require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function fixCarColor() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const carId = '69864e4fa41026f9288bb27c';
    
    console.log('\n🔍 Fetching car...');
    const car = await Car.findById(carId).populate('historyCheckId');
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }

    console.log('Current color:', car.color);
    
    // Check if history has color
    if (car.historyCheckId && car.historyCheckId.colour) {
      console.log('Color from history:', car.historyCheckId.colour);
      
      car.color = car.historyCheckId.colour;
      await car.save();
      
      console.log('✅ Updated car color to:', car.color);
    } else {
      console.log('⚠️  No color found in history check either');
    }
    
    // Verify MOT data is still there
    console.log('\n🔧 Verifying MOT data:');
    console.log('MOT Due:', car.motDue);
    console.log('MOT Expiry:', car.motExpiry);
    console.log('MOT History:', car.motHistory?.length || 0, 'records');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixCarColor();
