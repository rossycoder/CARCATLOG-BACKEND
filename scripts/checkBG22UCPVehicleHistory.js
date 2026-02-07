/**
 * Check BG22UCP Vehicle History
 * Specifically checking write-off category and complete history data
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const Car = require('../models/Car');

async function checkBG22UCPHistory() {
  try {
    console.log('🔍 Checking BG22UCP Vehicle History...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    const vrm = 'BG22UCP';
    
    // Find the car
    const car = await Car.findOne({ 
      registrationNumber: { $regex: new RegExp(vrm, 'i') } 
    });
    
    if (!car) {
      console.log(`❌ Car not found with registration: ${vrm}`);
      return;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚗 CAR INFORMATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Registration: ${car.registrationNumber}`);
    console.log(`Car ID: ${car._id}`);
    console.log(`Make/Model: ${car.make} ${car.model}`);
    console.log(`Variant: ${car.variant || 'N/A'}`);
    console.log(`Year: ${car.year}`);
    console.log(`Price: £${car.price?.toLocaleString() || 'N/A'}`);
    console.log(`Mileage: ${car.mileage?.toLocaleString() || 'N/A'} miles`);
    console.log(`History Check ID: ${car.historyCheckId || 'Not linked'}`);
    
    // Find vehicle history
    let history = null;
    
    if (car.historyCheckId) {
      history = await VehicleHistory.findById(car.historyCheckId);
      console.log(`\n✅ Vehicle History found via car link`);
    } else {
      // Try to find by VRM
      history = await VehicleHistory.findOne({ 
        vrm: vrm.toUpperCase().replace(/\s/g, '') 
      }).sort({ checkDate: -1 });
      
      if (history) {
        console.log(`\n✅ Vehicle History found via VRM search`);
      }
    }
    
    if (!history) {
      console.log(`\n❌ No Vehicle History record found for ${vrm}`);
      console.log(`\n⚠️  This means vehicle history data was never fetched from API`);
      console.log(`   or the data was not saved to VehicleHistory collection.`);
      return;
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 VEHICLE HISTORY RECORD');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`History ID: ${history._id}`);
    console.log(`VRM: ${history.vrm}`);
    console.log(`Check Date: ${history.checkDate.toLocaleString('en-GB')}`);
    console.log(`Check Status: ${history.checkStatus}`);
    console.log(`API Provider: ${history.apiProvider}`);
    console.log(`Test Mode: ${history.testMode ? 'Yes' : 'No'}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚨 WRITE-OFF STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Is Written Off: ${history.isWrittenOff ? '⚠️  YES' : '✅ NO'}`);
    console.log(`Write-Off Category: ${history.writeOffCategory || 'none'}`);
    
    if (history.writeOffDetails) {
      console.log(`\nWrite-Off Details:`);
      console.log(`   Category: ${history.writeOffDetails.category || 'N/A'}`);
      console.log(`   Date: ${history.writeOffDetails.date ? new Date(history.writeOffDetails.date).toLocaleDateString('en-GB') : 'N/A'}`);
      console.log(`   Description: ${history.writeOffDetails.description || 'N/A'}`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📜 COMPLETE VEHICLE HISTORY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🚗 Basic Vehicle Data:');
    console.log(`   Make: ${history.make || 'N/A'}`);
    console.log(`   Model: ${history.model || 'N/A'}`);
    console.log(`   Variant: ${history.variant || 'N/A'}`);
    console.log(`   Color: ${history.colour || 'N/A'}`);
    console.log(`   Year: ${history.yearOfManufacture || 'N/A'}`);
    console.log(`   Fuel Type: ${history.fuelType || 'N/A'}`);
    console.log(`   Body Type: ${history.bodyType || 'N/A'}`);
    console.log(`   Transmission: ${history.transmission || 'N/A'}`);
    console.log(`   Engine: ${history.engineCapacity || 'N/A'}cc`);
    console.log(`   Emission Class: ${history.emissionClass || 'N/A'}`);
    
    console.log('\n📐 Vehicle Specifications:');
    console.log(`   Doors: ${history.doors || 'N/A'}`);
    console.log(`   Seats: ${history.seats || 'N/A'}`);
    console.log(`   Gearbox: ${history.gearbox || 'N/A'}`);
    
    console.log('\n💰 Running Costs:');
    console.log(`   Urban MPG: ${history.urbanMpg || 'N/A'}`);
    console.log(`   Extra Urban MPG: ${history.extraUrbanMpg || 'N/A'}`);
    console.log(`   Combined MPG: ${history.combinedMpg || 'N/A'}`);
    console.log(`   CO2 Emissions: ${history.co2Emissions || 'N/A'} g/km`);
    console.log(`   Insurance Group: ${history.insuranceGroup || 'N/A'}`);
    console.log(`   Annual Tax: £${history.annualTax || 'N/A'}`);
    
    console.log('\n👥 Ownership History:');
    console.log(`   Previous Owners: ${history.numberOfPreviousKeepers || history.previousOwners || 0}`);
    console.log(`   Plate Changes: ${history.plateChanges || 0}`);
    console.log(`   Color Changes: ${history.colourChanges || 0}`);
    console.log(`   V5C Certificates: ${history.v5cCertificateCount || 0}`);
    
    console.log('\n🚨 History Flags:');
    console.log(`   Written Off: ${history.isWrittenOff ? '⚠️  YES' : '✅ No'}`);
    console.log(`   Stolen: ${history.isStolen ? '⚠️  YES' : '✅ No'}`);
    console.log(`   Scrapped: ${history.isScrapped ? '⚠️  YES' : '✅ No'}`);
    console.log(`   Imported: ${history.isImported ? '⚠️  YES' : '✅ No'}`);
    console.log(`   Exported: ${history.isExported ? '⚠️  YES' : '✅ No'}`);
    console.log(`   Outstanding Finance: ${history.hasOutstandingFinance ? '⚠️  YES' : '✅ No'}`);
    console.log(`   Accident History: ${history.hasAccidentHistory ? '⚠️  YES' : '✅ No'}`);
    
    if (history.hasAccidentHistory && history.accidentDetails) {
      console.log(`\n   Accident Details:`);
      console.log(`      Count: ${history.accidentDetails.count || 0}`);
      console.log(`      Severity: ${history.accidentDetails.severity || 'unknown'}`);
      if (history.accidentDetails.dates && history.accidentDetails.dates.length > 0) {
        console.log(`      Dates: ${history.accidentDetails.dates.map(d => new Date(d).toLocaleDateString('en-GB')).join(', ')}`);
      }
    }
    
    console.log('\n🔧 MOT History:');
    if (history.motHistory && history.motHistory.length > 0) {
      console.log(`   Total MOT Tests: ${history.motHistory.length}`);
      const latestMOT = history.motHistory[0];
      console.log(`\n   Latest MOT Test:`);
      console.log(`      Test Date: ${latestMOT.testDate ? new Date(latestMOT.testDate).toLocaleDateString('en-GB') : 'N/A'}`);
      console.log(`      Result: ${latestMOT.testResult || 'N/A'}`);
      console.log(`      Expiry Date: ${latestMOT.expiryDate ? new Date(latestMOT.expiryDate).toLocaleDateString('en-GB') : 'N/A'}`);
      console.log(`      Mileage: ${latestMOT.odometerValue?.toLocaleString() || 'N/A'} miles`);
      
      if (latestMOT.defects && latestMOT.defects.length > 0) {
        console.log(`\n   Defects/Advisories: ${latestMOT.defects.length}`);
        latestMOT.defects.slice(0, 3).forEach((defect, i) => {
          console.log(`      ${i + 1}. [${defect.type}] ${defect.text}`);
        });
        if (latestMOT.defects.length > 3) {
          console.log(`      ... and ${latestMOT.defects.length - 3} more`);
        }
      }
    } else {
      console.log(`   ❌ No MOT history found`);
    }
    
    console.log('\n💷 Valuation:');
    if (history.valuation && history.valuation.privatePrice) {
      console.log(`   Private Price: £${history.valuation.privatePrice.toLocaleString()}`);
      console.log(`   Dealer Price: £${history.valuation.dealerPrice?.toLocaleString() || 'N/A'}`);
      console.log(`   Part Exchange: £${history.valuation.partExchangePrice?.toLocaleString() || 'N/A'}`);
      console.log(`   Confidence: ${history.valuation.confidence || 'N/A'}`);
    } else {
      console.log(`   ❌ No valuation data`);
    }
    
    // Data completeness
    const fields = [
      history.make, history.model, history.variant, history.colour,
      history.yearOfManufacture, history.fuelType, history.bodyType,
      history.transmission, history.engineCapacity, history.emissionClass,
      history.doors, history.seats, history.urbanMpg, history.combinedMpg,
      history.co2Emissions, history.insuranceGroup, history.annualTax
    ];
    const filledFields = fields.filter(f => f !== null && f !== undefined && f !== 'Unknown').length;
    const completeness = Math.round((filledFields / fields.length) * 100);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Data Completeness: ${completeness}% (${filledFields}/${fields.length} fields)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (history.isWrittenOff) {
      console.log(`\n⚠️  WARNING: This vehicle has been written off!`);
      console.log(`   Category: ${history.writeOffCategory}`);
      console.log(`   This information should be clearly displayed to buyers.`);
    } else {
      console.log(`\n✅ No write-off record found for this vehicle.`);
    }
    
    if (history.isStolen) {
      console.log(`\n🚨 ALERT: This vehicle has been reported stolen!`);
    }
    
    if (history.hasOutstandingFinance) {
      console.log(`\n💰 NOTICE: This vehicle may have outstanding finance.`);
    }
    
    console.log(`\nData Quality: ${completeness >= 90 ? '✅ Excellent' : completeness >= 70 ? '⚠️  Good' : '❌ Poor'}`);
    console.log(`MOT History: ${history.motHistory && history.motHistory.length > 0 ? '✅ Available' : '❌ Missing'}`);
    console.log(`Running Costs: ${history.combinedMpg ? '✅ Available' : '❌ Missing'}`);
    console.log(`Valuation: ${history.valuation && history.valuation.privatePrice ? '✅ Available' : '❌ Missing'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the check
checkBG22UCPHistory();
