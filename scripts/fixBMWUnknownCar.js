require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixBMWUnknownCar() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find the BMW Unknown car from screenshot
    const carId = '6983ca26c10d3f3d9b026626';
    console.log(`🔍 Finding BMW Unknown car: ${carId}`);
    
    const car = await Car.findById(carId);

    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }

    console.log('\n📊 Current Car Data:');
    console.log('=====================================');
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('Registration:', car.registrationNumber);
    console.log('Engine Size:', car.engineSize);
    console.log('Fuel Type:', car.fuelType);
    console.log('Display Title:', car.displayTitle);

    if (!car.registrationNumber) {
      console.log('\n❌ No registration number - cannot fetch from API');
      process.exit(1);
    }

    console.log('\n🔄 Fetching real data from API...');
    console.log(`   Registration: ${car.registrationNumber}`);

    // Import the variant service
    const variantOnlyService = require('../services/variantOnlyService');
    
    try {
      // Fetch real vehicle data from API
      const vehicleData = await variantOnlyService.getVariantOnly(car.registrationNumber, false); // force fresh API call
      
      console.log('\n✅ API Response:');
      console.log('=====================================');
      console.log('Make:', vehicleData.make);
      console.log('Model:', vehicleData.model);
      console.log('Variant:', vehicleData.variant);
      console.log('Engine Size:', vehicleData.engineSize);
      console.log('Body Type:', vehicleData.bodyType);
      console.log('Doors:', vehicleData.doors);
      console.log('Emission Class:', vehicleData.emissionClass);

      // Update car with real data
      console.log('\n💾 Updating car with real API data...');
      
      // Extract values from wrapped format if needed
      const extractValue = (field) => {
        if (!field) return null;
        return typeof field === 'object' && field.value ? field.value : field;
      };

      car.model = extractValue(vehicleData.model) || car.model;
      car.variant = extractValue(vehicleData.variant) || car.variant;
      car.engineSize = parseFloat(extractValue(vehicleData.engineSize)) || car.engineSize;
      car.bodyType = extractValue(vehicleData.bodyType) || car.bodyType;
      car.doors = parseInt(extractValue(vehicleData.doors)) || car.doors;
      car.emissionClass = extractValue(vehicleData.emissionClass) || car.emissionClass;

      // Link to vehicle history if available
      if (vehicleData.historyCheckId && !car.historyCheckId) {
        car.historyCheckId = vehicleData.historyCheckId;
        car.historyCheckStatus = 'verified';
        car.historyCheckDate = new Date();
        console.log('✅ Linked to vehicle history');
      }

      // Save the car (pre-save hook will generate proper displayTitle)
      await car.save();

      console.log('\n✅ Car Updated Successfully!');
      console.log('=====================================');
      console.log('Make:', car.make);
      console.log('Model:', car.model);
      console.log('Variant:', car.variant);
      console.log('Engine Size:', car.engineSize);
      console.log('Body Type:', car.bodyType);
      console.log('Doors:', car.doors);
      console.log('Emission Class:', car.emissionClass);
      console.log('Display Title:', car.displayTitle);

      console.log('\n🎯 New Title Format:');
      console.log(`   "${car.displayTitle}"`);
      console.log('\n✅ Title will now show properly on frontend!');

    } catch (apiError) {
      console.error('\n❌ API Error:', apiError.message);
      
      if (apiError.message.includes('daily limit')) {
        console.log('\n⏰ API daily limit reached');
        console.log('   Please try again tomorrow or use cached data');
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Fix completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixBMWUnknownCar();
