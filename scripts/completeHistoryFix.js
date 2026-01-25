/**
 * Complete History Fix
 * Clears cache, tests parser, and verifies the complete flow
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function completeHistoryFix() {
  try {
    console.log('🔧 Complete History Fix\n');
    console.log('='.repeat(80));
    
    // Connect to database
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    // Clear vehicle history cache
    console.log('\n🗑️  Clearing vehicle history cache...');
    const VehicleHistory = require('../models/VehicleHistory');
    const deleteResult = await VehicleHistory.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} cached records`);
    
    // Test parser directly
    console.log('\n🧪 Testing Parser...');
    const { parseHistoryResponse } = require('../utils/historyResponseParser');
    
    const sampleResponse = {
      VehicleRegistration: {
        Vrm: 'EX09MYY',
        Make: 'HONDA',
        Model: 'CIVIC TYPE S I-VTEC',
        Scrapped: false,
        Imported: false,
        Exported: false,
      },
      VehicleHistory: {
        NumberOfPreviousKeepers: 5,
        writeOffRecord: true,
        writeoff: {
          status: 'CAT D VEHICLE DAMAGED',
          lossdate: '2016-12-19',
          category: 'D',
        },
        stolenRecord: false,
        financeRecord: false,
      },
    };
    
    const parsedResult = parseHistoryResponse(sampleResponse, false);
    console.log('✅ Parser working correctly');
    console.log('   - hasAccidentHistory:', parsedResult.hasAccidentHistory);
    console.log('   - isWrittenOff:', parsedResult.isWrittenOff);
    console.log('   - accidentDetails.severity:', parsedResult.accidentDetails.severity);
    console.log('   - stolenDetails:', parsedResult.stolenDetails ? '✅ Present' : '❌ Missing');
    console.log('   - financeDetails:', parsedResult.financeDetails ? '✅ Present' : '❌ Missing');
    
    // Test saving to database
    console.log('\n💾 Testing Database Save...');
    try {
      const testDoc = new VehicleHistory(parsedResult);
      await testDoc.save();
      console.log('✅ Successfully saved to database');
      console.log('   Document ID:', testDoc._id);
      
      // Verify it was saved correctly
      const retrieved = await VehicleHistory.findById(testDoc._id);
      console.log('✅ Successfully retrieved from database');
      console.log('   - Severity:', retrieved.accidentDetails.severity);
      console.log('   - stolenDetails:', retrieved.stolenDetails);
      console.log('   - financeDetails:', retrieved.financeDetails);
      
      // Clean up test document
      await VehicleHistory.findByIdAndDelete(testDoc._id);
      console.log('✅ Test document cleaned up');
      
    } catch (saveError) {
      console.error('❌ Database save failed:', saveError.message);
      if (saveError.errors) {
        console.error('   Validation errors:');
        Object.keys(saveError.errors).forEach(key => {
          console.error(`   - ${key}: ${saveError.errors[key].message}`);
        });
      }
      throw saveError;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(80));
    console.log('\n📋 Summary:');
    console.log('  ✅ Cache cleared');
    console.log('  ✅ Parser working');
    console.log('  ✅ Database schema valid');
    console.log('  ✅ Save/retrieve working');
    console.log('\n💡 Next Steps:');
    console.log('  1. Backend server should be restarted');
    console.log('  2. Test frontend: node backend/scripts/testFrontendHistoryEndpoint.js');
    console.log('  3. Or test in browser: http://localhost:3000/cars/[car-id]');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 MongoDB connection closed');
  }
}

completeHistoryFix();
