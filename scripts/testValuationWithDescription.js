/**
 * Test valuation API to see vehicle description
 */

require('dotenv').config();
const ValuationService = require('../services/valuationService');

const TEST_VRM = 'AV13NFC';
const TEST_MILEAGE = 50000;

async function testValuation() {
  console.log('Testing Valuation API for:', TEST_VRM);
  console.log('Mileage:', TEST_MILEAGE);
  console.log('='.repeat(80));

  try {
    const valuationService = new ValuationService();
    const result = await valuationService.getValuation(TEST_VRM, TEST_MILEAGE);
    
    console.log('\nValuation Result:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('Vehicle Description:', result.vehicleDescription);
    console.log('VRM:', result.vrm);
    console.log('Mileage:', result.mileage);
    console.log('\nValuation Prices:');
    console.log('  Retail:', result.estimatedValue.retail);
    console.log('  Trade:', result.estimatedValue.trade);
    console.log('  Private:', result.estimatedValue.private);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }

  process.exit(0);
}

testValuation();
