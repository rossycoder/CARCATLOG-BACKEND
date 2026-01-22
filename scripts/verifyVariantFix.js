/**
 * Verify that variant is properly saved and displayed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function verifyVariantFix() {
  try {
    console.log('🔍 Verifying variant fix...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check all cars with variants
    const carsWithVariants = await Car.find({
      variant: { $exists: true, $ne: null, $ne: '', $ne: 'null', $ne: 'undefined' }
    });
    
    console.log(`✅ Found ${carsWithVariants.length} cars with valid variants:\n`);
    
    carsWithVariants.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Variant: "${car.variant}"`);
      console.log(`   Variant length: ${car.variant.length} chars`);
      console.log(`   Trimmed: "${car.variant.trim()}"`);
      console.log(`   Status: ${car.advertStatus}`);
      console.log('');
    });
    
    // Check cars without variants
    const carsWithoutVariants = await Car.find({
      $or: [
        { variant: null },
        { variant: '' },
        { variant: 'null' },
        { variant: 'undefined' },
        { variant: { $exists: false } }
      ]
    });
    
    console.log(`\n⚠️  Found ${carsWithoutVariants.length} cars WITHOUT valid variants:\n`);
    
    carsWithoutVariants.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Variant: "${car.variant}"`);
      console.log(`   Status: ${car.advertStatus}`);
      console.log('');
    });
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyVariantFix();
