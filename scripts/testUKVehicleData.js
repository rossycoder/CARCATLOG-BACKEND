require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testUKVehicleData() {
  const vrm = 'HUM777A';
  
  console.log('='.repeat(80));
  console.log('Testing CheckCarDetails ukvehicledata endpoint for HUM777A');
  console.log('='.repeat(80));
  
  try {
    // Get UK Vehicle Data (different from Vehiclespecs)
    const ukVehicleData = await CheckCarDetailsClient.getUKVehicleData(vrm);
    
    console.log('\n📦 UK VEHICLE DATA RESPONSE:');
    console.log(JSON.stringify(ukVehicleData, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('CHECKING FOR COLOR:');
    console.log('='.repeat(80));
    console.log('VehicleRegistration.Colour:', ukVehicleData.VehicleRegistration?.Colour);
    
    console.log('\n' + '='.repeat(80));
    console.log('CHECKING FOR PREVIOUS OWNERS:');
    console.log('='.repeat(80));
    console.log('VehicleRegistration.NumberOfPreviousKeepers:', ukVehicleData.VehicleRegistration?.NumberOfPreviousKeepers);
    console.log('VehicleRegistration.PreviousKeepers:', ukVehicleData.VehicleRegistration?.PreviousKeepers);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUKVehicleData();
