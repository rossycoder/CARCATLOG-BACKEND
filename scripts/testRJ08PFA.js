/**
 * Test script to check RJ08PFA vehicle history API response
 */

const axios = require('axios');

async function testVehicleHistory() {
  const vrm = 'RJ08PFA';
  const apiKey = '14cedd96eeda4ac6b6b7f9a4db04f573';
  const baseUrl = 'https://api.checkcardetails.co.uk';
  
  try {
    console.log(`\n🔍 Testing Vehicle History API for VRM: ${vrm}`);
    console.log(`📡 Endpoint: ${baseUrl}/vehicledata/carhistorycheck`);
    console.log('='.repeat(80));
    
    const response = await axios.get(
      `${baseUrl}/vehicledata/carhistorycheck`,
      {
        params: {
          apikey: apiKey,
          vrm: vrm
        },
        timeout: 10000
      }
    );
    
    console.log('\n✅ API Response Status:', response.status);
    console.log('\n📦 Full Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Parse the response
    const vehicleReg = response.data.VehicleRegistration || {};
    const vehicleHistory = response.data.VehicleHistory || {};
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 PARSED DATA:');
    console.log('='.repeat(80));
    
    console.log('\n🚗 Vehicle Registration:');
    console.log('  VRM:', vehicleReg.Vrm);
    console.log('  Make:', vehicleReg.Make);
    console.log('  Model:', vehicleReg.Model);
    console.log('  Colour:', vehicleReg.Colour);
    console.log('  Year:', vehicleReg.YearOfManufacture);
    console.log('  Scrapped:', vehicleReg.Scrapped);
    console.log('  Imported:', vehicleReg.Imported);
    console.log('  Exported:', vehicleReg.Exported);
    
    console.log('\n📋 Vehicle History:');
    console.log('  Previous Keepers:', vehicleHistory.NumberOfPreviousKeepers);
    console.log('  Stolen Record:', vehicleHistory.stolenRecord);
    console.log('  Finance Record:', vehicleHistory.financeRecord);
    console.log('  Write-off Record:', vehicleHistory.writeOffRecord);
    
    if (vehicleHistory.writeOffRecord && vehicleHistory.writeoff) {
      console.log('\n⚠️  WRITE-OFF DETAILS:');
      const writeoff = Array.isArray(vehicleHistory.writeoff) 
        ? vehicleHistory.writeoff[0] 
        : vehicleHistory.writeoff;
      console.log('  Status:', writeoff.status);
      console.log('  Category:', writeoff.category);
      console.log('  Loss Date:', writeoff.lossdate);
      console.log('  Miaftr:', writeoff.miaftr);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testVehicleHistory();
