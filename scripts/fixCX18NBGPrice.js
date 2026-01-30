/**
 * Fix CX18NBG car price to use PRIVATE sale price
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const ValuationService = require('../services/valuationService');

async function fixPrice() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const registration = 'CX18NBG';
    
    console.log(`🔍 Finding car: ${registration}`);
    const car = await Car.findOne({ 
      registrationNumber: { $regex: new RegExp(registration, 'i') }
    });

    if (!car) {
      console.log('❌ Car not found!');
      return;
    }

    console.log(`✅ Car found: ${car.make} ${car.model}`);
    console.log(`   Current Price: £${car.price}`);
    console.log(`   Current Estimated Value: £${car.estimatedValue}\n`);

    // Get fresh valuation
    console.log('🔄 Fetching fresh valuation from API...');
    const valuationService = new ValuationService();
    const valuation = await valuationService.getValuation(registration, car.mileage);
    
    console.log('\n💰 Fresh Valuation:');
    console.log(`   Private Sale: £${valuation.estimatedValue.private}`);
    console.log(`   Retail: £${valuation.estimatedValue.retail}`);
    console.log(`   Trade-In: £${valuation.estimatedValue.trade}\n`);
    
    // Update with PRIVATE sale price
    const privatePrice = valuation.estimatedValue.private;
    
    console.log(`✏️ Updating price from £${car.price} → £${privatePrice}`);
    
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
    
    console.log('\n✅ SUCCESS! Car price updated!');
    console.log('═══════════════════════════════════════');
    console.log(`   New Price: £${car.price}`);
    console.log(`   New Estimated Value: £${car.estimatedValue}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('✨ Now refresh the page and you should see £19,981!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

fixPrice();
