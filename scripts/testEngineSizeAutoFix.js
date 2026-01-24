const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testEngineSizeExtraction() {
  try {
    console.log('🧪 Testing Engine Size Auto-Extraction\n');
    
    // Test with the Honda Civic registration
    const registration = 'EX09MYY';
    
    console.log(`📡 Fetching data for: ${registration}`);
    const vehicleData = await CheckCarDetailsClient.getVehicleData(registration);
    
    console.log('\n✅ Vehicle Data Retrieved:');
    console.log(`   Make: ${vehicleData.make}`);
    console.log(`   Model: ${vehicleData.model}`);
    console.log(`   Variant: ${vehicleData.variant}`);
    console.log(`   Model Variant: ${vehicleData.modelVariant}`);
    console.log(`   Engine Size: ${vehicleData.engineSize}L`);
    console.log(`   Engine Size Litres: ${vehicleData.engineSizeLitres}L`);
    console.log(`   Fuel Type: ${vehicleData.fuelType}`);
    console.log(`   Transmission: ${vehicleData.transmission}`);
    console.log(`   Body Type: ${vehicleData.bodyType}`);
    console.log(`   Doors: ${vehicleData.doors}`);
    
    // Simulate what the controller would do
    console.log('\n🔧 Simulating Controller Logic:');
    const engineSize = vehicleData.engineSize;
    console.log(`   Engine Size to be saved: ${engineSize}L`);
    
    // Generate display title
    const displayTitleParts = [];
    if (vehicleData.make) displayTitleParts.push(vehicleData.make);
    if (vehicleData.model) displayTitleParts.push(vehicleData.model);
    if (engineSize) displayTitleParts.push(`${engineSize}L`);
    if (vehicleData.modelVariant) displayTitleParts.push(vehicleData.modelVariant);
    const displayTitle = displayTitleParts.join(' ');
    
    console.log(`   Display Title: "${displayTitle}"`);
    
    // Test CarCard display logic
    console.log('\n📱 Simulating CarCard Display:');
    const car = {
      make: vehicleData.make,
      model: vehicleData.model,
      engineSize: engineSize,
      variant: vehicleData.modelVariant,
      bodyType: vehicleData.bodyType
    };
    
    // Simulate getVariantLine() from CarCard
    const parts = [];
    if (car.engineSize) {
      parts.push(`${parseFloat(car.engineSize).toFixed(1)}`);
    }
    if (car.variant && car.variant !== 'null' && car.variant !== 'undefined' && car.variant.trim() !== '') {
      parts.push(car.variant);
    }
    if (car.bodyType) {
      parts.push(car.bodyType);
    }
    const variantLine = parts.join(' ');
    
    console.log(`   Variant Line: "${variantLine}"`);
    console.log(`   Expected: "1.3 I-VTec Type S 3 DOOR HATCHBACK" (or similar)`);
    
    if (engineSize && engineSize > 0) {
      console.log('\n✅ SUCCESS: Engine size is correctly extracted and will be displayed!');
    } else {
      console.log('\n❌ FAILED: Engine size is missing or zero!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testEngineSizeExtraction();
