const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const dvlaService = require('../services/dvlaService');

async function fixMotDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find cars with expired MOT dates
    const now = new Date();
    const carsWithExpiredMot = await Car.find({
      motExpiry: { $lt: now },
      advertStatus: 'active',
      registrationNumber: { $exists: true, $ne: null }
    }).select('registrationNumber make model motExpiry motStatus _id');

    console.log(`\n🔍 Found ${carsWithExpiredMot.length} cars with expired MOT dates\n`);

    for (const car of carsWithExpiredMot) {
      console.log(`\n📋 Processing: ${car.registrationNumber} (${car.make} ${car.model})`);
      console.log(`   Current MOT expiry: ${car.motExpiry}`);

      try {
        // Fetch fresh data from DVLA
        console.log('   🔄 Fetching fresh data from DVLA...');
        const dvlaData = await dvlaService.lookupVehicle(car.registrationNumber);
        
        console.log('   ✅ DVLA data received');
        console.log('   📅 DVLA MOT Status:', dvlaData.motStatus);
        console.log('   📅 DVLA MOT Expiry Date:', dvlaData.motExpiryDate);

        // Update the car with fresh MOT data
        if (dvlaData.motExpiryDate) {
          car.motExpiry = new Date(dvlaData.motExpiryDate);
          car.motStatus = dvlaData.motStatus || 'Unknown';
          await car.save();
          
          console.log('   ✅ Updated MOT expiry to:', car.motExpiry);
          console.log('   ✅ Updated MOT status to:', car.motStatus);
        } else {
          console.log('   ⚠️  No MOT expiry date in DVLA response');
        }

        // Wait 1 second between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Error updating ${car.registrationNumber}:`, error.message);
      }
    }

    console.log('\n✅ Finished updating MOT dates');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixMotDates();
