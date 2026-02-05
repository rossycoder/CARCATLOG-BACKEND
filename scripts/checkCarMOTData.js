/**
 * Check MOT data for a specific car
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkMOTData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the latest car
    const car = await Car.findOne().sort({ createdAt: -1 });
    
    if (!car) {
      console.log('❌ No cars found');
      process.exit(0);
    }

    console.log('\n📋 Car Details:');
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Created: ${car.createdAt.toLocaleString()}`);

    console.log('\n🔍 MOT Data:');
    console.log(`   motStatus: ${car.motStatus || 'null'}`);
    console.log(`   motDue: ${car.motDue || 'null'}`);
    console.log(`   motExpiry: ${car.motExpiry || 'null'}`);
    console.log(`   motExpiryDate: ${car.motExpiryDate || 'null'}`);

    console.log('\n📊 MOT History:');
    if (car.motHistory && car.motHistory.length > 0) {
      console.log(`   Total Tests: ${car.motHistory.length}`);
      console.log(`   Latest Test:`);
      const latest = car.motHistory[0];
      console.log(`     Date: ${latest.testDate ? new Date(latest.testDate).toLocaleDateString() : 'N/A'}`);
      console.log(`     Result: ${latest.testResult || 'N/A'}`);
      console.log(`     Expiry: ${latest.expiryDate ? new Date(latest.expiryDate).toLocaleDateString() : 'N/A'}`);
    } else {
      console.log(`   No MOT history found`);
    }

    // Check if MOT data needs to be set
    if (!car.motDue && !car.motExpiry) {
      console.log('\n⚠️  MOT Due/Expiry is missing!');
      
      if (car.motHistory && car.motHistory.length > 0) {
        const latestTest = car.motHistory[0];
        if (latestTest.expiryDate) {
          console.log(`\n💡 Can set MOT Due from latest test: ${new Date(latestTest.expiryDate).toLocaleDateString()}`);
        }
      }
    } else {
      console.log('\n✅ MOT data is present');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkMOTData();
