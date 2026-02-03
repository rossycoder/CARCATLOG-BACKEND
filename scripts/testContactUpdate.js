require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testContactUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the specific car that's failing
    const advertId = 'f006b6a2-bb2d-4aac-bf39-d885b425e955';
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Car not found:', advertId);
      return;
    }

    console.log(`🚗 Testing with car: ${car.advertId}`);
    console.log(`   Current version: ${car.__v}`);
    console.log(`   Current sellerContact:`, car.sellerContact);

    // Test updating contact details
    const testContactDetails = {
      phoneNumber: '07123456789',
      email: 'test@example.com',
      postcode: 'NG1 5FS',
      allowEmailContact: true
    };
    
    console.log('💾 Testing findOneAndUpdate with contact details...');
    
    const updatedCar = await Car.findOneAndUpdate(
      { 
        _id: car._id,
        __v: car.__v
      },
      { 
        $set: { sellerContact: testContactDetails },
        $inc: { __v: 1 }
      },
      { 
        new: true,
        runValidators: true
      }
    );
    
    if (updatedCar) {
      console.log('✅ Car updated successfully');
      console.log(`   New version: ${updatedCar.__v}`);
      console.log(`   New sellerContact:`, updatedCar.sellerContact);
    } else {
      console.log('❌ Update failed - version conflict or car not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('❌ Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testContactUpdate();