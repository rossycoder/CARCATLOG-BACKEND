/**
 * Fix MOT Due/Expiry for all cars that have MOT history but missing motDue/motExpiry
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixAllMOTData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all cars with MOT history but missing motDue/motExpiry
    const carsNeedingFix = await Car.find({
      motHistory: { $exists: true, $ne: [] },
      $or: [
        { motDue: null },
        { motExpiry: null },
        { motDue: { $exists: false } },
        { motExpiry: { $exists: false } }
      ]
    });

    console.log(`\n📊 Found ${carsNeedingFix.length} cars needing MOT data fix\n`);

    if (carsNeedingFix.length === 0) {
      console.log('✅ All cars already have MOT data!');
      process.exit(0);
    }

    let fixed = 0;

    for (const car of carsNeedingFix) {
      console.log(`🔧 Fixing: ${car.registrationNumber} (${car.make} ${car.model})`);
      
      // Get latest MOT test
      const latestTest = car.motHistory[0];
      
      if (latestTest && latestTest.expiryDate) {
        car.motExpiry = latestTest.expiryDate;
        car.motDue = latestTest.expiryDate;
        
        // Determine MOT status
        const expiryDate = new Date(latestTest.expiryDate);
        const today = new Date();
        
        if (expiryDate > today) {
          car.motStatus = 'Valid';
        } else {
          car.motStatus = 'Expired';
        }
        
        await car.save();
        
        console.log(`   ✅ MOT Expiry: ${expiryDate.toLocaleDateString()}`);
        console.log(`   ✅ MOT Status: ${car.motStatus}\n`);
        
        fixed++;
      } else {
        console.log(`   ⚠️  No expiry date in MOT history\n`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixed} cars`);
    console.log(`   ⚠️  Skipped: ${carsNeedingFix.length - fixed} cars`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixAllMOTData();
