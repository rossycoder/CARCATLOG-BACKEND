/**
 * Test a single registration number with CheckCarDetails API
 * Usage: node backend/scripts/testSingleRegistration.js <registration>
 * Example: node backend/scripts/testSingleRegistration.js BD51SMR
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testSingleRegistration() {
  // Get registration from command line argument
  const registration = process.argv[2];
  
  if (!registration) {
    console.error('❌ Error: Please provide a registration number');
    console.log('\nUsage: node backend/scripts/testSingleRegistration.js <registration>');
    console.log('Example: node backend/scripts/testSingleRegistration.js BD51SMR');
    process.exit(1);
  }
  
  console.log('='.repeat(80));
  console.log('Testing Registration Number with CheckCarDetails API');
  console.log('='.repeat(80));
  console.log(`\nRegistration: ${registration}`);
  console.log(`API Environment: ${process.env.API_ENVIRONMENT || 'test'}`);
  console.log(`API Base URL: ${process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk'}`);
  console.log('\n' + '-'.repeat(80));
  
  try {
    console.log('\n🔍 Fetching vehicle data...\n');
    
    const data = await CheckCarDetailsClient.getVehicleData(registration);
    
    console.log('✅ SUCCESS! Vehicle data retrieved:\n');
    console.log('='.repeat(80));
    console.log('BASIC INFORMATION');
    console.log('='.repeat(80));
    console.log(`Make:         ${data.make || 'N/A'}`);
    console.log(`Model:        ${data.model || 'N/A'}`);
    console.log(`Year:         ${data.year || 'N/A'}`);
    console.log(`Fuel Type:    ${data.fuelType || 'N/A'}`);
    console.log(`Transmission: ${data.transmission || 'N/A'}`);
    console.log(`Engine Size:  ${data.engineSize ? data.engineSize + 'L' : 'N/A'}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('FUEL ECONOMY');
    console.log('='.repeat(80));
    console.log(`Urban:        ${data.fuelEconomy?.urban ? data.fuelEconomy.urban + ' mpg' : 'N/A'}`);
    console.log(`Extra Urban:  ${data.fuelEconomy?.extraUrban ? data.fuelEconomy.extraUrban + ' mpg' : 'N/A'}`);
    console.log(`Combined:     ${data.fuelEconomy?.combined ? data.fuelEconomy.combined + ' mpg' : 'N/A'}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('EMISSIONS & TAX');
    console.log('='.repeat(80));
    console.log(`CO2 Emissions:   ${data.co2Emissions ? data.co2Emissions + ' g/km' : 'N/A'}`);
    console.log(`Annual Tax:      ${data.annualTax ? '£' + data.annualTax : 'N/A'}`);
    console.log(`Insurance Group: ${data.insuranceGroup || 'N/A'}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE');
    console.log('='.repeat(80));
    console.log(`Power:        ${data.performance?.power ? data.performance.power + ' bhp' : 'N/A'}`);
    console.log(`Torque:       ${data.performance?.torque ? data.performance.torque + ' Nm' : 'N/A'}`);
    console.log(`0-60 mph:     ${data.performance?.acceleration ? data.performance.acceleration + ' seconds' : 'N/A'}`);
    console.log(`Top Speed:    ${data.performance?.topSpeed ? data.performance.topSpeed + ' mph' : 'N/A'}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('RAW API RESPONSE');
    console.log('='.repeat(80));
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Test completed successfully!');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.log('\n❌ FAILED to retrieve vehicle data\n');
    console.log('='.repeat(80));
    console.log('ERROR DETAILS');
    console.log('='.repeat(80));
    console.log(`Error Code:    ${error.code || 'UNKNOWN'}`);
    console.log(`Error Message: ${error.message}`);
    console.log(`User Message:  ${error.userMessage || 'N/A'}`);
    
    if (error.details) {
      console.log('\nDetailed Error Information:');
      console.log(JSON.stringify(error.details, null, 2));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('TROUBLESHOOTING TIPS');
    console.log('='.repeat(80));
    
    if (error.code === 'MISSING_API_KEY') {
      console.log('• Make sure CHECKCARD_API_KEY is set in backend/.env file');
    } else if (error.code === 'VEHICLE_NOT_FOUND') {
      console.log('• The registration number may not exist in the database');
      console.log('• Try a different UK registration number');
    } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
      console.log('• Wait a few minutes before trying again');
      console.log('• Check your API plan limits');
    } else if (error.message.includes('letter "A"')) {
      console.log('• In test mode, registration must contain letter "A"');
      console.log('• Set API_ENVIRONMENT=production in .env to use any registration');
    } else {
      console.log('• Check your internet connection');
      console.log('• Verify API credentials are correct');
      console.log('• Check API service status');
    }
    
    console.log('='.repeat(80));
    process.exit(1);
  }
}

testSingleRegistration();
