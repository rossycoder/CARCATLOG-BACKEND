require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testHUM777A() {
  const vrm = 'HUM777A';
  
  console.log('='.repeat(80));
  console.log('Testing CheckCarDetails API for HUM777A');
  console.log('='.repeat(80));
  console.log('API_ENVIRONMENT:', process.env.API_ENVIRONMENT);
  console.log('CHECKCARD_API_KEY:', process.env.CHECKCARD_API_KEY ? `${process.env.CHECKCARD_API_KEY.substring(0, 8)}...` : 'NOT SET');
  console.log('CHECKCARD_API_TEST_KEY:', process.env.CHECKCARD_API_TEST_KEY ? `${process.env.CHECKCARD_API_TEST_KEY.substring(0, 8)}...` : 'NOT SET');
  console.log('='.repeat(80));
  
  try {
    // Get raw API response
    const rawResponse = await CheckCarDetailsClient.getVehicleSpecs(vrm);
    
    console.log('\n📦 RAW API RESPONSE:');
    console.log(JSON.stringify(rawResponse, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('CHECKING SPECIFIC FIELDS:');
    console.log('='.repeat(80));
    
    // Check for color/colour
    console.log('\n🎨 COLOR/COLOUR:');
    console.log('  VehicleIdentification.DvlaColour:', rawResponse.VehicleIdentification?.DvlaColour);
    console.log('  SmmtDetails.Colour:', rawResponse.SmmtDetails?.Colour);
    console.log('  ModelData.Colour:', rawResponse.ModelData?.Colour);
    console.log('  Colour:', rawResponse.Colour);
    
    // Check for body type
    console.log('\n🚗 BODY TYPE:');
    console.log('  VehicleIdentification.DvlaBodyType:', rawResponse.VehicleIdentification?.DvlaBodyType);
    console.log('  SmmtDetails.BodyType:', rawResponse.SmmtDetails?.BodyType);
    console.log('  ModelData.BodyType:', rawResponse.ModelData?.BodyType);
    console.log('  BodyType:', rawResponse.BodyType);
    console.log('  VehicleIdentification.DvlaTypeApproval:', rawResponse.VehicleIdentification?.DvlaTypeApproval);
    
    // Check for doors
    console.log('\n🚪 DOORS:');
    console.log('  SmmtDetails.Doors:', rawResponse.SmmtDetails?.Doors);
    console.log('  ModelData.Doors:', rawResponse.ModelData?.Doors);
    console.log('  Doors:', rawResponse.Doors);
    
    // Check for previous owners
    console.log('\n👥 PREVIOUS OWNERS:');
    console.log('  VehicleHistory.PreviousOwners:', rawResponse.VehicleHistory?.PreviousOwners);
    console.log('  PreviousOwners:', rawResponse.PreviousOwners);
    console.log('  NumberOfPreviousOwners:', rawResponse.NumberOfPreviousOwners);
    
    // Now test parsed response
    console.log('\n' + '='.repeat(80));
    console.log('PARSED RESPONSE:');
    console.log('='.repeat(80));
    
    const parsedData = await CheckCarDetailsClient.getVehicleData(vrm);
    console.log(JSON.stringify(parsedData, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testHUM777A();
