/**
 * Fix Client's Car - LS70UAK
 * Force fetch complete data and update database
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const ComprehensiveVehicleService = require('../services/comprehensiveVehicleService');

async function fixClientCar() {
  try {
    console.log('🔧 Fixing Client Car: LS70UAK (698682fd4c9aa2475ac2cb91)\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    const carId = '698682fd4c9aa2475ac2cb91';
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }
    
    console.log('📋 Current Car Data:');
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make: ${car.make}`);
    console.log(`   Model: ${car.model}`);
    console.log(`   Variant: ${car.variant || 'MISSING'}`);
    console.log(`   Doors: ${car.doors || 'MISSING'}`);
    console.log(`   Seats: ${car.seats || 'MISSING'}`);
    console.log(`   Running Costs: ${car.fuelEconomyCombined ? 'Present' : 'MISSING'}`);
    console.log(`   Vehicle History: ${car.historyCheckId ? 'Linked' : 'MISSING'}`);
    
    console.log('\n🚀 Fetching complete vehicle data from API...\n');
    
    const service = new ComprehensiveVehicleService();
    const result = await service.fetchCompleteVehicleData(
      car.registrationNumber,
      car.mileage || 48500,
      true // Force refresh - get fresh data
    );
    
    console.log('\n✅ Complete data fetched!');
    console.log(`   API Calls: ${result.apiCalls}`);
    console.log(`   Total Cost: £${result.totalCost.toFixed(2)}`);
    console.log(`   Errors: ${result.errors.length}`);
    
    // Reload car to see updated data
    const updatedCar = await Car.findById(carId);
    
    console.log('\n📊 Updated Car Data:');
    console.log(`   Registration: ${updatedCar.registrationNumber}`);
    console.log(`   Make: ${updatedCar.make}`);
    console.log(`   Model: ${updatedCar.model}`);
    console.log(`   Variant: ${updatedCar.variant || 'STILL MISSING'}`);
    console.log(`   Doors: ${updatedCar.doors || 'STILL MISSING'}`);
    console.log(`   Seats: ${updatedCar.seats || 'STILL MISSING'}`);
    console.log(`   Emission Class: ${updatedCar.emissionClass || 'STILL MISSING'}`);
    console.log(`   Urban MPG: ${updatedCar.fuelEconomyUrban || 'STILL MISSING'}`);
    console.log(`   Combined MPG: ${updatedCar.fuelEconomyCombined || 'STILL MISSING'}`);
    console.log(`   CO2: ${updatedCar.co2Emissions || 'STILL MISSING'} g/km`);
    console.log(`   Annual Tax: £${updatedCar.annualTax || 'STILL MISSING'}`);
    console.log(`   Vehicle History: ${updatedCar.historyCheckId ? 'Linked' : 'STILL MISSING'}`);
    
    // Calculate completeness
    const fields = [
      updatedCar.make,
      updatedCar.model,
      updatedCar.variant,
      updatedCar.doors,
      updatedCar.seats,
      updatedCar.emissionClass,
      updatedCar.fuelEconomyCombined,
      updatedCar.co2Emissions,
      updatedCar.annualTax,
      updatedCar.historyCheckId
    ];
    
    const filledFields = fields.filter(f => f !== null && f !== undefined && f !== 'Unknown').length;
    const completeness = Math.round((filledFields / fields.length) * 100);
    
    console.log(`\n📈 Data Completeness: ${completeness}% (${filledFields}/${fields.length} fields)`);
    
    if (completeness >= 90) {
      console.log('\n✅ SUCCESS! Car data is now complete.');
      console.log('   Client will now see all the data on the detail page.');
    } else {
      console.log('\n⚠️  WARNING: Some data is still missing.');
      console.log('   This might be an API limitation.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixClientCar();
