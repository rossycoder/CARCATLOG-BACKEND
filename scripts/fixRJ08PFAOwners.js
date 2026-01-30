/**
 * Fix RJ08PFA owner count
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function fixOwners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const vrm = 'RJ08PFA';
    
    console.log(`🔍 Finding history for: ${vrm}`);
    const history = await VehicleHistory.findOne({ vrm }).sort({ checkDate: -1 });

    if (!history) {
      console.log('❌ No history found!');
      return;
    }

    console.log(`✅ History found`);
    console.log(`   Current numberOfPreviousKeepers: ${history.numberOfPreviousKeepers}`);
    console.log(`   Current previousOwners: ${history.previousOwners}`);
    console.log(`   Current numberOfOwners: ${history.numberOfOwners}\n`);

    // Fix: Use previousOwners value for all owner fields
    const correctOwnerCount = history.previousOwners || 7;
    
    history.numberOfPreviousKeepers = correctOwnerCount;
    history.numberOfOwners = correctOwnerCount;
    
    await history.save();
    
    console.log('✅ FIXED!');
    console.log(`   New numberOfPreviousKeepers: ${history.numberOfPreviousKeepers}`);
    console.log(`   New previousOwners: ${history.previousOwners}`);
    console.log(`   New numberOfOwners: ${history.numberOfOwners}\n`);
    
    console.log('✨ Now frontend will show: Owners: 7\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

fixOwners();
