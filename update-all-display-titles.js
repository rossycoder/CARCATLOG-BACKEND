/**
 * Update all cars with AutoTrader-style displayTitle
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

async function updateAllDisplayTitles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all cars
    const cars = await Car.find({});
    console.log(`\n📊 Found ${cars.length} cars to update`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const car of cars) {
      const oldDisplayTitle = car.displayTitle;
      
      // Generate displayTitle using AutoTrader format
      const parts = [];
      
      // For NON-ELECTRIC vehicles: Add engine size first
      if (car.fuelType !== 'Electric' && car.engineSize) {
        const size = parseFloat(car.engineSize);
        if (!isNaN(size) && size > 0) {
          // Check if variant already contains engine size info (common for vans like "35 L2H2")
          const variantHasEngineInfo = car.variant && /^\d+/.test(car.variant);
          if (!variantHasEngineInfo) {
            // If engine size is > 100, it's in CC, convert to litres
            const sizeInLitres = size > 100 ? size / 1000 : size;
            parts.push(sizeInLitres.toFixed(1));
          }
        }
      }
      
      // Add variant if available
      if (car.variant && 
          car.variant !== 'null' && 
          car.variant !== 'undefined' && 
          car.variant.trim() !== '') {
        parts.push(car.variant.trim());
      }
      
      // For ELECTRIC vehicles: Add battery capacity
      if (car.fuelType === 'Electric') {
        const batteryCapacity = car.batteryCapacity || car.runningCosts?.batteryCapacity;
        if (batteryCapacity) {
          parts.push(`${batteryCapacity}kWh`);
        }
      }
      
      // Add body type ONLY if it's NOT already in the variant
      if (car.bodyType && car.bodyType !== 'null' && car.bodyType !== 'undefined') {
        const bodyTypeInVariant = car.variant && 
          car.variant.toUpperCase().includes(car.bodyType.toUpperCase());
        
        if (!bodyTypeInVariant) {
          parts.push(car.bodyType);
        }
      }
      
      // Add transmission (Auto/Manual)
      if (car.transmission) {
        const trans = car.transmission.toLowerCase();
        if (trans === 'automatic' || trans === 'auto') {
          parts.push('Auto');
        } else if (trans === 'manual') {
          parts.push('Manual');
        } else {
          parts.push(car.transmission);
        }
      }
      
      // Add emission class (Euro 5, Euro 6, etc.) - for non-electric vehicles
      if (car.fuelType !== 'Electric' && car.emissionClass && car.emissionClass.includes('Euro')) {
        parts.push(car.emissionClass);
      }
      
      // Add drive type if available (AWD, FWD, RWD, 4WD)
      if (car.driveType) {
        parts.push(car.driveType);
      }
      
      // Add doors (5dr, 3dr, etc.)
      if (car.doors) {
        parts.push(`${car.doors}dr`);
      }
      
      const newDisplayTitle = parts.length > 0 ? parts.join(' ') : null;
      
      if (newDisplayTitle && newDisplayTitle !== oldDisplayTitle) {
        car.displayTitle = newDisplayTitle;
        await car.save();
        updated++;
        console.log(`✅ Updated: ${car.make} ${car.model}`);
        console.log(`   Old: "${oldDisplayTitle || 'none'}"`);
        console.log(`   New: "${newDisplayTitle}"`);
      } else {
        skipped++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total cars: ${cars.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

updateAllDisplayTitles();
