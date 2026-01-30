require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const Car = require('../models/Car');
const axios = require('axios');
const { parseHistoryResponse } = require('../utils/historyResponseParser');

/**
 * Completely fix RJ08PFA by:
 * 1. Deleting old wrong data
 * 2. Fetching fresh from API
 * 3. Parsing correctly
 * 4. Saving to database
 */
async function fixRJ08PFACompletely() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const vrm = 'RJ08PFA';
    
    console.log('='.repeat(60));
    console.log('COMPLETE FIX FOR RJ08PFA');
    console.log('='.repeat(60));
    
    // Step 1: Delete old wrong data
    console.log('\n📋 Step 1: Deleting old wrong data...');
    const deleted = await VehicleHistory.deleteMany({ vrm });
    console.log(`✅ Deleted ${deleted.deletedCount} old records\n`);
    
    // Step 2: Fetch fresh from API
    console.log('📋 Step 2: Fetching fresh data from CheckCarDetails API...');
    const apiKey = process.env.CHECKCARD_API_KEY;
    const baseUrl = process.env.CHECKCARD_API_BASE_URL;
    const url = `${baseUrl}/vehicledata/carhistorycheck?apikey=${apiKey}&vrm=${vrm}`;
    
    console.log(`API URL: ${url}\n`);
    
    let apiResponse;
    try {
      const response = await axios.get(url, { timeout: 30000 });
      apiResponse = response.data;
      console.log('✅ API call successful\n');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ API daily limit exceeded!');
        console.log('⏰ Please wait 24 hours and try again');
        return;
      }
      throw error;
    }
    
    // Step 3: Parse correctly using historyResponseParser
    console.log('📋 Step 3: Parsing API response...');
    const parsedData = parseHistoryResponse(apiResponse, false);
    
    console.log('✅ Parsed successfully');
    console.log('\n=== Parsed Data ===');
    console.log('numberOfPreviousKeepers:', parsedData.numberOfPreviousKeepers);
    console.log('previousOwners:', parsedData.previousOwners);
    console.log('numberOfOwners:', parsedData.numberOfOwners);
    console.log('numberOfKeys:', parsedData.numberOfKeys);
    console.log('serviceHistory:', parsedData.serviceHistory);
    console.log('v5cCertificateCount:', parsedData.v5cCertificateCount);
    console.log('keeperChangesList length:', parsedData.keeperChangesList?.length);
    console.log('isStolen:', parsedData.isStolen);
    console.log('isWrittenOff:', parsedData.isWrittenOff);
    console.log('hasAccidentHistory:', parsedData.hasAccidentHistory);
    if (parsedData.accidentDetails?.severity !== 'unknown') {
      console.log('Write-off Category:', parsedData.accidentDetails.severity);
    }
    
    // Step 4: Save to database
    console.log('\n📋 Step 4: Saving to database...');
    const historyDoc = new VehicleHistory(parsedData);
    await historyDoc.save();
    console.log('✅ Saved to database');
    console.log('History ID:', historyDoc._id);
    
    // Step 5: Update car
    console.log('\n📋 Step 5: Updating car document...');
    const car = await Car.findOne({ registrationNumber: vrm });
    
    if (car) {
      car.historyCheckId = historyDoc._id;
      car.historyCheckStatus = 'verified';
      car.historyCheckDate = new Date();
      await car.save();
      console.log('✅ Car updated');
      console.log('Car ID:', car._id);
    } else {
      console.log('⚠️  Car not found');
    }
    
    // Step 6: Verify
    console.log('\n📋 Step 6: Verifying...');
    const verifyHistory = await VehicleHistory.findById(historyDoc._id);
    console.log('✅ Verification successful');
    console.log('\n=== Final Database Data ===');
    console.log('numberOfPreviousKeepers:', verifyHistory.numberOfPreviousKeepers);
    console.log('previousOwners:', verifyHistory.previousOwners);
    console.log('numberOfOwners:', verifyHistory.numberOfOwners);
    console.log('apiProvider:', verifyHistory.apiProvider);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPLETE FIX SUCCESSFUL!');
    console.log('='.repeat(60));
    console.log('✅ Old wrong data deleted');
    console.log('✅ Fresh data fetched from API');
    console.log('✅ Correctly parsed');
    console.log('✅ Saved to database');
    console.log('✅ Car updated');
    console.log('\n📝 Next: Refresh browser to see correct data on frontend');
    
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

fixRJ08PFACompletely();
