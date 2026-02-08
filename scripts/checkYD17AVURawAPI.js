/**
 * Check what the raw API returns for YD17AVU
 */

require('dotenv').config();

async function checkYD17AVURawAPI() {
  try {
    console.log('🔍 Checking Raw API Response for YD17AVU');
    console.log('='.repeat(60));
    
    const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
    const client = new CheckCarDetailsClient();
    
    console.log('\n📡 Calling getVehicleSpecs API...\n');
    const rawData = await client.getVehicleSpecs('YD17AVU');
    
    console.log('✅ Raw API Response:');
    console.log(JSON.stringify(rawData, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Parsing with ApiResponseParser...\n');
    
    // Clear require cache to get fresh parser
    delete require.cache[require.resolve('../utils/apiResponseParser')];
    const ApiResponseParser = require('../utils/apiResponseParser');
    const parsed = ApiResponseParser.parseCheckCarDetailsResponse(rawData);
    
    console.log('✅ Parsed Data:');
    console.log(JSON.stringify(parsed, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkYD17AVURawAPI();
