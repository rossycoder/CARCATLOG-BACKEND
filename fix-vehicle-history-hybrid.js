/**
 * Fix VehicleHistory for Hybrid cars incorrectly marked as Electric
 * This ensures when cars are re-added, they get correct data from cache
 */

require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('./models/VehicleHistory');

async function fixVehicleHistoryHybrid() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find VehicleHistory records that are incorrectly marked as Electric
    // but are actually Hybrids (look for "HYBRID" in fuel type from API)
    const histories = await VehicleHistory.find({
      $or: [
        { vrm: 'GX65LZP' }, // Specific Lexus IS 300h
        {
          fuelType: 'Electric',
          $or: [
            { model: /hybrid/i },
            { make: 'LEXUS', model: /300h/i }
          ]
        }
      ]
    });

    console.log(`\n📊 Found ${histories.length} VehicleHistory records to check`);

    let fixedCount = 0;

    for (const history of histories) {
      console.log(`\n🔍 Checking: ${history.make} ${history.model} (${history.vrm})`);
      console.log(`   Current Fuel Type: ${history.fuelType}`);
      console.log(`   Electric Range: ${history.electricRange}`);

      // Check if this is actually a hybrid
      const isHybrid = 
        history.model?.toLowerCase().includes('hybrid') ||
        history.model?.toLowerCase().includes('300h') ||
        (history.make === 'LEXUS' && history.model?.includes('300'));

      if (isHybrid && history.fuelType === 'Electric') {
        console.log('\n🔧 FIXING VehicleHistory: This is a Hybrid, not Electric!');
        
        // Update fuel type to Hybrid
        history.fuelType = 'Hybrid';
        
        // Remove electric-only fields
        history.electricRange = null;
        history.batteryCapacity = null;
        history.chargingTime = null;
        
        await history.save();
        
        console.log('\n✅ FIXED! Updated VehicleHistory:');
        console.log(`   Fuel Type: ${history.fuelType}`);
        console.log(`   Electric Range: ${history.electricRange}`);
        console.log(`   Battery Capacity: ${history.batteryCapacity}`);
        console.log(`\n🎉 VehicleHistory for ${history.vrm} is now correct!`);
        
        fixedCount++;
      } else if (history.fuelType === 'Hybrid') {
        console.log('✅ VehicleHistory fuel type is already correct: Hybrid');
      } else {
        console.log('✅ VehicleHistory is correctly marked as Electric');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 Fix Summary:');
    console.log(`   Total VehicleHistory records checked: ${histories.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log('='.repeat(80));
    console.log('\n💡 Now when you re-add the car, it will get correct data from cache!');

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixVehicleHistoryHybrid();
