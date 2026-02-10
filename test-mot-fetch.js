/**
 * Test script to fetch MOT history for M77EDO
 */

require('dotenv').config();
const mongoose = require('mongoose');
const HistoryService = require('./services/historyService');
const Car = require('./models/Car');

async function testMOTFetch() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const vrm = 'M77EDO';
    
    // Initialize history service
    const historyService = new HistoryService();
    
    // Fetch MOT history
    console.log(`\n🔍 Fetching MOT history for ${vrm}...`);
    const motData = await historyService.getMOTHistory(vrm);
    
    console.log('\n📋 MOT History Response:');
    console.log(JSON.stringify(motData, null, 2));
    
    // Update the car document with MOT history
    if (motData && motData.tests && motData.tests.length > 0) {
      console.log(`\n💾 Updating car document with ${motData.tests.length} MOT tests...`);
      
      const car = await Car.findOne({ registrationNumber: vrm });
      if (car) {
        // Format MOT history for the Car model
        car.motHistory = motData.tests.map(test => ({
          testDate: test.completedDate ? new Date(test.completedDate) : null,
          expiryDate: test.expiryDate ? new Date(test.expiryDate) : null,
          testResult: test.testResult,
          odometerValue: parseInt(test.odometerValue) || 0,
          odometerUnit: test.odometerUnit?.toLowerCase() || 'mi',
          testNumber: test.motTestNumber || test.testNumber,
          defects: test.defects || [],
          rfrAndComments: test.rfrAndComments || []
        }));
        
        // Update MOT status
        if (motData.motStatus) {
          car.motStatus = motData.motStatus;
        }
        
        // Update MOT expiry date
        if (motData.expiryDate) {
          car.motExpiry = new Date(motData.expiryDate);
          car.motDue = new Date(motData.expiryDate);
        }
        
        await car.save();
        console.log('✅ Car document updated with MOT history');
        console.log(`   MOT Status: ${car.motStatus}`);
        console.log(`   MOT Expiry: ${car.motExpiry}`);
        console.log(`   MOT Tests: ${car.motHistory.length}`);
      } else {
        console.log('❌ Car not found in database');
      }
    } else {
      console.log('\n⚠️  No MOT history found for this vehicle');
      console.log('   This could mean:');
      console.log('   - Vehicle is too new (registered 2024)');
      console.log('   - MOT not yet due');
      console.log('   - API returned no data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testMOTFetch();
