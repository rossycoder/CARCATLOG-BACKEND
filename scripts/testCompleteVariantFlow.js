/**
 * Test complete variant flow from API to database
 * Simulates the full car creation process
 */

require('dotenv').config();
const mongoose = require('mongoose');
const enhancedVehicleService = require('../services/enhancedVehicleService');
const Car = require('../models/Car');

async function testCompleteVariantFlow() {
  try {
    console.log('🔍 Testing complete variant flow...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    const testVRM = 'RJ08PFA';
    
    // Step 1: Get enhanced vehicle data (simulates frontend API call)
    console.log('Step 1: Fetching enhanced vehicle data...');
    const vehicleData = await enhancedVehicleService.getEnhancedVehicleData(testVRM, false);
    
    console.log('\n📦 Enhanced Vehicle Data:');
    console.log(`   Make: ${vehicleData.make?.value}`);
    console.log(`   Model: ${vehicleData.model?.value}`);
    console.log(`   Variant: "${vehicleData.variant?.value}"`);
    console.log(`   ModelVariant: "${vehicleData.modelVariant?.value}"`);
    console.log(`   Engine Size: ${vehicleData.engineSize?.value}L`);
    console.log(`   Fuel Type: ${vehicleData.fuelType?.value}`);
    console.log(`   Transmission: ${vehicleData.transmission?.value}`);
    
    // Step 2: Create car document (simulates paymentController car creation)
    console.log('\n\nStep 2: Creating car document...');
    
    // Delete existing test car if exists
    await Car.deleteOne({ registrationNumber: testVRM });
    
    const carData = {
      make: vehicleData.make?.value || 'Unknown',
      model: vehicleData.model?.value || 'Unknown',
      variant: vehicleData.variant?.value, // This should be "CTDI Type S GT"
      year: vehicleData.year?.value || 2008,
      mileage: 100000,
      color: vehicleData.color?.value || 'Unknown',
      fuelType: vehicleData.fuelType?.value || 'Petrol',
      transmission: vehicleData.transmission?.value ? vehicleData.transmission.value.toLowerCase() : 'manual',
      registrationNumber: testVRM,
      engineSize: vehicleData.engineSize?.value,
      bodyType: vehicleData.bodyType?.value,
      doors: vehicleData.doors?.value,
      seats: vehicleData.seats?.value,
      price: 5000,
      description: 'Test car',
      postcode: 'SW1A 1AA',
      condition: 'used',
      advertStatus: 'active',
      dataSource: 'manual'
    };
    
    console.log('\n📝 Car data to save:');
    console.log(`   Variant: "${carData.variant}"`);
    
    const car = new Car(carData);
    await car.save();
    
    console.log('\n✅ Car saved to database');
    console.log(`   Car ID: ${car._id}`);
    console.log(`   Variant in DB: "${car.variant}"`);
    
    // Step 3: Fetch car from database (simulates frontend API call)
    console.log('\n\nStep 3: Fetching car from database...');
    const savedCar = await Car.findById(car._id);
    
    console.log('\n📦 Car from database:');
    console.log(`   Make/Model: ${savedCar.make} ${savedCar.model}`);
    console.log(`   Variant: "${savedCar.variant}"`);
    console.log(`   Variant length: ${savedCar.variant?.length || 0} chars`);
    console.log(`   Is trimmed: ${savedCar.variant === savedCar.variant?.trim()}`);
    
    // Step 4: Test frontend display logic
    console.log('\n\nStep 4: Testing frontend display logic...');
    const shouldDisplay = savedCar.variant && 
                         savedCar.variant !== 'null' && 
                         savedCar.variant !== 'undefined' && 
                         savedCar.variant.trim() !== '';
    
    console.log(`   Should display on frontend: ${shouldDisplay ? '✅ YES' : '❌ NO'}`);
    console.log(`   Display value: "${savedCar.variant}"`);
    
    // Cleanup
    await Car.deleteOne({ _id: car._id });
    console.log('\n\n🧹 Cleanup: Test car deleted');
    
    await mongoose.disconnect();
    console.log('✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
  }
}

testCompleteVariantFlow();
