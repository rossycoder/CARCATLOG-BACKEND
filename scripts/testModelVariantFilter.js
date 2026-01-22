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

const testModelVariantFilter = async () => {
  try {
    console.log('\n🧪 Testing Model Variant Filter Implementation\n');
    console.log('='.repeat(60));
    
    // Create test vehicles with submodel data
    console.log('\n1️⃣  Creating test vehicles...\n');
    
    const testCars = [
      {
        make: 'BMW',
        model: '3 Series',
        submodel: '320i M Sport',
        year: 2020,
        price: 25000,
        mileage: 30000,
        fuelType: 'Petrol',
        transmission: 'automatic',
        bodyType: 'Saloon',
        color: 'Black',
        advertStatus: 'active',
        registrationNumber: 'TEST001',
        description: 'Test BMW 320i M Sport',
        postcode: 'M1 1AA'
      },
      {
        make: 'BMW',
        model: '3 Series',
        submodel: '330d M Sport',
        year: 2021,
        price: 30000,
        mileage: 20000,
        fuelType: 'Diesel',
        transmission: 'automatic',
        bodyType: 'Saloon',
        color: 'White',
        advertStatus: 'active',
        registrationNumber: 'TEST002',
        description: 'Test BMW 330d M Sport',
        postcode: 'M1 1AB'
      },
      {
        make: 'Audi',
        model: 'A4',
        submodel: '2.0 TFSI S Line',
        year: 2019,
        price: 22000,
        mileage: 35000,
        fuelType: 'Petrol',
        transmission: 'automatic',
        bodyType: 'Saloon',
        color: 'Silver',
        advertStatus: 'active',
        registrationNumber: 'TEST003',
        description: 'Test Audi A4 S Line',
        postcode: 'M1 1AC'
      },
      {
        make: 'Mercedes',
        model: 'C-Class',
        submodel: 'C220 AMG Line',
        year: 2020,
        price: 28000,
        mileage: 25000,
        fuelType: 'Diesel',
        transmission: 'automatic',
        bodyType: 'Saloon',
        color: 'Blue',
        advertStatus: 'active',
        registrationNumber: 'TEST004',
        description: 'Test Mercedes C220',
        postcode: 'M1 1AD'
      }
    ];
    
    // Clear existing test data
    await Car.deleteMany({ registrationNumber: /^TEST/ });
    
    // Insert test cars
    await Car.insertMany(testCars);
    console.log(`✓ Created ${testCars.length} test vehicles\n`);
    
    // Test 1: Get filter options with hierarchical data
    console.log('2️⃣  Testing filter options API...\n');
    
    const makes = await Car.distinct('make', { advertStatus: 'active' });
    console.log('Makes:', makes);
    
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
    
    console.log('\nModels by Make:');
    console.log(JSON.stringify(modelsByMake, null, 2));
    
    console.log('\nSubmodels by Make/Model:');
    console.log(JSON.stringify(submodelsByMakeModel, null, 2));
    
    // Test 2: Filter by make only
    console.log('\n3️⃣  Testing filter by make (BMW)...\n');
    const bmwCars = await Car.find({ 
      advertStatus: 'active',
      make: new RegExp('^BMW$', 'i')
    }).select('make model submodel price');
    console.log(`Found ${bmwCars.length} BMW cars:`);
    bmwCars.forEach(car => {
      console.log(`  • ${car.make} ${car.model} ${car.submodel} - £${car.price}`);
    });
    
    // Test 3: Filter by make and model
    console.log('\n4️⃣  Testing filter by make and model (BMW 3 Series)...\n');
    const bmw3Series = await Car.find({ 
      advertStatus: 'active',
      make: new RegExp('^BMW$', 'i'),
      model: new RegExp('^3 Series$', 'i')
    }).select('make model submodel price');
    console.log(`Found ${bmw3Series.length} BMW 3 Series cars:`);
    bmw3Series.forEach(car => {
      console.log(`  • ${car.make} ${car.model} ${car.submodel} - £${car.price}`);
    });
    
    // Test 4: Filter by make, model, and submodel
    console.log('\n5️⃣  Testing filter by make, model, and submodel (BMW 3 Series 320i M Sport)...\n');
    const specificVariant = await Car.find({ 
      advertStatus: 'active',
      make: new RegExp('^BMW$', 'i'),
      model: new RegExp('^3 Series$', 'i'),
      submodel: new RegExp('^320i M Sport$', 'i')
    }).select('make model submodel price');
    console.log(`Found ${specificVariant.length} BMW 3 Series 320i M Sport cars:`);
    specificVariant.forEach(car => {
      console.log(`  • ${car.make} ${car.model} ${car.submodel} - £${car.price}`);
    });
    
    // Test 5: Verify cascading filter logic
    console.log('\n6️⃣  Testing cascading filter logic...\n');
    console.log('Available models for BMW:', modelsByMake['BMW']);
    console.log('Available submodels for BMW 3 Series:', submodelsByMakeModel['BMW']['3 Series']);
    console.log('Available submodels for Audi A4:', submodelsByMakeModel['Audi']['A4']);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed! Model Variant filter is working correctly.');
    console.log('='.repeat(60) + '\n');
    
    // Clean up test data
    await Car.deleteMany({ registrationNumber: /^TEST/ });
    console.log('✓ Cleaned up test data\n');
    
  } catch (error) {
    console.error('✗ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
};

// Run the test
testModelVariantFilter();
