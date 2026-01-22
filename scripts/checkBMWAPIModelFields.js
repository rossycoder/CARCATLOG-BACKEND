const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function checkModelFields() {
  try {
    console.log('Checking API model fields for BMW AV13NFC...\n');
    
    const response = await checkCarDetailsClient.getVehicleSpecs('AV13NFC');
    
    console.log('=== MODEL-RELATED FIELDS ===\n');
    
    // Check VehicleIdentification section
    if (response.VehicleIdentification) {
      console.log('VehicleIdentification:');
      console.log('  DvlaMake:', response.VehicleIdentification.DvlaMake);
      console.log('  DvlaModel:', response.VehicleIdentification.DvlaModel);
      console.log('  DvlaModelCode:', response.VehicleIdentification.DvlaModelCode);
    }
    
    // Check ModelData section
    if (response.ModelData) {
      console.log('\nModelData:');
      console.log('  Make:', response.ModelData.Make);
      console.log('  Model:', response.ModelData.Model);
      console.log('  ModelVariant:', response.ModelData.ModelVariant);
      console.log('  Trim:', response.ModelData.Trim);
      console.log('  Description:', response.ModelData.Description);
      console.log('  FullDescription:', response.ModelData.FullDescription);
    }
    
    // Check SmmtDetails section
    if (response.SmmtDetails) {
      console.log('\nSmmtDetails:');
      console.log('  Make:', response.SmmtDetails.Make);
      console.log('  Model:', response.SmmtDetails.Model);
      console.log('  Variant:', response.SmmtDetails.Variant);
      console.log('  Trim:', response.SmmtDetails.Trim);
      console.log('  Description:', response.SmmtDetails.Description);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkModelFields();
