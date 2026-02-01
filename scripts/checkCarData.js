/**
 * Check what data exists for a specific car
 * Usage: node scripts/checkCarData.js <REGISTRATION>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const registration = process.argv[2];

if (!registration) {
  console.log('❌ Please provide registration number');
  console.log('Usage: node scripts/checkCarData.js <REGISTRATION>');
  console.log('Example: node scripts/checkCarData.js CX18NBG\n');
  process.exit(1);
}

async function checkCarData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    const Car = require('../models/Car');
    
    const car = await Car.findOne({ 
      registrationNumber: new RegExp(`^${registration}$`, 'i')
    });
    
    if (!car) {
      console.log(`❌ No car found with registration: ${registration}\n`);
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('🚗 CAR DATA:');
    console.log('═══════════════════════════════════════\n');
    
    console.log('Basic Info:');
    console.log(`  Make/Model: ${car.make} ${car.model}`);
    console.log(`  Year: ${car.year}`);
    console.log(`  Registration: ${car.registrationNumber}`);
    console.log(`  Advert ID: ${car.advertId}\n`);
    
    console.log('💰 PRICE DATA:');
    console.log(`  car.price: £${car.price}`);
    console.log(`  car.estimatedValue: £${car.estimatedValue || 'N/A'}\n`);
    
    console.log('💰 VALUATION OBJECT:');
    if (car.valuation) {
      console.log(`  valuation.privatePrice: £${car.valuation.privatePrice || 'N/A'}`);
      console.log(`  valuation.dealerPrice: £${car.valuation.dealerPrice || 'N/A'}`);
      console.log(`  valuation.partExchangePrice: £${car.valuation.partExchangePrice || 'N/A'}`);
      console.log(`  valuation.valuationDate: ${car.valuation.valuationDate || 'N/A'}`);
    } else {
      console.log('  ❌ NO VALUATION OBJECT');
    }
    
    console.log('\n💰 ALL VALUATIONS:');
    if (car.allValuations) {
      console.log(`  allValuations.private: £${car.allValuations.private || 'N/A'}`);
      console.log(`  allValuations.retail: £${car.allValuations.retail || 'N/A'}`);
      console.log(`  allValuations.trade: £${car.allValuations.trade || 'N/A'}`);
    } else {
      console.log('  ❌ NO allValuations FIELD');
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log('\n📊 SUMMARY:');
    
    if (car.valuation?.privatePrice) {
      console.log(`✅ Private price exists: £${car.valuation.privatePrice}`);
    } else {
      console.log('❌ Private price NOT found in valuation');
    }
    
    if (car.allValuations?.private) {
      console.log(`✅ allValuations.private exists: £${car.allValuations.private}`);
    } else {
      console.log('❌ allValuations.private NOT found');
    }
    
    console.log(`\n💡 Frontend should show: £${car.valuation?.privatePrice || car.allValuations?.private || car.price}`);
    console.log(`   Currently showing: £${car.price}\n`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCarData();
