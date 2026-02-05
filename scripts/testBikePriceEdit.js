/**
 * Test bike price editing functionality
 * This script creates localStorage data to test the price editing feature
 */

console.log('🏍️ BIKE PRICE EDITING TEST');
console.log('='.repeat(50));
console.log('');

const testBikeAdvert = {
  id: 'test-bike-price-edit',
  vehicleData: {
    registration: 'MT09ABC',
    make: 'YAMAHA',
    model: 'MT-09',
    year: 2020,
    mileage: 15000,
    color: 'BLUE',
    fuelType: 'Petrol',
    engineSize: '0.9L',
    engineCC: 900,
    bikeType: 'Naked',
    estimatedValue: 7500,
    motDue: '2025-06-15'
  },
  advertData: {
    price: '7500', // Initial price
    description: 'Test bike for price editing functionality',
    photos: [],
    contactPhone: '07123456789',
    contactEmail: 'test@example.com',
    location: 'London',
    features: ['ABS', 'LED Headlights'],
    runningCosts: {
      fuelEconomy: { urban: '45', extraUrban: '65', combined: '55' },
      annualTax: '150',
      insuranceGroup: '12',
      co2Emissions: '120'
    },
    videoUrl: ''
  },
  status: 'draft',
  updatedAt: new Date().toISOString()
};

console.log('📋 TESTING INSTRUCTIONS:');
console.log('');
console.log('1. 🌐 Open your browser and go to your bike selling page');
console.log('2. 🔧 Open DevTools (F12)');
console.log('3. 📁 Go to Application/Storage > Local Storage');
console.log('4. ➕ Add new item with key: bikeAdvert_test-bike-price-edit');
console.log('5. 📄 Copy and paste the JSON below as Value:');
console.log('');
console.log('JSON DATA TO COPY:');
console.log('-'.repeat(40));
console.log(JSON.stringify(testBikeAdvert, null, 2));
console.log('-'.repeat(40));
console.log('');
console.log('6. 💾 Save the localStorage item');
console.log('7. 🚀 Navigate to: /bikes/selling/advert/edit/test-bike-price-edit');
console.log('8. ✨ Test the price editing functionality!');
console.log('');
console.log('🎯 EXPECTED BEHAVIOR:');
console.log('   - Price should display as "£7,500" with "Edit price" button');
console.log('   - Click "Edit price" button to enter edit mode');
console.log('   - Input field should appear with Save/Cancel buttons');
console.log('   - Change price and click Save to save to localStorage');
console.log('   - Click Cancel to revert to original price');
console.log('   - Price should update in display mode after saving');
console.log('');
console.log('🔍 DEBUGGING:');
console.log('   - Check browser console for "🖱️ Edit price button clicked!" message');
console.log('   - Look for "💰 Saving bike price: [amount]" when saving');
console.log('   - Should see "✅ Bike price saved successfully to localStorage"');
console.log('   - Verify localStorage is updated with new price');
console.log('');
console.log('✅ FEATURES TO TEST:');
console.log('   - Edit price button functionality');
console.log('   - Price input validation (negative/zero values)');
console.log('   - Save button saves to localStorage');
console.log('   - Cancel button reverts changes');
console.log('   - Price display updates after save');
console.log('   - Error handling for invalid prices');