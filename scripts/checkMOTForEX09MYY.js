const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Car = require('../models/Car');
const enhancedVehicleService = require('../services/enhancedVehicleService');

async function checkMOT() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const registration = 'EX09MYY';
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }

    console.log('\n📋 Current Car Data:');
    console.log('Registration:', car.registrationNumber);
    console.log('MOT Due:', car.motDue);
    console.log('MOT Expiry:', car.motExpiry);
    console.log('MOT Status:', car.motStatus);

    // Fetch enhanced data
    console.log('\n🔍 Fetching enhanced data from API...');
    const enhancedData = await enhancedVehicleService.getEnhancedVehicleData(registration);
    
    console.log('\n📊 Enhanced Data Structure:');
    console.log('Keys:', Object.keys(enhancedData));
    
    // Check for MOT data in various locations
    console.log('\n🔧 MOT Data Search:');
    console.log('enhancedData.motExpiry:', enhancedData.motExpiry);
    console.log('enhancedData.motDue:', enhancedData.motDue);
    console.log('enhancedData.motStatus:', enhancedData.motStatus);
    console.log('enhancedData.mot:', enhancedData.mot);
    console.log('enhancedData.valuation:', enhancedData.valuation ? 'exists' : 'null');
    
    if (enhancedData.valuation) {
      console.log('Valuation keys:', Object.keys(enhancedData.valuation));
      console.log('valuation.motExpiry:', enhancedData.valuation.motExpiry);
      console.log('valuation.motExpiryDate:', enhancedData.valuation.motExpiryDate);
    }

    // Try to update the car with MOT data
    const motExpiry = enhancedData.motExpiry || 
                     enhancedData.motDue || 
                     enhancedData.mot?.expiry ||
                     enhancedData.mot?.expiryDate ||
                     enhancedData.valuation?.motExpiry ||
                     enhancedData.valuation?.motExpiryDate;
                     
    const motStatus = enhancedData.motStatus || 
                     enhancedData.mot?.status ||
                     enhancedData.valuation?.motStatus;

    if (motExpiry || motStatus) {
      console.log('\n✅ Found MOT data!');
      console.log('MOT Expiry:', motExpiry);
      console.log('MOT Status:', motStatus);
      
      car.motDue = motExpiry;
      car.motExpiry = motExpiry;
      car.motStatus = motStatus;
      
      await car.save();
      console.log('\n💾 Car updated with MOT data');
    } else {
      console.log('\n⚠️ No MOT data found in API response');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkMOT();
