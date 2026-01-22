const mongoose = require('mongoose');
const Car = require('../models/Car');
require('dotenv').config();

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carsales';
mongoose.connect(mongoURI)
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch(err => {
    console.error('✗ MongoDB connection error:', err);
    process.exit(1);
  });

const diagnoseFilterDropdowns = async () => {
  try {
    console.log('\n🔍 Diagnosing Filter Dropdown Issue\n');
    console.log('='.repeat(60));
    
    // Check 1: Total cars in database
    const totalCars = await Car.countDocuments({});
    const activeCars = await Car.countDocuments({ advertStatus: 'active' });
    
    console.log('\n1️⃣  Database Status:');
    console.log(`   Total cars: ${totalCars}`);
    console.log(`   Active cars: ${activeCars}`);
    
    if (activeCars === 0) {
      console.log('\n   ⚠️  WARNING: No active cars found!');
      console.log('   The dropdowns will be empty because there are no active vehicles.');
      console.log('   You need to add some test vehicles or activate existing ones.');
    }
    
    // Check 2: Get distinct makes
    const makes = await Car.distinct('make', { advertStatus: 'active' });
    console.log('\n2️⃣  Available Makes:');
    if (makes.length === 0) {
      console.log('   ⚠️  No makes found for active cars');
    } else {
      makes.forEach(make => console.log(`   • ${make}`));
    }
    
    // Check 3: Get distinct models
    const models = await Car.distinct('model', { advertStatus: 'active' });
    console.log('\n3️⃣  Available Models:');
    if (models.length === 0) {
      console.log('   ⚠️  No models found for active cars');
    } else {
      models.forEach(model => console.log(`   • ${model}`));
    }
    
    // Check 4: Test the hierarchical aggregation
    console.log('\n4️⃣  Testing Hierarchical Aggregation:');
    const modelHierarchy = await Car.aggregate([
      { $match: { advertStatus: 'active' } },
      {
        $group: {
          _id: { make: '$make', model: '$model' },
          submodels: { $addToSet: '$submodel' }
        }
      },
      {
        $group: {
          _id: '$_id.make',
          models: {
            $push: {
              model: '$_id.model',
              submodels: { $filter: { input: '$submodels', cond: { $ne: ['$$this', null] } } }
            }
          }
        }
      }
    ]);
    
    if (modelHierarchy.length === 0) {
      console.log('   ⚠️  Aggregation returned no results');
    } else {
      console.log('   ✓ Aggregation successful');
      
      // Transform to see the structure
      const modelsByMake = {};
      const submodelsByMakeModel = {};
      
      modelHierarchy.forEach(makeGroup => {
        const make = makeGroup._id;
        modelsByMake[make] = [];
        submodelsByMakeModel[make] = {};
        
        makeGroup.models.forEach(modelGroup => {
          const model = modelGroup.model;
          if (model) {
            modelsByMake[make].push(model);
            submodelsByMakeModel[make][model] = modelGroup.submodels.filter(Boolean).sort();
          }
        });
        
        modelsByMake[make].sort();
      });
      
      console.log('\n   Models by Make:');
      console.log(JSON.stringify(modelsByMake, null, 4));
      
      console.log('\n   Submodels by Make/Model:');
      console.log(JSON.stringify(submodelsByMakeModel, null, 4));
    }
    
    // Check 5: Sample some cars to see their data
    console.log('\n5️⃣  Sample Vehicle Data:');
    const sampleCars = await Car.find({ advertStatus: 'active' })
      .limit(3)
      .select('make model submodel advertStatus');
    
    if (sampleCars.length === 0) {
      console.log('   ⚠️  No sample cars to display');
    } else {
      sampleCars.forEach((car, index) => {
        console.log(`\n   Car ${index + 1}:`);
        console.log(`   • Make: ${car.make || 'MISSING'}`);
        console.log(`   • Model: ${car.model || 'MISSING'}`);
        console.log(`   • Submodel: ${car.submodel || 'MISSING'}`);
        console.log(`   • Status: ${car.advertStatus}`);
      });
    }
    
    // Check 6: Test the actual API response structure
    console.log('\n6️⃣  Simulated API Response:');
    const result = {
      success: true,
      data: {
        makes: makes.filter(Boolean).sort(),
        models: models.filter(Boolean).sort(),
        modelsByMake: {},
        submodelsByMakeModel: {}
      }
    };
    
    modelHierarchy.forEach(makeGroup => {
      const make = makeGroup._id;
      result.data.modelsByMake[make] = [];
      result.data.submodelsByMakeModel[make] = {};
      
      makeGroup.models.forEach(modelGroup => {
        const model = modelGroup.model;
        if (model) {
          result.data.modelsByMake[make].push(model);
          result.data.submodelsByMakeModel[make][model] = modelGroup.submodels.filter(Boolean).sort();
        }
      });
      
      result.data.modelsByMake[make].sort();
    });
    
    console.log(JSON.stringify(result, null, 2));
    
    // Recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📋 Recommendations:\n');
    
    if (activeCars === 0) {
      console.log('❌ ISSUE: No active cars in database');
      console.log('   SOLUTION: Run one of these scripts:');
      console.log('   • node backend/scripts/testModelVariantFilter.js (creates test data)');
      console.log('   • node backend/scripts/populateSubmodelData.js (populates existing cars)');
    } else if (makes.length === 0) {
      console.log('❌ ISSUE: Active cars exist but have no make data');
      console.log('   SOLUTION: Check your car data and ensure make field is populated');
    } else {
      console.log('✅ Data looks good! If dropdowns still don\'t work:');
      console.log('   1. Check browser console for errors');
      console.log('   2. Verify API endpoint is accessible');
      console.log('   3. Check network tab to see API response');
      console.log('   4. Ensure frontend is fetching from correct endpoint');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('✗ Error during diagnosis:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
};

// Run the diagnosis
diagnoseFilterDropdowns();
