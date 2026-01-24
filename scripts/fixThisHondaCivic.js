require('dotenv').config();
const mongoose = require('mongoose');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function fixThisHondaCivic() {
  try {
    console.log('🔍 Connecting to local database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');
    
    const Car = require('../models/Car');
    const advertId = 'a1fe37e7-cd58-4584-89c8-200904318c7a';
    
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }
    
    console.log('\n📊 Current Data:');
    console.log('  Make:', car.make);
    console.log('  Model:', car.model);
    console.log('  DisplayTitle:', car.displayTitle);
    console.log('  Variant:', car.variant);
    console.log('  Registration:', car.registrationNumber);
    console.log('  Price:', car.price);
    console.log('  Estimated Value:', car.estimatedValue);
    console.log('  MOT Due:', car.motDue);
    console.log('  MOT Expiry:', car.motExpiry);
    console.log('  MOT Status:', car.motStatus);
    
    // Fetch fresh data from API
    if (car.registrationNumber) {
      console.log('\n📡 Fetching data from CheckCarDetails API...');
      try {
        const apiData = await CheckCarDetailsClient.getVehicleData(car.registrationNumber);
        
        console.log('\n✅ API Data Retrieved:');
        console.log('  Make:', apiData.make);
        console.log('  Model:', apiData.model);
        console.log('  ModelVariant:', apiData.modelVariant);
        console.log('  Variant:', apiData.variant);
        console.log('  Engine Size:', apiData.engineSize);
        console.log('  Valuation Price:', apiData.valuation?.dealerPrice);
        console.log('  MOT Expiry:', apiData.motHistory?.expiryDate);
        console.log('  MOT Status:', apiData.motHistory?.status);
        
        // Update the car with correct data
        car.make = apiData.make || car.make;
        car.model = apiData.model || car.model;
        car.variant = apiData.modelVariant || apiData.variant || car.variant;
        car.engineSize = apiData.engineSize || car.engineSize;
        
        // Set price
        if (apiData.valuation?.dealerPrice) {
          car.price = apiData.valuation.dealerPrice;
          car.estimatedValue = apiData.valuation.dealerPrice;
        }
        
        // Set MOT data
        if (apiData.motHistory?.expiryDate) {
          car.motExpiry = new Date(apiData.motHistory.expiryDate);
          car.motDue = new Date(apiData.motHistory.expiryDate);
        }
        if (apiData.motHistory?.status) {
          car.motStatus = apiData.motHistory.status;
        }
        
        // Set running costs
        if (apiData.runningCosts) {
          car.fuelEconomyUrban = apiData.runningCosts.fuelEconomy?.urban;
          car.fuelEconomyExtraUrban = apiData.runningCosts.fuelEconomy?.extraUrban;
          car.fuelEconomyCombined = apiData.runningCosts.fuelEconomy?.combined;
          car.annualTax = apiData.runningCosts.annualTax;
          car.co2Emissions = apiData.runningCosts.co2Emissions;
          car.insuranceGroup = apiData.runningCosts.insuranceGroup;
        }
        
        await car.save();
        
        console.log('\n✅ Updated Car Data:');
        console.log('  Make:', car.make);
        console.log('  Model:', car.model);
        console.log('  Variant:', car.variant);
        console.log('  DisplayTitle:', car.displayTitle);
        console.log('  Price:', car.price);
        console.log('  Estimated Value:', car.estimatedValue);
        console.log('  MOT Due:', car.motDue);
        console.log('  MOT Expiry:', car.motExpiry);
        console.log('  MOT Status:', car.motStatus);
        console.log('  Fuel Economy Urban:', car.fuelEconomyUrban);
        console.log('  Annual Tax:', car.annualTax);
        
      } catch (apiError) {
        console.error('❌ API Error:', apiError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  }
}

fixThisHondaCivic();
