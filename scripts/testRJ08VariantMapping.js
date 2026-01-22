/**
 * Test script to verify RJ08PFA variant mapping
 * Tests if ModelVariant from API is properly mapped to variant field
 */

require('dotenv').config();
const mongoose = require('mongoose');
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');
const dataMerger = require('../utils/dataMerger');
const vehicleFormatter = require('../utils/vehicleFormatter');

async function testRJ08VariantMapping() {
  try {
    console.log('🔍 Testing RJ08PFA variant mapping...\n');
    
    const vrm = 'RJ08PFA';
    
    // Step 1: Fetch data from CheckCarDetails API
    console.log('Step 1: Fetching data from CheckCarDetails API...');
    const apiResponse = await checkCarDetailsClient.getVehicleData(vrm);
    
    console.log('\n📦 API Response - ModelVariant:');
    console.log(`   ModelData.ModelVariant: "${apiResponse.modelVariant}"`);
    console.log(`   Make: "${apiResponse.make}"`);
    console.log(`   Model: "${apiResponse.model}"`);
    console.log(`   Engine Size: ${apiResponse.engineSize}L`);
    console.log(`   Fuel Type: ${apiResponse.fuelType}`);
    console.log(`   Transmission: ${apiResponse.transmission}`);
    
    // Step 2: Merge data using dataMerger
    console.log('\n\nStep 2: Merging data using dataMerger...');
    const merged = dataMerger.merge(apiResponse, null);
    
    console.log('\n📦 Merged Data:');
    console.log(`   variant.value: "${merged.variant?.value}"`);
    console.log(`   variant.source: "${merged.variant?.source}"`);
    console.log(`   modelVariant.value: "${merged.modelVariant?.value}"`);
    console.log(`   modelVariant.source: "${merged.modelVariant?.source}"`);
    
    // Step 3: Generate variant using vehicleFormatter (fallback)
    console.log('\n\nStep 3: Testing vehicleFormatter.formatVariant...');
    const vehicleData = {
      make: merged.make?.value,
      model: merged.model?.value,
      engineSize: merged.engineSize?.value,
      engineSizeLitres: merged.engineSize?.value,
      fuelType: merged.fuelType?.value,
      transmission: merged.transmission?.value,
      modelVariant: merged.modelVariant?.value,
      doors: merged.doors?.value
    };
    
    const generatedVariant = vehicleFormatter.formatVariant(vehicleData);
    console.log(`   Generated variant: "${generatedVariant}"`);
    
    // Step 4: Final variant decision
    console.log('\n\n✅ FINAL RESULT:');
    const finalVariant = merged.variant?.value || generatedVariant;
    console.log(`   Variant to save in database: "${finalVariant}"`);
    console.log(`   Source: ${merged.variant?.value ? 'API (modelVariant)' : 'Generated'}`);
    
    // Step 5: Check database
    console.log('\n\nStep 5: Checking database...');
    await mongoose.connect(process.env.MONGODB_URI);
    const Car = require('../models/Car');
    
    const car = await Car.findOne({ registrationNumber: vrm });
    if (car) {
      console.log(`   Found car in database:`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Variant in DB: "${car.variant}"`);
      console.log(`   Match: ${car.variant === finalVariant ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log(`   ⚠️  Car not found in database`);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testRJ08VariantMapping();
