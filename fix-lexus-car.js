/**
 * Fix the Lexus car - update displayTitle and ensure it shows on frontend
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

async function fixLexusCar() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the Lexus car
    const car = await Car.findOne({ registrationNumber: 'GX65LZP' });
    
    if (!car) {
      console.log('❌ Lexus car not found');
      return;
    }
    
    console.log(`\n📝 Current car data:`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Display Title: ${car.displayTitle}`);
    console.log(`   Advert Status: ${car.advertStatus}`);
    console.log(`   User ID: ${car.userId || 'MISSING'}`);
    console.log(`   Email: ${car.sellerContact?.email || 'MISSING'}`);
    
    // Update displayTitle to AutoTrader format
    const parts = [];
    
    // Engine size (convert CC to litres if needed)
    if (car.engineSize) {
      const size = parseFloat(car.engineSize);
      if (!isNaN(size) && size > 0) {
        const sizeInLitres = size > 100 ? size / 1000 : size;
        parts.push(sizeInLitres.toFixed(1));
      }
    }
    
    // Variant
    if (car.variant) {
      parts.push(car.variant);
    }
    
    // Body type
    if (car.bodyType) {
      parts.push(car.bodyType);
    }
    
    // Transmission
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
    
    // Doors
    if (car.doors) {
      parts.push(`${car.doors}dr`);
    }
    
    const newDisplayTitle = parts.join(' ');
    
    console.log(`\n🔄 Updating car...`);
    console.log(`   New Display Title: ${newDisplayTitle}`);
    
    car.displayTitle = newDisplayTitle;
    
    // Ensure advertStatus is active
    if (car.advertStatus !== 'active') {
      car.advertStatus = 'active';
      console.log(`   Setting advertStatus to: active`);
    }
    
    // Ensure publishedAt is set
    if (!car.publishedAt) {
      car.publishedAt = new Date();
      console.log(`   Setting publishedAt to: ${car.publishedAt}`);
    }
    
    await car.save();
    
    console.log(`\n✅ Car updated successfully!`);
    console.log(`   This car should now show on frontend`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixLexusCar();
