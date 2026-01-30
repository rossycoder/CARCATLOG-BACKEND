require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const Car = require('../models/Car');

/**
 * Complete diagnostic of history data flow
 * Checks: Database → Model → Controller → Frontend
 */
async function diagnosticHistoryFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const vrm = 'NU10YEV';
    
    console.log('='.repeat(60));
    console.log('DIAGNOSTIC: Vehicle History Data Flow');
    console.log('='.repeat(60));
    console.log(`VRM: ${vrm}\n`);
    
    // Step 1: Check raw database data
    console.log('📋 STEP 1: Raw Database Query');
    console.log('-'.repeat(60));
    const rawHistory = await VehicleHistory.findOne({ vrm }).lean();
    
    if (!rawHistory) {
      console.log('❌ No history found in database!');
      return;
    }
    
    console.log('✅ History found in database');
    console.log('Database _id:', rawHistory._id);
    console.log('Database numberOfPreviousKeepers:', rawHistory.numberOfPreviousKeepers);
    console.log('Database previousOwners:', rawHistory.previousOwners);
    console.log('Database numberOfOwners:', rawHistory.numberOfOwners);
    console.log('Database apiProvider:', rawHistory.apiProvider);
    
    // Step 2: Check Mongoose document (without .lean())
    console.log('\n📋 STEP 2: Mongoose Document (Model Layer)');
    console.log('-'.repeat(60));
    const mongooseDoc = await VehicleHistory.findOne({ vrm });
    console.log('✅ Mongoose document retrieved');
    console.log('Document numberOfPreviousKeepers:', mongooseDoc.numberOfPreviousKeepers);
    console.log('Document previousOwners:', mongooseDoc.previousOwners);
    console.log('Document numberOfOwners:', mongooseDoc.numberOfOwners);
    
    // Step 3: Check toObject() conversion
    console.log('\n📋 STEP 3: toObject() Conversion');
    console.log('-'.repeat(60));
    const objVersion = mongooseDoc.toObject();
    console.log('✅ Converted to plain object');
    console.log('Object numberOfPreviousKeepers:', objVersion.numberOfPreviousKeepers);
    console.log('Object previousOwners:', objVersion.previousOwners);
    console.log('Object numberOfOwners:', objVersion.numberOfOwners);
    
    // Step 4: Check JSON.stringify (what API returns)
    console.log('\n📋 STEP 4: JSON Serialization (API Response)');
    console.log('-'.repeat(60));
    const jsonString = JSON.stringify(mongooseDoc);
    const jsonParsed = JSON.parse(jsonString);
    console.log('✅ JSON serialized and parsed');
    console.log('JSON numberOfPreviousKeepers:', jsonParsed.numberOfPreviousKeepers);
    console.log('JSON previousOwners:', jsonParsed.previousOwners);
    console.log('JSON numberOfOwners:', jsonParsed.numberOfOwners);
    
    // Step 5: Simulate controller response
    console.log('\n📋 STEP 5: Controller Response Simulation');
    console.log('-'.repeat(60));
    const controllerResponse = {
      success: true,
      data: mongooseDoc
    };
    const controllerJSON = JSON.stringify(controllerResponse);
    const controllerParsed = JSON.parse(controllerJSON);
    console.log('✅ Controller response simulated');
    console.log('Response.data.numberOfPreviousKeepers:', controllerParsed.data.numberOfPreviousKeepers);
    console.log('Response.data.previousOwners:', controllerParsed.data.previousOwners);
    console.log('Response.data.numberOfOwners:', controllerParsed.data.numberOfOwners);
    
    // Step 6: Check Car document link
    console.log('\n📋 STEP 6: Car Document Link');
    console.log('-'.repeat(60));
    const car = await Car.findOne({ registrationNumber: vrm });
    if (car) {
      console.log('✅ Car found');
      console.log('Car _id:', car._id);
      console.log('Car historyCheckId:', car.historyCheckId);
      console.log('Car historyCheckStatus:', car.historyCheckStatus);
      
      if (car.historyCheckId) {
        const linkedHistory = await VehicleHistory.findById(car.historyCheckId);
        if (linkedHistory) {
          console.log('✅ Linked history found');
          console.log('Linked numberOfPreviousKeepers:', linkedHistory.numberOfPreviousKeepers);
        } else {
          console.log('❌ Linked history NOT found!');
        }
      } else {
        console.log('⚠️  No historyCheckId on car');
      }
    } else {
      console.log('❌ Car not found');
    }
    
    // Step 7: Check getMostRecent method (used by controller)
    console.log('\n📋 STEP 7: getMostRecent() Method (Controller Uses This)');
    console.log('-'.repeat(60));
    const mostRecent = await VehicleHistory.getMostRecent(vrm);
    if (mostRecent) {
      console.log('✅ getMostRecent() returned data');
      console.log('MostRecent numberOfPreviousKeepers:', mostRecent.numberOfPreviousKeepers);
      console.log('MostRecent previousOwners:', mostRecent.previousOwners);
      console.log('MostRecent numberOfOwners:', mostRecent.numberOfOwners);
      
      // This is what controller returns
      const finalResponse = {
        success: true,
        data: mostRecent
      };
      console.log('\n📤 Final API Response (what frontend receives):');
      console.log(JSON.stringify(finalResponse, null, 2));
    } else {
      console.log('❌ getMostRecent() returned null');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    
    const allStepsPass = 
      rawHistory.numberOfPreviousKeepers === 7 &&
      mongooseDoc.numberOfPreviousKeepers === 7 &&
      objVersion.numberOfPreviousKeepers === 7 &&
      jsonParsed.numberOfPreviousKeepers === 7 &&
      controllerParsed.data.numberOfPreviousKeepers === 7 &&
      mostRecent.numberOfPreviousKeepers === 7;
    
    if (allStepsPass) {
      console.log('✅ ALL STEPS PASS - Data is correct at every layer');
      console.log('✅ numberOfPreviousKeepers = 7 throughout the flow');
      console.log('\n🎯 If frontend shows 0, the issue is in:');
      console.log('   1. Frontend API call (check Network tab)');
      console.log('   2. Frontend component rendering logic');
      console.log('   3. Browser cache (try hard refresh: Ctrl+Shift+R)');
    } else {
      console.log('❌ DATA LOSS DETECTED - Check which step failed above');
    }
    
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

diagnosticHistoryFlow();
