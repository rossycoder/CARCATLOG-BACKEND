require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testVariantFilterAPI() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test the aggregation pipeline that the API uses
    console.log('📊 Testing variant aggregation pipeline...\n');
    
    const modelHierarchy = await Car.aggregate([
      { $match: { advertStatus: 'active' } },
      {
        $group: {
          _id: { make: '$make', model: '$model' },
          submodels: { $addToSet: '$submodel' },
          variants: { $addToSet: '$variant' }
        }
      },
      {
        $group: {
          _id: '$_id.make',
          models: {
            $push: {
              model: '$_id.model',
              submodels: { $filter: { input: '$submodels', cond: { $ne: ['$$this', null] } } },
              variants: { $filter: { input: '$variants', cond: { $ne: ['$$this', null] } } }
            }
          }
        }
      }
    ]);

    console.log('📦 Raw aggregation result:');
    console.log(JSON.stringify(modelHierarchy.slice(0, 2), null, 2));
    console.log('\n');

    // Transform the data like the API does
    const modelsByMake = {};
    const submodelsByMakeModel = {};
    const variantsByMakeModel = {};
    
    modelHierarchy.forEach(makeGroup => {
      const make = makeGroup._id;
      modelsByMake[make] = [];
      submodelsByMakeModel[make] = {};
      variantsByMakeModel[make] = {};
      
      makeGroup.models.forEach(modelGroup => {
        const model = modelGroup.model;
        if (model) {
          modelsByMake[make].push(model);
          submodelsByMakeModel[make][model] = modelGroup.submodels.filter(Boolean).sort();
          variantsByMakeModel[make][model] = modelGroup.variants.filter(Boolean).sort();
        }
      });
      
      modelsByMake[make].sort();
    });

    // Show sample data for HONDA Civic
    console.log('🚗 Sample data for HONDA Civic:');
    if (modelsByMake['HONDA']) {
      console.log('Models:', modelsByMake['HONDA']);
      if (submodelsByMakeModel['HONDA'] && submodelsByMakeModel['HONDA']['Civic']) {
        console.log('Submodels:', submodelsByMakeModel['HONDA']['Civic']);
      }
      if (variantsByMakeModel['HONDA'] && variantsByMakeModel['HONDA']['Civic']) {
        console.log('Variants:', variantsByMakeModel['HONDA']['Civic']);
      }
    }
    console.log('\n');

    // Check a few cars to see what variant data they have
    console.log('🔍 Checking sample cars for variant data...\n');
    const sampleCars = await Car.find({ 
      advertStatus: 'active',
      make: 'HONDA',
      model: 'Civic'
    }).limit(5).select('make model submodel variant displayTitle');

    sampleCars.forEach((car, index) => {
      console.log(`Car ${index + 1}:`);
      console.log(`  Make: ${car.make}`);
      console.log(`  Model: ${car.model}`);
      console.log(`  Submodel: ${car.submodel || 'null'}`);
      console.log(`  Variant: ${car.variant || 'null'}`);
      console.log(`  DisplayTitle: ${car.displayTitle || 'null'}`);
      console.log('');
    });

    // Count how many cars have variants
    const totalActive = await Car.countDocuments({ advertStatus: 'active' });
    const withVariants = await Car.countDocuments({ 
      advertStatus: 'active',
      variant: { $exists: true, $ne: null, $ne: '', $ne: 'null' }
    });
    
    console.log(`📈 Statistics:`);
    console.log(`  Total active cars: ${totalActive}`);
    console.log(`  Cars with variants: ${withVariants}`);
    console.log(`  Percentage: ${((withVariants / totalActive) * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testVariantFilterAPI();
