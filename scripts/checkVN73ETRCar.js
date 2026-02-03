require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkVN73ETRCar() {
  try {
    console.log('🔍 Checking for VN73ETR car in database...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const car = await Car.findOne({ registrationNumber: 'VN73ETR' });
    
    if (car) {
      console.log('✅ VN73ETR car found!');
      console.log('Car ID:', car._id);
      console.log('Advert Status:', car.advertStatus);
      console.log('User ID:', car.userId);
      console.log('Price:', car.price);
      console.log('Body Type:', car.bodyType);
      console.log('Fuel Type:', car.fuelType);
      
      console.log('\n🏃 Running Costs:');
      if (car.runningCosts) {
        console.log('  Urban MPG:', car.runningCosts.fuelEconomy?.urban || 'N/A');
        console.log('  Extra Urban MPG:', car.runningCosts.fuelEconomy?.extraUrban || 'N/A');
        console.log('  Combined MPG:', car.runningCosts.fuelEconomy?.combined || 'N/A');
        console.log('  Annual Tax:', car.runningCosts.annualTax || 'N/A');
        console.log('  CO2 Emissions:', car.runningCosts.co2Emissions || 'N/A');
        console.log('  Insurance Group:', car.runningCosts.insuranceGroup || 'N/A');
      } else {
        console.log('  No running costs data in database');
      }
      
      console.log('\n💰 Valuation:');
      if (car.valuation) {
        console.log('  Private Price:', car.valuation.privatePrice || 'N/A');
        console.log('  Retail Price:', car.valuation.retailPrice || 'N/A');
        console.log('  Trade Price:', car.valuation.tradePrice || 'N/A');
      } else {
        console.log('  No valuation data in database');
      }
      
      console.log('\n🔧 MOT Data:');
      console.log('  MOT Status:', car.motStatus || 'N/A');
      console.log('  MOT Due:', car.motDue || car.motExpiry || 'N/A');
      
      console.log('\n📱 Frontend Test URL:');
      console.log(`http://localhost:3000/selling/advert/edit/${car._id}`);
      
    } else {
      console.log('❌ VN73ETR car not found in database');
      console.log('💡 You may need to create a test car first');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkVN73ETRCar();