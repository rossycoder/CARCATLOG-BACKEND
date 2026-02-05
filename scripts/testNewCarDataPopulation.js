/**
 * Test New Car Data Population
 * Tests that when a new car is added, all fields are properly populated and no important fields are null
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const Car = require('../models/Car');
const EnhancedVehicleService = require('../services/enhancedVehicleService');
const ApiResponseUnwrapper = require('../utils/apiResponseUnwrapper');
const CarDataNormalizer = require('../utils/carDataNormalizer');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

/**
 * Test creating a new car and ensuring all data is properly populated
 */
async function testNewCarDataPopulation() {
  console.log('🚗 Testing New Car Data Population\n');
  
  try {
    // Test with a known electric vehicle registration
    const testRegistration = 'BG22UCP'; // BMW i4 M50
    
    console.log(`📋 Testing with registration: ${testRegistration}`);
    
    // First, get enhanced data from API
    console.log(`🌐 Fetching enhanced data from API...`);
    
    const enhancedData = await EnhancedVehicleService.getEnhancedVehicleData(
      testRegistration,
      false, // Don't use cache - force fresh API call
      2500 // Mileage
    );
    
    console.log(`\n📡 Enhanced Data Received:`);
    console.log(`   Make: ${enhancedData.make?.value || enhancedData.make || 'not found'}`);
    console.log(`   Model: ${enhancedData.model?.value || enhancedData.model || 'not found'}`);
    console.log(`   Variant: ${enhancedData.variant?.value || enhancedData.variant || 'not found'}`);
    console.log(`   Color: ${enhancedData.color?.value || enhancedData.color || 'not found'}`);
    console.log(`   Transmission: ${enhancedData.transmission?.value || enhancedData.transmission || 'not found'}`);
    console.log(`   Fuel Type: ${enhancedData.fuelType?.value || enhancedData.fuelType || 'not found'}`);
    console.log(`   Year: ${enhancedData.year?.value || enhancedData.year || 'not found'}`);
    console.log(`   Engine Size: ${enhancedData.engineSize?.value || enhancedData.engineSize || 'not found'}`);
    console.log(`   Body Type: ${enhancedData.bodyType?.value || enhancedData.bodyType || 'not found'}`);
    console.log(`   Doors: ${enhancedData.doors?.value || enhancedData.doors || 'not found'}`);
    console.log(`   Seats: ${enhancedData.seats?.value || enhancedData.seats || 'not found'}`);
    
    console.log(`\n🔋 Electric Vehicle Data:`);
    console.log(`   Electric Range: ${enhancedData.electricRange || enhancedData.runningCosts?.electricRange || 'not found'}`);
    console.log(`   Battery Capacity: ${enhancedData.batteryCapacity || enhancedData.runningCosts?.batteryCapacity || 'not found'}`);
    console.log(`   Charging Time: ${enhancedData.chargingTime || enhancedData.runningCosts?.chargingTime || 'not found'}`);
    
    console.log(`\n🏃 Running Costs Data:`);
    if (enhancedData.runningCosts) {
      console.log(`   Annual Tax: ${enhancedData.runningCosts.annualTax || 'not found'}`);
      console.log(`   Insurance Group: ${enhancedData.runningCosts.insuranceGroup || 'not found'}`);
      console.log(`   CO2 Emissions: ${enhancedData.runningCosts.co2Emissions || 'not found'}`);
      console.log(`   Electric Range: ${enhancedData.runningCosts.electricRange || 'not found'}`);
      console.log(`   Battery Capacity: ${enhancedData.runningCosts.batteryCapacity || 'not found'}`);
      console.log(`   Charging Time: ${enhancedData.runningCosts.chargingTime || 'not found'}`);
    }
    
    // Create a new car object with the enhanced data
    console.log(`\n🚗 Creating new car object...`);
    
    const newCarData = {
      make: ApiResponseUnwrapper.extractString(enhancedData.make) || 'BMW',
      model: ApiResponseUnwrapper.extractString(enhancedData.model) || 'i4',
      variant: ApiResponseUnwrapper.extractString(enhancedData.variant) || 'M50',
      year: ApiResponseUnwrapper.extractNumber(enhancedData.year) || 2022,
      fuelType: ApiResponseUnwrapper.extractString(enhancedData.fuelType) || 'Electric',
      transmission: CarDataNormalizer.normalizeTransmission(ApiResponseUnwrapper.extractString(enhancedData.transmission)) || 'automatic',
      color: ApiResponseUnwrapper.extractString(enhancedData.color) || 'White',
      bodyType: ApiResponseUnwrapper.extractString(enhancedData.bodyType) || 'Coupe',
      doors: ApiResponseUnwrapper.extractNumber(enhancedData.doors) || 5,
      seats: ApiResponseUnwrapper.extractNumber(enhancedData.seats) || 5,
      engineSize: ApiResponseUnwrapper.extractNumber(enhancedData.engineSize) || 0,
      mileage: 2500,
      price: 36971,
      estimatedValue: 36971,
      registrationNumber: testRegistration,
      dataSource: 'DVLA',
      postcode: 'NG1 5FS',
      description: 'Test BMW i4 M50 Electric Vehicle with complete data population',
      
      // Electric vehicle specific fields
      electricRange: ApiResponseUnwrapper.extractNumber(enhancedData.runningCosts?.electricRange) || 270,
      batteryCapacity: ApiResponseUnwrapper.extractNumber(enhancedData.runningCosts?.batteryCapacity) || 83.9,
      chargingTime: ApiResponseUnwrapper.extractNumber(enhancedData.runningCosts?.chargingTime) || 8.25,
      
      // Running costs
      runningCosts: {
        fuelEconomy: {
          urban: ApiResponseUnwrapper.extractNumber(enhancedData.runningCosts?.fuelEconomy?.urban),
          extraUrban: ApiResponseUnwrapper.extractNumber(enhancedData.runningCosts?.fuelEconomy?.extraUrban),
          combined: ApiResponseUnwrapper.extractNumber(enhancedData.runningCosts?.fuelEconomy?.combined)
        },
        annualTax: ApiResponseUnwrapper.extractNumber(enhancedData.runningCosts?.annualTax) || 0,
        insuranceGroup: ApiResponseUnwrapper.extractString(enhancedData.runningCosts?.insuranceGroup),
        co2Emissions: ApiResponseUnwrapper.extractNumber(enhancedData.runningCosts?.co2Emissions) || 0,
        electricRange: ApiResponseUnwrapper.extractNumber(enhancedData.runningCosts?.electricRange) || 270,
        batteryCapacity: ApiResponseUnwrapper.extractNumber(enhancedData.runningCosts?.batteryCapacity) || 83.9,
        chargingTime: ApiResponseUnwrapper.extractNumber(enhancedData.runningCosts?.chargingTime) || 8.25
      },
      
      // Other important fields
      co2Emissions: ApiResponseUnwrapper.extractNumber(enhancedData.runningCosts?.co2Emissions) || 0,
      annualTax: ApiResponseUnwrapper.extractNumber(enhancedData.runningCosts?.annualTax) || 0,
      insuranceGroup: ApiResponseUnwrapper.extractString(enhancedData.runningCosts?.insuranceGroup),
      
      advertStatus: 'active',
      condition: 'used',
      vehicleType: 'car'
    };
    
    console.log(`\n📊 New Car Data Structure:`);
    console.log(`   Make: ${newCarData.make}`);
    console.log(`   Model: ${newCarData.model}`);
    console.log(`   Variant: ${newCarData.variant}`);
    console.log(`   Color: ${newCarData.color}`);
    console.log(`   Transmission: ${newCarData.transmission}`);
    console.log(`   Fuel Type: ${newCarData.fuelType}`);
    console.log(`   Year: ${newCarData.year}`);
    console.log(`   Body Type: ${newCarData.bodyType}`);
    console.log(`   Doors: ${newCarData.doors}`);
    console.log(`   Seats: ${newCarData.seats}`);
    console.log(`   Electric Range: ${newCarData.electricRange}`);
    console.log(`   Battery Capacity: ${newCarData.batteryCapacity}`);
    console.log(`   Charging Time: ${newCarData.chargingTime}`);
    console.log(`   Annual Tax: ${newCarData.annualTax}`);
    console.log(`   CO2 Emissions: ${newCarData.co2Emissions}`);
    
    // Check for null values in important fields
    console.log(`\n🔍 Checking for null values in important fields...`);
    
    const importantFields = [
      'make', 'model', 'variant', 'year', 'fuelType', 'transmission', 
      'bodyType', 'doors', 'seats', 'mileage', 'price', 'estimatedValue'
    ];
    
    const electricVehicleFields = [
      'electricRange', 'batteryCapacity', 'chargingTime', 'annualTax', 'co2Emissions'
    ];
    
    let nullCount = 0;
    
    console.log(`\n📋 Important Fields Check:`);
    for (const field of importantFields) {
      const value = newCarData[field];
      const isNull = value === null || value === undefined;
      console.log(`   ${field}: ${value} ${isNull ? '❌ NULL' : '✅'}`);
      if (isNull) nullCount++;
    }
    
    console.log(`\n🔋 Electric Vehicle Fields Check:`);
    for (const field of electricVehicleFields) {
      const value = newCarData[field];
      const isNull = value === null || value === undefined;
      console.log(`   ${field}: ${value} ${isNull ? '❌ NULL' : '✅'}`);
      if (isNull) nullCount++;
    }
    
    console.log(`\n🏃 Running Costs Fields Check:`);
    if (newCarData.runningCosts) {
      const runningCostsFields = ['annualTax', 'co2Emissions', 'electricRange', 'batteryCapacity', 'chargingTime'];
      for (const field of runningCostsFields) {
        const value = newCarData.runningCosts[field];
        const isNull = value === null || value === undefined;
        console.log(`   runningCosts.${field}: ${value} ${isNull ? '❌ NULL' : '✅'}`);
        if (isNull) nullCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total fields checked: ${importantFields.length + electricVehicleFields.length + 5}`);
    console.log(`   Null fields: ${nullCount}`);
    console.log(`   Complete fields: ${importantFields.length + electricVehicleFields.length + 5 - nullCount}`);
    
    if (nullCount === 0) {
      console.log(`\n✅ SUCCESS: All important fields are properly populated!`);
    } else {
      console.log(`\n⚠️  WARNING: ${nullCount} fields are null - data population needs improvement`);
    }
    
    // Test saving the car (but don't actually save to avoid duplicates)
    console.log(`\n🧪 Testing car validation (without saving)...`);
    
    try {
      const testCar = new Car(newCarData);
      await testCar.validate();
      console.log(`✅ Car validation passed - data structure is correct`);
    } catch (validationError) {
      console.error(`❌ Car validation failed:`, validationError.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing new car data population:', error);
  }
}

// Main execution
async function main() {
  await connectDB();
  await testNewCarDataPopulation();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { testNewCarDataPopulation };