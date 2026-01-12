require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function checkCache() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Check for any vehicle history records
    const count = await VehicleHistory.countDocuments();
    console.log(`Total vehicle history records: ${count}\n`);
    
    if (count > 0) {
      // Get recent records
      const recent = await VehicleHistory.find()
        .sort({ checkDate: -1 })
        .limit(5);
      
      console.log('Recent vehicle history checks:');
      recent.forEach((record, index) => {
        console.log(`\n${index + 1}. VRM: ${record.vrm}`);
        console.log(`   Check Date: ${record.checkDate}`);
        console.log(`   Owners: ${record.owners || 'N/A'}`);
        console.log(`   Keys: ${record.keys || 'N/A'}`);
        console.log(`   Is Mock: ${record.isMockData || false}`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCache();
