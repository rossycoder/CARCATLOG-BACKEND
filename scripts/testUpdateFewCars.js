/**
 * Test: Update first 5 cars with variant field
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testUpdateFewCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get first 5 cars with registration
    const cars = await Car.find({ 
      registrationNumber: { $exists: true, $ne: null, $ne: '' }
    }).limit(5);

    console.log(`\n📊 Testing with ${cars.length} cars`);
    console.log('='.repeat(80));

    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      console.log(`\n[${i + 1}/${cars.length}] ${car.registrationNumber}`);
      
      try {
        const vehicleData = await checkCarDetailsClient.getVehicleData(car.registrationNumber);
        
        if (vehicleData && vehicleData.variant) {
          car.variant = vehicleData.variant;
          
          // Update engine size if missing or 0
          if ((!car.engineSize || car.engineSize === 0) && vehicleData.engineSize) {
            car.engineSize = vehicleData.engineSize;
          }
          
          await car.save();
          console.log(`✅ ${car.make} ${car.model}`);
          console.log(`   Variant: ${vehicleData.variant}`);
          console.log(`   Engine: ${vehicleData.engineSize}cc`);
        } else {
          console.log(`⚠️  No variant available`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Test complete');

  } catch (error) {
    console.error('❌ Fatal Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testUpdateFewCars();
