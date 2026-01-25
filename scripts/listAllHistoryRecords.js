/**
 * List All History Records
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const VehicleHistory = require('../models/VehicleHistory');

async function listAllHistoryRecords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const historyRecords = await VehicleHistory.find().sort({ checkDate: -1 });

    console.log(`Total history records: ${historyRecords.length}\n`);

    for (const history of historyRecords) {
      console.log(`📋 ${history.vrm}`);
      console.log(`   ID: ${history._id}`);
      console.log(`   Check Date: ${history.checkDate.toLocaleString()}`);
      console.log(`   API Provider: ${history.apiProvider}`);
      console.log(`   Written Off: ${history.isWrittenOff ? 'YES' : 'NO'}`);
      console.log(`   Has Accident History: ${history.hasAccidentHistory ? 'YES' : 'NO'}`);
      if (history.accidentDetails) {
        console.log(`   Accident Severity: ${history.accidentDetails.severity}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

listAllHistoryRecords();
