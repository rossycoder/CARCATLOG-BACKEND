const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

async function checkMotDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the specific car
    const car = await Car.findOne({ registrationNumber: 'HUM777A' });
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }

    console.log('\n📋 Vehicle Details:');
    console.log('Registration:', car.registrationNumber);
    console.log('Make/Model:', car.make, car.model);
    console.log('\n🔍 MOT Data:');
    console.log('motStatus:', car.motStatus);
    console.log('motExpiry:', car.motExpiry);
    console.log('motDue:', car.motDue);
    console.log('\n📅 Raw Date Values:');
    console.log('motExpiry type:', typeof car.motExpiry);
    console.log('motExpiry value:', car.motExpiry);
    
    if (car.motExpiry) {
      const date = new Date(car.motExpiry);
      console.log('Parsed as Date:', date);
      console.log('ISO String:', date.toISOString());
      console.log('Formatted (en-GB):', date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }));
    }

    // Check all cars with MOT dates in the past
    console.log('\n\n🔍 Checking all cars with expired MOT dates...');
    const now = new Date();
    const carsWithExpiredMot = await Car.find({
      motExpiry: { $lt: now },
      advertStatus: 'active'
    }).select('registrationNumber make model motExpiry motStatus');

    console.log(`Found ${carsWithExpiredMot.length} active cars with expired MOT dates:`);
    carsWithExpiredMot.forEach(car => {
      console.log(`- ${car.registrationNumber} (${car.make} ${car.model}): MOT expired ${car.motExpiry}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkMotDates();
