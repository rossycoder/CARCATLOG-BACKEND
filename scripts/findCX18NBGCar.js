/**
 * Find car with registration CX18NBG
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function findCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const registration = 'CX18NBG';
    
    console.log(`🔍 Searching for car with registration: ${registration}\n`);
    
    const car = await Car.findOne({ 
      registrationNumber: { $regex: new RegExp(registration, 'i') }
    });

    if (!car) {
      console.log('❌ No car found with this registration in database');
      console.log('\nℹ️ This means the car hasn\'t been created yet.');
      console.log('   When you create it, make sure it uses £19,981 (private sale price)\n');
      return;
    }

    console.log('✅ Car Found!\n');
    console.log('═══════════════════════════════════════');
    console.log('📊 CAR DETAILS:');
    console.log('═══════════════════════════════════════');
    console.log(`   ID: ${car._id}`);
    console.log(`   Advert ID: ${car.advertId}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Year: ${car.year}`);
    console.log(`   Mileage: ${car.mileage?.toLocaleString()} miles`);
    console.log(`   Color: ${car.color}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('💰 PRICING:');
    console.log(`   Current Price: £${car.price?.toLocaleString() || 'Not set'}`);
    console.log(`   Estimated Value: £${car.estimatedValue?.toLocaleString() || 'Not set'}`);
    
    if (car.valuation) {
      console.log('\n   Stored Valuation:');
      console.log(`     Private: £${car.valuation.privatePrice?.toLocaleString() || 'N/A'}`);
      console.log(`     Retail: £${car.valuation.dealerPrice?.toLocaleString() || 'N/A'}`);
      console.log(`     Trade: £${car.valuation.partExchangePrice?.toLocaleString() || 'N/A'}`);
    }
    
    console.log('\n📅 Status:');
    console.log(`   Advert Status: ${car.advertStatus}`);
    console.log(`   Created: ${car.createdAt?.toLocaleDateString()}`);
    if (car.publishedAt) {
      console.log(`   Published: ${car.publishedAt.toLocaleDateString()}`);
    }
    
    console.log('\n═══════════════════════════════════════');
    
    // Check if price is wrong
    if (car.price && car.price !== 19981) {
      console.log('\n⚠️ WARNING: Price mismatch detected!');
      console.log(`   Current price: £${car.price}`);
      console.log(`   Expected (Private Sale): £19,981`);
      console.log('\n   To fix this, run: node backend/scripts/fixCX18NBGPrice.js');
    } else if (car.price === 19981) {
      console.log('\n✅ Price is correct! (£19,981 - Private Sale)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

findCar();
