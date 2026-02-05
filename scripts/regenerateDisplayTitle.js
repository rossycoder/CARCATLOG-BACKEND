require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function regenerateDisplayTitle() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const carId = '6983ca26c10d3f3d9b026626';
    console.log(`🔍 Finding BMW car: ${carId}`);
    
    const car = await Car.findById(carId);

    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }

    console.log('\n📊 Current Car Data:');
    console.log('=====================================');
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('Engine Size:', car.engineSize);
    console.log('Body Type:', car.bodyType);
    console.log('Transmission:', car.transmission);
    console.log('Emission Class:', car.emissionClass);
    console.log('Doors:', car.doors);
    console.log('Current Display Title:', car.displayTitle);

    // Manually generate displayTitle using the same logic as pre-save hook
    console.log('\n🔄 Regenerating display title...');
    
    const parts = [];
    
    // 1. Engine size (without 'L' suffix for AutoTrader style)
    if (car.engineSize) {
      const size = parseFloat(car.engineSize);
      if (!isNaN(size) && size > 0) {
        parts.push(size.toFixed(1));
      }
    }
    
    // 2. Real API variant (the main technical specification)
    if (car.variant && car.variant !== 'null' && car.variant !== 'undefined') {
      parts.push(car.variant);
    }
    
    // 3. Body type (for comprehensive title)
    if (car.bodyType && car.bodyType !== 'null' && car.bodyType !== 'undefined') {
      parts.push(car.bodyType);
    }
    
    // 4. Transmission
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
    
    // 5. Euro status if available (like "Euro 5", "Euro 6")
    if (car.emissionClass && car.emissionClass.includes('Euro')) {
      parts.push(car.emissionClass);
    }
    
    // 6. Doors (like "3dr", "4dr", "5dr")
    if (car.doors && car.doors >= 2 && car.doors <= 5) {
      parts.push(`${car.doors}dr`);
    }
    
    const newDisplayTitle = parts.join(' ');
    
    console.log('\n🎯 New Display Title:');
    console.log(`   "${newDisplayTitle}"`);
    
    // Update and save
    car.displayTitle = newDisplayTitle;
    
    // Mark as modified to ensure save
    car.markModified('displayTitle');
    
    await car.save();

    console.log('\n✅ Display Title Updated!');
    console.log('=====================================');
    console.log('Display Title:', car.displayTitle);
    console.log('\n✅ This will now show on frontend!');

    await mongoose.connection.close();
    console.log('\n✅ Regeneration completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

regenerateDisplayTitle();
