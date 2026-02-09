/**
 * Test: Check if running costs are properly saved and retrieved from database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

async function testRunningCostsDisplay() {
  console.log('='.repeat(70));
  console.log('TEST: Running Costs Display Issue');
  console.log('='.repeat(70));
  console.log();

  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autotrader');
    console.log('✅ Connected');
    console.log();

    // Find a car with running costs
    console.log('Searching for cars with running costs data...');
    const carsWithRunningCosts = await Car.find({
      'runningCosts.annualTax': { $exists: true, $ne: null }
    }).limit(5);

    console.log(`Found ${carsWithRunningCosts.length} cars with running costs`);
    console.log();

    if (carsWithRunningCosts.length === 0) {
      console.log('⚠️  No cars found with running costs data');
      console.log('   This might be because:');
      console.log('   1. No cars have been added yet');
      console.log('   2. Running costs data is not being saved');
      console.log('   3. API is not returning running costs');
      console.log();
      
      // Check if there are any cars at all
      const totalCars = await Car.countDocuments();
      console.log(`Total cars in database: ${totalCars}`);
      
      if (totalCars > 0) {
        console.log();
        console.log('Checking first car structure...');
        const firstCar = await Car.findOne();
        console.log('Car data structure:');
        console.log('- registrationNumber:', firstCar.registrationNumber);
        console.log('- make:', firstCar.make);
        console.log('- model:', firstCar.model);
        console.log('- runningCosts:', JSON.stringify(firstCar.runningCosts, null, 2));
        console.log('- annualTax (legacy):', firstCar.annualTax);
        console.log('- insuranceGroup (legacy):', firstCar.insuranceGroup);
        console.log('- combinedMpg (legacy):', firstCar.combinedMpg);
      }
    } else {
      // Display running costs for found cars
      carsWithRunningCosts.forEach((car, index) => {
        console.log(`Car ${index + 1}: ${car.make} ${car.model} (${car.registrationNumber})`);
        console.log('='.repeat(70));
        console.log('Running Costs Object:');
        console.log(JSON.stringify(car.runningCosts, null, 2));
        console.log();
        console.log('Legacy Fields (for comparison):');
        console.log('- annualTax:', car.annualTax);
        console.log('- insuranceGroup:', car.insuranceGroup);
        console.log('- combinedMpg:', car.combinedMpg);
        console.log('- urbanMpg:', car.urbanMpg);
        console.log('- extraUrbanMpg:', car.extraUrbanMpg);
        console.log();
        
        // Check if data is properly structured
        const hasRunningCostsObject = car.runningCosts && typeof car.runningCosts === 'object';
        const hasAnnualTax = car.runningCosts?.annualTax !== null && car.runningCosts?.annualTax !== undefined;
        const hasInsuranceGroup = car.runningCosts?.insuranceGroup !== null && car.runningCosts?.insuranceGroup !== undefined;
        const hasFuelEconomy = car.runningCosts?.fuelEconomy && 
                               (car.runningCosts.fuelEconomy.combined || 
                                car.runningCosts.fuelEconomy.urban || 
                                car.runningCosts.fuelEconomy.extraUrban);
        
        console.log('Data Validation:');
        console.log(`✅ Has runningCosts object: ${hasRunningCostsObject}`);
        console.log(`${hasAnnualTax ? '✅' : '❌'} Has annualTax: ${hasAnnualTax}`);
        console.log(`${hasInsuranceGroup ? '✅' : '❌'} Has insuranceGroup: ${hasInsuranceGroup}`);
        console.log(`${hasFuelEconomy ? '✅' : '❌'} Has fuelEconomy: ${hasFuelEconomy}`);
        console.log();
        
        if (!hasAnnualTax && !hasInsuranceGroup && !hasFuelEconomy) {
          console.log('⚠️  WARNING: runningCosts object exists but all values are null/undefined');
          console.log('   This means the API is not returning running costs data');
        }
        console.log('='.repeat(70));
        console.log();
      });
    }

    // Check for cars without runningCosts object
    console.log('Checking for cars without runningCosts object...');
    const carsWithoutRunningCosts = await Car.find({
      runningCosts: { $exists: false }
    }).limit(3);

    if (carsWithoutRunningCosts.length > 0) {
      console.log(`⚠️  Found ${carsWithoutRunningCosts.length} cars without runningCosts object`);
      carsWithoutRunningCosts.forEach((car, index) => {
        console.log(`   ${index + 1}. ${car.make} ${car.model} (${car.registrationNumber})`);
      });
      console.log();
      console.log('   These cars need to be updated with running costs data');
    } else {
      console.log('✅ All cars have runningCosts object');
    }
    console.log();

    // Summary
    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    const totalCars = await Car.countDocuments();
    const carsWithData = await Car.countDocuments({
      'runningCosts.annualTax': { $exists: true, $ne: null }
    });
    const carsWithoutObject = await Car.countDocuments({
      runningCosts: { $exists: false }
    });

    console.log(`Total cars: ${totalCars}`);
    console.log(`Cars with running costs data: ${carsWithData} (${((carsWithData/totalCars)*100).toFixed(1)}%)`);
    console.log(`Cars without runningCosts object: ${carsWithoutObject} (${((carsWithoutObject/totalCars)*100).toFixed(1)}%)`);
    console.log();

    if (carsWithData === 0 && totalCars > 0) {
      console.log('❌ ISSUE FOUND: No cars have running costs data');
      console.log();
      console.log('Possible causes:');
      console.log('1. API is not returning running costs data');
      console.log('2. Parser is not extracting running costs correctly');
      console.log('3. Data is not being saved to runningCosts object');
      console.log();
      console.log('Next steps:');
      console.log('1. Check API response in logs');
      console.log('2. Verify parser is extracting annualTax, insuranceGroup, etc.');
      console.log('3. Ensure universalAutoCompleteService is creating runningCosts object');
    } else if (carsWithData > 0) {
      console.log('✅ Running costs data is being saved correctly');
      console.log();
      console.log('If frontend is not showing data, check:');
      console.log('1. API endpoint is returning runningCosts object');
      console.log('2. Frontend is reading from correct field (car.runningCosts.annualTax)');
      console.log('3. Frontend component is rendering the data');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log();
    console.log('Database connection closed');
  }
}

testRunningCostsDisplay();
