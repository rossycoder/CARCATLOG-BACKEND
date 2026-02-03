require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixMissingVariant() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find the specific car by registration
    const registration = 'EK11XHZ'; // Change this to your car's registration
    
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log(`❌ Car not found with registration: ${registration}`);
      process.exit(1);
    }

    console.log('📊 Current Car Data:');
    console.log('==================');
    console.log('Make/Model:', `${car.make} ${car.model}`);
    console.log('Current Variant:', car.variant || 'NOT SET');
    console.log('Current DisplayTitle:', car.displayTitle || 'NOT SET');
    console.log('Engine Size:', car.engineSize);
    console.log('Fuel Type:', car.fuelType);
    console.log('Transmission:', car.transmission);
    console.log('Doors:', car.doors);
    console.log('\n');

    // Fetch variant from API if missing
    if (!car.variant || car.variant === 'null' || car.variant === 'undefined') {
      console.log('🔍 Variant missing - fetching from API...');
      
      const enhancedVehicleService = require('../services/enhancedVehicleService');
      const vehicleData = await enhancedVehicleService.getEnhancedVehicleData(registration, false, car.mileage);
      
      if (vehicleData.variant) {
        car.variant = vehicleData.variant;
        console.log(`✅ Variant found from API: ${vehicleData.variant}`);
      } else {
        console.log('⚠️  No variant found in API data');
      }
    }

    // Auto-generate displayTitle if missing
    if (!car.displayTitle) {
      const parts = [];
      
      // Engine size (without 'L' suffix)
      if (car.engineSize) {
        const size = parseFloat(car.engineSize);
        if (!isNaN(size) && size > 0) {
          parts.push(size.toFixed(1));
        }
      }
      
      // Variant
      if (car.variant && car.variant !== 'null' && car.variant !== 'undefined' && car.variant.trim() !== '') {
        parts.push(car.variant);
      } else if (car.fuelType) {
        parts.push(car.fuelType);
      }
      
      // Body style
      if (car.doors && car.doors >= 2 && car.doors <= 5) {
        parts.push(`${car.doors}dr`);
      }
      
      if (parts.length > 0) {
        car.displayTitle = parts.join(' ');
        console.log(`✅ Generated displayTitle: "${car.displayTitle}"`);
      }
    }

    // Save changes
    await car.save();
    console.log('\n✅ Car updated successfully!');
    
    console.log('\n📊 Updated Car Data:');
    console.log('==================');
    console.log('Variant:', car.variant || 'NOT SET');
    console.log('DisplayTitle:', car.displayTitle || 'NOT SET');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixMissingVariant();
