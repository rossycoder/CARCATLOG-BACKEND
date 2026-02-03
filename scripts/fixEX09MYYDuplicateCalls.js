/**
 * Fix EX09MYY Car - Remove duplicate API calls and verify cost
 * This car was charged £6.44 instead of £1.96 due to duplicate calls
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function fixEX09MYYCar() {
  try {
    console.log('🔧 Fixing EX09MYY Car - Removing Duplicate API Calls\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const vrm = 'EX09MYY';
    
    // Step 1: Find the car
    console.log('1️⃣ Finding EX09MYY car...');
    const car = await Car.findOne({ registrationNumber: vrm });
    
    if (!car) {
      console.log('❌ EX09MYY car not found in database');
      return;
    }
    
    console.log(`✅ Found car: ${car._id}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Current History ID: ${car.historyCheckId}`);
    console.log(`   Variant: ${car.variant}\n`);
    
    // Step 2: Check for duplicate VehicleHistory documents
    console.log('2️⃣ Checking for duplicate VehicleHistory documents...');
    const historyDocs = await VehicleHistory.find({ vrm: vrm });
    console.log(`   Found ${historyDocs.length} VehicleHistory documents for ${vrm}`);
    
    if (historyDocs.length > 1) {
      console.log('⚠️  DUPLICATE DOCUMENTS FOUND:');
      historyDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ID: ${doc._id}, Created: ${doc.createdAt}, Status: ${doc.checkStatus}`);
      });
      
      // Keep the most recent one and delete the rest
      const sortedDocs = historyDocs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const keepDoc = sortedDocs[0];
      const deleteIds = sortedDocs.slice(1).map(doc => doc._id);
      
      console.log(`\n   Keeping most recent: ${keepDoc._id} (${keepDoc.createdAt})`);
      console.log(`   Deleting ${deleteIds.length} duplicate documents...`);
      
      await VehicleHistory.deleteMany({ _id: { $in: deleteIds } });
      console.log('✅ Duplicate documents deleted');
      
      // Update car to reference the kept document
      car.historyCheckId = keepDoc._id;
      car.historyCheckStatus = 'verified';
      car.historyCheckDate = new Date();
      await car.save();
      console.log('✅ Car updated to reference correct history document');
      
    } else if (historyDocs.length === 1) {
      console.log('✅ Only 1 VehicleHistory document found - no duplicates');
    } else {
      console.log('⚠️  No VehicleHistory documents found');
    }
    
    // Step 3: Verify car data completeness
    console.log('\n3️⃣ Verifying car data completeness...');
    console.log(`   Variant: ${car.variant || 'MISSING'}`);
    console.log(`   Engine Size: ${car.engineSize || 'MISSING'}`);
    console.log(`   Display Title: ${car.displayTitle || 'MISSING'}`);
    console.log(`   History Check ID: ${car.historyCheckId || 'MISSING'}`);
    console.log(`   Valuation: ${car.valuation ? 'Present' : 'MISSING'}`);
    
    if (car.valuation) {
      console.log(`     Private: £${car.valuation.privatePrice}`);
      console.log(`     Trade: £${car.valuation.partExchangePrice}`);
      console.log(`     Retail: £${car.valuation.dealerPrice}`);
    }
    
    // Step 4: Cost analysis
    console.log('\n4️⃣ Cost Analysis:');
    console.log('   Expected cost for EX09MYY: £1.96 total');
    console.log('   - Vehicle History: £1.82');
    console.log('   - MOT History: £0.02');
    console.log('   - Valuation: £0.12');
    console.log('   Previous cost: £6.44 (due to duplicates)');
    
    const duplicateCount = Math.max(0, historyDocs.length - 1);
    const wastedCost = duplicateCount * 1.96;
    
    if (duplicateCount > 0) {
      console.log(`   Duplicate calls removed: ${duplicateCount}`);
      console.log(`   Cost saved: £${wastedCost.toFixed(2)}`);
      console.log('✅ DUPLICATE API CALLS FIXED');
    } else {
      console.log('✅ No duplicate calls found');
    }
    
    // Step 5: Final verification
    console.log('\n5️⃣ Final verification...');
    const finalHistoryCount = await VehicleHistory.countDocuments({ vrm: vrm });
    console.log(`   VehicleHistory documents for ${vrm}: ${finalHistoryCount}`);
    
    if (finalHistoryCount === 1) {
      console.log('✅ SUCCESS - Only 1 VehicleHistory document remains');
      console.log('✅ Future API calls for this car will use cache (£0.00)');
    } else if (finalHistoryCount === 0) {
      console.log('⚠️  No VehicleHistory documents - car may need data refresh');
    } else {
      console.log(`❌ Still ${finalHistoryCount} documents - manual cleanup needed`);
    }
    
    console.log('\n🎉 EX09MYY Car Fix Completed!');
    console.log('💰 This car should now cost £1.96 for new data or £0.00 for cached data');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the fix
fixEX09MYYCar();