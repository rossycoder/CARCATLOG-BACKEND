require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function checkHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const historyId = '697217e723bac81e8f993680';
    const history = await VehicleHistory.findById(historyId);

    if (!history) {
      console.log('History record not found');
      return;
    }

    console.log('\n=== VEHICLE HISTORY RECORD ===');
    console.log('VRM:', history.vrm);
    console.log('\n=== RAW DATA ===');
    console.log(JSON.stringify(history.toObject(), null, 2));
    
    console.log('\n=== CHECKING FOR CONTRADICTIONS ===');
    
    // Check for write-off contradictions
    const writeOffFields = {
      hasAccidentHistory: history.hasAccidentHistory,
      isWrittenOff: history.isWrittenOff,
      writeOffCategory: history.writeOffCategory,
      categoryD: history.categoryD,
      categoryN: history.categoryN
    };
    
    console.log('Write-off related fields:', writeOffFields);
    
    const hasAnyWriteOff = Object.values(writeOffFields).some(val => val === true || (typeof val === 'string' && val.length > 0));
    const hasNeverWrittenOff = history.neverWrittenOff === true || history.hasAccidentHistory === false;
    
    if (hasAnyWriteOff && hasNeverWrittenOff) {
      console.log('\n⚠️  CONTRADICTION DETECTED!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkHistory();
