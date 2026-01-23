/**
 * Diagnostic script to check running costs autofill issue
 * This script helps identify why running costs are not auto-filling on deployment
 */

require('dotenv').config();
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function diagnoseRunningCostsIssue() {
  console.log('🔍 Diagnosing Running Costs Autofill Issue\n');
  console.log('=' .repeat(60));
  
  // 1. Check environment configuration
  console.log('\n1️⃣ Environment Configuration:');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   API_ENVIRONMENT:', process.env.API_ENVIRONMENT);
  console.log('   CHECKCARD_API_KEY:', process.env.CHECKCARD_API_KEY ? `${process.env.CHECKCARD_API_KEY.substring(0, 8)}...` : '❌ NOT SET');
  console.log('   CHECKCARD_API_BASE_URL:', process.env.CHECKCARD_API_BASE_URL || '❌ NOT SET');
  
  // 2. Check if API key is configured
  if (!process.env.CHECKCARD_API_KEY) {
    console.log('\n❌ ISSUE FOUND: CHECKCARD_API_KEY is not set!');
    console.log('   This is why running costs are not auto-filling on deployment.');
    console.log('\n   To fix:');
    console.log('   1. Set CHECKCARD_API_KEY in your deployment environment variables');
    console.log('   2. Use the live API key: 14cedd96eeda4ac6b6b7f9a4db04f573');
    console.log('   3. Redeploy your application');
    return;
  }
  
  // 3. Test API connection with a sample registration
  console.log('\n2️⃣ Testing API Connection:');
  const testRegistration = 'EK14TWX'; // Known working registration
  
  try {
    console.log(`   Testing with registration: ${testRegistration}`);
    const vehicleData = await CheckCarDetailsClient.getVehicleData(testRegistration);
    
    console.log('\n✅ API Connection Successful!');
    console.log('\n3️⃣ Running Costs Data:');
    console.log('   Fuel Economy:');
    console.log('     - Urban:', vehicleData.fuelEconomy?.urban || 'N/A', 'mpg');
    console.log('     - Extra Urban:', vehicleData.fuelEconomy?.extraUrban || 'N/A', 'mpg');
    console.log('     - Combined:', vehicleData.fuelEconomy?.combined || 'N/A', 'mpg');
    console.log('   CO2 Emissions:', vehicleData.co2Emissions || 'N/A', 'g/km');
    console.log('   Annual Tax: £', vehicleData.annualTax || 'N/A');
    console.log('   Insurance Group:', vehicleData.insuranceGroup || 'N/A');
    
    if (!vehicleData.fuelEconomy?.urban && !vehicleData.co2Emissions && !vehicleData.annualTax) {
      console.log('\n⚠️ WARNING: API returned no running costs data');
      console.log('   This could mean:');
      console.log('   1. The API key has no credits');
      console.log('   2. The API is not returning running costs for this vehicle');
      console.log('   3. The data is not available in the API database');
    } else {
      console.log('\n✅ Running costs data is available from API');
    }
    
  } catch (error) {
    console.log('\n❌ API Connection Failed!');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
    
    if (error.code === 'MISSING_API_KEY') {
      console.log('\n   Fix: Set CHECKCARD_API_KEY environment variable');
    } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
      console.log('\n   Fix: Wait for rate limit to reset or upgrade API plan');
    } else if (error.code === 'API_TIMEOUT') {
      console.log('\n   Fix: Check network connection and API availability');
    } else {
      console.log('\n   Fix: Check API key validity and network connection');
    }
  }
  
  // 4. Check enhanced vehicle lookup endpoint
  console.log('\n4️⃣ Testing Enhanced Vehicle Lookup:');
  try {
    const enhancedVehicleService = require('../services/enhancedVehicleService');
    const result = await enhancedVehicleService.getVehicleDataWithFallback(testRegistration);
    
    if (result.success) {
      console.log('   ✅ Enhanced lookup successful');
      console.log('   Data sources:');
      console.log('     - DVLA:', result.data.dataSources.dvla ? '✅' : '❌');
      console.log('     - CheckCarDetails:', result.data.dataSources.checkCarDetails ? '✅' : '❌');
      
      if (result.data.runningCosts) {
        console.log('   Running costs in merged data:');
        console.log('     - Urban MPG:', result.data.runningCosts.fuelEconomy?.urban?.value || 'N/A');
        console.log('     - Combined MPG:', result.data.runningCosts.fuelEconomy?.combined?.value || 'N/A');
        console.log('     - CO2:', result.data.runningCosts.co2Emissions?.value || 'N/A');
        console.log('     - Annual Tax:', result.data.runningCosts.annualTax?.value || 'N/A');
      } else {
        console.log('   ⚠️ No running costs in merged data');
      }
    } else {
      console.log('   ❌ Enhanced lookup failed:', result.error);
    }
  } catch (error) {
    console.log('   ❌ Enhanced lookup error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Summary:');
  console.log('   If running costs are not auto-filling on deployment:');
  console.log('   1. Verify CHECKCARD_API_KEY is set in deployment environment');
  console.log('   2. Check API credits/rate limits');
  console.log('   3. Verify network connectivity from deployment server to API');
  console.log('   4. Check browser console for API errors');
  console.log('   5. Verify the enhanced-lookup endpoint is accessible');
}

// Run diagnostic
diagnoseRunningCostsIssue()
  .then(() => {
    console.log('\n✅ Diagnostic complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostic failed:', error);
    process.exit(1);
  });
