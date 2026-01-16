const enhancedVehicleService = require('../services/enhancedVehicleService');

async function test() {
  console.log('Testing EK14TWX with enhanced vehicle service...\n');
  
  try {
    const result = await enhancedVehicleService.getEnhancedVehicleData('EK14TWX', false, 5000);
    console.log('\n=== ENHANCED RESULT ===');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

test();
