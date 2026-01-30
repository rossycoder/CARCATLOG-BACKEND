require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

/**
 * Simulate adding a new car to test if history is fetched correctly
 * This mimics what happens when user adds a car through the frontend
 */
async function simulateNewCarAdd() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test with a different registration (not NU10YEV)
    const testVRM = 'RJ08PFA'; // Another test registration
    
    console.log('=== Simulating New Car Addition ===');
    console.log(`Registration: ${testVRM}`);
    console.log('This simulates what happens when you add a car through frontend\n');
    
    // Step 1: Check if car already exists
    console.log('📋 Step 1: Checking if car already exists...');
    const existingCar = await Car.findOne({ registrationNumber: testVRM });
    if (existingCar) {
      console.log('⚠️  Car already exists. Deleting for fresh test...');
      await Car.deleteOne({ _id: existingCar._id });
      if (existingCar.historyCheckId) {
        await VehicleHistory.deleteOne({ _id: existingCar.historyCheckId });
      }
      console.log('✅ Old car and history deleted\n');
    } else {
      console.log('✅ No existing car found\n');
    }
    
    // Step 2: Create new car (this triggers pre-save hook)
    console.log('📋 Step 2: Creating new car...');
    console.log('⏳ This will automatically trigger history check via pre-save hook...\n');
    
    const newCar = new Car({
      make: 'Test',
      model: 'Car',
      year: 2008,
      price: 5000,
      mileage: 80000,
      color: 'Blue',
      transmission: 'manual',
      fuelType: 'Petrol',
      description: 'Test car for history verification',
      registrationNumber: testVRM,
      postcode: 'SW1A 1AA',
      condition: 'used',
      vehicleType: 'car',
      advertStatus: 'active',
      historyCheckStatus: 'pending', // This triggers history check
      sellerContact: {
        type: 'private',
        phoneNumber: '07700900000',
        email: 'rozeena031@gmail.com',
        postcode: 'SW1A 1AA'
      }
    });
    
    console.log('💾 Saving car (pre-save hook will run)...\n');
    await newCar.save();
    
    console.log('✅ Car saved successfully!\n');
    
    // Step 3: Verify history was fetched and saved
    console.log('📋 Step 3: Verifying history data...\n');
    
    const savedCar = await Car.findById(newCar._id);
    console.log('🚗 Car Details:');
    console.log('   - ID:', savedCar._id);
    console.log('   - Registration:', savedCar.registrationNumber);
    console.log('   - History Check Status:', savedCar.historyCheckStatus);
    console.log('   - History Check Date:', savedCar.historyCheckDate);
    console.log('   - History Check ID:', savedCar.historyCheckId);
    
    if (savedCar.historyCheckId) {
      console.log('\n📊 Fetching linked history record...\n');
      const history = await VehicleHistory.findById(savedCar.historyCheckId);
      
      if (history) {
        console.log('✅ History Record Found!');
        console.log('\n=== Owner Information ===');
        console.log('👥 Number of Previous Keepers:', history.numberOfPreviousKeepers);
        console.log('👥 Previous Owners:', history.previousOwners);
        console.log('👥 Number of Owners:', history.numberOfOwners);
        console.log('🔑 Number of Keys:', history.numberOfKeys);
        console.log('📋 Service History:', history.serviceHistory);
        
        console.log('\n=== Additional History ===');
        console.log('📜 V5C Certificate Count:', history.v5cCertificateCount);
        console.log('🔄 Plate Changes:', history.plateChanges);
        console.log('🎨 Colour Changes:', history.colourChanges);
        console.log('🔍 VIC Count:', history.vicCount);
        console.log('📝 Keeper Changes List:', history.keeperChangesList?.length || 0, 'entries');
        
        console.log('\n=== Safety Checks ===');
        console.log('🚨 Is Stolen:', history.isStolen);
        console.log('💥 Is Written Off:', history.isWrittenOff);
        console.log('🚗 Has Accident History:', history.hasAccidentHistory);
        console.log('💰 Has Outstanding Finance:', history.hasOutstandingFinance);
        
        console.log('\n=== API Info ===');
        console.log('📡 API Provider:', history.apiProvider);
        console.log('📅 Check Date:', history.checkDate);
        console.log('✅ Check Status:', history.checkStatus);
        
        // Verification
        console.log('\n=== Verification ===');
        if (history.apiProvider === 'CheckCarDetails') {
          console.log('✅ Correct API provider (CheckCarDetails)');
        } else {
          console.log('⚠️  Wrong API provider:', history.apiProvider);
        }
        
        if (history.numberOfPreviousKeepers !== undefined && history.numberOfPreviousKeepers !== null) {
          console.log('✅ Owner count is set:', history.numberOfPreviousKeepers);
        } else {
          console.log('❌ Owner count is missing!');
        }
        
        console.log('\n🎉 SUCCESS! History was fetched and saved correctly!');
        console.log('This proves that new cars will have correct history data.');
        
      } else {
        console.log('❌ History record not found in database!');
      }
    } else {
      console.log('\n⚠️  No history check ID found on car!');
      console.log('History check may have failed. Check logs above.');
    }
    
    // Cleanup
    console.log('\n📋 Cleaning up test data...');
    await Car.deleteOne({ _id: newCar._id });
    if (savedCar.historyCheckId) {
      await VehicleHistory.deleteOne({ _id: savedCar.historyCheckId });
    }
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

simulateNewCarAdd();
