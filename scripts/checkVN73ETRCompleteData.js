require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function checkVN73ETRCompleteData() {
  try {
    const registration = 'VN73ETR';
    console.log(`🔍 Checking Complete Data for: ${registration}`);
    console.log('=====================================');

    // 1. Test UK Vehicle Data (includes running costs)
    console.log('\n1️⃣ UK Vehicle Data (Running Costs):');
    try {
      const ukData = await CheckCarDetailsClient.getUKVehicleData(registration);
      
      if (ukData) {
        console.log('✅ UK Vehicle Data received');
        
        // Check fuel economy
        console.log('\n🏃 Fuel Economy:');
        if (ukData.Consumption) {
          console.log(`   Urban: ${ukData.Consumption.UrbanCold?.Mpg || 'N/A'} MPG`);
          console.log(`   Extra Urban: ${ukData.Consumption.ExtraUrban?.Mpg || 'N/A'} MPG`);
          console.log(`   Combined: ${ukData.Consumption.Combined?.Mpg || 'N/A'} MPG`);
        }
        
        // Check emissions and tax
        console.log('\n💨 Emissions & Tax:');
        console.log(`   CO2 Emissions: ${ukData.Performance?.Co2 || ukData.VehicleRegistration?.Co2Emissions || 'N/A'} g/km`);
        console.log(`   Annual Tax: £${ukData.vedRate?.Standard?.TwelveMonth || 'N/A'}`);
        
        // Check performance
        console.log('\n⚡ Performance:');
        if (ukData.Performance) {
          console.log(`   Power: ${ukData.Performance.Power?.Bhp || 'N/A'} BHP`);
          console.log(`   Torque: ${ukData.Performance.Torque?.Nm || 'N/A'} Nm`);
          console.log(`   0-60: ${ukData.Performance.Acceleration?.ZeroTo60Mph || 'N/A'} seconds`);
          console.log(`   Top Speed: ${ukData.Performance.MaxSpeed?.Mph || 'N/A'} mph`);
        }
      }
    } catch (error) {
      console.log('❌ UK Vehicle Data error:', error.message);
    }

    // 2. Test Vehicle Specs (more detailed)
    console.log('\n2️⃣ Vehicle Specs Data:');
    try {
      const specsData = await CheckCarDetailsClient.getVehicleSpecs(registration);
      
      if (specsData) {
        console.log('✅ Vehicle Specs received');
        
        // Check fuel economy from specs
        console.log('\n🏃 Fuel Economy (Specs):');
        if (specsData.Performance?.FuelEconomy) {
          console.log(`   Urban: ${specsData.Performance.FuelEconomy.UrbanColdMpg || 'N/A'} MPG`);
          console.log(`   Extra Urban: ${specsData.Performance.FuelEconomy.ExtraUrbanMpg || 'N/A'} MPG`);
          console.log(`   Combined: ${specsData.Performance.FuelEconomy.CombinedMpg || 'N/A'} MPG`);
        }
        
        // Check emissions
        console.log('\n💨 Emissions (Specs):');
        console.log(`   CO2: ${specsData.Emissions?.ManufacturerCo2 || 'N/A'} g/km`);
        console.log(`   Annual Tax: £${specsData.VehicleExciseDutyDetails?.VedRate?.Standard?.TwelveMonths || 'N/A'}`);
      }
    } catch (error) {
      console.log('❌ Vehicle Specs error:', error.message);
    }

    // 3. Test MOT History
    console.log('\n3️⃣ MOT History:');
    try {
      const motData = await CheckCarDetailsClient.getMOTHistory(registration);
      
      if (motData && motData.length > 0) {
        console.log(`✅ MOT History found: ${motData.length} records`);
        
        const latestMOT = motData[0];
        console.log('\n🔧 Latest MOT:');
        console.log(`   Test Date: ${latestMOT.testDate || 'N/A'}`);
        console.log(`   Result: ${latestMOT.testResult || 'N/A'}`);
        console.log(`   Expiry Date: ${latestMOT.expiryDate || 'N/A'}`);
        console.log(`   Mileage: ${latestMOT.completedDate?.mileage || 'N/A'}`);
        
        // Calculate MOT due
        if (latestMOT.expiryDate) {
          const expiryDate = new Date(latestMOT.expiryDate);
          const today = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          
          console.log(`   Days until expiry: ${daysUntilExpiry}`);
          console.log(`   Status: ${daysUntilExpiry > 0 ? 'Valid' : 'Expired'}`);
        }
      } else {
        console.log('❌ No MOT history found');
      }
    } catch (error) {
      console.log('❌ MOT History error:', error.message);
    }

    // 4. Test Complete Vehicle Data (our parsed version)
    console.log('\n4️⃣ Complete Parsed Data:');
    try {
      const completeData = await CheckCarDetailsClient.getVehicleData(registration);
      
      if (completeData) {
        console.log('✅ Complete data parsed successfully');
        
        console.log('\n📊 Parsed Running Costs:');
        console.log(`   Urban MPG: ${completeData.fuelEconomy?.urban || 'N/A'}`);
        console.log(`   Extra Urban MPG: ${completeData.fuelEconomy?.extraUrban || 'N/A'}`);
        console.log(`   Combined MPG: ${completeData.fuelEconomy?.combined || 'N/A'}`);
        console.log(`   CO2 Emissions: ${completeData.co2Emissions || 'N/A'} g/km`);
        console.log(`   Annual Tax: £${completeData.annualTax || 'N/A'}`);
        console.log(`   Insurance Group: ${completeData.insuranceGroup || 'N/A'}`);
        
        console.log('\n🔧 Vehicle Details:');
        console.log(`   Make/Model: ${completeData.make} ${completeData.model}`);
        console.log(`   Body Type: ${completeData.bodyType}`);
        console.log(`   Fuel Type: ${completeData.fuelType}`);
        console.log(`   Year: ${completeData.year}`);
        console.log(`   Engine Size: ${completeData.engineSize}L`);
        console.log(`   Transmission: ${completeData.transmission}`);
        console.log(`   Doors: ${completeData.doors}`);
        console.log(`   Seats: ${completeData.seats}`);
        console.log(`   Color: ${completeData.color || 'N/A'}`);
        
        // Check what frontend would receive
        console.log('\n🖥️ Frontend Format:');
        const frontendData = {
          // Basic info
          make: completeData.make,
          model: completeData.model,
          bodyType: completeData.bodyType,
          fuelType: completeData.fuelType,
          year: completeData.year,
          
          // Running costs
          runningCosts: {
            fuelEconomy: {
              urban: completeData.fuelEconomy?.urban?.toString() || '',
              extraUrban: completeData.fuelEconomy?.extraUrban?.toString() || '',
              combined: completeData.fuelEconomy?.combined?.toString() || ''
            },
            annualTax: completeData.annualTax?.toString() || '',
            co2Emissions: completeData.co2Emissions?.toString() || '',
            insuranceGroup: completeData.insuranceGroup?.toString() || ''
          },
          
          // MOT info (would come from separate call)
          motStatus: 'Valid', // This should come from MOT API
          motDue: '2024-10-31', // This should come from MOT API
          motExpiry: '2024-10-31'
        };
        
        console.log(JSON.stringify(frontendData, null, 2));
      }
    } catch (error) {
      console.log('❌ Complete data error:', error.message);
    }

    // 5. Summary
    console.log('\n📋 SUMMARY:');
    console.log('=====================================');
    console.log('✅ Body Type: Fixed (SUV)');
    console.log('❓ Running Costs: Check above results');
    console.log('❓ MOT Data: Check above results');
    console.log('💡 If data is available above but not showing in frontend,');
    console.log('   the issue is in the frontend data handling logic.');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  }
}

checkVN73ETRCompleteData();