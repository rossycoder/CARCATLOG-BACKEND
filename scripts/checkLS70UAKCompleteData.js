/**
 * Check LS70UAK Complete Data
 * Shows what data is available from CheckCarDetails API
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

const VRM = 'LS70UAK';

async function checkCompleteData() {
  try {
    console.log('🔍 Checking Complete Data for LS70UAK\n');
    console.log('=' .repeat(70));

    const client = new CheckCarDetailsClient();
    
    // Fetch complete data
    console.log('\n📡 Fetching data from CheckCarDetails API...\n');
    const rawData = await client.getUKVehicleData(VRM);
    const parsedData = client.parseResponse(rawData);

    // Display all data
    console.log('✅ DATA AVAILABLE FROM API:\n');
    console.log('=' .repeat(70));
    
    console.log('\n📋 BASIC INFO:');
    console.log(`   Make: ${parsedData.make || '❌ MISSING'}`);
    console.log(`   Model: ${parsedData.model || '❌ MISSING'}`);
    console.log(`   Variant: ${parsedData.variant || '❌ MISSING'}`);
    console.log(`   Year: ${parsedData.year || '❌ MISSING'}`);
    console.log(`   Body Type: ${parsedData.bodyType || '❌ MISSING'}`);
    
    console.log('\n🔧 SPECIFICATIONS:');
    console.log(`   Engine Size: ${parsedData.engineSize ? parsedData.engineSize + 'L' : '❌ MISSING'}`);
    console.log(`   Transmission: ${parsedData.transmission || '❌ MISSING'}`);
    console.log(`   Fuel Type: ${parsedData.fuelType || '❌ MISSING'}`);
    console.log(`   Doors: ${parsedData.doors || '❌ MISSING'}`);
    console.log(`   Seats: ${parsedData.seats || '❌ MISSING'}`);
    console.log(`   Emission Class: ${parsedData.emissionClass || '❌ MISSING'}`);
    
    console.log('\n💰 RUNNING COSTS:');
    console.log(`   Urban MPG: ${parsedData.urbanMpg || '❌ MISSING'}`);
    console.log(`   Extra Urban MPG: ${parsedData.extraUrbanMpg || '❌ MISSING'}`);
    console.log(`   Combined MPG: ${parsedData.combinedMpg || '❌ MISSING'}`);
    console.log(`   Annual Tax: ${parsedData.annualTax ? '£' + parsedData.annualTax : '❌ MISSING'}`);
    console.log(`   Insurance Group: ${parsedData.insuranceGroup || '❌ MISSING'}`);
    console.log(`   CO2 Emissions: ${parsedData.co2Emissions ? parsedData.co2Emissions + 'g/km' : '❌ MISSING'}`);

    // Check MOT data from raw response
    console.log('\n🔍 MOT DATA (from raw API):');
    if (rawData.VehicleRegistration) {
      const motExpiry = rawData.VehicleRegistration.MotExpiryDate || 
                       rawData.VehicleRegistration.motExpiryDate ||
                       rawData.VehicleRegistration.MotDueDate;
      console.log(`   MOT Expiry: ${motExpiry || '❌ NOT IN UKVEHICLEDATA'}`);
    }

    // Check if we need separate MOT API call
    console.log('\n📞 Checking if MOT data needs separate API call...');
    console.log('   Note: MOT data usually comes from separate "mot" endpoint (£0.02)');
    console.log('   Or from "carhistorycheck" endpoint (£1.82)');

    // Check vehicle history data
    console.log('\n📚 VEHICLE HISTORY (from ukvehicledata):');
    if (rawData.VehicleHistory) {
      const history = rawData.VehicleHistory;
      console.log(`   Previous Owners: ${history.NumberOfPreviousKeepers || '❌ MISSING'}`);
      console.log(`   Write-off Record: ${history.writeOffRecord ? '⚠️ YES' : '✅ NO'}`);
      console.log(`   Stolen Record: ${history.stolenRecord ? '⚠️ YES' : '✅ NO'}`);
      console.log(`   Finance Record: ${history.financeRecord ? '⚠️ YES' : '✅ NO'}`);
      console.log(`   V5C Certificates: ${history.V5CCertificateCount || 0}`);
      console.log(`   Plate Changes: ${history.PlateChangeCount || 0}`);
      console.log(`   Colour Changes: ${history.ColourChangeCount || 0}`);
    } else {
      console.log('   ❌ Vehicle history not in ukvehicledata response');
      console.log('   Note: Need to call "carhistorycheck" endpoint separately');
    }

    console.log('\n\n📊 DATA COMPLETENESS:');
    console.log('=' .repeat(70));
    
    const fields = {
      'Variant': parsedData.variant,
      'Engine Size': parsedData.engineSize,
      'Transmission': parsedData.transmission,
      'Doors': parsedData.doors,
      'Seats': parsedData.seats,
      'Emission Class': parsedData.emissionClass,
      'Urban MPG': parsedData.urbanMpg,
      'Combined MPG': parsedData.combinedMpg,
      'Annual Tax': parsedData.annualTax,
      'CO2 Emissions': parsedData.co2Emissions
    };

    let complete = 0;
    Object.entries(fields).forEach(([name, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`   ${status} ${name}: ${value || 'MISSING'}`);
      if (value) complete++;
    });

    const percentage = Math.round((complete / Object.keys(fields).length) * 100);
    console.log(`\n   Completeness: ${complete}/${Object.keys(fields).length} (${percentage}%)`);

    if (percentage >= 90) {
      console.log('\n   🎉 EXCELLENT! Data is very complete');
    } else if (percentage >= 70) {
      console.log('\n   ⚠️  GOOD but some fields missing');
    } else {
      console.log('\n   ❌ POOR - Many fields missing');
    }

    console.log('\n\n💡 RECOMMENDATION:');
    console.log('=' .repeat(70));
    if (percentage >= 90) {
      console.log('✅ This data is ready to save to database');
      console.log('✅ Running costs will display properly');
      console.log('✅ All specifications are complete');
    } else {
      console.log('⚠️  Some data is missing from ukvehicledata endpoint');
      console.log('💡 May need to call additional endpoints:');
      console.log('   - "mot" endpoint for MOT history (£0.02)');
      console.log('   - "carhistorycheck" for complete history (£1.82)');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

checkCompleteData();
