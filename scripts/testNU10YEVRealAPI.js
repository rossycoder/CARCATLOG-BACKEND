require('dotenv').config();
const axios = require('axios');

async function testRealAPI() {
  try {
    const vrm = 'NU10YEV';
    const apiKey = process.env.CHECKCARD_API_KEY;
    const baseUrl = process.env.CHECKCARD_API_BASE_URL;
    
    console.log('=== Testing Real CheckCarDetails API ===');
    console.log(`VRM: ${vrm}`);
    console.log(`API Key: ${apiKey.substring(0, 8)}...`);
    console.log(`Base URL: ${baseUrl}\n`);
    
    const url = `${baseUrl}/vehicledata/carhistorycheck?apikey=${apiKey}&vrm=${vrm}`;
    console.log(`Calling: ${url}\n`);
    
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CarCatalog/1.0'
      }
    });
    
    console.log('=== API Response ===');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Extract keeper information
    const vehicleHistory = response.data.VehicleHistory || {};
    console.log('\n=== Keeper Information ===');
    console.log('NumberOfPreviousKeepers:', vehicleHistory.NumberOfPreviousKeepers);
    console.log('V5CCertificateCount:', vehicleHistory.V5CCertificateCount);
    console.log('PlateChangeCount:', vehicleHistory.PlateChangeCount);
    console.log('ColourChangeCount:', vehicleHistory.ColourChangeCount);
    console.log('VicCount:', vehicleHistory.VicCount);
    
    if (vehicleHistory.KeeperChangesList) {
      console.log('\n=== Keeper Changes List ===');
      console.log(JSON.stringify(vehicleHistory.KeeperChangesList, null, 2));
    }
    
    if (vehicleHistory.V5CCertificateList) {
      console.log('\n=== V5C Certificate List ===');
      console.log(JSON.stringify(vehicleHistory.V5CCertificateList, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRealAPI();
