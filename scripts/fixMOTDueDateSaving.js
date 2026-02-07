const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Direct schema definition
const carSchema = new mongoose.Schema({}, { strict: false });
const vehicleHistorySchema = new mongoose.Schema({}, { strict: false });

const Car = mongoose.model('Car', carSchema);
const VehicleHistory = mongoose.model('VehicleHistory', vehicleHistorySchema);

async function fixMOTDueDateSaving() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    // Find all cars with MOT history but missing motDue/motExpiry
    const carsWithMOTHistory = await Car.find({
      motHistory: { $exists: true, $ne: [] },
      $or: [
        { motDue: { $exists: false } },
        { motDue: null },
        { motExpiry: { $exists: false } },
        { motExpiry: null }
      ]
    });

    console.log(`Found ${carsWithMOTHistory.length} cars with MOT history but missing motDue/motExpiry\n`);

    let fixed = 0;
    let skipped = 0;

    for (const car of carsWithMOTHistory) {
      try {
        // Get latest MOT test
        const latestTest = car.motHistory[0];
        
        if (latestTest && latestTest.expiryDate) {
          // Update both motDue and motExpiry
          car.motDue = latestTest.expiryDate;
          car.motExpiry = latestTest.expiryDate;
          car.motStatus = latestTest.testResult === 'PASSED' ? 'Valid' : 'Invalid';
          
          await car.save();
          
          console.log(`✅ Fixed ${car.registrationNumber || car._id}`);
          console.log(`   MOT Due: ${new Date(car.motDue).toLocaleDateString('en-GB')}`);
          console.log(`   Status: ${car.motStatus}\n`);
          
          fixed++;
        } else {
          console.log(`⚠️  Skipped ${car.registrationNumber || car._id} - No expiry date in MOT history\n`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error fixing ${car.registrationNumber || car._id}:`, error.message);
        skipped++;
      }
    }

    // Also fix VehicleHistory documents
    console.log('\n=== Fixing VehicleHistory Documents ===\n');
    
    const historyDocs = await VehicleHistory.find({
      motTests: { $exists: true, $ne: [] },
      $or: [
        { motExpiryDate: { $exists: false } },
        { motExpiryDate: null }
      ]
    });

    console.log(`Found ${historyDocs.length} VehicleHistory docs with MOT tests but missing motExpiryDate\n`);

    let historyFixed = 0;

    for (const history of historyDocs) {
      try {
        const latestTest = history.motTests[0];
        
        if (latestTest && latestTest.expiryDate) {
          history.motExpiryDate = latestTest.expiryDate;
          history.motStatus = latestTest.testResult === 'PASSED' ? 'Valid' : 'Invalid';
          
          await history.save();
          
          console.log(`✅ Fixed VehicleHistory for ${history.vrm}`);
          console.log(`   MOT Expiry: ${new Date(history.motExpiryDate).toLocaleDateString('en-GB')}\n`);
          
          historyFixed++;
        }
      } catch (error) {
        console.error(`❌ Error fixing VehicleHistory ${history.vrm}:`, error.message);
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Cars fixed: ${fixed}`);
    console.log(`Cars skipped: ${skipped}`);
    console.log(`VehicleHistory docs fixed: ${historyFixed}`);
    console.log(`Total fixed: ${fixed + historyFixed}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

fixMOTDueDateSaving();
