require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');
const VehicleHistory = require('./models/VehicleHistory');

async function fixMHEVVehicles() {
  try {
    console.log('🔧 Fixing MHEV (Mild Hybrid) Vehicles\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find all vehicles with MHEV in model or variant
    const mhevCars = await Car.find({
      $or: [
        { model: /MHEV/i },
        { variant: /MHEV/i },
        { displayTitle: /MHEV/i }
      ]
    });
    
    console.log(`📊 Found ${mhevCars.length} MHEV vehicles\n`);
    
    if (mhevCars.length === 0) {
      console.log('✅ No MHEV vehicles found to fix');
      await mongoose.disconnect();
      return;
    }
    
    let fixedCount = 0;
    
    for (const car of mhevCars) {
      console.log(`\n🚗 Processing: ${car.registrationNumber}`);
      console.log(`   Model: ${car.model}`);
      console.log(`   Variant: ${car.variant}`);
      console.log(`   Current Fuel Type: ${car.fuelType}`);
      
      let needsUpdate = false;
      const updates = {};
      
      // Fix fuel type if it's not already a hybrid
      if (car.fuelType && !car.fuelType.toLowerCase().includes('hybrid')) {
        const baseFuelType = car.fuelType.toLowerCase();
        
        if (baseFuelType.includes('diesel')) {
          updates.fuelType = 'Diesel Hybrid';
          console.log(`   ✅ Fixing fuel type: ${car.fuelType} → Diesel Hybrid`);
          needsUpdate = true;
        } else if (baseFuelType.includes('petrol')) {
          updates.fuelType = 'Petrol Hybrid';
          console.log(`   ✅ Fixing fuel type: ${car.fuelType} → Petrol Hybrid`);
          needsUpdate = true;
        }
      }
      
      // Fix CO2 if it's suspiciously low (1 g/km is wrong for MHEV)
      if (car.co2Emissions === 1) {
        console.log(`   ⚠️  CO2 emissions is 1 g/km (likely incorrect)`);
        console.log(`   ℹ️  Typical MHEV CO2: 100-130 g/km`);
        console.log(`   ℹ️  Will be corrected on next API refresh`);
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        await Car.updateOne(
          { _id: car._id },
          { $set: updates }
        );
        fixedCount++;
        console.log(`   ✅ Updated successfully`);
      } else {
        console.log(`   ℹ️  No changes needed`);
      }
      
      // Also fix VehicleHistory if exists
      if (car.historyCheckId) {
        const history = await VehicleHistory.findById(car.historyCheckId);
        if (history && history.fuelType && !history.fuelType.toLowerCase().includes('hybrid')) {
          const historyUpdates = {};
          
          if (history.fuelType.toLowerCase().includes('diesel')) {
            historyUpdates.fuelType = 'Diesel Hybrid';
          } else if (history.fuelType.toLowerCase().includes('petrol')) {
            historyUpdates.fuelType = 'Petrol Hybrid';
          }
          
          if (Object.keys(historyUpdates).length > 0) {
            await VehicleHistory.updateOne(
              { _id: history._id },
              { $set: historyUpdates }
            );
            console.log(`   ✅ VehicleHistory fuel type also updated`);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Fixed ${fixedCount} out of ${mhevCars.length} MHEV vehicles`);
    console.log('='.repeat(60));
    
    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMHEVVehicles();
