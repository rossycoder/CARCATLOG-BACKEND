/**
 * Fix Advert Edit Page Data Issues
 * - Ensure price comes from valuation API
 * - Ensure MOT data comes from CheckCarDetails/DVLA API
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const enhancedVehicleService = require('../services/enhancedVehicleService');
const HistoryService = require('../services/historyService');

const advertId = 'a1fe37e7-cd58-4584-89c8-200904318c7a';
const historyService = new HistoryService();

async function fixAdvertData() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find the car by advertId
    console.log(`📋 Looking for advert: ${advertId}`);
    const car = await Car.findOne({ advertId: advertId });

    if (!car) {
      console.log('❌ No car found with this advertId');
      return;
    }

    console.log('\n📊 CURRENT CAR DATA:');
    console.log('==================');
    console.log('Registration:', car.registrationNumber);
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('Display Title:', car.displayTitle);
    console.log('Current Price:', car.price);
    console.log('Current Estimated Value:', car.estimatedValue);
    console.log('Current MOT Status:', car.motStatus);
    console.log('Current MOT Due:', car.motDue);
    console.log('Current MOT Expiry:', car.motExpiry);

    if (!car.registrationNumber) {
      console.log('❌ No registration number found - cannot fetch enhanced data');
      return;
    }

    // Fetch enhanced data from APIs
    console.log('\n🔍 Fetching enhanced data from APIs...');
    const enhancedData = await enhancedVehicleService.getEnhancedVehicleData(car.registrationNumber, false);

    console.log('\n📊 ENHANCED DATA RECEIVED:');
    console.log('==================');
    console.log('Data Sources:', enhancedData.dataSources);

    // Extract valuation price
    let valuationPrice = null;
    console.log('\n💰 RAW VALUATION DATA:');
    console.log(JSON.stringify(enhancedData.valuation, null, 2));
    
    // Try different valuation price fields
    if (enhancedData.valuation?.estimatedValue?.retail) {
      valuationPrice = parseInt(enhancedData.valuation.estimatedValue.retail);
    } else if (enhancedData.valuation?.dealerPrice?.value) {
      valuationPrice = enhancedData.valuation.dealerPrice.value;
    } else if (enhancedData.valuation?.dealerPrice) {
      valuationPrice = enhancedData.valuation.dealerPrice;
    }
    
    if (valuationPrice) {
      console.log('\n💰 VALUATION DATA:');
      console.log('  Retail Price:', valuationPrice);
      console.log('  Private Price:', enhancedData.valuation?.estimatedValue?.private || enhancedData.valuation?.privatePrice?.value || enhancedData.valuation?.privatePrice);
      console.log('  Trade Price:', enhancedData.valuation?.estimatedValue?.trade || enhancedData.valuation?.tradePrice?.value || enhancedData.valuation?.tradePrice);
    }

    // Extract MOT data
    let motExpiry = null;
    let motStatus = null;
    console.log('\n🔧 RAW MOT DATA:');
    console.log('motExpiry:', JSON.stringify(enhancedData.motExpiry, null, 2));
    console.log('motStatus:', JSON.stringify(enhancedData.motStatus, null, 2));
    console.log('mot:', JSON.stringify(enhancedData.mot, null, 2));
    
    // Try to get MOT from different possible locations
    if (enhancedData.motExpiry?.value) {
      motExpiry = enhancedData.motExpiry.value;
      motStatus = enhancedData.motStatus?.value || 'Valid';
    } else if (enhancedData.motExpiry) {
      motExpiry = enhancedData.motExpiry;
      motStatus = enhancedData.motStatus || 'Valid';
    } else if (enhancedData.mot?.expiryDate) {
      motExpiry = enhancedData.mot.expiryDate;
      motStatus = enhancedData.mot.status || 'Valid';
    }
    
    if (motExpiry) {
      console.log('\n🔧 MOT DATA:');
      console.log('  Expiry Date:', motExpiry);
      console.log('  Status:', motStatus);
    } else {
      console.log('\n⚠️ No MOT data found in enhanced data');
      console.log('  Fetching MOT data from history API...');
      
      try {
        const motHistory = await historyService.getMOTHistory(car.registrationNumber);
        console.log('\n🔧 MOT HISTORY DATA:');
        console.log(JSON.stringify(motHistory, null, 2));
        
        if (motHistory) {
          // Get the expiry date and status from the response
          motExpiry = motHistory.expiryDate;
          motStatus = motHistory.currentStatus || 'Valid';
          console.log('\n✅ MOT data fetched from history API:');
          console.log('  Expiry Date:', motExpiry);
          console.log('  Status:', motStatus);
        }
      } catch (motError) {
        console.error('❌ Failed to fetch MOT data:', motError.message);
      }
    }

    // Update the car record
    console.log('\n✏️ UPDATING CAR RECORD...');
    const updates = {};

    if (valuationPrice) {
      updates.price = valuationPrice;
      updates.estimatedValue = valuationPrice;
      console.log('  ✓ Setting price to:', valuationPrice);
    }

    if (motExpiry) {
      updates.motExpiry = motExpiry;
      updates.motDue = motExpiry;
      updates.motStatus = motStatus;
      console.log('  ✓ Setting MOT expiry to:', motExpiry);
      console.log('  ✓ Setting MOT status to:', motStatus);
    }

    // Update running costs if available
    if (enhancedData.runningCosts) {
      if (enhancedData.runningCosts.fuelEconomy?.urban?.value) {
        updates.fuelEconomyUrban = enhancedData.runningCosts.fuelEconomy.urban.value;
        console.log('  ✓ Setting urban MPG to:', updates.fuelEconomyUrban);
      }
      if (enhancedData.runningCosts.fuelEconomy?.extraUrban?.value) {
        updates.fuelEconomyExtraUrban = enhancedData.runningCosts.fuelEconomy.extraUrban.value;
        console.log('  ✓ Setting extra urban MPG to:', updates.fuelEconomyExtraUrban);
      }
      if (enhancedData.runningCosts.fuelEconomy?.combined?.value) {
        updates.fuelEconomyCombined = enhancedData.runningCosts.fuelEconomy.combined.value;
        console.log('  ✓ Setting combined MPG to:', updates.fuelEconomyCombined);
      }
      if (enhancedData.runningCosts.annualTax?.value) {
        updates.annualTax = enhancedData.runningCosts.annualTax.value;
        console.log('  ✓ Setting annual tax to:', updates.annualTax);
      }
      if (enhancedData.runningCosts.insuranceGroup?.value) {
        updates.insuranceGroup = enhancedData.runningCosts.insuranceGroup.value;
        console.log('  ✓ Setting insurance group to:', updates.insuranceGroup);
      }
      if (enhancedData.runningCosts.co2Emissions?.value) {
        updates.co2Emissions = enhancedData.runningCosts.co2Emissions.value;
        console.log('  ✓ Setting CO2 emissions to:', updates.co2Emissions);
      }
    }

    if (Object.keys(updates).length > 0) {
      await Car.findByIdAndUpdate(car._id, updates);
      console.log('\n✅ Car record updated successfully!');
    } else {
      console.log('\n⚠️ No updates needed - all data is already correct');
    }

    // Verify the updates
    const updatedCar = await Car.findById(car._id);
    console.log('\n� UPDlATED CAR DATA:');
    console.log('==================');
    console.log('Price:', updatedCar.price);
    console.log('Estimated Value:', updatedCar.estimatedValue);
    console.log('MOT Status:', updatedCar.motStatus);
    console.log('MOT Due:', updatedCar.motDue);
    console.log('MOT Expiry:', updatedCar.motExpiry);
    console.log('Urban MPG:', updatedCar.fuelEconomyUrban);
    console.log('Extra Urban MPG:', updatedCar.fuelEconomyExtraUrban);
    console.log('Combined MPG:', updatedCar.fuelEconomyCombined);
    console.log('Annual Tax:', updatedCar.annualTax);
    console.log('Insurance Group:', updatedCar.insuranceGroup);
    console.log('CO2 Emissions:', updatedCar.co2Emissions);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

fixAdvertData();
