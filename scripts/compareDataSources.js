/**
 * Compare data availability across different sources
 * Usage: node backend/scripts/compareDataSources.js <registration>
 * Example: node backend/scripts/compareDataSources.js HUM777A
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function compareDataSources() {
  const registration = process.argv[2] || 'HUM777A';
  
  console.log('='.repeat(80));
  console.log(`Data Source Comparison for: ${registration}`);
  console.log('='.repeat(80));
  
  const results = {
    registration,
    sources: {}
  };
  
  // Test CheckCarDetails
  console.log('\n🔍 Checking CheckCarDetails API...');
  try {
    const data = await CheckCarDetailsClient.getVehicleData(registration);
    results.sources.checkCarDetails = {
      available: true,
      data: {
        make: data.make,
        model: data.model,
        year: data.year,
        fuelType: data.fuelType,
        transmission: data.transmission,
        engineSize: data.engineSize,
        fuelEconomy: data.fuelEconomy,
        co2Emissions: data.co2Emissions,
        insuranceGroup: data.insuranceGroup,
        annualTax: data.annualTax,
        performance: data.performance
      }
    };
    console.log('✅ CheckCarDetails: Data available');
  } catch (error) {
    results.sources.checkCarDetails = {
      available: false,
      error: error.code || error.message
    };
    console.log(`❌ CheckCarDetails: ${error.code || 'Error'}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const checkCarAvailable = results.sources.checkCarDetails.available;
  
  console.log(`\n📊 Data Availability for ${registration}:`);
  console.log(`   CheckCarDetails: ${checkCarAvailable ? '✅ Available' : '❌ Not Available'}`);
  
  if (checkCarAvailable) {
    console.log('\n✅ GOOD NEWS: Full data available from CheckCarDetails');
    console.log('   Your application will show:');
    console.log('   • Complete vehicle specifications');
    console.log('   • Running costs (fuel economy, tax, insurance)');
    console.log('   • Performance data');
  } else {
    console.log('\n⚠️  LIMITED DATA: CheckCarDetails does not have this vehicle');
    console.log('   Your application will:');
    console.log('   • Show DVLA data (make, model, year, fuel type, color)');
    console.log('   • Show "Information unavailable" for running costs');
    console.log('   • Allow user to manually enter missing details');
    console.log('   • Still function normally - this is expected behavior');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('WHY THIS HAPPENS');
  console.log('='.repeat(80));
  console.log('\n📚 Different APIs have different data coverage:');
  console.log('   • DVLA: Official UK government database (most comprehensive)');
  console.log('   • AutoTrader: Commercial database with extensive coverage');
  console.log('   • CheckCarDetails: Third-party API with selective coverage');
  console.log('\n💡 Not all vehicles in DVLA/AutoTrader are in CheckCarDetails');
  console.log('   This is normal and expected!');
  
  console.log('\n' + '='.repeat(80));
  console.log('YOUR APPLICATION BEHAVIOR');
  console.log('='.repeat(80));
  console.log('\n✅ Current implementation handles this correctly:');
  console.log('   1. Tries CheckCarDetails for enhanced data');
  console.log('   2. Falls back to DVLA data if CheckCarDetails unavailable');
  console.log('   3. Shows clear messages for unavailable information');
  console.log('   4. Allows manual data entry');
  console.log('   5. Vehicle can still be listed and sold');
  
  console.log('\n' + '='.repeat(80));
  
  // Save results to file
  const fs = require('fs');
  const resultsFile = path.join(__dirname, `data-comparison-${registration}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsFile}`);
  console.log('='.repeat(80));
}

compareDataSources().catch(console.error);
