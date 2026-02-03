require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function fixVN73ETRBodyType() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const registration = 'VN73ETR';
    console.log(`\n🔧 Fixing body type for: ${registration}`);
    console.log('=====================================');

    // 1. Check if car exists in database
    let car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found in database - cannot fix');
      return;
    }

    console.log('✅ Car found in database');
    console.log(`   Current Body Type: "${car.bodyType}"`);
    console.log(`   Current Fuel Type: "${car.fuelType}"`);

    // 2. Get correct data from API
    console.log('\n📡 Fetching correct data from API...');
    
    try {
      const specsData = await CheckCarDetailsClient.getVehicleSpecs(registration);
      
      if (specsData && specsData.BodyDetails) {
        const correctBodyType = specsData.BodyDetails.BodyStyle; // "SUV"
        const correctFuelType = specsData.ModelData?.FuelType || specsData.VehicleIdentification?.DvlaFuelType;
        
        console.log(`✅ API data received:`);
        console.log(`   Correct Body Type: "${correctBodyType}"`);
        console.log(`   Correct Fuel Type: "${correctFuelType}"`);
        
        // 3. Update the car if needed
        let needsUpdate = false;
        const updates = {};
        
        if (car.bodyType !== correctBodyType) {
          console.log(`\n🔧 Body type needs update: "${car.bodyType}" → "${correctBodyType}"`);
          updates.bodyType = correctBodyType;
          needsUpdate = true;
        }
        
        if (car.fuelType !== correctFuelType) {
          console.log(`🔧 Fuel type needs update: "${car.fuelType}" → "${correctFuelType}"`);
          updates.fuelType = correctFuelType;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          console.log('\n💾 Updating car in database...');
          
          const updatedCar = await Car.findByIdAndUpdate(
            car._id,
            { 
              ...updates,
              updatedAt: new Date()
            },
            { new: true }
          );
          
          if (updatedCar) {
            console.log('✅ Car updated successfully!');
            console.log(`   New Body Type: "${updatedCar.bodyType}"`);
            console.log(`   New Fuel Type: "${updatedCar.fuelType}"`);
            console.log('\n🎉 Frontend will now show correct body type!');
          } else {
            console.log('❌ Failed to update car');
          }
        } else {
          console.log('\n✅ Car data is already correct - no update needed');
        }
        
      } else {
        console.log('❌ Could not get API data');
      }
      
    } catch (apiError) {
      console.log('❌ API error:', apiError.message);
    }

    // 4. Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const verifiedCar = await Car.findOne({ registrationNumber: registration });
    
    if (verifiedCar) {
      console.log(`   Database Body Type: "${verifiedCar.bodyType}"`);
      console.log(`   Database Fuel Type: "${verifiedCar.fuelType}"`);
      
      if (verifiedCar.bodyType === 'SUV') {
        console.log('✅ Body type is now correct!');
      } else {
        console.log('❌ Body type is still incorrect');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

fixVN73ETRBodyType();