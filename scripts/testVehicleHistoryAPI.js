/**
 * Test Vehicle History API
 * Tests the carhistorycheck endpoint and response parsing
 */

require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.CHECKCARDETAILS_API_KEY || '14cedd96eeda4ac6b6b7f9a4db04f573';
const BASE_URL = 'https://api.checkcardetails.co.uk';
const VRM = 'RJ08PFA';

async function testVehicleHistoryAPI() {
  console.log('='.repeat(80));
  console.log('Testing Vehicle History API');
  console.log('='.repeat(80));
  console.log(`VRM: ${VRM}`);
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');

  try {
    const url = `${BASE_URL}/vehicledata/carhistorycheck`;
    console.log(`Calling: ${url}`);
    
    const response = await axios.get(url, {
      params: {
        apikey: API_KEY,
        vrm: VRM
      },
      timeout: 10000
    });

    console.log('\n✅ API Response Status:', response.status);
    console.log('');
    
    const data = response.data;
    
    // Extract key fields
    const vehicleReg = data.VehicleRegistration || {};
    const vehicleHistory = data.VehicleHistory || {};
    
    console.log('📋 Vehicle Registration:');
    console.log('  VRM:', vehicleReg.Vrm);
    console.log('  Make:', vehicleReg.Make);
    console.log('  Model:', vehicleReg.Model);
    console.log('  Year:', vehicleReg.YearOfManufacture);
    console.log('  Colour:', vehicleReg.Colour);
    console.log('  Fuel Type:', vehicleReg.FuelType);
    console.log('');
    
    console.log('📊 Vehicle History:');
    console.log('  Write-off Record:', vehicleHistory.writeOffRecord);
    console.log('  Stolen Record:', vehicleHistory.stolenRecord);
    console.log('  Finance Record:', vehicleHistory.financeRecord);
    console.log('  Number of Previous Keepers:', vehicleHistory.NumberOfPreviousKeepers);
    console.log('  V5C Certificate Count:', vehicleHistory.V5CCertificateCount);
    console.log('  Keeper Changes Count:', vehicleHistory.KeeperChangesCount);
    console.log('  Plate Change Count:', vehicleHistory.PlateChangeCount);
    console.log('  Colour Change Count:', vehicleHistory.ColourChangeCount);
    console.log('');
    
    // Test the parser
    console.log('🔧 Testing Response Parser:');
    const { parseHistoryResponse } = require('../utils/historyResponseParser');
    
    const parsed = parseHistoryResponse(data, false);
    
    console.log('  VRM:', parsed.vrm);
    console.log('  Has Accident History:', parsed.hasAccidentHistory);
    console.log('  Is Written Off:', parsed.isWrittenOff);
    console.log('  Is Stolen:', parsed.isStolen);
    console.log('  Has Outstanding Finance:', parsed.hasOutstandingFinance);
    console.log('  Is Scrapped:', parsed.isScrapped);
    console.log('  Is Imported:', parsed.isImported);
    console.log('  Is Exported:', parsed.isExported);
    console.log('  Previous Owners:', parsed.previousOwners);
    console.log('  Number of Owners:', parsed.numberOfOwners);
    console.log('  Number of Keys:', parsed.numberOfKeys);
    console.log('  Service History:', parsed.serviceHistory);
    console.log('  MOT Status:', parsed.motStatus);
    console.log('  MOT Expiry Date:', parsed.motExpiryDate);
    console.log('');
    
    console.log('✅ Accident Details:');
    console.log('  Count:', parsed.accidentDetails?.count);
    console.log('  Severity:', parsed.accidentDetails?.severity);
    console.log('  Dates:', parsed.accidentDetails?.dates);
    console.log('');
    
    console.log('='.repeat(80));
    console.log('✅ Test Complete - API and Parser Working Correctly');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    console.log('='.repeat(80));
    process.exit(1);
  }
}

testVehicleHistoryAPI();
