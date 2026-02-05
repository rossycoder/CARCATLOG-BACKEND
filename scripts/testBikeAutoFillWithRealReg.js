/**
 * Test bike auto-fill functionality with REAL registration number
 * This script creates localStorage data with a real registration that works with the API
 */

console.log('🏍️ BIKE AUTO-FILL TEST WITH REAL REGISTRATION');
console.log('='.repeat(60));
console.log('');

// Real registration that works with our API
const REAL_REGISTRATION = 'EX09MYY'; // This is a real Honda registration

const testBikeAdvert = {
  id: 'test-bike-real-reg',
  vehicleData: {
    registration: REAL_REGISTRATION,
    make: 'HONDA',
    model: 'CBR600RR', // Sport bike
    year: 2009,
    mileage: 25000,
    color: 'RED',
    fuelType: 'Petrol',
    engineSize: '0.6L',
    engineCC: 600,
    bikeType: 'Sports',
    estimatedValue: 4500,
    motDue: '2025-03-15'
  },
  advertData: {
    price: '4500',
    description: 'Test bike for running costs auto-fill with real registration',
    photos: [],
    contactPhone: '07123456789',
    contactEmail: 'test@example.com',
    location: 'London',
    features: ['ABS', 'LED Headlights', 'Quick Shifter'],
    runningCosts: {
      fuelEconomy: { urban: '', extraUrban: '', combined: '' }, // Empty - should auto-fill
      annualTax: '', // Empty - should auto-fill
      insuranceGroup: '', // Empty - should auto-fill
      co2Emissions: '' // Empty - should auto-fill
    },
    videoUrl: ''
  },
  status: 'draft',
  updatedAt: new Date().toISOString()
};

console.log('📋 STEP-BY-STEP INSTRUCTIONS:');
console.log('');
console.log('1. 🌐 Open your browser and go to your bike selling page');
console.log('2. 🔧 Open DevTools (F12)');
console.log('3. 📁 Go to Application/Storage > Local Storage');
console.log('4. ➕ Click "Add new item" or right-click and select "Add"');
console.log('5. 🔑 Set Key: bikeAdvert_test-bike-real-reg');
console.log('6. 📄 Copy and paste the JSON below as Value:');
console.log('');
console.log('JSON DATA TO COPY:');
console.log('-'.repeat(40));
console.log(JSON.stringify(testBikeAdvert, null, 2));
console.log('-'.repeat(40));
console.log('');
console.log('7. 💾 Save the localStorage item');
console.log('8. 🚀 Navigate to: /bikes/selling/advert/edit/test-bike-real-reg');
console.log('9. ✨ Watch the running costs auto-fill from API!');
console.log('');
console.log('🎯 EXPECTED AUTO-FILL RESULTS:');
console.log('   Registration: EX09MYY (REAL Honda)');
console.log('   Combined MPG: Should auto-fill from API');
console.log('   Annual Tax: Should auto-fill from API');
console.log('   CO2 Emissions: Should auto-fill from API');
console.log('   Insurance Group: May or may not auto-fill');
console.log('');
console.log('🔍 DEBUGGING:');
console.log('   - Check browser console for API calls');
console.log('   - Look for "🔍 Looking up bike: EX09MYY" message');
console.log('   - Should see "✅ Bike lookup successful" if working');
console.log('   - Running costs section should expand automatically');
console.log('');
console.log('❌ IF STILL GETTING 404:');
console.log('   - Make sure backend server is running on localhost:5000');
console.log('   - Check that bike routes are properly configured');
console.log('   - Verify API credentials are set in backend/.env');
console.log('');
console.log('🚨 IMPORTANT: Use REAL registration EX09MYY, not fake MT09ABC!');