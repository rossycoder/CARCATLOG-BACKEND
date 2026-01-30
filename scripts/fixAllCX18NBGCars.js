/**
 * Fix ALL CX18NBG cars with correct private sale price
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const ValuationService = require('../services/valuationService');

async function fixAllCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const registration = 'CX18NBG';
    
    console.log(`🔍 Finding ALL cars with registration: ${registration}\n`);
    const cars = await Car.find({ 
      registrationNumber: { $regex: new RegExp(registration, 'i') }
    });

    if (cars.length === 0) {
      console.log('❌ No cars found!');
      return;
    }

    console.log(`✅ Found ${cars.length} car(s)\n`);

    // Get fresh valuation once
    console.log('🔄 Fetching fresh valuation from API...');
    const valuationService = new ValuationService();
    const valuation = await valuationService.getValuation(registration, 5000);
    
    console.log('\n💰 Fresh Valuation:');
    console.log(`   Private Sale: £${valuation.estimatedValue.private}`);
    console.log(`   Retail: £${valuation.estimatedValue.retail}`);
    console.log(`   Trade-In: £${valuation.estimatedValue.trade}\n`);
    
    const privatePrice = valuation.estimatedValue.private;

    // Update all cars
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      console.log(`\n[${i + 1}/${cars.length}] Updating car:`);
      console.log(`   ID: ${car._id}`);
      console.log(`   Advert ID: ${car.advertId}`);
      console.log(`   Current Price: £${car.price}`);
      
      car.price = privatePrice;
      car.estimatedValue = privatePrice;
      
      // Store all valuation data
      car.valuation = {
        privatePrice: valuation.estimatedValue.private,
        dealerPrice: valuation.estimatedValue.retail,
        partExchangePrice: valuation.estimatedValue.trade,
        confidence: valuation.confidence,
        valuationDate: new Date()
      };
      
      await car.save();
      console.log(`   ✅ Updated to: £${car.price}`);
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log(`✅ SUCCESS! Updated ${cars.length} car(s)`);
    console.log('═══════════════════════════════════════');
    console.log(`   All cars now show: £${privatePrice}`);
    console.log('\n✨ Refresh the page to see £19,981!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

fixAllCars();
