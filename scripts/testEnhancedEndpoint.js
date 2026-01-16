const axios = require('axios');

async function testEnhancedEndpoint() {
    try {
        console.log('='.repeat(60));
        console.log('Testing Enhanced DVLA Lookup Endpoint');
        console.log('='.repeat(60));
        
        const API_URL = 'http://localhost:5000/api';
        const testVRM = 'HUM777A';
        
        console.log(`\n🚗 Testing with VRM: ${testVRM}`);
        console.log('-'.repeat(60));
        
        const response = await axios.post(`${API_URL}/vehicles/dvla-lookup`, {
            registrationNumber: testVRM,
            mileage: 5000
        });
        
        console.log('\n📊 RESPONSE DATA:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            const data = response.data.data;
            console.log('\n✅ SUCCESS! Extracted Data:');
            console.log('-'.repeat(60));
            console.log('Make:', data.make);
            console.log('Model:', data.model);
            console.log('Year:', data.yearOfManufacture);
            console.log('Previous Owners:', data.previousOwners);
            console.log('Colour:', data.colour);
            console.log('Fuel Type:', data.fuelType);
            console.log('\n📡 Data Sources:');
            console.log('DVLA:', data._sources?.dvla ? '✓' : '✗');
            console.log('CheckCarDetails:', data._sources?.checkCarDetails ? '✓' : '✗');
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testEnhancedEndpoint();
