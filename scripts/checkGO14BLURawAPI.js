const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');

async function checkGO14BLURawAPI() {
  try {
    console.log('=== CHECKING GO14BLU RAW API RESPONSES ===\n');

    const baseURL = process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk';
    const apiKey = process.env.CHECKCARD_API_KEY;
    const vrm = 'GO14BLU';

    console.log(`Base URL: ${baseURL}`);
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'NOT SET'}`);
    console.log(`VRM: ${vrm}\n`);

    // Test different endpoints
    const endpoints = [
      'ukvehicledata',
      'Vehiclespecs', 
      'vehiclevaluation',
      'mot',
      'carhistorycheck'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`--- Testing ${endpoint} endpoint ---`);
        const url = `${baseURL}/vehicledata/${endpoint}`;
        
        console.log(`URL: ${url}?vrm=${vrm}`);
        
        const response = await axios.get(url, {
          params: {
            apikey: apiKey,
            vrm: vrm
          },
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        console.log(`Response data:`, JSON.stringify(response.data, null, 2));
        console.log('');

      } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.response?.status || error.code} - ${error.message}`);
        if (error.response?.data) {
          console.log(`Error data:`, JSON.stringify(error.response.data, null, 2));
        }
        console.log('');
      }
    }

    // Also test with a known working VRM for comparison
    console.log('=== TESTING WITH KNOWN WORKING VRM (BG22UCP) ===\n');
    
    const workingVRM = 'BG22UCP';
    
    for (const endpoint of ['ukvehicledata', 'Vehiclespecs']) {
      try {
        console.log(`--- Testing ${endpoint} with ${workingVRM} ---`);
        const url = `${baseURL}/vehicledata/${endpoint}`;
        
        const response = await axios.get(url, {
          params: {
            apikey: apiKey,
            vrm: workingVRM
          },
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        console.log(`Response keys:`, Object.keys(response.data));
        console.log('Sample data:', {
          make: response.data.make,
          model: response.data.model,
          variant: response.data.variant,
          fuelType: response.data.fuelType,
          engineSize: response.data.engineSize
        });
        console.log('');

      } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.response?.status || error.code} - ${error.message}`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkGO14BLURawAPI();