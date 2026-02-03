const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCarRunningCosts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    // Find a car to test with
    const car = await Car.findOne({ registrationNumber: 'EK11XHZ' });
    
    if (car) {
      console.log('🚗 Found car:', car.registrationNumber);
      console.log('💰 Price:', car.price);
      console.log('💰 Valuation:', car.valuation);
      console.log('🏃 Running costs:', car.runningCosts);
      console.log('🏃 Legacy running costs fields:', {
        fuelEconomyUrban: car.fuelEconomyUrban,
        fuelEconomyExtraUrban: car.fuelEconomyExtraUrban,
        fuelEconomyCombined: car.fuelEconomyCombined,
        annualTax: car.annualTax,
        co2Emissions: car.co2Emissions
      });
      console.log('🆔 Car ID:', car._id);
    } else {
      console.log('❌ No car found with registration EK11XHZ');
      
      // Find any car
      const anyCar = await Car.findOne();
      if (anyCar) {
        console.log('🚗 Found any car:', anyCar.registrationNumber);
        console.log('🆔 Car ID:', anyCar._id);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCarRunningCosts();