/**
 * Diagnose Advert Edit Page Data Issues
 * Check what data is being returned for a specific advert
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

const advertId = 'a1fe37e7-cd58-4584-89c8-200904318c7a';

async function diagnoseAdvertData() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find the car by advertId
    console.log(`📋 Looking for advert: ${advertId}`);
    const car = await Car.findOne({ advertId: advertId });

    if (!car) {
      console.log('❌ No car found with this advertId');
      return;
    }

    console.log('\n📊 CAR DATA FOUND:');
    console.log('==================');
    console.log('Registration:', car.registrationNumber);
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('Display Title:', car.displayTitle);
    console.log('Year:', car.year);
    console.log('Engine Size:', car.engineSize);
    console.log('Fuel Type:', car.fuelType);
    console.log('Transmission:', car.transmission);
    console.log('Mileage:', car.mileage);
    console.log('\n💰 PRICING:');
    console.log('Price:', car.price);
    console.log('Estimated Value:', car.estimatedValue);
    console.log('\n🔧 MOT DATA:');
    console.log('MOT Status:', car.motStatus);
    console.log('MOT Due:', car.motDue);
    console.log('MOT Expiry:', car.motExpiry);
    console.log('\n📝 ADVERT DATA:');
    console.log('Status:', car.status);
    console.log('Description:', car.description ? `${car.description.substring(0, 50)}...` : 'None');
    console.log('Photos:', car.photos ? car.photos.length : 0);
    console.log('\n🏃 RUNNING COSTS:');
    console.log('Fuel Economy Urban:', car.fuelEconomyUrban);
    console.log('Fuel Economy Extra Urban:', car.fuelEconomyExtraUrban);
    console.log('Fuel Economy Combined:', car.fuelEconomyCombined);
    console.log('Annual Tax:', car.annualTax);
    console.log('Insurance Group:', car.insuranceGroup);
    console.log('CO2 Emissions:', car.co2Emissions);

    console.log('\n\n🔍 CHECKING ENHANCED VEHICLE DATA...');
    const enhancedVehicleService = require('../services/enhancedVehicleService');
    
    if (car.registrationNumber) {
      console.log(`Fetching enhanced data for: ${car.registrationNumber}`);
      const enhancedData = await enhancedVehicleService.getEnhancedVehicleData(car.registrationNumber, false);
      
      console.log('\n📊 ENHANCED DATA:');
      console.log('==================');
      console.log('Data Sources:', enhancedData.dataSources);
      console.log('\nValuation:');
      console.log('  - Dealer Price:', enhancedData.valuation?.dealerPrice?.value);
      console.log('  - Private Price:', enhancedData.valuation?.privatePrice?.value);
      console.log('  - Trade Price:', enhancedData.valuation?.tradePrice?.value);
      console.log('\nMOT:');
      console.log('  - Expiry Date:', enhancedData.motExpiry?.value);
      console.log('  - Status:', enhancedData.motStatus?.value);
      console.log('\nRunning Costs:');
      console.log('  - Urban MPG:', enhancedData.runningCosts?.fuelEconomy?.urban?.value);
      console.log('  - Extra Urban MPG:', enhancedData.runningCosts?.fuelEconomy?.extraUrban?.value);
      console.log('  - Combined MPG:', enhancedData.runningCosts?.fuelEconomy?.combined?.value);
      console.log('  - Annual Tax:', enhancedData.runningCosts?.annualTax?.value);
      console.log('  - Insurance Group:', enhancedData.runningCosts?.insuranceGroup?.value);
      console.log('  - CO2 Emissions:', enhancedData.runningCosts?.co2Emissions?.value);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

diagnoseAdvertData();
