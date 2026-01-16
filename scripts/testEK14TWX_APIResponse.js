/**
 * Test script to check what data the API actually returns for EK14 TWX
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const ValuationAPIClient = require('../clients/ValuationAPIClient');

const testRegistration = 'EK14TWX';

async function testAPIs() {
  console.log('='.repeat(80));
  console.log('ENVIRONMENT VARIABLES CHECK');
  console.log('='.repeat(80));
  console.log(`API_ENVIRONMENT: ${process.env.API_ENVIRONMENT}`);
  console.log(`CHECKCARD_API_KEY: ${process.env.CHECKCARD_API_KEY ? process.env.CHECKCARD_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
  console.log(`CHECKCARD_API_TEST_KEY: ${process.env.CHECKCARD_API_TEST_KEY ? process.env.CHECKCARD_API_TEST_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
  console.log(`CHECKCARD_API_BASE_URL: ${process.env.CHECKCARD_API_BASE_URL || 'NOT SET'}`);
  console.log('');
  
  console.log('='.repeat(80));
  console.log(`Testing API responses for: ${testRegistration}`);
  console.log('='.repeat(80));
  console.log('');

  // Test CheckCarDetails API
  console.log('1. CHECKCARDETAILS API');
  console.log('-'.repeat(80));
  try {
    const checkCarData = await CheckCarDetailsClient.getVehicleData(testRegistration);
    console.log('✅ CheckCarDetails API Response:');
    console.log(JSON.stringify(checkCarData, null, 2));
    console.log('');
    console.log('Key fields:');
    console.log(`  - make: ${checkCarData?.make || 'NULL'}`);
    console.log(`  - model: ${checkCarData?.model || 'NULL'}`);
    console.log(`  - year: ${checkCarData?.year || 'NULL'}`);
    console.log(`  - engineSize: ${checkCarData?.engineSize || 'NULL'}`);
    console.log(`  - bodyType: ${checkCarData?.bodyType || 'NULL'}`);
    console.log(`  - color: ${checkCarData?.color || 'NULL'}`);
    console.log(`  - fuelType: ${checkCarData?.fuelType || 'NULL'}`);
    console.log(`  - transmission: ${checkCarData?.transmission || 'NULL'}`);
    console.log(`  - doors: ${checkCarData?.doors || 'NULL'}`);
    console.log(`  - seats: ${checkCarData?.seats || 'NULL'}`);
    console.log(`  - gearbox: ${checkCarData?.gearbox || 'NULL'}`);
    console.log(`  - emissionClass: ${checkCarData?.emissionClass || 'NULL'}`);
    console.log(`  - previousOwners: ${checkCarData?.previousOwners || 'NULL'}`);
  } catch (error) {
    console.log('❌ CheckCarDetails API Error:', error.message);
  }
  console.log('');

  // Test Valuation API
  console.log('2. VALUATION API');
  console.log('-'.repeat(80));
  try {
    const valuationClient = new ValuationAPIClient(
      process.env.CHECKCARD_API_KEY,
      process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk',
      process.env.API_ENVIRONMENT !== 'production'
    );
    
    const valuationData = await valuationClient.getValuation(testRegistration, 5000);
    console.log('✅ Valuation API Response:');
    console.log(JSON.stringify(valuationData, null, 2));
    console.log('');
    console.log('Key fields:');
    console.log(`  - vehicleDescription: ${valuationData?.vehicleDescription || 'NULL'}`);
    console.log(`  - estimatedValue.retail: ${valuationData?.estimatedValue?.retail || 'NULL'}`);
    console.log(`  - estimatedValue.trade: ${valuationData?.estimatedValue?.trade || 'NULL'}`);
    console.log(`  - estimatedValue.private: ${valuationData?.estimatedValue?.private || 'NULL'}`);
  } catch (error) {
    console.log('❌ Valuation API Error:', error.message);
  }
  console.log('');

  // Test Enhanced Vehicle Service (which merges both)
  console.log('3. ENHANCED VEHICLE SERVICE (MERGED DATA)');
  console.log('-'.repeat(80));
  try {
    const enhancedVehicleService = require('../services/enhancedVehicleService');
    const mergedData = await enhancedVehicleService.getEnhancedVehicleData(testRegistration, false, 5000);
    
    console.log('✅ Merged Data:');
    console.log(JSON.stringify(mergedData, null, 2));
    console.log('');
    console.log('Key fields (with source tracking):');
    console.log(`  - make: ${mergedData?.make?.value || 'NULL'} (source: ${mergedData?.make?.source || 'N/A'})`);
    console.log(`  - model: ${mergedData?.model?.value || 'NULL'} (source: ${mergedData?.model?.source || 'N/A'})`);
    console.log(`  - year: ${mergedData?.year?.value || 'NULL'} (source: ${mergedData?.year?.source || 'N/A'})`);
    console.log(`  - engineSize: ${mergedData?.engineSize?.value || 'NULL'} (source: ${mergedData?.engineSize?.source || 'N/A'})`);
    console.log(`  - bodyType: ${mergedData?.bodyType?.value || 'NULL'} (source: ${mergedData?.bodyType?.source || 'N/A'})`);
    console.log(`  - color: ${mergedData?.color?.value || 'NULL'} (source: ${mergedData?.color?.source || 'N/A'})`);
    console.log(`  - fuelType: ${mergedData?.fuelType?.value || 'NULL'} (source: ${mergedData?.fuelType?.source || 'N/A'})`);
    console.log(`  - transmission: ${mergedData?.transmission?.value || 'NULL'} (source: ${mergedData?.transmission?.source || 'N/A'})`);
    console.log(`  - doors: ${mergedData?.doors?.value || 'NULL'} (source: ${mergedData?.doors?.source || 'N/A'})`);
    console.log(`  - seats: ${mergedData?.seats?.value || 'NULL'} (source: ${mergedData?.seats?.source || 'N/A'})`);
    console.log(`  - gearbox: ${mergedData?.gearbox?.value || 'NULL'} (source: ${mergedData?.gearbox?.source || 'N/A'})`);
    console.log(`  - emissionClass: ${mergedData?.emissionClass?.value || 'NULL'} (source: ${mergedData?.emissionClass?.source || 'N/A'})`);
    console.log(`  - previousOwners: ${mergedData?.previousOwners?.value || 'NULL'} (source: ${mergedData?.previousOwners?.source || 'N/A'})`);
    console.log('');
    console.log('Data Sources:');
    console.log(`  - CheckCarDetails: ${mergedData?.dataSources?.checkCarDetails ? '✅' : '❌'}`);
    console.log(`  - Valuation: ${mergedData?.dataSources?.valuation ? '✅' : '❌'}`);
  } catch (error) {
    console.log('❌ Enhanced Vehicle Service Error:', error.message);
    console.error(error);
  }
  console.log('');

  console.log('='.repeat(80));
  console.log('Test Complete');
  console.log('='.repeat(80));
  
  process.exit(0);
}

testAPIs().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
