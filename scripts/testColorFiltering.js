const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testColorFiltering() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Get all colors
    const allColors = await Car.distinct('color', { advertStatus: 'active' });
    console.log('\n📊 All colors in database:', allColors);

    // Test 2: Get Honda colors only
    const hondaColors = await Car.distinct('color', { 
      advertStatus: 'active',
      make: 'HONDA'
    });
    console.log('\n🚗 Honda colors only:', hondaColors);

    // Test 3: Get Honda Civic colors only
    const hondaCivicColors = await Car.distinct('color', { 
      advertStatus: 'active',
      make: 'HONDA',
      model: 'CIVIC'
    });
    console.log('\n🚗 Honda Civic colors only:', hondaCivicColors);

    // Test 4: Get Honda Civic with specific variant colors
    const hondaCivicVariantColors = await Car.distinct('color', { 
      advertStatus: 'active',
      make: 'HONDA',
      model: 'CIVIC',
      variant: { $ne: null }
    });
    console.log('\n🚗 Honda Civic (with variant) colors:', hondaCivicVariantColors);

    await mongoose.connection.close();
    console.log('\n✅ Test complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testColorFiltering();
