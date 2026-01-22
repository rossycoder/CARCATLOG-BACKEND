require('dotenv').config();
const enhancedVehicleService = require('../services/enhancedVehicleService');

async function showAPIResponse() {
  
  // Test with BMW
  console.log('\n========================================');
  console.log('BMW 3 SERIES EXAMPLE (HUM777A)');
  console.log('========================================\n');
  
  try {
    const bmwData = await enhancedVehicleService.getEnhancedVehicleData('HUM777A');
    console.log('Full API Response:');
    console.log(JSON.stringify(bmwData, null, 2));
    
    console.log('\n--- Key Fields for Make/Model/Variant ---');
    console.log('Make:', bmwData.make);
    console.log('Model:', bmwData.model);
    console.log('Variant:', bmwData.variant);
    console.log('Description:', bmwData.description);
    console.log('Full Model:', bmwData.fullModel);
    console.log('Model Variant:', bmwData.modelVariant);
    
  } catch (error) {
    console.error('Error fetching BMW data:', error.message);
  }
  
  // Test with another registration if you have one
  console.log('\n========================================');
  console.log('PLEASE PROVIDE A SKODA REGISTRATION');
  console.log('========================================\n');
  console.log('To test with a Skoda Octavia, please provide the registration number');
  console.log('and I will show you the exact API response fields.');
}

showAPIResponse();
