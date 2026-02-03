require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testVN73ETRFixedParsing() {
  try {
    const registration = 'VN73ETR';
    console.log(`🧪 Testing fixed parsing logic for: ${registration}`);
    console.log('=====================================');

    // Test the complete getVehicleData method which uses our fixed parsing
    console.log('\n📡 Calling getVehicleData with fixed parsing...');
    
    const vehicleData = await CheckCarDetailsClient.getVehicleData(registration);
    
    if (vehicleData) {
      console.log('✅ Vehicle data received with fixed parsing:');
      console.log(`   Make: "${vehicleData.make}"`);
      console.log(`   Model: "${vehicleData.model}"`);
      console.log(`   Body Type: "${vehicleData.bodyType}" ${vehicleData.bodyType === 'SUV' ? '✅' : '❌'}`);
      console.log(`   Fuel Type: "${vehicleData.fuelType}"`);
      console.log(`   Engine Size: "${vehicleData.engineSize}"`);
      console.log(`   Year: ${vehicleData.year}`);
      console.log(`   Transmission: "${vehicleData.transmission}"`);
      console.log(`   Doors: ${vehicleData.doors}`);
      console.log(`   Seats: ${vehicleData.seats}`);
      console.log(`   Variant: "${vehicleData.variant || 'Not set'}"`);
      console.log(`   Color: "${vehicleData.color || 'Not set'}"`);
      
      // Check if the fix worked
      if (vehicleData.bodyType === 'SUV') {
        console.log('\n🎉 SUCCESS! Body type is now correctly showing as SUV');
        console.log('   Frontend will now display the correct body type');
      } else {
        console.log('\n❌ FAILED! Body type is still incorrect');
        console.log(`   Expected: "SUV", Got: "${vehicleData.bodyType}"`);
      }
      
      // Also check fuel type
      if (vehicleData.fuelType && vehicleData.fuelType.toLowerCase().includes('hybrid')) {
        console.log('✅ Fuel type correctly shows hybrid');
      } else {
        console.log(`⚠️  Fuel type: "${vehicleData.fuelType}" - may need review`);
      }
      
    } else {
      console.log('❌ No vehicle data received');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  }
}

testVN73ETRFixedParsing();