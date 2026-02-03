/**
 * Fix EK11XHZ Car - Ensure historyCheckId is properly linked
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function fixEK11XHZPopulation() {
  try {
    console.log('🔧 Fixing EK11XHZ Car Population Issues\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const vrm = 'EK11XHZ';
    
    // Step 1: Find the car
    console.log('1️⃣ Finding EK11XHZ car...');
    const car = await Car.findOne({ registrationNumber: vrm });
    
    if (!car) {
      console.log('❌ EK11XHZ car not found');
      return;
    }
    
    console.log(`✅ Found car: ${car._id}`);
    console.log(`   Current historyCheckId: ${car.historyCheckId}`);
    console.log(`   Variant: ${car.variant}`);
    console.log(`   Display Title: ${car.displayTitle}\n`);
    
    // Step 2: Find VehicleHistory for this VRM
    console.log('2️⃣ Finding VehicleHistory documents...');
    const historyDocs = await VehicleHistory.find({ vrm: vrm });
    console.log(`   Found ${historyDocs.length} VehicleHistory documents`);
    
    if (historyDocs.length === 0) {
      console.log('❌ No VehicleHistory documents found');
      return;
    }
    
    // Use the most recent one
    const latestHistory = historyDocs.sort((a, b) => new Date(b.checkDate) - new Date(a.checkDate))[0];
    console.log(`   Using latest: ${latestHistory._id} (${latestHistory.checkDate})`);
    console.log(`   Write-off Category: ${latestHistory.writeOffCategory}`);
    console.log(`   Is Written Off: ${latestHistory.isWrittenOff}`);
    console.log(`   MOT History: ${latestHistory.motHistory?.length || 0} tests\n`);
    
    // Step 3: Update car with correct historyCheckId
    console.log('3️⃣ Updating car with historyCheckId...');
    car.historyCheckId = latestHistory._id;
    car.historyCheckStatus = 'verified';
    car.historyCheckDate = new Date();
    
    // Also update MOT history if missing
    if (latestHistory.motHistory && latestHistory.motHistory.length > 0) {
      car.motHistory = latestHistory.motHistory;
      console.log(`   Added ${latestHistory.motHistory.length} MOT tests to car`);
    }
    
    await car.save();
    console.log('✅ Car updated successfully\n');
    
    // Step 4: Test population
    console.log('4️⃣ Testing population...');
    const populatedCar = await Car.findById(car._id).populate('historyCheckId');
    
    if (populatedCar.historyCheckId) {
      console.log('✅ Population working!');
      console.log(`   Populated historyCheckId: ${populatedCar.historyCheckId._id}`);
      console.log(`   Write-off Category: ${populatedCar.historyCheckId.writeOffCategory}`);
      console.log(`   Is Written Off: ${populatedCar.historyCheckId.isWrittenOff}`);
      console.log(`   MOT History: ${populatedCar.historyCheckId.motHistory?.length || 0} tests`);
    } else {
      console.log('❌ Population still not working');
    }
    
    // Step 5: Test frontend data structure
    console.log('\n5️⃣ Frontend data structure test...');
    const frontendData = {
      historyCheckId: populatedCar.historyCheckId,
      motHistory: populatedCar.motHistory,
      variant: populatedCar.variant,
      displayTitle: populatedCar.displayTitle
    };
    
    console.log('Frontend will receive:');
    console.log(`   historyCheckId exists: ${!!frontendData.historyCheckId}`);
    console.log(`   writeOffCategory: ${frontendData.historyCheckId?.writeOffCategory}`);
    console.log(`   motHistory length: ${frontendData.motHistory?.length || 0}`);
    console.log(`   variant: ${frontendData.variant}`);
    console.log(`   displayTitle: ${frontendData.displayTitle}`);
    
    // Check if CAT N warning should show (it shouldn't for CAT N)
    const shouldShowWarning = frontendData.historyCheckId?.writeOffCategory && 
                             ['A', 'B', 'S'].includes(frontendData.historyCheckId.writeOffCategory.toUpperCase());
    
    console.log(`   Should show warning badge: ${shouldShowWarning} (CAT N should be false)`);
    
    console.log('\n🎉 EK11XHZ Fix Completed!');
    console.log('💡 Now test the car detail page to verify:');
    console.log('   - Vehicle history shows from database');
    console.log('   - MOT history shows complete tests');
    console.log('   - CAT N does NOT show warning badge');
    console.log('   - Variant displays correctly');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the fix
fixEK11XHZPopulation();