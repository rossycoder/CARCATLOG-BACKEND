/**
 * Fix Honda Civic (EK11XHZ) - Fetch complete data and update
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const ComprehensiveVehicleService = require('../services/comprehensiveVehicleService');

async function fixHondaCivic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const registration = 'EK11XHZ';
    const carId = '698507008c15d0c32719e246';
    
    // Find the car
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }

    console.log('\n📋 Current Car Data:');
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make: ${car.make}`);
    console.log(`   Model: ${car.model}`);
    console.log(`   Variant: ${car.variant}`);
    console.log(`   Year: ${car.year}`);
    console.log(`   Running Costs: ${car.runningCosts?.fuelEconomy?.combined || 'null'}`);

    // Fetch complete vehicle data
    console.log('\n🔍 Fetching complete vehicle data from APIs...');
    const comprehensiveService = new ComprehensiveVehicleService();
    
    const result = await comprehensiveService.fetchCompleteVehicleData(
      registration,
      car.mileage,
      true // Force refresh
    );

    console.log('\n📊 API Results:');
    console.log(`   API Calls: ${result.apiCalls}`);
    console.log(`   Total Cost: £${result.totalCost.toFixed(2)}`);
    console.log(`   Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach(err => {
        console.log(`   - ${err.service}: ${err.error}`);
      });
    }

    // Get vehicle history
    const history = await VehicleHistory.findOne({ 
      vrm: registration.toUpperCase().replace(/\s/g, '') 
    });

    if (history) {
      console.log('\n✅ Vehicle History Found:');
      console.log(`   Make: ${history.make}`);
      console.log(`   Model: ${history.model}`);
      console.log(`   Variant: ${history.variant}`);
      console.log(`   Year: ${history.yearOfManufacture}`);
      console.log(`   Combined MPG: ${history.combinedMpg || 'N/A'}`);
      console.log(`   CO2: ${history.co2Emissions || 'N/A'}g/km`);
      console.log(`   Insurance: Group ${history.insuranceGroup || 'N/A'}`);
      console.log(`   Tax: £${history.annualTax || 'N/A'}/year`);

      // Update car with correct data
      console.log('\n🔧 Updating car with correct data...');
      
      if (history.model && history.model !== 'Unknown') {
        car.model = history.model;
        console.log(`   ✅ Model: ${car.model}`);
      }
      
      if (history.variant) {
        car.variant = history.variant;
        console.log(`   ✅ Variant: ${car.variant}`);
      }

      // Update running costs
      car.runningCosts = {
        fuelEconomy: {
          urban: history.urbanMpg || null,
          extraUrban: history.extraUrbanMpg || null,
          combined: history.combinedMpg || null
        },
        co2Emissions: history.co2Emissions || null,
        insuranceGroup: history.insuranceGroup || null,
        annualTax: history.annualTax || null
      };

      // Update individual fields
      car.co2Emissions = history.co2Emissions || car.co2Emissions;
      car.insuranceGroup = history.insuranceGroup || car.insuranceGroup;
      car.annualTax = history.annualTax || car.annualTax;
      car.fuelEconomyUrban = history.urbanMpg || car.fuelEconomyUrban;
      car.fuelEconomyExtraUrban = history.extraUrbanMpg || car.fuelEconomyExtraUrban;
      car.fuelEconomyCombined = history.combinedMpg || car.fuelEconomyCombined;

      console.log('\n📊 Running Costs Updated:');
      console.log(`   Urban MPG: ${car.runningCosts.fuelEconomy.urban || 'N/A'}`);
      console.log(`   Extra Urban MPG: ${car.runningCosts.fuelEconomy.extraUrban || 'N/A'}`);
      console.log(`   Combined MPG: ${car.runningCosts.fuelEconomy.combined || 'N/A'}`);
      console.log(`   CO2: ${car.runningCosts.co2Emissions || 'N/A'}g/km`);
      console.log(`   Insurance: Group ${car.runningCosts.insuranceGroup || 'N/A'}`);
      console.log(`   Tax: £${car.runningCosts.annualTax || 'N/A'}/year`);

      // Update display title
      if (car.variant && car.variant !== '1.3L Petrol') {
        car.displayTitle = `${car.variant}`;
      } else if (car.model !== 'Unknown') {
        car.displayTitle = `${car.model} ${car.engineSize}L`;
      }

      // Save the car
      await car.save();
      console.log('\n✅ Car updated successfully!');

    } else {
      console.log('\n⚠️  No vehicle history found');
      console.log('   Car may be too old or uncommon');
    }

    // Verify the update
    const updatedCar = await Car.findById(carId);
    console.log('\n📊 Verified Updated Data:');
    console.log(`   Model: ${updatedCar.model}`);
    console.log(`   Variant: ${updatedCar.variant}`);
    console.log(`   Display Title: ${updatedCar.displayTitle}`);
    console.log(`   Combined MPG: ${updatedCar.runningCosts?.fuelEconomy?.combined || 'null'}`);
    console.log(`   CO2 Emissions: ${updatedCar.co2Emissions || 'null'}g/km`);
    console.log(`   Insurance Group: ${updatedCar.insuranceGroup || 'null'}`);
    console.log(`   Annual Tax: £${updatedCar.annualTax || 'null'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixHondaCivic();
