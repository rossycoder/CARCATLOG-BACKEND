/**
 * Fix RJ08PFA car - the one you just created
 * This car has variant: null because it was created manually
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const vehicleFormatter = require('../utils/vehicleFormatter');

async function fixRJ08PFACar() {
  try {
    console.log('🔧 Fixing RJ08PFA car...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Find the car by registration (with or without space)
    const car = await Car.findOne({
      $or: [
        { registrationNumber: 'RJ08PFA' },
        { registrationNumber: 'RJ08 PFA' }
      ]
    }).sort({ createdAt: -1 }); // Get the latest one
    
    if (!car) {
      console.log('❌ Car not found!');
      return;
    }
    
    console.log('📦 Found car:');
    console.log(`   ID: ${car._id}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Registration: "${car.registrationNumber}"`);
    console.log(`   Current variant: ${car.variant}`);
    console.log(`   Engine Size: ${car.engineSize}L`);
    console.log(`   Fuel Type: ${car.fuelType}`);
    console.log(`   Transmission: ${car.transmission}`);
    console.log(`   Doors: ${car.doors}`);
    
    // Generate variant
    console.log('\n🔧 Generating variant...');
    
    const variantData = {
      make: car.make,
      model: car.model,
      engineSize: car.engineSize,
      engineSizeLitres: car.engineSize,
      fuelType: car.fuelType,
      transmission: car.transmission,
      doors: car.doors
    };
    
    let variant = vehicleFormatter.formatVariant(variantData);
    console.log(`   Generated variant: "${variant}"`);
    
    // If still null, create fallback
    if (!variant || variant.trim() === '') {
      const engineStr = car.engineSize ? `${car.engineSize}L` : '';
      const fuelStr = car.fuelType || 'Petrol';
      const transStr = car.transmission ? car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1) : 'Manual';
      const doorsStr = car.doors ? `${car.doors}dr` : '';
      variant = [engineStr, fuelStr, transStr, doorsStr].filter(Boolean).join(' ');
      console.log(`   Fallback variant: "${variant}"`);
    }
    
    // Update car
    car.variant = variant;
    
    // Also fix registration (remove space)
    if (car.registrationNumber.includes(' ')) {
      car.registrationNumber = car.registrationNumber.replace(/\s/g, '');
      console.log(`   Fixed registration: "${car.registrationNumber}"`);
    }
    
    await car.save();
    
    console.log('\n✅ Car updated successfully!');
    console.log(`   New variant: "${car.variant}"`);
    console.log(`   Registration: "${car.registrationNumber}"`);
    
    // Verify
    const updated = await Car.findById(car._id);
    console.log('\n📦 Verification:');
    console.log(`   Variant in DB: "${updated.variant}"`);
    console.log(`   Should display on frontend: ${updated.variant && updated.variant !== 'null' && updated.variant.trim() !== '' ? '✅ YES' : '❌ NO'}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
  }
}

fixRJ08PFACar();
