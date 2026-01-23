const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

/**
 * Generate AutoTrader-style displayTitle
 * Format: "EngineSize Variant BodyStyle"
 * Example: "1.6 TDI S 5dr"
 */
function generateDisplayTitle(car) {
  const parts = [];
  
  // Engine size (without 'L' suffix)
  if (car.engineSize) {
    const size = parseFloat(car.engineSize);
    if (!isNaN(size)) {
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
  if (car.doors) {
    parts.push(`${car.doors}dr`);
  } else if (car.bodyType) {
    const bodyType = car.bodyType.toLowerCase();
    if (bodyType.includes('hatchback')) {
      parts.push('Hatchback');
    } else if (bodyType.includes('saloon') || bodyType.includes('sedan')) {
      parts.push('Saloon');
    } else if (bodyType.includes('estate')) {
      parts.push('Estate');
    } else if (bodyType.includes('coupe')) {
      parts.push('Coupe');
    } else if (bodyType.includes('convertible')) {
      parts.push('Convertible');
    }
  }
  
  return parts.join(' ');
}

async function fixSkodaDisplayTitle() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the Skoda Octavia
    const skoda = await Car.findOne({ 
      make: 'SKODA',
      model: 'Octavia'
    });

    if (!skoda) {
      console.log('Skoda Octavia not found');
      return;
    }

    console.log('\n=== BEFORE FIX ===');
    console.log('Variant:', skoda.variant);
    console.log('DisplayTitle:', skoda.displayTitle);
    console.log('Engine Size:', skoda.engineSize);
    console.log('Fuel Type:', skoda.fuelType);
    console.log('Body Type:', skoda.bodyType);
    console.log('Doors:', skoda.doors);

    // Generate the displayTitle
    const displayTitle = generateDisplayTitle(skoda);
    
    console.log('\n=== GENERATED ===');
    console.log('New DisplayTitle:', displayTitle);

    // Update the car
    skoda.displayTitle = displayTitle;
    await skoda.save();

    console.log('\n=== AFTER FIX ===');
    console.log('DisplayTitle saved:', skoda.displayTitle);
    console.log('\n✅ Skoda Octavia displayTitle fixed!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixSkodaDisplayTitle();
