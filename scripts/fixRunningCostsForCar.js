require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const EnhancedVehicleService = require('../services/enhancedVehicleService');

async function fixRunningCosts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find the Honda Civic car
    const carId = '6984f9e62a60eb9313c08860';
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }
    
    console.log('🚗 Found car:', car.make, car.model, car.registrationNumber);
    console.log('\n📊 Current running costs in database:');
    console.log(JSON.stringify(car.runningCosts, null, 2));
    
    // Fetch fresh data from API
    console.log('\n🔍 Fetching fresh data from API...');
    const enhancedService = new EnhancedVehicleService();
    const freshData = await enhancedService.getEnhancedVehicleData(
      car.registrationNumber,
      car.mileage
    );
    
    console.log('\n📊 Fresh running costs from API:');
    console.log(JSON.stringify(freshData.runningCosts, null, 2));
    
    // Update car with fresh running costs
    if (freshData.runningCosts) {
      car.runningCosts = {
        fuelEconomy: {
          urban: freshData.runningCosts.fuelEconomy?.urban || null,
          extraUrban: freshData.runningCosts.fuelEconomy?.extraUrban || null,
          combined: freshData.runningCosts.fuelEconomy?.combined || null
        },
        co2Emissions: freshData.runningCosts.co2Emissions || car.co2Emissions || null,
        insuranceGroup: freshData.runningCosts.insuranceGroup || null,
        annualTax: freshData.runningCosts.annualTax || null
      };
      
      // Also update individual fields for backward compatibility
      if (freshData.runningCosts.fuelEconomy) {
        car.fuelEconomyUrban = freshData.runningCosts.fuelEconomy.urban || null;
        car.fuelEconomyExtraUrban = freshData.runningCosts.fuelEconomy.extraUrban || null;
        car.fuelEconomyCombined = freshData.runningCosts.fuelEconomy.combined || null;
      }
      
      if (freshData.runningCosts.co2Emissions) {
        car.co2Emissions = freshData.runningCosts.co2Emissions;
      }
      
      if (freshData.runningCosts.insuranceGroup) {
        car.insuranceGroup = freshData.runningCosts.insuranceGroup;
      }
      
      if (freshData.runningCosts.annualTax) {
        car.annualTax = freshData.runningCosts.annualTax;
      }
      
      await car.save();
      
      console.log('\n✅ Running costs updated in database!');
      console.log('\n📊 Updated running costs:');
      console.log(JSON.stringify(car.runningCosts, null, 2));
      
      console.log('\n📊 Individual fields:');
      console.log('  fuelEconomyUrban:', car.fuelEconomyUrban);
      console.log('  fuelEconomyExtraUrban:', car.fuelEconomyExtraUrban);
      console.log('  fuelEconomyCombined:', car.fuelEconomyCombined);
      console.log('  co2Emissions:', car.co2Emissions);
      console.log('  insuranceGroup:', car.insuranceGroup);
      console.log('  annualTax:', car.annualTax);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

fixRunningCosts();
