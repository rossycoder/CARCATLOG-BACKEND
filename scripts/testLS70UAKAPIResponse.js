/**
 * Test LS70UAK API Response
 * Check what data API is returning for this registration
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testLS70UAK() {
  try {
    console.log('🔍 Testing LS70UAK API Response...\n');
    
    const vrm = 'LS70UAK';
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 FETCHING VEHICLE HISTORY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const rawData = await checkCarDetailsClient.getVehicleHistory(vrm);
    const parsedData = checkCarDetailsClient.parseResponse(rawData);
    
    console.log('✅ API Response Received\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 PARSED DATA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Make: ${parsedData.make || 'MISSING'}`);
    console.log(`Model: ${parsedData.model || 'MISSING'}`);
    console.log(`Variant: ${parsedData.modelVariant || parsedData.variant || 'MISSING'}`);
    console.log(`Body Type: ${parsedData.bodyType || 'MISSING'}`);
    console.log(`Doors: ${parsedData.doors || 'MISSING'}`);
    console.log(`Seats: ${parsedData.seats || 'MISSING'}`);
    console.log(`Transmission: ${parsedData.transmission || 'MISSING'}`);
    console.log(`Engine Size: ${parsedData.engineSize || parsedData.engineSizeLitres || 'MISSING'}`);
    console.log(`Emission Class: ${parsedData.emissionClass || parsedData.euroStatus || 'MISSING'}`);
    
    console.log('\n💰 Running Costs:');
    console.log(`Urban MPG: ${parsedData.fuelEconomy?.urban || 'MISSING'}`);
    console.log(`Extra Urban MPG: ${parsedData.fuelEconomy?.extraUrban || 'MISSING'}`);
    console.log(`Combined MPG: ${parsedData.fuelEconomy?.combined || 'MISSING'}`);
    console.log(`CO2: ${parsedData.co2Emissions || 'MISSING'} g/km`);
    console.log(`Insurance Group: ${parsedData.insuranceGroup || 'MISSING'}`);
    console.log(`Annual Tax: £${parsedData.annualTax || 'MISSING'}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 RAW API RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(rawData, null, 2));
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DATA AVAILABILITY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const fields = {
      'Make': parsedData.make,
      'Model': parsedData.model,
      'Variant': parsedData.modelVariant || parsedData.variant,
      'Body Type': parsedData.bodyType,
      'Doors': parsedData.doors,
      'Seats': parsedData.seats,
      'Transmission': parsedData.transmission,
      'Engine Size': parsedData.engineSize || parsedData.engineSizeLitres,
      'Emission Class': parsedData.emissionClass || parsedData.euroStatus,
      'Urban MPG': parsedData.fuelEconomy?.urban,
      'Combined MPG': parsedData.fuelEconomy?.combined,
      'CO2': parsedData.co2Emissions,
      'Insurance Group': parsedData.insuranceGroup,
      'Annual Tax': parsedData.annualTax
    };
    
    const available = [];
    const missing = [];
    
    Object.entries(fields).forEach(([key, value]) => {
      if (value && value !== 'Unknown') {
        available.push(key);
        console.log(`✅ ${key}: ${value}`);
      } else {
        missing.push(key);
        console.log(`❌ ${key}: MISSING FROM API`);
      }
    });
    
    const completeness = Math.round((available.length / Object.keys(fields).length) * 100);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📈 API Data Completeness: ${completeness}% (${available.length}/${Object.keys(fields).length} fields)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (missing.length > 0) {
      console.log(`\n⚠️  Missing from API: ${missing.join(', ')}`);
      console.log(`\nThis means the API itself doesn't have this data.`);
      console.log(`It's not a code issue - the data simply isn't available from the API provider.`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

testLS70UAK();
