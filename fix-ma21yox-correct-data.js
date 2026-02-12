const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('./models/Car');
const VehicleHistory = require('./models/VehicleHistory');

async function fixMA21YOXData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const vrm = 'MA21YOX';
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: vrm });
    
    if (!car) {
      console.log('❌ Car not found:', vrm);
      return;
    }

    console.log('\n📊 Current Car Data:');
    console.log('MOT Due:', car.motDue);
    console.log('MOT Expiry:', car.motExpiry);
    console.log('Color:', car.color);
    console.log('MOT Status:', car.motStatus);

    // Correct data (as per user's original input)
    const correctData = {
      motDue: new Date('2026-03-21'),
      motExpiry: new Date('2026-03-21'),
      motStatus: 'Valid',
      color: 'White'
    };

    console.log('\n🔧 Updating to correct data:');
    console.log('MOT Due: 21 March 2026');
    console.log('Color: White');

    // Update Car model
    await Car.findByIdAndUpdate(car._id, {
      $set: correctData
    });

    console.log('✅ Car model updated');

    // Update VehicleHistory if linked
    if (car.historyCheckId) {
      await VehicleHistory.findByIdAndUpdate(car.historyCheckId, {
        $set: {
          motExpiryDate: new Date('2026-03-21'),
          motStatus: 'Valid',
          colour: 'White'
        }
      });
      console.log('✅ VehicleHistory updated');
    }

    // Verify the update
    const updatedCar = await Car.findById(car._id);
    console.log('\n✅ Verified Updated Data:');
    console.log('MOT Due:', updatedCar.motDue);
    console.log('MOT Expiry:', updatedCar.motExpiry);
    console.log('Color:', updatedCar.color);
    console.log('MOT Status:', updatedCar.motStatus);

    console.log('\n✅ MA21YOX data corrected successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixMA21YOXData();
