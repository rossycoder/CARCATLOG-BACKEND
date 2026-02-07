/**
 * Check Specific Car by URL
 * Check car data for: https://carcatlog.vercel.app/cars/698682fd4c9aa2475ac2cb91
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkCar() {
  try {
    console.log('🔍 Checking car: 698682fd4c9aa2475ac2cb91\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    const carId = '698682fd4c9aa2475ac2cb91';
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚗 CAR INFORMATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Car ID: ${car._id}`);
    console.log(`Registration: ${car.registrationNumber}`);
    console.log(`Make: ${car.make || 'Missing'}`);
    console.log(`Model: ${car.model || 'Missing'}`);
    console.log(`Variant: ${car.variant || 'Missing'}`);
    console.log(`Year: ${car.year || 'Missing'}`);
    console.log(`Price: £${car.price?.toLocaleString() || 'Missing'}`);
    console.log(`Mileage: ${car.mileage?.toLocaleString() || 'Missing'} miles`);
    console.log(`Color: ${car.color || 'Missing'}`);
    console.log(`Transmission: ${car.transmission || 'Missing'}`);
    console.log(`Fuel Type: ${car.fuelType || 'Missing'}`);
    console.log(`Body Type: ${car.bodyType || 'Missing'}`);
    console.log(`Engine Size: ${car.engineSize || 'Missing'}L`);
    console.log(`Doors: ${car.doors || 'Missing'}`);
    console.log(`Seats: ${car.seats || 'Missing'}`);
    console.log(`Emission Class: ${car.emissionClass || 'Missing'}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 VEHICLE HISTORY STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`History Check ID: ${car.historyCheckId || 'Not linked'}`);
    console.log(`History Check Status: ${car.historyCheckStatus || 'Not checked'}`);
    console.log(`History Check Date: ${car.historyCheckDate ? car.historyCheckDate.toLocaleString('en-GB') : 'Never'}`);
    
    // Check if vehicle history exists
    let history = null;
    if (car.historyCheckId) {
      history = await VehicleHistory.findById(car.historyCheckId);
      if (history) {
        console.log(`\n✅ Vehicle History Record Found`);
        console.log(`   VRM: ${history.vrm}`);
        console.log(`   Make: ${history.make || 'Missing'}`);
        console.log(`   Model: ${history.model || 'Missing'}`);
        console.log(`   Variant: ${history.variant || 'Missing'}`);
        console.log(`   Previous Owners: ${history.numberOfPreviousKeepers || 0}`);
        console.log(`   Write-Off: ${history.isWrittenOff ? 'YES' : 'No'}`);
        console.log(`   Write-Off Category: ${history.writeOffCategory || 'none'}`);
      } else {
        console.log(`\n❌ Vehicle History Record NOT FOUND (orphaned link)`);
      }
    } else {
      console.log(`\n❌ No Vehicle History linked to this car`);
      
      // Try to find by VRM
      if (car.registrationNumber) {
        const historyByVrm = await VehicleHistory.findOne({
          vrm: car.registrationNumber.toUpperCase().replace(/\s/g, '')
        });
        
        if (historyByVrm) {
          console.log(`\n⚠️  Found unlinked Vehicle History by VRM!`);
          console.log(`   History ID: ${historyByVrm._id}`);
          console.log(`   This should be linked to the car`);
          history = historyByVrm;
        }
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 RUNNING COSTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Urban MPG: ${car.fuelEconomyUrban || 'Missing'}`);
    console.log(`Extra Urban MPG: ${car.fuelEconomyExtraUrban || 'Missing'}`);
    console.log(`Combined MPG: ${car.fuelEconomyCombined || 'Missing'}`);
    console.log(`CO2 Emissions: ${car.co2Emissions || 'Missing'} g/km`);
    console.log(`Insurance Group: ${car.insuranceGroup || 'Missing'}`);
    console.log(`Annual Tax: £${car.annualTax || 'Missing'}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 MOT DATA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`MOT Status: ${car.motStatus || 'Missing'}`);
    console.log(`MOT Due: ${car.motDue ? new Date(car.motDue).toLocaleDateString('en-GB') : 'Missing'}`);
    console.log(`MOT History Records: ${car.motHistory?.length || 0}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DATA COMPLETENESS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const fields = {
      'Make': car.make,
      'Model': car.model,
      'Variant': car.variant,
      'Year': car.year,
      'Color': car.color,
      'Transmission': car.transmission,
      'Fuel Type': car.fuelType,
      'Body Type': car.bodyType,
      'Engine Size': car.engineSize,
      'Doors': car.doors,
      'Seats': car.seats,
      'Emission Class': car.emissionClass,
      'Running Costs': car.fuelEconomyCombined || car.co2Emissions,
      'MOT Data': car.motDue,
      'Vehicle History': car.historyCheckId
    };
    
    const missing = [];
    const present = [];
    
    Object.entries(fields).forEach(([key, value]) => {
      if (!value || value === 'Unknown' || value === 'Missing') {
        missing.push(key);
        console.log(`❌ ${key}: Missing`);
      } else {
        present.push(key);
        console.log(`✅ ${key}: Present`);
      }
    });
    
    const completeness = Math.round((present.length / Object.keys(fields).length) * 100);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📈 Completeness: ${completeness}% (${present.length}/${Object.keys(fields).length} fields)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (missing.length > 0) {
      console.log(`\n⚠️  Missing Fields: ${missing.join(', ')}`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DIAGNOSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!car.variant || car.variant === 'Unknown') {
      console.log(`\n❌ VARIANT MISSING`);
      console.log(`   Reason: Variant not fetched or saved from API`);
      if (history && history.variant) {
        console.log(`   ✅ Available in Vehicle History: ${history.variant}`);
        console.log(`   Solution: Run comprehensive service to update`);
      } else {
        console.log(`   ❌ Not available in Vehicle History either`);
        console.log(`   Solution: Fetch fresh data from API`);
      }
    }
    
    if (!car.historyCheckId) {
      console.log(`\n❌ VEHICLE HISTORY NOT LINKED`);
      console.log(`   Reason: History check was never performed or link is broken`);
      console.log(`   Solution: Run comprehensive vehicle service`);
    }
    
    if (!car.motDue) {
      console.log(`\n❌ MOT DATA MISSING`);
      console.log(`   Reason: MOT history not fetched or saved`);
      console.log(`   Solution: Fetch MOT history from API`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMMENDED ACTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (completeness < 80) {
      console.log(`\n⚠️  This car needs data update!`);
      console.log(`   Current completeness: ${completeness}%`);
      console.log(`   \n   Options:`);
      console.log(`   1. Run comprehensive service to fetch all missing data`);
      console.log(`   2. Delete and re-add the car (will fetch fresh data)`);
      console.log(`   3. Manually fix specific fields`);
    } else {
      console.log(`\n✅ Car data is mostly complete (${completeness}%)`);
      console.log(`   Only minor fields missing`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkCar();
