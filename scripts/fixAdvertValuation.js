/**
 * Fix valuation for existing advert
 * This script updates the estimatedValue for an existing advert by fetching fresh valuation data
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const ValuationAPIClient = require('../clients/ValuationAPIClient');

const ADVERT_ID = '2f015ba8-14f1-4e76-b1ad-15156631d662';

async function fixAdvertValuation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the advert
    const car = await Car.findOne({ advertId: ADVERT_ID });
    
    if (!car) {
      console.error(`❌ Advert not found: ${ADVERT_ID}`);
      process.exit(1);
    }

    console.log('\n📋 Current Advert Data:');
    console.log(`  VRM: ${car.registrationNumber}`);
    console.log(`  Make/Model: ${car.make} ${car.model}`);
    console.log(`  Mileage: ${car.mileage}`);
    console.log(`  Current Price: £${car.price}`);
    console.log(`  Current Estimated Value: £${car.estimatedValue}`);

    // Get fresh valuation data
    if (!car.registrationNumber) {
      console.error('❌ No registration number found for this advert');
      process.exit(1);
    }

    console.log(`\n🔄 Fetching fresh valuation for ${car.registrationNumber}...`);
    
    const apiKey = process.env.CHECKCARD_API_KEY;
    const baseUrl = process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk';
    const isTestMode = process.env.API_ENVIRONMENT === 'test';
    
    const valuationClient = new ValuationAPIClient(apiKey, baseUrl, isTestMode);
    const valuation = await valuationClient.getValuation(car.registrationNumber, car.mileage);

    console.log('\n💰 Fresh Valuation Data:');
    console.log(`  Retail: £${valuation.estimatedValue.retail}`);
    console.log(`  Trade: £${valuation.estimatedValue.trade}`);
    console.log(`  Private: £${valuation.estimatedValue.private}`);

    // Update the car with correct valuation
    car.estimatedValue = valuation.estimatedValue.retail;
    car.price = valuation.estimatedValue.retail;
    
    // Store all valuation values for reference
    car.valuation = {
      dealerPrice: valuation.estimatedValue.retail,
      privatePrice: valuation.estimatedValue.private,
      partExchangePrice: valuation.estimatedValue.trade,
      valuationDate: new Date()
    };

    await car.save();

    console.log('\n✅ Advert Updated Successfully!');
    console.log(`  New Price: £${car.price}`);
    console.log(`  New Estimated Value: £${car.estimatedValue}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixAdvertValuation();
