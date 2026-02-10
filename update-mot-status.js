/**
 * Update MOT status for M77EDO with the information we have
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

async function updateMOTStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const vrm = 'M77EDO';
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: vrm });
    
    if (!car) {
      console.log('❌ Car not found in database');
      return;
    }
    
    console.log(`\n📝 Current MOT data for ${vrm}:`);
    console.log(`   MOT Status: ${car.motStatus}`);
    console.log(`   MOT Expiry: ${car.motExpiry}`);
    console.log(`   MOT History: ${car.motHistory?.length || 0} tests`);
    
    // Update with correct MOT information
    car.motStatus = 'Valid';
    car.motExpiry = new Date('2027-12-30');
    car.motDue = new Date('2027-12-30');
    car.motHistory = []; // Empty because vehicle is too new
    
    await car.save();
    
    console.log(`\n✅ Updated MOT data for ${vrm}:`);
    console.log(`   MOT Status: ${car.motStatus}`);
    console.log(`   MOT Expiry: ${car.motExpiry}`);
    console.log(`   MOT Due: ${car.motDue}`);
    console.log(`   MOT History: ${car.motHistory.length} tests (empty - vehicle too new)`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

updateMOTStatus();
