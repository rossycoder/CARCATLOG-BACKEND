require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixLatestCarVariant() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find the latest active car
    const car = await Car.findOne({ advertStatus: 'active' }).sort({ createdAt: -1 });
    
    if (!car) {
      console.log('❌ No active cars found');
      process.exit(1);
    }

    console.log('📊 Latest Active Car:');
    console.log('==================');
    console.log('Registration:', car.registrationNumber);
    console.log('Make/Model:', `${car.make} ${car.model}`);
    console.log('Current Variant:', car.variant || 'NOT SET');
    console.log('Current DisplayTitle:', car.displayTitle || 'NOT SET');
    console.log('Engine Size:', car.engineSize);
    console.log('Fuel Type:', car.fuelType);
    console.log('Transmission:', car.transmission);
    console.log('Doors:', car.doors);
    console.log('Year:', car.year);
    console.log('Mileage:', car.mileage);
    console.log('\n');

    let needsUpdate = false;

    // Fetch variant from API if missing
    if (!car.variant || car.variant === 'null' || car.variant === 'undefined' || car.variant.trim() === '') {
      console.log('🔍 Variant missing - fetching from API...');
      
      try {
        const enhancedVehicleService = require('../services/enhancedVehicleService');
        const vehicleData = await enhancedVehicleService.getEnhancedVehicleData(car.registrationNumber, false, car.mileage);
        
        if (vehicleData.variant && vehicleData.variant !== 'null' && vehicleData.variant !== 'undefined' && vehicleData.variant.trim() !== '') {
          car.variant = vehicleData.variant;
          console.log(`✅ Variant found from API: "${vehicleData.variant}"`);
          needsUpdate = true;
        } else {
          console.log('⚠️  No variant found in API data');
          // Set a fallback variant based on fuel type and engine size
          if (car.fuelType && car.engineSize) {
            car.variant = `${car.engineSize}L ${car.fuelType}`;
            console.log(`✅ Generated fallback variant: "${car.variant}"`);
            needsUpdate = true;
          }
        }
      } catch (error) {
        console.error('⚠️  API call failed:', error.message);
        // Set a fallback variant
        if (car.fuelType && car.engineSize) {
          car.variant = `${car.engineSize}L ${car.fuelType}`;
          console.log(`✅ Generated fallback variant: "${car.variant}"`);
          needsUpdate = true;
        }
      }
    } else {
      console.log(`✅ Variant already exists: "${car.variant}"`);
    }

    // Auto-generate displayTitle if missing or needs update
    if (!car.displayTitle || needsUpdate) {
      const parts = [];
      
      // Engine size (without 'L' suffix for AutoTrader style)
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
      
      // Body style - doors
      if (car.doors && car.doors >= 2 && car.doors <= 5) {
        parts.push(`${car.doors}dr`);
      }
      
      if (parts.length > 0) {
        car.displayTitle = parts.join(' ');
        console.log(`✅ Generated displayTitle: "${car.displayTitle}"`);
        needsUpdate = true;
      }
    }

    // Save changes if needed
    if (needsUpdate) {
      await car.save();
      console.log('\n✅ Car updated successfully!');
    } else {
      console.log('\n✅ No updates needed - car already has variant and displayTitle');
    }
    
    console.log('\n📊 Final Car Data:');
    console.log('==================');
    console.log('Registration:', car.registrationNumber);
    console.log('Variant:', car.variant || 'NOT SET');
    console.log('DisplayTitle:', car.displayTitle || 'NOT SET');
    console.log('Make/Model:', `${car.make} ${car.model}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixLatestCarVariant();