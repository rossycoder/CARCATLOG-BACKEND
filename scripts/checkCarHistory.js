/**
 * Check a specific car's history data
 * Usage: node backend/scripts/checkCarHistory.js <VRM>
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const Car = require('../models/Car');

const vrm = process.argv[2];

if (!vrm) {
  console.error('❌ Please provide a VRM');
  console.error('Usage: node backend/scripts/checkCarHistory.js <VRM>');
  process.exit(1);
}

async function checkCarHistory() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find car
    console.log(`🚗 Looking for car with VRM: ${vrm}`);
    const car = await Car.findOne({ registrationNumber: vrm.toUpperCase() });
    
    if (!car) {
      console.log('❌ Car not found in database');
    } else {
      console.log('✅ Car found:');
      console.log(`   ID: ${car._id}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   History Check ID: ${car.historyCheckId}`);
      console.log(`   History Check Status: ${car.historyCheckStatus}\n`);
    }

    // Find history
    console.log(`📋 Looking for history records for VRM: ${vrm}`);
    const histories = await VehicleHistory.find({ vrm: vrm.toUpperCase() });
    
    if (histories.length === 0) {
      console.log('❌ No history records found');
    } else {
      console.log(`✅ Found ${histories.length} history record(s):\n`);
      
      histories.forEach((history, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`   ID: ${history._id}`);
        console.log(`   Check Date: ${history.checkDate}`);
        console.log(`   Make/Model: ${history.make} ${history.model}`);
        console.log(`   Owners: ${history.numberOfPreviousKeepers}`);
        console.log(`   Keys: ${history.numberOfKeys}`);
        console.log(`   \n   Write-off Status:`);
        console.log(`   - isWrittenOff: ${history.isWrittenOff}`);
        console.log(`   - hasAccidentHistory: ${history.hasAccidentHistory}`);
        console.log(`   - writeOffCategory: ${history.writeOffCategory}`);
        console.log(`   - accidentDetails.severity: ${history.accidentDetails?.severity}`);
        console.log(`   - writeOffDetails:`, JSON.stringify(history.writeOffDetails, null, 6));
        console.log(`   \n   Other Checks:`);
        console.log(`   - isStolen: ${history.isStolen}`);
        console.log(`   - hasOutstandingFinance: ${history.hasOutstandingFinance}`);
        console.log(`   - isScrapped: ${history.isScrapped}`);
        console.log(`   - isImported: ${history.isImported}`);
        console.log(`   - isExported: ${history.isExported}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkCarHistory();
