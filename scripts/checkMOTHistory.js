/**
 * Check MOT history for HUM777A to get additional vehicle details
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');

const VRM = 'HUM777A';

async function checkMOT() {
  try {
    console.log('Checking MOT history for:', VRM);
    console.log('='.repeat(80));

    const response = await axios.get(`https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests`, {
      params: {
        registration: VRM
      },
      headers: {
        'x-api-key': process.env.MOT_API_KEY || process.env.DVLA_API_KEY,
        'Accept': 'application/json+v6'
      }
    });

    console.log('\nMOT History Response:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data && response.data[0]) {
      const vehicle = response.data[0];
      console.log('\n' + '='.repeat(80));
      console.log('Vehicle Details from MOT:');
      console.log('='.repeat(80));
      console.log('Make:', vehicle.make);
      console.log('Model:', vehicle.model);
      console.log('Colour:', vehicle.primaryColour);
      console.log('Fuel Type:', vehicle.fuelType);
      console.log('Engine Size:', vehicle.engineSize, 'cc');
      console.log('First Used Date:', vehicle.firstUsedDate);
      console.log('Registration Date:', vehicle.registrationDate);
      console.log('Manufacturing Year:', vehicle.manufactureYear);
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

checkMOT();
