/**
 * Check LS70UAK MOT and History Data
 * Fetches from carhistorycheck endpoint
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

const VRM = 'LS70UAK';

async function checkMOTAndHistory() {
  try {
    console.log('🔍 Checking MOT & History for LS70UAK\n');
    console.log('=' .repeat(70));

    const client = new CheckCarDetailsClient();
    
    // Fetch history data (includes MOT)
    console.log('\n📡 Fetching from carhistorycheck endpoint...');
    console.log('   Cost: £1.82 (includes MOT, history, write-offs, etc.)\n');
    
    const rawData = await client.getVehicleHistory(VRM);
    const parsedData = client.parseResponse(rawData);

    console.log('✅ DATA RECEIVED:\n');
    console.log('=' .repeat(70));

    // MOT Data
    console.log('\n🔍 MOT DATA:');
    if (rawData.VehicleRegistration) {
      const reg = rawData.VehicleRegistration;
      console.log(`   MOT Expiry: ${reg.MotExpiryDate || reg.motExpiryDate || '❌ MISSING'}`);
      console.log(`   MOT Status: ${reg.MotStatus || reg.motStatus || '❌ MISSING'}`);
    }

    // Vehicle History
    console.log('\n📚 VEHICLE HISTORY:');
    if (rawData.VehicleHistory) {
      const history = rawData.VehicleHistory;
      console.log(`   Previous Owners: ${history.NumberOfPreviousKeepers ?? '❌ MISSING'}`);
      console.log(`   Write-off Record: ${history.writeOffRecord ? '⚠️ YES' : '✅ NO'}`);
      console.log(`   Stolen Record: ${history.stolenRecord ? '⚠️ YES' : '✅ NO'}`);
      console.log(`   Finance Record: ${history.financeRecord ? '⚠️ YES' : '✅ NO'}`);
      console.log(`   V5C Certificates: ${history.V5CCertificateCount || 0}`);
      console.log(`   Plate Changes: ${history.PlateChangeCount || 0}`);
      console.log(`   Colour Changes: ${history.ColourChangeCount || 0}`);
      
      if (history.financeRecord && history.finance) {
        console.log('\n   💰 FINANCE DETAILS:');
        history.finance.forEach((f, i) => {
          console.log(`      ${i + 1}. ${f.financecompany || 'Unknown'}`);
          console.log(`         Agreement: ${f.agreementnumber || 'N/A'}`);
          console.log(`         Type: ${f.agreementtype || 'N/A'}`);
        });
      }
    }

    // Parsed data
    console.log('\n📊 PARSED DATA:');
    console.log(`   Make: ${parsedData.make}`);
    console.log(`   Model: ${parsedData.model}`);
    console.log(`   Variant: ${parsedData.variant}`);
    console.log(`   Transmission: ${parsedData.transmission}`);
    console.log(`   Emission Class: ${parsedData.emissionClass}`);
    console.log(`   Urban MPG: ${parsedData.urbanMpg}`);
    console.log(`   Combined MPG: ${parsedData.combinedMpg}`);
    console.log(`   Annual Tax: £${parsedData.annualTax}`);

    console.log('\n\n✅ SUMMARY:');
    console.log('=' .repeat(70));
    console.log('✅ Running Costs: AVAILABLE (Urban MPG, Combined MPG, Tax)');
    console.log(`${rawData.VehicleRegistration?.MotExpiryDate ? '✅' : '❌'} MOT Due Date: ${rawData.VehicleRegistration?.MotExpiryDate || 'MISSING'}`);
    console.log(`${rawData.VehicleHistory ? '✅' : '❌'} Vehicle History: ${rawData.VehicleHistory ? 'AVAILABLE' : 'MISSING'}`);
    console.log(`   Previous Owners: ${rawData.VehicleHistory?.NumberOfPreviousKeepers ?? 'MISSING'}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

checkMOTAndHistory();
