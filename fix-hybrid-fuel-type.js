/**
 * Fix Hybrid vehicles incorrectly classified as Electric
 * This fixes cars where fuelType is "Electric" but should be "Hybrid"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

async function fixHybridFuelTypes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find cars that are incorrectly marked as Electric but are actually Hybrids
    // Look for cars with "HYBRID" in the model name or registration data
    const cars = await Car.find({
      $or: [
        { registrationNumber: 'GX65LZP' }, // Specific Lexus IS 300h
        { 
          fuelType: 'Electric',
          $or: [
            { model: /hybrid/i },
            { variant: /hybrid/i },
            { make: 'LEXUS', model: /300h/i }
          ]
        }
      ]
    });

    console.log(`\n📊 Found ${cars.length} cars to check`);

    let fixedCount = 0;

    for (const car of cars) {
      console.log(`\n🔍 Checking: ${car.make} ${car.model} (${car.registrationNumber})`);
      console.log(`   Current Fuel Type: ${car.fuelType}`);
      console.log(`   Electric Range: ${car.electricRange}`);

      // Check if this is actually a hybrid (not pure electric)
      const isHybrid = 
        car.model?.toLowerCase().includes('hybrid') ||
        car.model?.toLowerCase().includes('300h') ||
        car.variant?.toLowerCase().includes('hybrid') ||
        (car.make === 'LEXUS' && car.model?.includes('300'));

      if (isHybrid && car.fuelType === 'Electric') {
        console.log('\n🔧 FIXING: This is a Hybrid, not Electric!');
        
        // Update fuel type to Hybrid
        car.fuelType = 'Hybrid';
        
        // Remove electric-only fields (hybrids don't have these)
        car.electricRange = null;
        car.batteryCapacity = null;
        car.chargingTime = null;
        car.homeChargingSpeed = null;
        car.publicChargingSpeed = null;
        car.rapidChargingSpeed = null;
        car.chargingTime10to80 = null;
        car.electricMotorPower = null;
        car.electricMotorTorque = null;
        car.chargingPortType = null;
        car.fastChargingCapability = null;
        
        // Also clear from runningCosts object
        if (car.runningCosts) {
          car.runningCosts.electricRange = null;
          car.runningCosts.batteryCapacity = null;
          car.runningCosts.chargingTime = null;
          car.runningCosts.homeChargingSpeed = null;
          car.runningCosts.publicChargingSpeed = null;
          car.runningCosts.rapidChargingSpeed = null;
          car.runningCosts.chargingTime10to80 = null;
          car.runningCosts.electricMotorPower = null;
          car.runningCosts.electricMotorTorque = null;
          car.runningCosts.chargingPortType = null;
          car.runningCosts.fastChargingCapability = null;
        }
        
        // Regenerate display title without electric data
        const parts = [];
        
        // Add engine size
        if (car.engineSize) {
          const size = parseFloat(car.engineSize);
          if (!isNaN(size) && size > 0) {
            const sizeInLitres = size > 100 ? size / 1000 : size;
            const rounded = Math.round(sizeInLitres * 2) / 2;
            parts.push(rounded.toFixed(1));
          }
        }
        
        // Add specific hybrid type
        const variantLower = (car.variant || '').toLowerCase();
        if (variantLower.includes('diesel') || variantLower.includes('tdi') || variantLower.includes('hdi')) {
          parts.push('Diesel Hybrid');
        } else {
          parts.push('Petrol Hybrid');
        }
        
        // Add variant
        if (car.variant && car.variant !== 'null' && car.variant !== 'undefined' && car.variant.trim() !== '') {
          parts.push(car.variant.trim());
        }
        
        // Add body type
        if (car.bodyType && car.bodyType !== 'null' && car.bodyType !== 'undefined') {
          parts.push(car.bodyType);
        }
        
        // Add doors
        if (car.doors && car.doors >= 2 && car.doors <= 5) {
          parts.push(`${car.doors}dr`);
        }
        
        car.displayTitle = parts.join(' ');
        
        await car.save();
        
        console.log('\n✅ FIXED! Updated Car Data:');
        console.log(`   Fuel Type: ${car.fuelType}`);
        console.log(`   Electric Range: ${car.electricRange}`);
        console.log(`   Battery Capacity: ${car.batteryCapacity}`);
        console.log(`   Display Title: ${car.displayTitle}`);
        console.log(`\n🎉 ${car.make} ${car.model} is now correctly classified as Hybrid!`);
        
        fixedCount++;
      } else if (car.fuelType === 'Hybrid') {
        console.log('✅ Car fuel type is already correct: Hybrid');
      } else {
        console.log('✅ Car is correctly marked as Electric (not a hybrid)');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 Fix Summary:');
    console.log(`   Total cars checked: ${cars.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log('='.repeat(80));

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixHybridFuelTypes();
