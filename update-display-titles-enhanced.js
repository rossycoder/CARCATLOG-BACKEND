require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

/**
 * Update all cars with enhanced displayTitle
 * Format: "1.6 XCeed Diesel Hybrid SUV Manual 5dr"
 */
async function updateDisplayTitlesEnhanced() {
  try {
    console.log('🔧 Updating Display Titles with Enhanced Format\n');
    console.log('='.repeat(70));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find all cars
    const cars = await Car.find({});
    console.log(`📊 Found ${cars.length} cars\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const car of cars) {
      const oldDisplayTitle = car.displayTitle;
      const parts = [];
      
      // 1. Engine size
      if (car.engineSize) {
        const size = parseFloat(car.engineSize);
        if (!isNaN(size) && size > 0) {
          parts.push(size.toFixed(1));
        }
      }
      
      // 2. Variant
      if (car.variant) {
        parts.push(car.variant);
      }
      
      // 3. Fuel type
      if (car.fuelType) {
        parts.push(car.fuelType);
      }
      
      // 4. Body type
      if (car.bodyType) {
        parts.push(car.bodyType);
      }
      
      // 5. Transmission
      if (car.transmission) {
        const trans = car.transmission.toLowerCase();
        if (trans.includes('auto') && !trans.includes('semi')) {
          parts.push('Auto');
        } else if (trans.includes('manual')) {
          parts.push('Manual');
        } else if (trans.includes('semi')) {
          parts.push('Semi-Auto');
        }
      }
      
      // 6. Doors
      if (car.doors && car.doors >= 2 && car.doors <= 5) {
        parts.push(`${car.doors}dr`);
      }
      
      const newDisplayTitle = parts.length > 0 ? parts.join(' ') : null;
      
      if (newDisplayTitle && newDisplayTitle !== oldDisplayTitle) {
        console.log(`\n🔄 ${car.registrationNumber || car._id}`);
        console.log(`   Old: "${oldDisplayTitle || 'none'}"`);
        console.log(`   New: "${newDisplayTitle}"`);
        
        car.displayTitle = newDisplayTitle;
        await car.save();
        updated++;
      } else {
        skipped++;
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated} cars`);
    console.log(`   ⏭️  Skipped: ${skipped} cars`);
    console.log(`\n✅ All display titles updated!`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateDisplayTitlesEnhanced();
