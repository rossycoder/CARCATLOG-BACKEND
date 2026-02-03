require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testVersionConflictFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the specific car
    const advertId = 'f006b6a2-bb2d-4aac-bf39-d885b425e955';
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Car not found:', advertId);
      return;
    }

    console.log(`🚗 Testing with car: ${car.advertId}`);
    console.log(`   Current version: ${car.__v}`);

    // Simulate the problematic update with __v in the data
    const updateObjWithVersion = {
      sellerContact: {
        phoneNumber: '07123456789',
        email: 'test@example.com',
        postcode: 'NG1 5FS',
        allowEmailContact: true
      },
      __v: car.__v, // This would cause the conflict
      _id: car._id,  // This should also be excluded
      createdAt: car.createdAt,
      updatedAt: car.updatedAt
    };

    // Remove MongoDB internal fields (simulating our fix)
    const mongoInternalFields = ['__v', '_id', 'createdAt', 'updatedAt'];
    const cleanUpdateObj = { ...updateObjWithVersion };
    mongoInternalFields.forEach(field => {
      if (cleanUpdateObj.hasOwnProperty(field)) {
        console.log(`⚠️ Removing internal field: ${field}`);
        delete cleanUpdateObj[field];
      }
    });

    console.log('💾 Testing findOneAndUpdate with cleaned data...');
    console.log('💾 Clean update object keys:', Object.keys(cleanUpdateObj));
    
    const updatedCar = await Car.findOneAndUpdate(
      { 
        _id: car._id,
        __v: car.__v
      },
      { 
        $set: cleanUpdateObj,
        $inc: { __v: 1 }
      },
      { 
        new: true,
        runValidators: true
      }
    );
    
    if (updatedCar) {
      console.log('✅ Car updated successfully without version conflict');
      console.log(`   New version: ${updatedCar.__v}`);
      console.log(`   New sellerContact:`, updatedCar.sellerContact);
    } else {
      console.log('❌ Update failed - version conflict or car not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('__v')) {
      console.error('❌ Version conflict still exists!');
    }
  } finally {
    await mongoose.disconnect();
  }
}

testVersionConflictFix();