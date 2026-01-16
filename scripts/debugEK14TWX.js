/**
 * Debug EK14TWX - See exactly what data is being returned
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function debugEK14TWX() {
  const registration = 'EK14TWX';
  
  console.log('='.repeat(80));
  console.log(`Debugging: ${registration}`);
  console.log('='.repeat(80));
  
  try {
    // Test Enhanced Vehicle Service (what the frontend uses)
    const enhancedVehicleService = require('../services/enhancedVehicleService');
    console.log('\n📊 Calling enhancedVehicleService.getVehicleData()...\n');
    
    const result = await enhancedVehicleService.getVehicleData(registration);
    
    console.log('✅ RAW RESPONSE:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('FIELD-BY-FIELD ANALYSIS');
    console.log('='.repeat(80));
    
    const fields = [
      'make', 'model', 'year', 'color', 'fuelType', 
      'transmission', 'engineSize', 'bodyType', 'doors',
      'previousOwners', 'seats'
    ];
    
    fields.forEach(field => {
      const value = result[field];
      const hasValue = value && value.value !== null && value.value !== undefined && value.value !== 'Unknown';
      console.log(`${field.padEnd(20)}: ${hasValue ? '✅' : '❌'} ${JSON.stringify(value)}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('WHAT FRONTEND WILL SHOW');
    console.log('='.repeat(80));
    
    const extractValue = (field) => {
      if (field === null || field === undefined) return null;
      if (typeof field === 'object' && field.value !== undefined) {
        return field.value;
      }
      return field;
    };
    
    console.log(`Make:             ${extractValue(result.make) || 'Please verify make'}`);
    console.log(`Model:            ${extractValue(result.model) || 'Please verify model'}`);
    console.log(`Year:             ${extractValue(result.year) || 'Please verify year'}`);
    console.log(`Color:            ${extractValue(result.color) || 'Please verify colour'}`);
    console.log(`Fuel Type:        ${extractValue(result.fuelType) || 'Please verify fuel type'}`);
    console.log(`Transmission:     ${extractValue(result.transmission) || 'Manual'}`);
    console.log(`Engine Size:      ${extractValue(result.engineSize) ? `${(extractValue(result.engineSize) / 1000).toFixed(1)}L` : 'Please verify engine size'}`);
    console.log(`Body Type:        ${extractValue(result.bodyType) || 'Please verify body type'}`);
    console.log(`Doors:            ${extractValue(result.doors) || '4'}`);
    console.log(`Previous Owners:  ${extractValue(result.previousOwners) || '1'}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS');
    console.log('='.repeat(80));
    
    const missingFields = fields.filter(field => {
      const value = extractValue(result[field]);
      return !value || value === 'Unknown';
    });
    
    if (missingFields.length > 0) {
      console.log('\n❌ Missing or Unknown fields:');
      missingFields.forEach(field => console.log(`   - ${field}`));
      console.log('\n💡 Solution: These fields will show "Please verify" in frontend');
      console.log('   User can manually edit these values using "Edit Details" button');
    } else {
      console.log('\n✅ All fields have valid data!');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n' + '='.repeat(80));
}

debugEK14TWX().catch(console.error);
