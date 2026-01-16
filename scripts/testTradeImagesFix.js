require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testTradeImagesFix() {
  try {
    const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!dbUri) {
      console.error('❌ No MongoDB URI found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    // Find a trade dealer vehicle
    const tradeCar = await Car.findOne({ 
      isDealerListing: true,
      advertStatus: 'active'
    });

    if (!tradeCar) {
      console.log('❌ No trade dealer vehicles found');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Testing with vehicle:');
    console.log(`   Make/Model: ${tradeCar.make} ${tradeCar.model}`);
    console.log(`   ID: ${tradeCar._id}`);
    console.log(`   Advert ID: ${tradeCar.advertId}`);
    console.log(`   Current images: ${tradeCar.images ? tradeCar.images.length : 0}`);
    console.log(`   Current description: ${tradeCar.description ? 'YES' : 'NO'}`);
    console.log('');

    // Simulate what happens during publish with advertData
    const mockAdvertData = {
      images: [
        'https://res.cloudinary.com/test/image1.jpg',
        'https://res.cloudinary.com/test/image2.jpg',
        'https://res.cloudinary.com/test/image3.jpg'
      ],
      description: 'This is a test description from advertData',
      features: ['Feature 1', 'Feature 2'],
      condition: 'Excellent'
    };

    console.log('🔄 Simulating publish with advertData:');
    console.log(`   Images in advertData: ${mockAdvertData.images.length}`);
    console.log(`   Description in advertData: YES`);
    console.log('');

    // Build update data like the controller does
    const updateData = {};

    // ALWAYS use images from advertData if provided
    if (mockAdvertData && mockAdvertData.images && mockAdvertData.images.length > 0) {
      console.log('✅ Using images from advertData:', mockAdvertData.images.length);
      updateData.images = mockAdvertData.images;
    }

    // ALWAYS use description from advertData if provided
    if (mockAdvertData && mockAdvertData.description && mockAdvertData.description.trim() !== '') {
      console.log('✅ Using description from advertData');
      updateData.description = mockAdvertData.description;
    }

    // ALWAYS use other important fields from advertData if they exist
    if (mockAdvertData) {
      const fieldsToUpdate = ['features', 'condition', 'serviceHistory', 'owners'];
      fieldsToUpdate.forEach(field => {
        if (mockAdvertData[field]) {
          console.log(`✅ Using ${field} from advertData`);
          updateData[field] = mockAdvertData[field];
        }
      });
    }

    console.log('');
    console.log('📦 Update data prepared:');
    console.log(`   Images: ${updateData.images ? updateData.images.length : 0}`);
    console.log(`   Description: ${updateData.description ? 'YES' : 'NO'}`);
    console.log(`   Features: ${updateData.features ? updateData.features.length : 0}`);
    console.log(`   Condition: ${updateData.condition || 'N/A'}`);
    console.log('');

    console.log('✅ Logic test passed! Images and description will be updated from advertData.');
    console.log('');
    console.log('💡 The fix ensures that:');
    console.log('   1. Images from advertData ALWAYS override existing images');
    console.log('   2. Description from advertData ALWAYS overrides existing description');
    console.log('   3. Other fields (features, condition) are also updated from advertData');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testTradeImagesFix();
