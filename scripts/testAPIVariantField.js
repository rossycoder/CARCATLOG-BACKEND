/**
 * Test to check what variant field API returns
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testAPIVariant() {
  console.log('Testing API Variant Field');
  console.log('='.repeat(80));

  const registration = 'NU10YEV';

  try {
    // Get raw API response
    const specsData = await checkCarDetailsClient.getVehicleSpecs(registration);
    
    console.log('\n📋 RAW API RESPONSE - Checking for variant field:');
    console.log('='.repeat(80));
    
    // Check ModelData
    console.log('\nModelData.Variant:', specsData.ModelData?.Variant || 'NOT FOUND');
    console.log('ModelData.ModelVariant:', specsData.ModelData?.ModelVariant || 'NOT FOUND');
    console.log('ModelData.Range:', specsData.ModelData?.Range || 'NOT FOUND');
    console.log('ModelData.Model:', specsData.ModelData?.Model || 'NOT FOUND');
    console.log('ModelData.Series:', specsData.ModelData?.Series || 'NOT FOUND');
    
    // Check SmmtDetails
    console.log('\nSmmtDetails.Variant:', specsData.SmmtDetails?.Variant || 'NOT FOUND');
    console.log('SmmtDetails.Range:', specsData.SmmtDetails?.Range || 'NOT FOUND');
    console.log('SmmtDetails.Model:', specsData.SmmtDetails?.Model || 'NOT FOUND');
    
    // Check engine details
    console.log('\n🔧 ENGINE DETAILS:');
    console.log('EngineCapacityCc:', specsData.PowerSource?.IceDetails?.EngineCapacityCc || 'NOT FOUND');
    console.log('EngineCapacityLitres:', specsData.PowerSource?.IceDetails?.EngineCapacityLitres || 'NOT FOUND');
    console.log('EngineDescription:', specsData.PowerSource?.IceDetails?.EngineDescription || 'NOT FOUND');
    
    // Check body details
    console.log('\n🚗 BODY DETAILS:');
    console.log('NumberOfDoors:', specsData.BodyDetails?.NumberOfDoors || 'NOT FOUND');
    console.log('BodyStyle:', specsData.BodyDetails?.BodyStyle || 'NOT FOUND');
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Check complete');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

testAPIVariant();
