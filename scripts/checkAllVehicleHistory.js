/**
 * Check All Vehicle History Records
 * Verifies that vehicle history data is correctly saved in the database
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const Car = require('../models/Car');

async function checkAllVehicleHistory() {
  try {
    console.log('🔍 Checking all vehicle history records...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Get all vehicle history records
    const histories = await VehicleHistory.find({}).sort({ checkDate: -1 });
    console.log(`📊 Total Vehicle History Records: ${histories.length}\n`);
    
    if (histories.length === 0) {
      console.log('❌ No vehicle history records found in database');
      return;
    }
    
    // Check each history record
    for (const history of histories) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📋 VRM: ${history.vrm}`);
      console.log(`🆔 History ID: ${history._id}`);
      console.log(`📅 Check Date: ${history.checkDate.toLocaleDateString('en-GB')}`);
      console.log(`✅ Check Status: ${history.checkStatus}`);
      console.log(`🔧 API Provider: ${history.apiProvider}`);
      
      // Check basic vehicle data
      console.log('\n🚗 Basic Vehicle Data:');
      console.log(`   Make: ${history.make || 'Missing'}`);
      console.log(`   Model: ${history.model || 'Missing'}`);
      console.log(`   Variant: ${history.variant || 'Missing'}`);
      console.log(`   Color: ${history.colour || 'Missing'}`);
      console.log(`   Year: ${history.yearOfManufacture || 'Missing'}`);
      console.log(`   Fuel Type: ${history.fuelType || 'Missing'}`);
      console.log(`   Body Type: ${history.bodyType || 'Missing'}`);
      console.log(`   Transmission: ${history.transmission || 'Missing'}`);
      console.log(`   Engine Capacity: ${history.engineCapacity || 'Missing'}cc`);
      console.log(`   Emission Class: ${history.emissionClass || 'Missing'}`);
      
      // Check vehicle specs
      console.log('\n📐 Vehicle Specifications:');
      console.log(`   Doors: ${history.doors || 'Missing'}`);
      console.log(`   Seats: ${history.seats || 'Missing'}`);
      console.log(`   Gearbox: ${history.gearbox || 'Missing'}`);
      
      // Check running costs
      console.log('\n💰 Running Costs:');
      console.log(`   Urban MPG: ${history.urbanMpg || 'Missing'}`);
      console.log(`   Extra Urban MPG: ${history.extraUrbanMpg || 'Missing'}`);
      console.log(`   Combined MPG: ${history.combinedMpg || 'Missing'}`);
      console.log(`   CO2 Emissions: ${history.co2Emissions || 'Missing'} g/km`);
      console.log(`   Insurance Group: ${history.insuranceGroup || 'Missing'}`);
      console.log(`   Annual Tax: £${history.annualTax || 'Missing'}`);
      
      // Check history data
      console.log('\n📜 Vehicle History:');
      console.log(`   Previous Owners: ${history.numberOfPreviousKeepers || history.previousOwners || 0}`);
      console.log(`   Plate Changes: ${history.plateChanges || 0}`);
      console.log(`   Color Changes: ${history.colourChanges || 0}`);
      console.log(`   V5C Certificates: ${history.v5cCertificateCount || 0}`);
      console.log(`   VIC Count: ${history.vicCount || 0}`);
      
      // Check flags
      console.log('\n🚨 History Flags:');
      console.log(`   Written Off: ${history.isWrittenOff ? '⚠️  YES' : '✅ No'}`);
      if (history.isWrittenOff) {
        console.log(`   Write-Off Category: ${history.writeOffCategory || 'Unknown'}`);
        if (history.writeOffDetails && history.writeOffDetails.date) {
          console.log(`   Write-Off Date: ${new Date(history.writeOffDetails.date).toLocaleDateString('en-GB')}`);
        }
      }
      console.log(`   Stolen: ${history.isStolen ? '⚠️  YES' : '✅ No'}`);
      console.log(`   Scrapped: ${history.isScrapped ? '⚠️  YES' : '✅ No'}`);
      console.log(`   Imported: ${history.isImported ? '⚠️  YES' : '✅ No'}`);
      console.log(`   Exported: ${history.isExported ? '⚠️  YES' : '✅ No'}`);
      console.log(`   Outstanding Finance: ${history.hasOutstandingFinance ? '⚠️  YES' : '✅ No'}`);
      console.log(`   Accident History: ${history.hasAccidentHistory ? '⚠️  YES' : '✅ No'}`);
      
      // Check MOT history
      console.log('\n🔧 MOT History:');
      if (history.motHistory && history.motHistory.length > 0) {
        console.log(`   Total MOT Tests: ${history.motHistory.length}`);
        const latestMOT = history.motHistory[0];
        console.log(`   Latest Test Date: ${latestMOT.testDate ? new Date(latestMOT.testDate).toLocaleDateString('en-GB') : 'Missing'}`);
        console.log(`   Latest Test Result: ${latestMOT.testResult || 'Missing'}`);
        console.log(`   Latest Expiry Date: ${latestMOT.expiryDate ? new Date(latestMOT.expiryDate).toLocaleDateString('en-GB') : 'Missing'}`);
        console.log(`   Latest Mileage: ${latestMOT.odometerValue || 'Missing'} miles`);
      } else {
        console.log(`   ❌ No MOT history found`);
      }
      
      // Check valuation
      console.log('\n💷 Valuation:');
      if (history.valuation && history.valuation.privatePrice) {
        console.log(`   Private Price: £${history.valuation.privatePrice.toLocaleString()}`);
        console.log(`   Dealer Price: £${history.valuation.dealerPrice?.toLocaleString() || 'N/A'}`);
        console.log(`   Part Exchange: £${history.valuation.partExchangePrice?.toLocaleString() || 'N/A'}`);
        console.log(`   Confidence: ${history.valuation.confidence || 'N/A'}`);
      } else {
        console.log(`   ❌ No valuation data found`);
      }
      
      // Check if linked to a car
      console.log('\n🔗 Car Linkage:');
      const linkedCar = await Car.findOne({ historyCheckId: history._id });
      if (linkedCar) {
        console.log(`   ✅ Linked to car: ${linkedCar._id}`);
        console.log(`   Car Registration: ${linkedCar.registrationNumber}`);
        console.log(`   Car Make/Model: ${linkedCar.make} ${linkedCar.model}`);
      } else {
        console.log(`   ⚠️  Not linked to any car (orphaned record)`);
      }
      
      // Data completeness score
      const fields = [
        history.make, history.model, history.variant, history.colour,
        history.yearOfManufacture, history.fuelType, history.bodyType,
        history.transmission, history.engineCapacity, history.emissionClass,
        history.doors, history.seats, history.urbanMpg, history.combinedMpg,
        history.co2Emissions, history.insuranceGroup, history.annualTax
      ];
      const filledFields = fields.filter(f => f !== null && f !== undefined && f !== 'Unknown').length;
      const completeness = Math.round((filledFields / fields.length) * 100);
      
      console.log(`\n📊 Data Completeness: ${completeness}% (${filledFields}/${fields.length} fields)`);
      console.log('');
    }
    
    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Records: ${histories.length}`);
    
    const withMOT = histories.filter(h => h.motHistory && h.motHistory.length > 0).length;
    const withValuation = histories.filter(h => h.valuation && h.valuation.privatePrice).length;
    const withRunningCosts = histories.filter(h => h.combinedMpg || h.co2Emissions).length;
    const writeOffs = histories.filter(h => h.isWrittenOff).length;
    const stolen = histories.filter(h => h.isStolen).length;
    const finance = histories.filter(h => h.hasOutstandingFinance).length;
    
    console.log(`\nData Coverage:`);
    console.log(`   With MOT History: ${withMOT} (${Math.round(withMOT/histories.length*100)}%)`);
    console.log(`   With Valuation: ${withValuation} (${Math.round(withValuation/histories.length*100)}%)`);
    console.log(`   With Running Costs: ${withRunningCosts} (${Math.round(withRunningCosts/histories.length*100)}%)`);
    
    console.log(`\nHistory Flags:`);
    console.log(`   Written Off: ${writeOffs}`);
    console.log(`   Stolen: ${stolen}`);
    console.log(`   Outstanding Finance: ${finance}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the check
checkAllVehicleHistory();
