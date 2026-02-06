require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function fixCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const carId = '69864ffba41026f9288bb44c';
    
    console.log('\n🔍 Fetching car...');
    const car = await Car.findById(carId).populate('historyCheckId');
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }

    console.log('\n📋 BEFORE FIX:');
    console.log('Variant:', car.variant);
    console.log('Doors:', car.doors);
    console.log('Seats:', car.seats);
    console.log('Body Type:', car.bodyType);
    console.log('Transmission:', car.transmission);
    
    if (!car.historyCheckId) {
      console.log('❌ No history check data available');
      process.exit(1);
    }
    
    console.log('\n🔧 FIXING FROM HISTORY CHECK DATA...');
    
    // Update variant from history
    if (car.historyCheckId.variant) {
      console.log('✅ Updating variant:', car.historyCheckId.variant);
      car.variant = car.historyCheckId.variant;
    }
    
    // Update doors from history
    if (car.historyCheckId.doors) {
      console.log('✅ Updating doors:', car.historyCheckId.doors);
      car.doors = car.historyCheckId.doors;
    }
    
    // Update seats from history
    if (car.historyCheckId.seats) {
      console.log('✅ Updating seats:', car.historyCheckId.seats);
      car.seats = car.historyCheckId.seats;
    }
    
    // Update body type from history
    if (car.historyCheckId.bodyType) {
      console.log('✅ Updating body type:', car.historyCheckId.bodyType);
      car.bodyType = car.historyCheckId.bodyType;
    }
    
    // Update transmission from history (if car has wrong value)
    if (car.historyCheckId.transmission && car.transmission !== car.historyCheckId.transmission.toLowerCase()) {
      console.log('✅ Updating transmission:', car.historyCheckId.transmission);
      car.transmission = car.historyCheckId.transmission.toLowerCase();
    }
    
    // Regenerate display title
    const generateDisplayTitle = (car) => {
      const parts = [];
      
      // Engine size
      if (car.engineSize) {
        const size = parseFloat(car.engineSize);
        if (!isNaN(size) && size > 0) {
          parts.push(size.toFixed(1));
        }
      }
      
      // Variant
      if (car.variant && car.variant !== 'null' && car.variant !== 'undefined') {
        parts.push(car.variant);
      }
      
      // Body type
      if (car.bodyType && car.bodyType !== 'null' && car.bodyType !== 'undefined') {
        parts.push(car.bodyType);
      }
      
      // Transmission
      if (car.transmission) {
        const trans = car.transmission.toLowerCase();
        if (trans === 'automatic' || trans === 'auto') {
          parts.push('Auto');
        } else if (trans === 'manual') {
          parts.push('Manual');
        }
      }
      
      // Doors
      if (car.doors) {
        parts.push(`${car.doors}dr`);
      }
      
      return parts.length > 0 ? parts.join(' ') : null;
    };
    
    car.displayTitle = generateDisplayTitle(car);
    console.log('✅ Updated display title:', car.displayTitle);
    
    // Save the car
    await car.save();
    
    console.log('\n✅ AFTER FIX:');
    console.log('Variant:', car.variant);
    console.log('Doors:', car.doors);
    console.log('Seats:', car.seats);
    console.log('Body Type:', car.bodyType);
    console.log('Transmission:', car.transmission);
    console.log('Display Title:', car.displayTitle);
    
    console.log('\n🎉 Car fixed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixCar();
