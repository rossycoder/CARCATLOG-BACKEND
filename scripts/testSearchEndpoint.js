const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testSearchEndpoint() {
  console.log('Testing /vehicles/search endpoint...\n');

  try {
    // Test 1: Search with no filters (should return all active cars)
    console.log('Test 1: Search with no filters');
    const response1 = await axios.get(`${API_URL}/vehicles/search`);
    console.log('✓ Success:', response1.data.total, 'cars found');
    console.log('Sample car:', response1.data.cars[0]?.make, response1.data.cars[0]?.model);
    console.log('');

    // Test 2: Search with mileage filter
    console.log('Test 2: Search with mileage filter (mileageTo=50000)');
    const response2 = await axios.get(`${API_URL}/vehicles/search?mileageTo=50000`);
    console.log('✓ Success:', response2.data.total, 'cars found');
    console.log('Sample mileages:', response2.data.cars.slice(0, 3).map(c => c.mileage));
    console.log('');

    // Test 3: Search with make filter
    console.log('Test 3: Search with make filter (make=BMW)');
    const response3 = await axios.get(`${API_URL}/vehicles/search?make=BMW`);
    console.log('✓ Success:', response3.data.total, 'cars found');
    console.log('Makes:', [...new Set(response3.data.cars.map(c => c.make))]);
    console.log('');

    // Test 4: Search with price range
    console.log('Test 4: Search with price range (priceFrom=10000&priceTo=20000)');
    const response4 = await axios.get(`${API_URL}/vehicles/search?priceFrom=10000&priceTo=20000`);
    console.log('✓ Success:', response4.data.total, 'cars found');
    console.log('Sample prices:', response4.data.cars.slice(0, 3).map(c => c.price));
    console.log('');

    // Test 5: Search with multiple filters
    console.log('Test 5: Search with multiple filters (make=Audi&fuelType=Diesel&mileageTo=60000)');
    const response5 = await axios.get(`${API_URL}/vehicles/search?make=Audi&fuelType=Diesel&mileageTo=60000`);
    console.log('✓ Success:', response5.data.total, 'cars found');
    if (response5.data.cars.length > 0) {
      console.log('Sample car:', response5.data.cars[0].make, response5.data.cars[0].fuelType, response5.data.cars[0].mileage);
    }
    console.log('');

    console.log('All tests passed! ✓');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testSearchEndpoint();
