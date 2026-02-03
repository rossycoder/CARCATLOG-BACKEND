require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testAdvertUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test car
    const car = await Car.findOne({ advertStatus: 'active' }).limit(1);
    
    if (!car) {
      console.log('❌ No active cars found');
      return;
    }

    console.log(`🚗 Testing with car: ${car.advertId}`);
    console.log(`   Current features: ${car.features}`);

    // Test updating features
    const testFeatures = ['Air Conditioning', 'Bluetooth'];
    car.features = testFeatures;
    
    console.log('💾 Saving car with new features...');
    await car.save();
    
    console.log('✅ Car saved successfully');
    console.log(`   New features: ${car.features}`);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('❌ Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testAdvertUpdate();