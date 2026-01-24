const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Car = require('../models/Car');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function fixAllZeroEngineSizes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const client = new CheckCarDetailsClient();

    // Find all cars with zero/null engine size that have registration numbers
    const carsToFix = await Car.find({
      registrationNumber: { $exists: true, $ne: null },
      $or: [
        { engineSize: 0 },
        { engineSize: null },
        { engineSize: { $exists: false } }
      ]
    });

    console.log(`\n📊 Found ${carsToFix.length} cars with zero/null engine size\n`);

    if (carsToFix.length === 0) {
      console.log('✅ No cars need fixing!');
      return;
    }

    let fixed = 0;
    let failed = 0;

    for (const car of carsToFix) {
      try {
        console.log(`\n🔧 Fixing: ${car.registrationNumber} - ${car.make} ${car.model}`);
        
        // Fetch fresh data from CheckCarDetails API
        const vehicleData = await client.getVehicleData(car.registrationNumber);
        
        if (vehicleData && vehicleData.engineSize) {
          const oldEngineSize = car.engineSize;
          car.engineSize = vehicleData.engineSize;
          
          // Save (this will trigger displayTitle regeneration)
          await car.save();
          
          console.log(`✅ Updated engine size: ${oldEngineSize} → ${car.engineSize}L`);
          console.log(`   Display Title: ${car.displayTitle}`);
          fixed++;
        } else {
          console.log(`⚠️  No engine size data available from API`);
          failed++;
        }
      } catch (error) {
        console.error(`❌ Failed to fix ${car.registrationNumber}:`, error.message);
        failed++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Failed: ${failed}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixAllZeroEngineSizes();
