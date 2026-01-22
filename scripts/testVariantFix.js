/**
 * Test Variant Fix for RJ08 PFA
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function testVariantFix() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    const registration = 'RJ08 PFA';
    
    // Find the car in database
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log(`Car not found: ${registration}`);
      return;
    }
    
    console.log('\n=== BEFORE ===');
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('Display Title:', car.displayTitle);
    
    // Fetch fresh data from API
    console.log(`\nFetching fresh API data for ${registration}...`);
    const apiData = await CheckCarDetailsClient.getVehicleData(registration);
    
    console.log('\n=== API DATA ===');
    console.log('Make:', apiData.make);
    console.log('Model:', apiData.model);
    console.log('ModelVariant:', apiData.modelVariant);
    console.log('Variant:', apiData.variant);
    console.log('Engine Size:', apiData.engineSize);
    console.log('Fuel Type:', apiData.fuelType);
    
    // Update the car
    const variant = apiData.variant || apiData.modelVariant;
    
    if (variant) {
      car.variant = variant;
      
      // Update display title
      const parts = [];
      if (car.make) parts.push(car.make);
      if (car.model) parts.push(car.model);
      if (car.engineSize) parts.push(`${car.engineSize.toFixed(1)}L`);
      if (variant) parts.push(variant);
      if (car.fuelType) parts.push(car.fuelType);
      
      car.displayTitle = parts.join(' ');
      
      await car.save();
      
      console.log('\n=== AFTER ===');
      console.log('Variant:', car.variant);
      console.log('Display Title:', car.displayTitle);
      console.log('\n✅ Successfully updated!');
    } else {
      console.log('\n⚠️  No variant data available from API');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

testVariantFix();
