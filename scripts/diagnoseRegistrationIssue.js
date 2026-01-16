require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

// Test registrations
const testRegistrations = [
  'HUM777A',    // Your working registration
  'BD51SMR',    // UK registration
  'EK14TWX',    // UK registration
  'MX08XMT',    // UK registration
  'AB12CDE'     // Test registration
];

async function diagnoseRegistration(vrm) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${vrm}`);
  console.log('='.repeat(80));
  
  try {
    const data = await CheckCarDetailsClient.getVehicleData(vrm);
    
    console.log('✅ SUCCESS - Data retrieved');
    console.log('Make:', data.make || 'Not available');
    console.log('Model:', data.model || 'Not available');
    console.log('Year:', data.year || 'Not available');
    console.log('Fuel Type:', data.fuelType || 'Not available');
    
    return { vrm, status: 'SUCCESS', data };
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Error Code:', error.code || 'Unknown');
    console.log('Error Message:', error.message);
    
    // Check specific error types
    if (error.response) {
      console.log('HTTP Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      
      if (error.response.status === 403) {
        console.log('⚠️  RATE LIMIT: You may have exceeded your API quota');
      } else if (error.response.status === 404) {
        console.log('⚠️  NOT FOUND: This registration may not exist in the database');
      }
    }
    
    return { vrm, status: 'FAILED', error: error.message, code: error.code };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('REGISTRATION DIAGNOSIS TOOL');
  console.log('='.repeat(80));
  console.log('API Environment:', process.env.API_ENVIRONMENT);
  console.log('API Key:', process.env.CHECKCARD_API_KEY ? `${process.env.CHECKCARD_API_KEY.substring(0, 8)}...` : 'NOT SET');
  console.log('='.repeat(80));
  
  const results = [];
  
  for (const vrm of testRegistrations) {
    const result = await diagnoseRegistration(vrm);
    results.push(result);
    
    // Wait 2 seconds between requests to avoid rate limiting
    if (testRegistrations.indexOf(vrm) < testRegistrations.length - 1) {
      console.log('\nWaiting 2 seconds before next request...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  console.log(`Total Tested: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log('');
  
  results.forEach(result => {
    if (result.status === 'SUCCESS') {
      console.log(`✅ ${result.vrm}: ${result.data.make || 'N/A'} ${result.data.model || 'N/A'} (${result.data.year || 'N/A'})`);
    } else {
      console.log(`❌ ${result.vrm}: ${result.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(80));
  
  if (failed > 0) {
    console.log('');
    console.log('If you see 403 errors:');
    console.log('  - You may have hit your API rate limit');
    console.log('  - Wait a few minutes and try again');
    console.log('  - Check your API quota at CheckCarDetails dashboard');
    console.log('');
    console.log('If you see 404 errors:');
    console.log('  - The registration may not exist in the CheckCarDetails database');
    console.log('  - Try with real UK registrations');
    console.log('  - Some older or private registrations may not be available');
    console.log('');
  }
  
  console.log('='.repeat(80));
}

main().catch(console.error);
