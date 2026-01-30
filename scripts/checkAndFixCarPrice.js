/**
 * Check and fix car price - ensure it uses PRIVATE sale price
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkAndFixCarPrice() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the car by advertId from the screenshot URL
    const advertId = 'eb1e7522-df31-4d20-a618-09c1f0094f48';
    
    console.log(`\n🔍 Looking for car with advertId: ${advertId}`);
    const car = await Car.findOne({ advertId });

    if (!car) {
      console.log('❌ Car not found!');
      return;
    }

    console.log('\n📊 Current Car Data:');
    console.log(`  Make/Model: ${car.make} ${car.model}`);
    console.log(`  Registration: ${car.registrationNumber}`);
    console.log(`  Current Price: £${car.price}`);
    console.log(`  Estimated Value: £${car.estimatedValue}`);
    
    if (car.valuation) {
      console.log('\n💰 Stored Valuation Data:');
      console.log(`  Private: £${car.valuation.privatePrice || 'N/A'}`);
      console.log(`  Retail: £${car.valuation.dealerPrice || 'N/A'}`);
      console.log(`  Trade: £${car.valuation.partExchangePrice || 'N/A'}`);
    }

    // Check if we need to fetch fresh valuation
    console.log('\n🔄 Fetching fresh valuation data...');
    const ValuationService = require('../services/valuationService');
    const valuationService = new ValuationService();
    
    try {
      const valuation = await valuationService.getValuation(car.registrationNumber, car.mileage);
      
      console.log('\n💰 Fresh Valuation from API:');
      console.log(`  Private: £${valuation.estimatedValue.private}`);
      console.log(`  Retail: £${valuation.estimatedValue.retail}`);
      console.log(`  Trade: £${valuation.estimatedValue.trade}`);
      
      // Update car with PRIVATE sale price
      const privatePrice = valuation.estimatedValue.private;
      
      console.log(`\n✏️ Updating car price from £${car.price} to £${privatePrice} (PRIVATE sale price)`);
      
      car.price = privatePrice;
      car.estimatedValue = privatePrice;
      
      // Store all valuation values for reference
      car.valuation = {
        privatePrice: valuation.estimatedValue.private,
        dealerPrice: valuation.estimatedValue.retail,
        partExchangePrice: valuation.estimatedValue.trade,
        confidence: valuation.confidence,
        valuationDate: new Date()
      };
      
      await car.save();
      
      console.log('\n✅ Car Updated Successfully!');
      console.log(`  New Price: £${car.price}`);
      console.log(`  New Estimated Value: £${car.estimatedValue}`);
      
    } catch (valuationError) {
      console.error('\n❌ Failed to fetch valuation:', valuationError.message);
      console.log('\nℹ️ You can manually set the price:');
      console.log(`  car.price = 19981;`);
      console.log(`  car.estimatedValue = 19981;`);
      console.log(`  await car.save();`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
checkAndFixCarPrice();
