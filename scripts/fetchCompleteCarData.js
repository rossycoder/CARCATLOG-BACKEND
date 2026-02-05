require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function fetchCompleteCarData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const carId = '6983ca26c10d3f3d9b026626';
    console.log(`🔍 Finding BMW car: ${carId}`);
    
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
    console.log('Display Title:', car.displayTitle);

    console.log('\n🔄 Fetching COMPLETE data from API...');
    
    // Fetch complete vehicle data
    const completeData = await CheckCarDetailsClient.getVehicleData(car.registrationNumber);
    
    console.log('\n✅ Complete API Response:');
    console.log('=====================================');
    console.log('Make:', completeData.make);
    console.log('Model:', completeData.model);
    console.log('Variant:', completeData.variant);
    console.log('Engine Size:', completeData.engineSize);
    console.log('Body Type:', completeData.bodyType);
    console.log('Doors:', completeData.doors);
    console.log('Seats:', completeData.seats);
    console.log('Emission Class:', completeData.emissionClass);
    console.log('Transmission:', completeData.transmission);
    console.log('Color:', completeData.color);

    // Update car with complete data
    console.log('\n💾 Updating car with complete data...');
    
    if (completeData.bodyType) car.bodyType = completeData.bodyType;
    if (completeData.doors) car.doors = parseInt(completeData.doors);
    if (completeData.seats) car.seats = parseInt(completeData.seats);
    if (completeData.emissionClass) car.emissionClass = completeData.emissionClass;
    if (completeData.color && car.color === 'null') car.color = completeData.color;

    // Save to regenerate displayTitle with all fields
    await car.save();

    console.log('\n✅ Car Updated with Complete Data!');
    console.log('=====================================');
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('Engine Size:', car.engineSize);
    console.log('Body Type:', car.bodyType);
    console.log('Doors:', car.doors);
    console.log('Seats:', car.seats);
    console.log('Emission Class:', car.emissionClass);
    console.log('Color:', car.color);
    console.log('Display Title:', car.displayTitle);

    console.log('\n🎯 Final Title:');
    console.log(`   "${car.displayTitle}"`);
    console.log('\n✅ Expected format: "2.0 520D XDrive M Sport Manual Euro 6 5dr"');

    await mongoose.connection.close();
    console.log('\n✅ Complete data fetch completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message && error.message.includes('daily limit')) {
      console.log('\n⏰ API daily limit reached');
      console.log('   The car has been updated with available data');
      console.log('   Run this script again tomorrow for complete data');
    }
    
    process.exit(1);
  }
}

fetchCompleteCarData();
