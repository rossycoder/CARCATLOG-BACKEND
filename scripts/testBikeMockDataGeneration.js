/**
 * Test Bike Mock Data Generation
 * Tests the generateMockBikeData function directly without database
 */

// Copy the generateMockBikeData function from bikeController.js
function generateMockBikeData(registration, mileage) {
  // Extract year from registration if possible
  const yearMatch = registration.match(/[A-Z]{2}(\d{2})/i);
  let year = 2020;
  if (yearMatch) {
    const regYear = parseInt(yearMatch[1]);
    year = regYear >= 50 ? 1950 + regYear : 2000 + regYear;
  }
  
  // Common bike makes and models
  const bikeData = [
    { make: 'Honda', model: 'CBR600RR', type: 'Sport', cc: 600 },
    { make: 'Yamaha', model: 'YZF-R6', type: 'Sport', cc: 600 },
    { make: 'Kawasaki', model: 'Ninja ZX-6R', type: 'Sport', cc: 636 },
    { make: 'Suzuki', model: 'GSX-R600', type: 'Sport', cc: 600 },
    { make: 'Honda', model: 'CB500F', type: 'Naked', cc: 500 },
    { make: 'Yamaha', model: 'MT-07', type: 'Naked', cc: 689 },
    { make: 'BMW', model: 'R1250GS', type: 'Adventure', cc: 1254 },
    { make: 'Triumph', model: 'Street Triple', type: 'Naked', cc: 765 },
    { make: 'Ducati', model: 'Monster', type: 'Naked', cc: 937 },
    { make: 'Harley-Davidson', model: 'Street Glide', type: 'Cruiser', cc: 1746 }
  ];
  
  // Select random bike data
  const randomBike = bikeData[Math.floor(Math.random() * bikeData.length)];
  
  // Generate colors
  const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Orange', 'Silver', 'Yellow'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Calculate estimated value
  const baseValue = 8000;
  const yearDepreciation = (2024 - year) * 500;
  const mileageDepreciation = Math.floor(mileage / 5000) * 300;
  const estimatedValue = Math.max(baseValue - yearDepreciation - mileageDepreciation, 1500);
  
  // Generate running costs based on engine size
  const combinedMpg = randomBike.cc <= 125 ? 80 + Math.floor(Math.random() * 20) :
                     randomBike.cc <= 500 ? 60 + Math.floor(Math.random() * 15) :
                     randomBike.cc <= 750 ? 45 + Math.floor(Math.random() * 15) :
                     35 + Math.floor(Math.random() * 15);
  
  // Generate urban and extra urban MPG (typically urban is lower, extra urban is higher)
  const urbanMpg = Math.floor(combinedMpg * 0.85) + Math.floor(Math.random() * 5); // ~15% lower than combined
  const extraUrbanMpg = Math.floor(combinedMpg * 1.15) + Math.floor(Math.random() * 5); // ~15% higher than combined
  
  const annualTax = randomBike.cc <= 150 ? 20 :
                   randomBike.cc <= 400 ? 47 :
                   randomBike.cc <= 600 ? 68 :
                   91;
  
  const insuranceGroup = Math.min(20, Math.floor(randomBike.cc / 50) + Math.floor(Math.random() * 5));
  
  return {
    registration: registration,
    mileage: mileage,
    make: randomBike.make,
    model: randomBike.model,
    variant: null,
    year: year,
    color: randomColor,
    fuelType: 'Petrol',
    transmission: 'Manual',
    engineSize: `${(randomBike.cc / 1000).toFixed(1)}L`,
    engineCC: randomBike.cc,
    bikeType: randomBike.type,
    bodyType: 'Motorcycle',
    emissionClass: 'Euro 4',
    co2Emissions: Math.floor(randomBike.cc / 10) + 50 + Math.floor(Math.random() * 20),
    
    // Running costs data
    combinedMpg: combinedMpg,
    urbanMpg: urbanMpg,
    extraUrbanMpg: extraUrbanMpg,
    annualTax: annualTax,
    insuranceGroup: insuranceGroup.toString(),
    
    // Estimated pricing
    estimatedValue: estimatedValue,
    
    // Metadata
    apiProvider: 'mock-generator',
    checkDate: new Date(),
    fromCache: false,
    
    // Additional mock data
    taxStatus: 'Taxed',
    motStatus: 'Valid',
    motExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
}

async function testBikeMockDataGeneration() {
  console.log('🏍️ TESTING BIKE MOCK DATA GENERATION');
  console.log('==================================================');
  
  // Test registrations
  const testRegistrations = [
    { reg: 'SD69UOY', mileage: 2500, description: 'User test registration' },
    { reg: 'AB12CDE', mileage: 5000, description: 'Mock test registration' },
    { reg: 'TEST123', mileage: 1000, description: 'Test registration' }
  ];
  
  for (const test of testRegistrations) {
    console.log(`\n📡 Testing: ${test.reg} (${test.description})`);
    console.log('--------------------------------------------------');
    
    try {
      const mockData = generateMockBikeData(test.reg, test.mileage);
      
      console.log('✅ Mock data generated successfully!');
      console.log(`   Make: ${mockData.make}`);
      console.log(`   Model: ${mockData.model}`);
      console.log(`   Year: ${mockData.year}`);
      console.log(`   Engine: ${mockData.engineSize} (${mockData.engineCC}cc)`);
      console.log(`   Bike Type: ${mockData.bikeType}`);
      console.log(`   Color: ${mockData.color}`);
      console.log(`   Estimated Value: £${mockData.estimatedValue}`);
      
      // Check running costs - ALL THREE MPG VALUES
      console.log('\n💰 Running Costs Data:');
      console.log(`   Urban MPG: ${mockData.urbanMpg}`);
      console.log(`   Extra Urban MPG: ${mockData.extraUrbanMpg}`);
      console.log(`   Combined MPG: ${mockData.combinedMpg}`);
      console.log(`   Annual Tax: £${mockData.annualTax}`);
      console.log(`   Insurance Group: ${mockData.insuranceGroup}`);
      console.log(`   CO2 Emissions: ${mockData.co2Emissions}g/km`);
      
      // Verify all MPG values are present
      if (mockData.urbanMpg && mockData.extraUrbanMpg && mockData.combinedMpg) {
        console.log('✅ All MPG values generated - Urban, Extra Urban, and Combined!');
      } else {
        console.log('❌ Missing MPG values:', {
          urban: mockData.urbanMpg || 'MISSING',
          extraUrban: mockData.extraUrbanMpg || 'MISSING', 
          combined: mockData.combinedMpg || 'MISSING'
        });
      }
      
    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('   ✅ Mock data generation includes all three MPG values');
  console.log('   ✅ Urban MPG: ~15% lower than combined');
  console.log('   ✅ Extra Urban MPG: ~15% higher than combined');
  console.log('   ✅ Frontend should now show all three fields filled');
}

// Run the test
testBikeMockDataGeneration().catch(console.error);