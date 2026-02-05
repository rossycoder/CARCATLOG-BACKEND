/**
 * Fix car using EXISTING data only - NO API calls
 * Updates running costs and MOT data from VehicleHistory and MOT history
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function fixCarFromExistingData(registration) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const vrm = registration.toUpperCase().replace(/\s/g, '');
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: vrm });
    
    if (!car) {
      console.log(`❌ Car not found: ${registration}`);
      process.exit(1);
    }

    console.log('\n📋 Current Car Data:');
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Variant: ${car.variant || 'null'}`);
    console.log(`   Running Costs: ${car.runningCosts?.fuelEconomy?.combined || 'null'}`);
    console.log(`   MOT Due: ${car.motDue || 'null'}`);

    let updated = false;

    // Step 1: Fix MOT Due/Expiry from MOT History
    if ((!car.motDue || !car.motExpiry) && car.motHistory && car.motHistory.length > 0) {
      console.log('\n🔧 Fixing MOT data from MOT history...');
      
      const latestTest = car.motHistory[0];
      if (latestTest && latestTest.expiryDate) {
        car.motExpiry = latestTest.expiryDate;
        car.motDue = latestTest.expiryDate;
        
        // Determine MOT status
        const expiryDate = new Date(latestTest.expiryDate);
        const today = new Date();
        
        if (expiryDate > today) {
          car.motStatus = 'Valid';
        } else {
          car.motStatus = 'Expired';
        }
        
        console.log(`   ✅ MOT Expiry: ${expiryDate.toLocaleDateString()}`);
        console.log(`   ✅ MOT Status: ${car.motStatus}`);
        updated = true;
      }
    }

    // Step 2: Fix Running Costs from VehicleHistory
    const history = await VehicleHistory.findOne({ vrm: vrm });
    
    if (history) {
      console.log('\n✅ VehicleHistory found');
      console.log(`   Make: ${history.make || 'null'}`);
      console.log(`   Model: ${history.model || 'null'}`);
      console.log(`   Variant: ${history.variant || 'null'}`);
      
      // Update model/variant if missing
      if (history.model && (!car.model || car.model === 'Unknown')) {
        car.model = history.model;
        console.log(`\n🔧 Updated model: ${car.model}`);
        updated = true;
      }
      
      if (history.variant && (!car.variant || car.variant.includes('L Petrol') || car.variant.includes('L Diesel'))) {
        car.variant = history.variant;
        console.log(`🔧 Updated variant: ${car.variant}`);
        updated = true;
      }
      
      // Check if running costs exist in VehicleHistory
      const hasRunningCosts = history.urbanMpg || history.extraUrbanMpg || 
                             history.combinedMpg || history.co2Emissions || 
                             history.insuranceGroup || history.annualTax;
      
      if (hasRunningCosts) {
        console.log('\n🔧 Updating running costs from VehicleHistory...');
        
        car.runningCosts = {
          fuelEconomy: {
            urban: history.urbanMpg || null,
            extraUrban: history.extraUrbanMpg || null,
            combined: history.combinedMpg || null
          },
          co2Emissions: history.co2Emissions || null,
          insuranceGroup: history.insuranceGroup || null,
          annualTax: history.annualTax || null
        };
        
        // Update individual fields
        car.co2Emissions = history.co2Emissions || car.co2Emissions;
        car.insuranceGroup = history.insuranceGroup || car.insuranceGroup;
        car.annualTax = history.annualTax || car.annualTax;
        car.fuelEconomyUrban = history.urbanMpg || car.fuelEconomyUrban;
        car.fuelEconomyExtraUrban = history.extraUrbanMpg || car.fuelEconomyExtraUrban;
        car.fuelEconomyCombined = history.combinedMpg || car.fuelEconomyCombined;
        
        console.log(`   Urban MPG: ${history.urbanMpg || 'N/A'}`);
        console.log(`   Extra Urban MPG: ${history.extraUrbanMpg || 'N/A'}`);
        console.log(`   Combined MPG: ${history.combinedMpg || 'N/A'}`);
        console.log(`   CO2: ${history.co2Emissions || 'N/A'}g/km`);
        console.log(`   Insurance: Group ${history.insuranceGroup || 'N/A'}`);
        console.log(`   Tax: £${history.annualTax || 'N/A'}/year`);
        
        updated = true;
      } else {
        console.log('\n⚠️  No running costs in VehicleHistory');
        console.log('   This vehicle may need Vehicle Specs API call (£0.05)');
      }
    } else {
      console.log('\n⚠️  No VehicleHistory found');
      console.log('   Need to fetch from API first');
    }

    // Save if updated
    if (updated) {
      await car.save();
      console.log('\n✅ Car updated successfully! (NO API COST)');
    } else {
      console.log('\n⚠️  No updates needed or no data available');
    }

    // Verify
    const updatedCar = await Car.findOne({ registrationNumber: vrm });
    console.log('\n📊 Final Car Data:');
    console.log(`   Model: ${updatedCar.model}`);
    console.log(`   Variant: ${updatedCar.variant}`);
    console.log(`   Combined MPG: ${updatedCar.runningCosts?.fuelEconomy?.combined || 'null'}`);
    console.log(`   CO2: ${updatedCar.co2Emissions || 'null'}g/km`);
    console.log(`   MOT Due: ${updatedCar.motDue ? new Date(updatedCar.motDue).toLocaleDateString() : 'null'}`);
    console.log(`   MOT Status: ${updatedCar.motStatus || 'null'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Get registration from command line
const registration = process.argv[2] || 'EX09MYY';
fixCarFromExistingData(registration);
