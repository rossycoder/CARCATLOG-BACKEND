require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function fixCarData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const advertId = '3655c431-391a-4081-ac9b-b323bded03d5';
    const registration = 'EX09MYY';
    
    console.log(`\n🔧 Fixing car data for: ${registration}\n`);
    
    // Fetch data from CheckCarDetails API
    console.log('📡 Fetching data from CheckCarDetails API...');
    const apiData = await CheckCarDetailsClient.getVehicleData(registration);
    
    console.log('\n📋 API Response:');
    console.log('  Valuation:', apiData.valuation?.estimatedValue);
    console.log('  MOT Expiry:', apiData.motExpiry);
    console.log('  MOT Status:', apiData.motStatus);
    console.log('  Tax Due:', apiData.taxDue);
    
    // Find the car in database
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }
    
    console.log('\n💾 Current database values:');
    console.log('  Price:', car.price);
    console.log('  Estimated Value:', car.estimatedValue);
    console.log('  MOT Due:', car.motDue);
    console.log('  MOT Expiry:', car.motExpiry);
    console.log('  MOT Status:', car.motStatus);
    
    // Update the car with API data
    let updated = false;
    
    // Update price/estimated value
    if (apiData.valuation?.estimatedValue) {
      const estimatedValue = typeof apiData.valuation.estimatedValue === 'object'
        ? (apiData.valuation.estimatedValue.retail || 
           apiData.valuation.estimatedValue.trade || 
           apiData.valuation.estimatedValue.private)
        : apiData.valuation.estimatedValue;
      
      if (estimatedValue) {
        car.estimatedValue = estimatedValue;
        if (!car.price || car.price === 0) {
          car.price = estimatedValue;
        }
        console.log(`\n💰 Updated price to: £${estimatedValue}`);
        updated = true;
      }
    }
    
    // Update MOT data
    if (apiData.motExpiry) {
      car.motExpiry = new Date(apiData.motExpiry);
      car.motDue = new Date(apiData.motExpiry);
      console.log(`🔧 Updated MOT Expiry to: ${apiData.motExpiry}`);
      updated = true;
    }
    
    if (apiData.motStatus) {
      car.motStatus = apiData.motStatus;
      console.log(`🔧 Updated MOT Status to: ${apiData.motStatus}`);
      updated = true;
    }
    
    if (apiData.taxDue) {
      car.taxStatus = apiData.taxDue;
      console.log(`🔧 Updated Tax Due to: ${apiData.taxDue}`);
      updated = true;
    }
    
    if (updated) {
      await car.save();
      console.log('\n✅ Car data updated successfully!');
      
      console.log('\n📋 New database values:');
      console.log('  Price:', car.price);
      console.log('  Estimated Value:', car.estimatedValue);
      console.log('  MOT Due:', car.motDue);
      console.log('  MOT Expiry:', car.motExpiry);
      console.log('  MOT Status:', car.motStatus);
    } else {
      console.log('\n⚠️  No updates needed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixCarData();
