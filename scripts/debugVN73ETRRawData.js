require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function debugVN73ETRRawData() {
  try {
    const registration = 'VN73ETR';
    console.log(`🔍 Debugging raw API data for: ${registration}`);
    console.log('=====================================');

    // 1. Get raw DVLA data
    console.log('\n1️⃣ Raw DVLA Data (UKVehicleData):');
    try {
      const rawDvlaData = await CheckCarDetailsClient.getUKVehicleData(registration);
      console.log('✅ Raw DVLA response received');
      
      // Look for body type fields
      console.log('\n🔍 Body Type Fields in DVLA Data:');
      if (rawDvlaData.VehicleRegistration) {
        console.log(`   VehicleRegistration.BodyType: "${rawDvlaData.VehicleRegistration.BodyType}"`);
        console.log(`   VehicleRegistration.VehicleClass: "${rawDvlaData.VehicleRegistration.VehicleClass}"`);
      }
      if (rawDvlaData.VehicleIdentification) {
        console.log(`   VehicleIdentification.DvlaBodyType: "${rawDvlaData.VehicleIdentification.DvlaBodyType}"`);
      }
      
      // Look for fuel type fields
      console.log('\n⛽ Fuel Type Fields in DVLA Data:');
      if (rawDvlaData.VehicleRegistration) {
        console.log(`   VehicleRegistration.FuelType: "${rawDvlaData.VehicleRegistration.FuelType}"`);
      }
      if (rawDvlaData.VehicleIdentification) {
        console.log(`   VehicleIdentification.DvlaFuelType: "${rawDvlaData.VehicleIdentification.DvlaFuelType}"`);
      }
      
      console.log('\n📄 Full DVLA Structure:');
      console.log(JSON.stringify(rawDvlaData, null, 2));
      
    } catch (dvlaError) {
      console.log('❌ DVLA API error:', dvlaError.message);
    }

    // 2. Get raw Specs data
    console.log('\n\n2️⃣ Raw Specs Data (Vehiclespecs):');
    try {
      const rawSpecsData = await CheckCarDetailsClient.getVehicleSpecs(registration);
      console.log('✅ Raw Specs response received');
      
      // Look for body type fields
      console.log('\n🔍 Body Type Fields in Specs Data:');
      if (rawSpecsData.VehicleIdentification) {
        console.log(`   VehicleIdentification.DvlaBodyType: "${rawSpecsData.VehicleIdentification.DvlaBodyType}"`);
      }
      if (rawSpecsData.BodyDetails) {
        console.log(`   BodyDetails.BodyStyle: "${rawSpecsData.BodyDetails.BodyStyle}"`);
        console.log(`   BodyDetails.BodyShape: "${rawSpecsData.BodyDetails.BodyShape}"`);
      }
      if (rawSpecsData.SmmtDetails) {
        console.log(`   SmmtDetails.BodyStyle: "${rawSpecsData.SmmtDetails.BodyStyle}"`);
      }
      
      // Look for fuel type fields
      console.log('\n⛽ Fuel Type Fields in Specs Data:');
      if (rawSpecsData.VehicleIdentification) {
        console.log(`   VehicleIdentification.DvlaFuelType: "${rawSpecsData.VehicleIdentification.DvlaFuelType}"`);
      }
      if (rawSpecsData.ModelData) {
        console.log(`   ModelData.FuelType: "${rawSpecsData.ModelData.FuelType}"`);
      }
      if (rawSpecsData.SmmtDetails) {
        console.log(`   SmmtDetails.FuelType: "${rawSpecsData.SmmtDetails.FuelType}"`);
      }
      
      console.log('\n📄 Full Specs Structure:');
      console.log(JSON.stringify(rawSpecsData, null, 2));
      
    } catch (specsError) {
      console.log('❌ Specs API error:', specsError.message);
    }

    // 3. Show how our parser would handle this
    console.log('\n\n3️⃣ Parser Logic Analysis:');
    console.log('=====================================');
    
    console.log('\n🔧 Our parsing priority for bodyType:');
    console.log('   1. vehicleId.DvlaBodyType (from VehicleIdentification)');
    console.log('   2. bodyDetails.BodyStyle (from BodyDetails)');
    console.log('   3. smmtDetails.BodyStyle (from SmmtDetails)');
    console.log('   4. data.BodyType (fallback)');
    
    console.log('\n🔧 Our parsing priority for fuelType:');
    console.log('   1. vehicleId.DvlaFuelType (from VehicleIdentification)');
    console.log('   2. modelData.FuelType (from ModelData)');
    console.log('   3. smmtDetails.FuelType (from SmmtDetails)');
    console.log('   4. data.FuelType (fallback)');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  }
}

debugVN73ETRRawData();