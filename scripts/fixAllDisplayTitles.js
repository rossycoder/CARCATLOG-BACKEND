const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

/**
 * Generate AutoTrader-style displayTitle
 * Format: "EngineSize Variant BodyStyle"
 * Example: "1.6 TDI 5dr" or "2.0 320d M Sport 4dr"
 */
function generateDisplayTitle(car) {
  const parts = [];
  
  // Engine size (without 'L' suffix)
  if (car.engineSize) {
    const size = parseFloat(car.engineSize);
    if (!isNaN(size) && size > 0) {
      parts.push(size.toFixed(1));
    }
  }
  
  // Variant (should include fuel type + trim)
  if (car.variant && car.variant !== 'null' && car.variant !== 'undefined' && car.variant.trim() !== '') {
    parts.push(car.variant);
  } else if (car.fuelType) {
    // Fallback to fuel type if no variant
    parts.push(car.fuelType);
  }
  
  // Body style - convert to short form
  if (car.doors && car.doors >= 2 && car.doors <= 5) {
    parts.push(`${car.doors}dr`);
  } else if (car.bodyType) {
    const bodyType = car.bodyType.toLowerCase();
    if (bodyType.includes('estate')) {
      parts.push('Estate');
    } else if (bodyType.includes('saloon') || bodyType.includes('sedan')) {
      parts.push('Saloon');
    } else if (bodyType.includes('coupe')) {
      parts.push('Coupe');
    } else if (bodyType.includes('convertible') || bodyType.includes('cabriolet')) {
      parts.push('Convertible');
    } else if (bodyType.includes('suv')) {
      parts.push('SUV');
    } else if (bodyType.includes('mpv')) {
      parts.push('MPV');
    }
  }
  
  return parts.join(' ');
}

async function fixAllDisplayTitles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all cars
    const cars = await Car.find({});
    console.log(`\nFound ${cars.length} cars in database`);

    let updated = 0;
    let skipped = 0;

    for (const car of cars) {
      const oldDisplayTitle = car.displayTitle;
      const newDisplayTitle = generateDisplayTitle(car);
      
      // Only update if different
      if (oldDisplayTitle !== newDisplayTitle) {
        car.displayTitle = newDisplayTitle;
        await car.save();
        updated++;
        
        console.log(`\n✅ Updated: ${car.make} ${car.model}`);
        console.log(`   Old: "${oldDisplayTitle || 'undefined'}"`);
        console.log(`   New: "${newDisplayTitle}"`);
      } else {
        skipped++;
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total cars: ${cars.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped (already correct): ${skipped}`);
    console.log(`\n✅ All displayTitles fixed!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixAllDisplayTitles();
