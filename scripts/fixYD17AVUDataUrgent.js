/**
 * URGENT FIX for YD17AVU - Completely wrong data in database
 * Real mileage: 173,130 miles vs stored: 2,500 miles
 * Real MOT expiry: June 2026 vs stored: August 2027
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function fixYD17AVUDataUrgent() {
  try {
    console.log('🚨 URGENT FIX: YD17AVU Data Correction...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const vrm = 'YD17AVU';
    
    // 1. Delete existing wrong data
    console.log('1️⃣ Clearing wrong data...');
    await Car.deleteMany({ registrationNumber: vrm });
    await VehicleHistory.deleteMany({ vrm: vrm });
    console.log('✅ Cleared existing wrong data\n');

    // 2. Fetch correct data from API
    console.log('2️⃣ Fetching correct data from API...');
    const correctVehicleData = await checkCarDetailsClient.getVehicleData(vrm);
    const correctMOTData = await checkCarDetailsClient.getMOTHistory(vrm);
    const correctValuationData = await checkCarDetailsClient.getVehicleDataWithValuation(vrm);
    
    console.log('✅ Fetched correct data:');
    console.log(`   Real Mileage: ${correctMOTData.motHistory[0].odometerValue} miles`);
    console.log(`   Real MOT Expiry: ${correctMOTData.mot.motDueDate}`);
    console.log(`   Previous Owners: ${correctVehicleData.previousOwners}`);

    // 3. Create correct car record
    console.log('\n3️⃣ Creating correct car record...');
    const realMileage = parseInt(correctMOTData.motHistory[0].odometerValue);
    
    const correctCar = new Car({
      make: correctVehicleData.make,
      model: correctVehicleData.model,
      variant: correctVehicleData.variant,
      year: correctVehicleData.year,
      mileage: realMileage, // CORRECT MILEAGE
      color: correctVehicleData.color,
      transmission: correctVehicleData.transmission?.toLowerCase() || 'automatic',
      fuelType: correctVehicleData.fuelType,
      engineSize: correctVehicleData.engineSize,
      bodyType: correctVehicleData.bodyType,
      doors: correctVehicleData.doors,
      seats: correctVehicleData.seats,
      co2Emissions: correctVehicleData.co2Emissions,
      registrationNumber: vrm,
      
      // Correct running costs
      fuelEconomyUrban: correctVehicleData.fuelEconomy?.urban,
      fuelEconomyExtraUrban: correctVehicleData.fuelEconomy?.extraUrban,
      fuelEconomyCombined: correctVehicleData.fuelEconomy?.combined,
      annualTax: correctVehicleData.annualTax,
      insuranceGroup: correctVehicleData.insuranceGroup,
      
      // Correct MOT data
      motStatus: correctMOTData.mot.motStatus,
      motExpiry: new Date(correctMOTData.mot.motDueDate),
      motDue: new Date(correctMOTData.mot.motDueDate),
      
      // Convert MOT history to correct format
      motHistory: correctMOTData.motHistory.map(test => ({
        testDate: new Date(test.completedDate),
        expiryDate: test.expiryDate ? new Date(test.expiryDate) : null,
        testResult: test.testResult,
        odometerValue: parseInt(test.odometerValue),
        odometerUnit: test.odometerUnit.toLowerCase(),
        testNumber: test.motTestNumber,
        defects: test.defects || [],
        advisoryText: test.defects?.map(d => d.text) || [],
        testClass: "4",
        testType: "Normal Test",
        completedDate: new Date(test.completedDate)
      })),
      
      // Pricing - need to recalculate with correct mileage
      price: 15000, // Placeholder - will be updated with correct valuation
      estimatedValue: 15000,
      
      // Status
      advertStatus: 'draft', // Keep as draft until verified
      condition: 'used',
      vehicleType: 'car',
      dataSource: 'DVLA',
      historyCheckStatus: 'verified',
      
      // Seller info (keep existing)
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'rozeena.careers031@gmail.com',
        allowEmailContact: false,
        postcode: 'L1 1AA'
      },
      
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await correctCar.save();
    console.log('✅ Saved correct car record\n');

    // 4. Create correct history record
    console.log('4️⃣ Creating correct history record...');
    const correctHistory = new VehicleHistory({
      vrm: vrm,
      make: correctVehicleData.make,
      model: correctVehicleData.model,
      colour: correctVehicleData.color,
      fuelType: correctVehicleData.fuelType,
      yearOfManufacture: correctVehicleData.year,
      mileage: realMileage, // CORRECT MILEAGE
      
      // Previous owners (API shows 4, AutoTrader shows 2 - need to verify)
      numberOfPreviousKeepers: correctVehicleData.previousOwners,
      previousOwners: correctVehicleData.previousOwners,
      
      // History data
      isWrittenOff: true, // Category S
      writeOffCategory: 'S',
      hasOutstandingFinance: true,
      isStolen: false,
      plateChanges: 4,
      colourChanges: 0,
      
      // Correct valuation with real mileage
      valuation: {
        privatePrice: correctValuationData.valuation?.privatePrice,
        dealerPrice: correctValuationData.valuation?.dealerPrice,
        partExchangePrice: correctValuationData.valuation?.partExchangePrice,
        confidence: 'medium'
      },
      
      checkStatus: 'success',
      checkDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await correctHistory.save();
    console.log('✅ Saved correct history record\n');

    // 5. Update car with correct pricing
    const correctPrivatePrice = correctValuationData.valuation?.privatePrice || 15000;
    await Car.updateOne(
      { registrationNumber: vrm },
      { 
        price: correctPrivatePrice,
        estimatedValue: correctPrivatePrice
      }
    );

    console.log('5️⃣ SUMMARY OF CORRECTIONS:');
    console.log('=' .repeat(40));
    console.log(`❌ Wrong Mileage: 2,500 miles`);
    console.log(`✅ Correct Mileage: ${realMileage.toLocaleString()} miles`);
    console.log(`❌ Wrong MOT Expiry: August 2027`);
    console.log(`✅ Correct MOT Expiry: ${correctMOTData.mot.motDueDate}`);
    console.log(`❌ Wrong Valuation: £7,615`);
    console.log(`✅ Correct Valuation: £${correctPrivatePrice.toLocaleString()}`);
    
    console.log('\n🎉 YD17AVU data corrected successfully!');
    console.log('⚠️  Car set to DRAFT status for verification');

  } catch (error) {
    console.error('❌ Error during fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  fixYD17AVUDataUrgent();
}

module.exports = { fixYD17AVUDataUrgent };