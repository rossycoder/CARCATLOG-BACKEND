/**
 * Create a test bike advert with real registration for testing auto-fill
 */

const testBikeAdvert = {
  id: 'test-bike-123',
  vehicleData: {
    registration: 'EX09MYY', // Real registration that works with API
    make: 'HONDA',
    model: 'Civic',
    year: 2009,
    mileage: 50000,
    color: 'BLACK',
    fuelType: 'Petrol',
    engineSize: '1.3L',
    engineCC: 1300,
    bikeType: 'Sport',
    estimatedValue: 500
  },
  advertData: {
    price: '500',
    description: 'Test bike for running costs auto-fill',
    photos: [],
    contactPhone: '07123456789',
    contactEmail: 'test@example.com',
    location: 'London',
    features: ['ABS', 'LED Headlights'],
    runningCosts: {
      fuelEconomy: { urban: '', extraUrban: '', combined: '' },
      annualTax: '',
      insuranceGroup: '',
      co2Emissions: ''
    },
    videoUrl: ''
  },
  status: 'draft',
  updatedAt: new Date().toISOString()
};

console.log('🏍️ Test Bike Advert Data for localStorage:');
console.log('='.repeat(50));
console.log('Copy this to browser localStorage:');
console.log('');
console.log('Key: bikeAdvert_test-bike-123');
console.log('Value:');
console.log(JSON.stringify(testBikeAdvert, null, 2));
console.log('');
console.log('📋 Instructions:');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Application/Storage > Local Storage');
console.log('3. Add new item with key: bikeAdvert_test-bike-123');
console.log('4. Paste the JSON value above');
console.log('5. Navigate to: /bikes/selling/advert/edit/test-bike-123');
console.log('6. Running costs should auto-fill from API!');
console.log('');
console.log('Expected auto-fill data:');
console.log('- Combined MPG: 47.9');
console.log('- Annual Tax: £195');
console.log('- CO2 Emissions: 135 g/km');
console.log('- Insurance Group: (may be empty)');