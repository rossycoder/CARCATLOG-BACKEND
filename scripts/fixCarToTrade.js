/**
 * Fix car seller type to Trade
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

const CAR_ID = '697e6f046c9f782ca6cdcb55';

async function fixCarToTrade() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const car = await Car.findById(CAR_ID);
    
    if (!car) {
      console.error('❌ Car not found');
      return;
    }

    console.log('\n🚗 Car Details:');
    console.log('   Make/Model:', car.make, car.model);
    console.log('   Registration:', car.registrationNumber);
    console.log('   Current Seller Type:', car.sellerContact?.type);

    // Change to trade
    if (!car.sellerContact) {
      car.sellerContact = {};
    }
    
    car.sellerContact.type = 'trade';
    
    await car.save();
    
    console.log('\n✅ Seller type changed to: TRADE');
    console.log('   Car will now show "Trade Seller" badge');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixCarToTrade();
