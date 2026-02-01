/**
 * Fix specific car price to use PRIVATE sale price
 * Quick fix for current car issue
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Get registration from command line or use default
const registration = process.argv[2] || 'CX18NBG'; // Default to Honda Civic from screenshot

async function fixThisCarPrice() {
  try {
    console.log('🚀 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');
    
    const Car = require('../models/Car');
    const ValuationService = require('../services/valuationService');
    
    console.log(`🔍 Looking for car with registration: ${registration}\n`);
    
    // Find car by registration
    const car = await Car.findOne({ 
      registrationNumber: new RegExp(`^${registration}$`, 'i')
    });
    
    if (!car) {
      console.log(`❌ No car found with registration: ${registration}`);
      console.log('\nUsage: node scripts/fixThisCarPrice.js <REGISTRATION>');
      console.log('Example: node scripts/fixThisCarPrice.js CX18NBG\n');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('🚗 Car Found:');
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Year: ${car.year}`);
    console.log(`   Mileage: ${car.mileage}`);
    console.log(`   Current Price: £${car.price}`);
    console.log(`   Estimated Value: £${car.estimatedValue || 'N/A'}`);
    console.log(`   Advert ID: ${car.advertId}\n`);
    
    // Fetch fresh valuation
    console.log('📡 Fetching fresh valuation from API...\n');
    const valuation = await ValuationService.getValuation(
      car.registrationNumber,
      car.mileage || 50000
    );
    
    if (!valuation || !valuation.estimatedValue) {
      console.log('❌ Could not fetch valuation');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    const privatePrice = valuation.estimatedValue.private;
    const retailPrice = valuation.estimatedValue.retail;
    const tradePrice = valuation.estimatedValue.trade;
    
    console.log('💰 Fresh Valuation:');
    console.log('═══════════════════════════════════════');
    console.log(`   🏠 PRIVATE SALE:  £${privatePrice.toLocaleString()}`);
    console.log(`   🏪 RETAIL:        £${retailPrice.toLocaleString()}`);
    console.log(`   🔄 TRADE-IN:      £${tradePrice.toLocaleString()}`);
    console.log('═══════════════════════════════════════\n');
    
    // Check if already correct
    if (car.price === privatePrice && car.estimatedValue === privatePrice) {
      console.log('✅ Price is already correct!');
      console.log(`   Current: £${car.price}`);
      console.log(`   Private Sale: £${privatePrice}\n`);
      await mongoose.connection.close();
      process.exit(0);
    }
    
    // Update car with PRIVATE sale price
    console.log('✏️  Updating car price...');
    console.log(`   Old Price: £${car.price}`);
    console.log(`   New Price: £${privatePrice} (PRIVATE SALE)\n`);
    
    car.price = privatePrice;
    car.estimatedValue = privatePrice;
    car.valuation = {
      privatePrice: privatePrice,
      dealerPrice: retailPrice,
      partExchangePrice: tradePrice,
      valuationDate: new Date()
    };
    
    await car.save();
    
    console.log('✅ SUCCESS! Car price updated!\n');
    console.log('📊 Updated Values:');
    console.log(`   Price: £${car.price}`);
    console.log(`   Estimated Value: £${car.estimatedValue}`);
    console.log(`   Private Price: £${car.valuation.privatePrice}`);
    console.log(`   Retail Price: £${car.valuation.dealerPrice}`);
    console.log(`   Trade Price: £${car.valuation.partExchangePrice}\n`);
    
    console.log('🌐 Refresh your page to see the updated price!');
    console.log(`   Frontend: https://carcatlog.vercel.app/sell-my-car/edit/${car.advertId}\n`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixThisCarPrice();
