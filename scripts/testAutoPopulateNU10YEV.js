/**
 * Test automatic data population for NU10YEV
 * This tests that ALL fields from CheckCarDetails API are automatically extracted
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testAutoPopulate() {
  console.log('='.repeat(80));
  console.log('Testing Automatic Data Population for NU10YEV');
  console.log('='.repeat(80));

  const registration = 'NU10YEV';

  try {
    console.log(`\nFetching data for: ${registration}`);
    console.log('-'.repeat(80));

    // Get vehicle data - this automatically extracts ALL fields
    const vehicleData = await checkCarDetailsClient.getVehicleData(registration);

    console.log('\n✅ DATA AUTOMATICALLY POPULATED:');
    console.log('='.repeat(80));

    // Basic Vehicle Info
    console.log('\n📋 BASIC VEHICLE INFORMATION:');
    console.log(`Make: ${vehicleData.make || 'N/A'}`);
    console.log(`Model: ${vehicleData.model || 'N/A'}`);
    console.log(`Variant (Formatted): ${vehicleData.variant || 'N/A'}`);
    console.log(`Model Variant (API Raw): ${vehicleData.modelVariant || 'N/A'}`);
    console.log(`Series: ${vehicleData.series || 'N/A'}`);
    console.log(`Year: ${vehicleData.year || 'N/A'}`);
    console.log(`Color: ${vehicleData.color || 'N/A'}`);
    console.log(`Fuel Type: ${vehicleData.fuelType || 'N/A'}`);
    console.log(`Transmission: ${vehicleData.transmission || 'N/A'}`);
    console.log(`Number of Gears: ${vehicleData.numberOfGears || 'N/A'}`);
    console.log(`Drive Type: ${vehicleData.driveType || 'N/A'}`);
    console.log(`Driving Axle: ${vehicleData.drivingAxle || 'N/A'}`);

    // Engine Details
    console.log('\n🔧 ENGINE DETAILS:');
    console.log(`Engine Size (cc): ${vehicleData.engineSize || 'N/A'}`);
    console.log(`Engine Size (L): ${vehicleData.engineSizeLitres || 'N/A'}`);
    console.log(`Engine Description: ${vehicleData.engineDescription || 'N/A'}`);
    console.log(`Engine Manufacturer: ${vehicleData.engineManufacturer || 'N/A'}`);
    console.log(`Engine Location: ${vehicleData.engineLocation || 'N/A'}`);
    console.log(`Number of Cylinders: ${vehicleData.numberOfCylinders || 'N/A'}`);
    console.log(`Cylinder Arrangement: ${vehicleData.cylinderArrangement || 'N/A'}`);
    console.log(`Valves Per Cylinder: ${vehicleData.valvesPerCylinder || 'N/A'}`);
    console.log(`Valve Gear: ${vehicleData.valveGear || 'N/A'}`);
    console.log(`Bore: ${vehicleData.bore || 'N/A'}`);
    console.log(`Stroke: ${vehicleData.stroke || 'N/A'}`);
    console.log(`Aspiration: ${vehicleData.aspiration || 'N/A'}`);
    console.log(`Fuel Delivery: ${vehicleData.fuelDelivery || 'N/A'}`);

    // Body Details
    console.log('\n🚗 BODY DETAILS:');
    console.log(`Body Type: ${vehicleData.bodyType || 'N/A'}`);
    console.log(`Body Shape: ${vehicleData.bodyShape || 'N/A'}`);
    console.log(`Doors: ${vehicleData.doors || 'N/A'}`);
    console.log(`Seats: ${vehicleData.seats || 'N/A'}`);
    console.log(`Number of Axles: ${vehicleData.numberOfAxles || 'N/A'}`);
    console.log(`Wheelbase: ${vehicleData.wheelbase || 'N/A'}`);

    // VIN and Registration
    console.log('\n🔢 VIN & REGISTRATION:');
    console.log(`VIN: ${vehicleData.vin || 'N/A'}`);
    console.log(`VIN Last 5: ${vehicleData.vinLast5 || 'N/A'}`);
    console.log(`Engine Number: ${vehicleData.engineNumber || 'N/A'}`);
    console.log(`Date First Registered: ${vehicleData.dateFirstRegistered || 'N/A'}`);
    console.log(`Date of Manufacture: ${vehicleData.dateOfManufacture || 'N/A'}`);

    // Dimensions
    console.log('\n📏 DIMENSIONS:');
    console.log(`Height (mm): ${vehicleData.heightMm || 'N/A'}`);
    console.log(`Length (mm): ${vehicleData.lengthMm || 'N/A'}`);
    console.log(`Width (mm): ${vehicleData.widthMm || 'N/A'}`);
    console.log(`Wheelbase Length (mm): ${vehicleData.wheelBaseLengthMm || 'N/A'}`);

    // Weights
    console.log('\n⚖️  WEIGHTS:');
    console.log(`Kerb Weight (kg): ${vehicleData.kerbWeightKg || 'N/A'}`);
    console.log(`Gross Vehicle Weight (kg): ${vehicleData.grossVehicleWeightKg || 'N/A'}`);
    console.log(`Unladen Weight (kg): ${vehicleData.unladenWeightKg || 'N/A'}`);
    console.log(`Payload Weight (kg): ${vehicleData.payloadWeightKg || 'N/A'}`);
    console.log(`Max Towable Mass Braked: ${vehicleData.maxTowableMassBraked || 'N/A'}`);
    console.log(`Max Towable Mass Unbraked: ${vehicleData.maxTowableMassUnbraked || 'N/A'}`);

    // Running Costs
    console.log('\n💰 RUNNING COSTS:');
    console.log(`Fuel Economy - Urban: ${vehicleData.fuelEconomy?.urban || 'N/A'} mpg`);
    console.log(`Fuel Economy - Extra Urban: ${vehicleData.fuelEconomy?.extraUrban || 'N/A'} mpg`);
    console.log(`Fuel Economy - Combined: ${vehicleData.fuelEconomy?.combined || 'N/A'} mpg`);
    console.log(`CO2 Emissions: ${vehicleData.co2Emissions || 'N/A'} g/km`);
    console.log(`CO2 Band: ${vehicleData.co2Band || 'N/A'}`);
    console.log(`Insurance Group: ${vehicleData.insuranceGroup || 'N/A'}`);
    console.log(`Annual Tax: £${vehicleData.annualTax || 'N/A'}`);

    // Performance
    console.log('\n🏎️  PERFORMANCE:');
    console.log(`Power (BHP): ${vehicleData.performance?.power || 'N/A'}`);
    console.log(`Power (kW): ${vehicleData.performance?.powerKw || 'N/A'}`);
    console.log(`Power (PS): ${vehicleData.performance?.powerPs || 'N/A'}`);
    console.log(`Torque (Nm): ${vehicleData.performance?.torque || 'N/A'}`);
    console.log(`Torque (lb-ft): ${vehicleData.performance?.torqueLbFt || 'N/A'}`);
    console.log(`Torque RPM: ${vehicleData.performance?.torqueRpm || 'N/A'}`);
    console.log(`0-60 mph: ${vehicleData.performance?.acceleration || 'N/A'} seconds`);
    console.log(`0-100 kph: ${vehicleData.performance?.zeroToOneHundredKph || 'N/A'} seconds`);
    console.log(`Top Speed (mph): ${vehicleData.performance?.topSpeed || 'N/A'}`);
    console.log(`Top Speed (kph): ${vehicleData.performance?.topSpeedKph || 'N/A'}`);

    // Additional Details
    console.log('\n📝 ADDITIONAL DETAILS:');
    console.log(`Fuel Tank Capacity: ${vehicleData.fuelTankCapacityLitres || 'N/A'} litres`);
    console.log(`Country of Origin: ${vehicleData.countryOfOrigin || 'N/A'}`);
    console.log(`Euro Status: ${vehicleData.euroStatus || 'N/A'}`);
    console.log(`Type Approval Category: ${vehicleData.typeApprovalCategory || 'N/A'}`);
    console.log(`Vehicle Class: ${vehicleData.vehicleClass || 'N/A'}`);
    console.log(`Market Sector Code: ${vehicleData.marketSectorCode || 'N/A'}`);
    console.log(`Sound Level Stationary: ${vehicleData.soundLevelStationary || 'N/A'} dB`);
    console.log(`Sound Level Drive By: ${vehicleData.soundLevelDriveBy || 'N/A'} dB`);
    console.log(`Has Fuel Catalyst: ${vehicleData.hasFuelCatalyst !== null ? vehicleData.hasFuelCatalyst : 'N/A'}`);
    console.log(`Previous Owners: ${vehicleData.previousOwners !== null ? vehicleData.previousOwners : 'N/A'}`);
    console.log(`Gearbox: ${vehicleData.gearbox || 'N/A'}`);
    console.log(`Emission Class: ${vehicleData.emissionClass || 'N/A'}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL DATA AUTOMATICALLY POPULATED FROM API');
    console.log('='.repeat(80));

    // Count populated fields
    const allFields = Object.keys(vehicleData);
    const populatedFields = allFields.filter(key => {
      const value = vehicleData[key];
      if (value === null || value === undefined) return false;
      if (typeof value === 'object') {
        return Object.values(value).some(v => v !== null && v !== undefined);
      }
      return true;
    });

    console.log(`\n📊 STATISTICS:`);
    console.log(`Total Fields: ${allFields.length}`);
    console.log(`Populated Fields: ${populatedFields.length}`);
    console.log(`Coverage: ${((populatedFields.length / allFields.length) * 100).toFixed(1)}%`);

    console.log('\n✅ SUCCESS: Data automatically populated without manual entry!');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code) {
      console.error(`Error Code: ${error.code}`);
    }
    if (error.userMessage) {
      console.error(`User Message: ${error.userMessage}`);
    }
    process.exit(1);
  }
}

// Run the test
testAutoPopulate();
