/**
 * Diagnose Valuation Discrepancy
 * Tests valuation for AV13NFC through both paths:
 * 1. Direct valuation endpoint (used by valuation tool)
 * 2. Enhanced vehicle service (used during listing)
 */

require('dotenv').config();
const ValuationService = require('../services/valuationService');
const enhancedVehicleService = require('../services/enhancedVehicleService');

const TEST_VRM = 'AV13NFC';
const TEST_MILEAGE = 50000; // Adjust based on actual mileage

async function diagnoseValuationDiscrepancy() {
  console.log('='.repeat(80));
  console.log('VALUATION DISCREPANCY DIAGNOSIS');
  console.log('='.repeat(80));
  console.log(`Testing VRM: ${TEST_VRM}`);
  console.log(`Test Mileage: ${TEST_MILEAGE}`);
  console.log('');

  try {
    // Test 1: Direct Valuation Service (used by valuation tool)
    console.log('TEST 1: Direct Valuation Service (Valuation Tool Path)');
    console.log('-'.repeat(80));
    const valuationService = new ValuationService();
    const directValuation = await valuationService.getValuation(TEST_VRM, TEST_MILEAGE);
    
    console.log('Direct Valuation Result:');
    console.log(JSON.stringify(directValuation, null, 2));
    console.log('');
    console.log('Direct Valuation Prices:');
    console.log(`  Retail: £${directValuation.estimatedValue?.retail || 'N/A'}`);
    console.log(`  Trade: £${directValuation.estimatedValue?.trade || 'N/A'}`);
    console.log(`  Private: £${directValuation.estimatedValue?.private || 'N/A'}`);
    console.log('');

    // Test 2: Enhanced Vehicle Service (used during listing)
    console.log('TEST 2: Enhanced Vehicle Service (Listing Path)');
    console.log('-'.repeat(80));
    const enhancedData = await enhancedVehicleService.getEnhancedVehicleData(
      TEST_VRM,
      false, // Don't use cache
      TEST_MILEAGE
    );
    
    console.log('Enhanced Vehicle Data Result:');
    console.log(JSON.stringify(enhancedData, null, 2));
    console.log('');
    
    // Extract valuation from enhanced data
    if (enhancedData.valuation) {
      console.log('Enhanced Data Valuation Prices:');
      console.log(`  Retail: £${enhancedData.valuation.estimatedValue?.retail || 'N/A'}`);
      console.log(`  Trade: £${enhancedData.valuation.estimatedValue?.trade || 'N/A'}`);
      console.log(`  Private: £${enhancedData.valuation.estimatedValue?.private || 'N/A'}`);
    } else {
      console.log('⚠️  No valuation data in enhanced result');
    }
    console.log('');

    // Compare results
    console.log('COMPARISON');
    console.log('-'.repeat(80));
    
    const directRetail = directValuation.estimatedValue?.retail || 0;
    const enhancedRetail = enhancedData.valuation?.estimatedValue?.retail || 0;
    
    const directTrade = directValuation.estimatedValue?.trade || 0;
    const enhancedTrade = enhancedData.valuation?.estimatedValue?.trade || 0;
    
    const directPrivate = directValuation.estimatedValue?.private || 0;
    const enhancedPrivate = enhancedData.valuation?.estimatedValue?.private || 0;
    
    console.log('Retail Valuation:');
    console.log(`  Direct: £${directRetail}`);
    console.log(`  Enhanced: £${enhancedRetail}`);
    console.log(`  Difference: £${Math.abs(directRetail - enhancedRetail)}`);
    console.log(`  Match: ${directRetail === enhancedRetail ? '✅' : '❌'}`);
    console.log('');
    
    console.log('Trade Valuation:');
    console.log(`  Direct: £${directTrade}`);
    console.log(`  Enhanced: £${enhancedTrade}`);
    console.log(`  Difference: £${Math.abs(directTrade - enhancedTrade)}`);
    console.log(`  Match: ${directTrade === enhancedTrade ? '✅' : '❌'}`);
    console.log('');
    
    console.log('Private Valuation:');
    console.log(`  Direct: £${directPrivate}`);
    console.log(`  Enhanced: £${enhancedPrivate}`);
    console.log(`  Difference: £${Math.abs(directPrivate - enhancedPrivate)}`);
    console.log(`  Match: ${directPrivate === enhancedPrivate ? '✅' : '❌'}`);
    console.log('');

    // Check data sources
    console.log('DATA SOURCES');
    console.log('-'.repeat(80));
    console.log('Direct Valuation:');
    console.log(`  API Provider: ${directValuation.apiProvider || 'unknown'}`);
    console.log(`  Test Mode: ${directValuation.testMode}`);
    console.log('');
    console.log('Enhanced Data:');
    console.log(`  Data Sources: ${JSON.stringify(enhancedData.dataSources || {})}`);
    console.log('');

    // Summary
    console.log('SUMMARY');
    console.log('='.repeat(80));
    if (directRetail === enhancedRetail && directTrade === enhancedTrade && directPrivate === enhancedPrivate) {
      console.log('✅ Valuations match across both paths');
    } else {
      console.log('❌ DISCREPANCY DETECTED');
      console.log('');
      console.log('Possible causes:');
      console.log('1. Different mileage values being used');
      console.log('2. Different API endpoints or parameters');
      console.log('3. Data transformation in dataMerger');
      console.log('4. Caching issues');
      console.log('');
      console.log('Recommended actions:');
      console.log('1. Check mileage values in both paths');
      console.log('2. Review dataMerger.js valuation handling');
      console.log('3. Verify API credentials and endpoints');
    }

  } catch (error) {
    console.error('Error during diagnosis:', error);
    console.error('Stack trace:', error.stack);
  }

  process.exit(0);
}

// Run diagnosis
diagnoseValuationDiscrepancy();
