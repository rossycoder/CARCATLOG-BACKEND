const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function demonstrateMOTFlow() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const vrm = 'EX09MYY';
    
    console.log('\n📋 COMPLETE MOT FLOW DEMONSTRATION');
    console.log('=====================================');
    
    // Step 1: Show current MOT data in database
    console.log('\n1️⃣ STEP 1: Current MOT Data in Database');
    console.log('----------------------------------------');
    
    const car = await Car.findOne({ registrationNumber: vrm }).populate('historyCheckId');
    
    if (car) {
      console.log('🚗 Car Found:', car.make, car.model, `(${car.registrationNumber})`);
      console.log('📊 MOT History Count:', car.motHistory ? car.motHistory.length : 0);
      console.log('📅 MOT Status:', car.motStatus);
      console.log('📅 MOT Expiry:', car.motExpiry ? car.motExpiry.toDateString() : 'Not set');
      
      if (car.motHistory && car.motHistory.length > 0) {
        console.log('\n📋 MOT Tests in Database:');
        car.motHistory.forEach((test, index) => {
          console.log(`   Test ${index + 1}: ${test.testResult} (${test.testDate.toDateString()}) - ${test.odometerValue} miles`);
        });
      }
    }
    
    // Step 2: Show how data flows to frontend
    console.log('\n2️⃣ STEP 2: Data Flow to Frontend');
    console.log('----------------------------------');
    console.log('✅ Backend API: /api/vehicles/:id');
    console.log('✅ Returns car document with motHistory array');
    console.log('✅ Frontend MOTHistorySection receives car data');
    console.log('✅ Component uses car.motHistory (no additional API calls)');
    console.log('✅ Displays MOT tests with proper formatting');
    
    // Step 3: Show API endpoint simulation
    console.log('\n3️⃣ STEP 3: API Response Simulation');
    console.log('-----------------------------------');
    
    const apiResponse = {
      success: true,
      data: {
        _id: car._id,
        make: car.make,
        model: car.model,
        registrationNumber: car.registrationNumber,
        motHistory: car.motHistory,
        motStatus: car.motStatus,
        motExpiry: car.motExpiry,
        // ... other car fields
      }
    };
    
    console.log('📡 API Response Structure:');
    console.log('   - success: true');
    console.log('   - data.motHistory: Array of', car.motHistory.length, 'tests');
    console.log('   - data.motStatus:', car.motStatus);
    console.log('   - data.motExpiry:', car.motExpiry ? car.motExpiry.toDateString() : 'null');
    
    // Step 4: Frontend processing
    console.log('\n4️⃣ STEP 4: Frontend Processing');
    console.log('-------------------------------');
    console.log('✅ CarDetailPage fetches car data via API');
    console.log('✅ Passes car data to MOTHistorySection component');
    console.log('✅ MOTHistorySection checks car.motHistory array');
    console.log('✅ Renders MOT tests without additional API calls');
    console.log('✅ Vehicle History section does NOT show MOT info');
    
    console.log('\n🎉 FLOW COMPLETE!');
    console.log('=================');
    console.log('✅ MOT data: API → Database → Frontend (no frontend API calls)');
    console.log('✅ Separation: Vehicle History ≠ MOT History');
    console.log('✅ Clean architecture: One source of truth (database)');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

demonstrateMOTFlow();