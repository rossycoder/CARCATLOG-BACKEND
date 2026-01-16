/**
 * Test UK registration numbers with CheckCarDetails API
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

// UK registration patterns to test
const testRegistrations = [
  // Current format (2001-present) - AB12 CDE
  'BD51SMR',   // 2001 September
  'BF12KHG',   // 2012 March
  'BG15ABC',   // 2015 March
  'BV66XYZ',   // 2016 September
  'AB62CDE',   // 2012 September
  'CD18EFG',   // 2018 March
  'EF19HIJ',   // 2019 March
  'GH20KLM',   // 2020 March
  'JK21NOP',   // 2021 March
  'LM22QRS',   // 2022 March
  
  // Prefix format (1983-2001) - A123 BCD
  'Y123ABC',   // 2001
  'X456DEF',   // 2000
  'V789GHI',   // 1999
  'T234JKL',   // 1999
  'S567MNO',   // 1998
  'R890PQR',   // 1997
  'P123STU',   // 1996
  'N456VWX',   // 1995
  'M789YZA',   // 1994
  'L234BCD',   // 1993
];

async function testVehicleRegistrations() {
  console.log('Testing UK registration numbers with CheckCarDetails API...');
  console.log('='.repeat(80));
  
  const workingRegs = [];
  const failedRegs = [];
  
  for (const reg of testRegistrations) {
    try {
      console.log(`\nTesting: ${reg}`);
      const data = await CheckCarDetailsClient.getVehicleData(reg);
      
      if (data) {
        console.log(`✅ SUCCESS: ${reg}`);
        console.log(`   Make: ${data.make || 'N/A'}`);
        console.log(`   Model: ${data.model || 'N/A'}`);
        console.log(`   Year: ${data.year || 'N/A'}`);
        console.log(`   Fuel: ${data.fuelType || 'N/A'}`);
        
        workingRegs.push({
          registration: reg,
          make: data.make,
          model: data.model,
          year: data.year,
          fuelType: data.fuelType
        });
      }
    } catch (error) {
      console.log(`❌ FAILED: ${reg} - ${error.message}`);
      failedRegs.push({ reg, error: error.message });
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  if (workingRegs.length > 0) {
    console.log(`\n✅ WORKING REGISTRATIONS (${workingRegs.length}):`);
    workingRegs.forEach(reg => {
      console.log(`   ${reg.registration} - ${reg.make} ${reg.model} (${reg.year})`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 RECOMMENDED FOR TESTING:');
    console.log('='.repeat(80));
    console.log(`\nRegistration: ${workingRegs[0].registration}`);
    console.log(`Vehicle: ${workingRegs[0].make} ${workingRegs[0].model}`);
    console.log(`Year: ${workingRegs[0].year}`);
  } else {
    console.log('\n⚠️  No working registrations found.');
    console.log('The API requires real, registered UK vehicle numbers.');
  }
  
  console.log(`\n❌ FAILED: ${failedRegs.length}/${testRegistrations.length}`);
}

testVehicleRegistrations().catch(console.error);
