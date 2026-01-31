/**
 * Fix car price to use private sale valuation
 * Usage: node scripts/fixCarPrice.js <ADVERT_ID>
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const EnhancedVehicleService = require('../services/enhancedVehicleService');

async function fixCarPrice(advertId) {
  try {
    console.log(`🔧 Fixing price for advert: ${advertId}\n`);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the car
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Car not found!');
      return;
    }

    console.log(`Found: ${car.make} ${car.model}`);
    console.log(`Current price: £${car.price}`);
    console.log(`Registration: ${car.registrationNumber}\n`);

    if (!car.registrationNumber) {
      console.log('❌ No registration number - cannot fetch valuation');
      return;
    }

    // Fetch fresh valuation data
    console.log('📡 Fetching fresh valuation data...');
    const enhancedData = await EnhancedVehicleService.getEnhancedVehicleData(
      car.registrationNumber, 
      false, 
      car.mileage || 50000
    );

    if (enhancedData?.valuation?.estimatedValue) {
      const valuation = enhancedData.valuation.estimatedValue;
      const privatePrice = valuation.private || 0;
      const tradePrice = valuation.trade || 0;
      const retailPrice = valuation.retail || 0;

      console.log('\n💰 Valuation data:');
      console.log(`   Private: £${privatePrice}`);
      console.log(`   Trade: £${tradePrice}`);
      console.log(`   Retail: £${retailPrice}`);

      if (privatePrice > 0) {
        // Update car with new price
        car.price = privatePrice;
        car.estimatedValue = privatePrice;
        car.valuation = {
          privatePrice: privatePrice,
          tradePrice: tradePrice,
          retailPrice: retailPrice,
          confidence: enhancedData.valuation.confidence || 'medium'
        };

        await car.save();

        console.log(`\n✅ Updated car price to £${privatePrice} (Private Sale)`);
      } else {
        console.log('\n⚠️  No valid private price found');
      }
    } else {
      console.log('\n⚠️  No valuation data available');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Get advertId from command line
const advertId = process.argv[2];

if (!advertId) {
  console.log('Usage: node scripts/fixCarPrice.js <ADVERT_ID>');
  console.log('Example: node scripts/fixCarPrice.js 83b5db73-d05b-4f8e-882a-c61f60ee5bf7');
  process.exit(1);
}

fixCarPrice(advertId);
