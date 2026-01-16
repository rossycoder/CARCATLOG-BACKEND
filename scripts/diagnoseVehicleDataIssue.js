/**
 * Diagnose Vehicle Data Issue
 * Tests the complete flow for EK14TWX and HUM777A
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const ValuationAPIClientClass = require('../clients/ValuationAPIClient');
const dataMerger = require('../utils/dataMerger');

// Initialize ValuationAPIClient
const ValuationAPIClient = new ValuationAPIClientClass(
  process.env.CHECKCARD_API_KEY,
  process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk',
  process.env.API_ENVIRONMENT !== 'production'
);

async function testVehicle(vrm) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing VRM: ${vrm}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Test CheckCarDetails API
    console.log('1. Testing CheckCarDetails API...');
    const checkCarData = await CheckCarDetailsClient.getVehicleData(vrm);
    console.log('CheckCarDetails Response:', JSON.stringify(checkCarData, null, 2));

    // Test Valuation API
    console.log('\n2. Testing Valuation API...');
    const valuationData = await ValuationAPIClient.getValuation(vrm, 50000);
    console.log('Valuation Response:', JSON.stringify(valuationData, null, 2));

    // Test Data Merger
    console.log('\n3. Testing Data Merger...');
    const mergedData = dataMerger.merge(checkCarData, valuationData);
    console.log('Merged Data:', JSON.stringify(mergedData, null, 2));

    // Check what's missing
    console.log('\n4. Data Quality Check:');
    const criticalFields = ['make', 'model', 'year', 'fuelType'];
    const missingFields = criticalFields.filter(field => !mergedData[field]?.value);
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing critical fields: ${missingFields.join(', ')}`);
    } else {
      console.log('✅ All critical fields present');
    }

    // Check data sources
    console.log('\n5. Data Sources:');
    console.log(`CheckCarDetails: ${mergedData.dataSources.checkCarDetails ? '✅' : '❌'}`);
    console.log(`Valuation: ${mergedData.dataSources.valuation ? '✅' : '❌'}`);

  } catch (error) {
    console.error(`\n❌ Error testing ${vrm}:`, error.message);
    console.error('Full error:', error);
  }
}

async function main() {
  console.log('Vehicle Data Diagnosis Tool');
  console.log('API Environment:', process.env.API_ENVIRONMENT || 'test');
  console.log('API Key configured:', !!process.env.CHECKCARD_API_KEY);

  // Test both problematic VRMs
  await testVehicle('EK14TWX');
  await testVehicle('HUM777A');

  console.log('\n' + '='.repeat(60));
  console.log('Diagnosis Complete');
  console.log('='.repeat(60));
}

main().catch(console.error);
