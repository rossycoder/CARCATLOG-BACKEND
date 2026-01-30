/**
 * List recent cars to find the BMW 5 Series
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function listRecentCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find BMW 5 Series cars
    console.log('🔍 Looking for BMW 5 Series cars...\n');
    const bmwCars = await Car.find({ 
      make: /BMW/i,
      model: /5 Series/i
    }).sort({ createdAt: -1 }).limit(5);

    if (bmwCars.length === 0) {
      console.log('❌ No BMW 5 Series found\n');
      
      // Show all recent cars
      console.log('📋 Showing 10 most recent cars:\n');
      const recentCars = await Car.find({}).sort({ createdAt: -1 }).limit(10);
      
      recentCars.forEach((car, index) => {
        console.log(`${index + 1}. ${car.make} ${car.model}`);
        console.log(`   Advert ID: ${car.advertId}`);
        console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
        console.log(`   Price: £${car.price}`);
        console.log(`   Status: ${car.advertStatus}`);
        console.log(`   Created: ${car.createdAt}`);
        console.log('');
      });
    } else {
      console.log(`✅ Found ${bmwCars.length} BMW 5 Series car(s):\n`);
      
      bmwCars.forEach((car, index) => {
        console.log(`${index + 1}. ${car.make} ${car.model} ${car.variant || ''}`);
        console.log(`   Advert ID: ${car.advertId}`);
        console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
        console.log(`   Year: ${car.year}`);
        console.log(`   Mileage: ${car.mileage}`);
        console.log(`   Price: £${car.price}`);
        console.log(`   Estimated Value: £${car.estimatedValue || 'N/A'}`);
        console.log(`   Status: ${car.advertStatus}`);
        console.log(`   Created: ${car.createdAt}`);
        
        if (car.valuation) {
          console.log(`   Valuation:`);
          console.log(`     - Private: £${car.valuation.privatePrice || 'N/A'}`);
          console.log(`     - Retail: £${car.valuation.dealerPrice || 'N/A'}`);
          console.log(`     - Trade: £${car.valuation.partExchangePrice || 'N/A'}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

listRecentCars();
