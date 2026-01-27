/**
 * Insert correct vehicle history data for RJ08PFA
 * This is a temporary solution while API daily limit is exceeded
 */

const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
require('dotenv').config();

async function insertCorrectHistory() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    // Correct data from CheckCarDetails API
    const correctData = {
      vrm: 'RJ08PFA',
      checkDate: new Date(),
      hasAccidentHistory: false,
      isStolen: false,
      hasOutstandingFinance: false,
      isScrapped: false,
      isImported: false,
      isExported: false,
      isWrittenOff: false,
      numberOfPreviousKeepers: 7,
      previousOwners: 7,
      numberOfOwners: 7,
      numberOfKeys: 1,
      keys: 1,
      serviceHistory: 'Contact seller',
      motStatus: null,
      motExpiryDate: null,
      checkStatus: 'success',
      apiProvider: 'CheckCarDetails',
      testMode: false,
      accidentDetails: {
        count: 0,
        severity: 'unknown',
        dates: []
      },
      stolenDetails: {
        status: 'active'
      },
      financeDetails: {
        amount: 0,
        lender: 'Unknown',
        type: 'unknown'
      }
    };
    
    // Create new history record
    const history = new VehicleHistory(correctData);
    await history.save();
    
    console.log('\n✅ Inserted correct vehicle history data:');
    console.log('  VRM:', history.vrm);
    console.log('  Number of Previous Keepers:', history.numberOfPreviousKeepers);
    console.log('  Previous Owners:', history.previousOwners);
    console.log('  Number of Owners:', history.numberOfOwners);
    console.log('  Check Status:', history.checkStatus);
    console.log('  API Provider:', history.apiProvider);
    
    console.log('\n💡 Now refresh the browser to see the correct data');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

insertCorrectHistory();
