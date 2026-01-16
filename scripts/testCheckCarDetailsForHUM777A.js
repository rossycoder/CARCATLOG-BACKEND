/**
 * Test CheckCarDetails API directly for HUM777A
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testCheckCarDetails() {
  try {
    const testReg = 'HUM777A';
    
    console.log(`🚗 Testing CheckCarDetails API for: ${testReg}\n`);
    console.log('='.repeat(80));
    
    const data = await CheckCarDetailsClient.getVehicleData(testReg);
    
    console.log('\n✅ CheckCarDetails API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 Extracted Fields:');
    console.log('='.repeat(80));
    console.log(`Make: ${data.make || 'N/A'}`);
    console.log(`Model: ${data.model || 'N/A'}`);
    console.log(`Year: ${data.year || 'N/A'}`);
    console.log(`Color: ${data.color || 'N/A'}`);
    console.log(`Fuel Type: ${data.fuelType || 'N/A'}`);
    console.log(`Transmission: ${data.transmission || 'N/A'}`);
    console.log(`Engine Size: ${data.engineSize || 'N/A'}`);
    console.log(`Body Type: ${data.bodyType || 'N/A'}`);
    console.log(`Doors: ${data.doors || 'N/A'}`);
    console.log(`Seats: ${data.seats || 'N/A'}`);
    console.log(`Previous Owners: ${data.previousOwners || 'N/A'}`);
    
    if (data.fuelEconomy) {
      console.log('\n💰 Running Costs:');
      console.log(`  Urban MPG: ${data.fuelEconomy.urban || 'N/A'}`);
      console.log(`  Extra Urban MPG: ${data.fuelEconomy.extraUrban || 'N/A'}`);
      console.log(`  Combined MPG: ${data.fuelEconomy.combined || 'N/A'}`);
    }
    console.log(`  Annual Tax: ${data.annualTax || 'N/A'}`);
    console.log(`  Insurance Group: ${data.insuranceGroup || 'N/A'}`);
    console.log(`  CO2 Emissions: ${data.co2Emissions || 'N/A'}`);
    
  } catch (error) {
    console.error('\n❌ CheckCarDetails API Error:');
    console.error(`Message: ${error.message}`);
    console.error(`Code: ${error.code}`);
    if (error.userMessage) {
      console.error(`User Message: ${error.userMessage}`);
    }
  }
}

testCheckCarDetails();
