require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');
const VehicleHistory = require('./models/VehicleHistory');

async function checkMA21YOXInDatabase() {
  try {
    console.log('🔍 Connecting to database...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const vrm = 'MA21YOX';
    
    // Find car in database
    console.log('🚗 Searching for car with registration:', vrm);
    console.log('='.repeat(80));
    
    const car = await Car.findOne({ registrationNumber: vrm }).populate('historyCheckId');
    
    if (!car) {
      console.log('❌ Car not found in database');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n✅ Car found in database!\n');
    
    // MOT Information
    console.log('🔧 MOT INFORMATION:');
    console.log('-'.repeat(80));
    console.log('MOT Status:', car.motStatus || 'Not set');
    console.log('MOT Due:', car.motDue || 'Not set');
    console.log('MOT Expiry:', car.motExpiry || 'Not set');
    
    if (car.motHistory && car.motHistory.length > 0) {
      console.log('\nMOT History (', car.motHistory.length, 'tests):');
      const latestTest = car.motHistory[0];
      console.log('  Latest Test Date:', latestTest.testDate);
      console.log('  Expiry Date:', latestTest.expiryDate);
      console.log('  Result:', latestTest.testResult);
      console.log('  Mileage:', latestTest.odometerValue, latestTest.odometerUnit);
    } else {
      console.log('MOT History: No tests recorded');
    }
    
    // Color Information
    console.log('\n🎨 COLOR INFORMATION:');
    console.log('-'.repeat(80));
    console.log('Color (Car model):', car.color || 'Not set');
    
    // Basic Vehicle Info
    console.log('\n🚗 BASIC VEHICLE INFO:');
    console.log('-'.repeat(80));
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('Year:', car.year);
    console.log('Fuel Type:', car.fuelType);
    console.log('Body Type:', car.bodyType);
    console.log('Engine Size:', car.engineSize, 'L');
    console.log('Transmission:', car.transmission);
    console.log('Doors:', car.doors);
    console.log('Seats:', car.seats);
    console.log('Mileage:', car.mileage);
    
    // VehicleHistory Information
    if (car.historyCheckId) {
      console.log('\n📋 VEHICLE HISTORY DATA:');
      console.log('-'.repeat(80));
      
      const history = car.historyCheckId;
      console.log('Color (VehicleHistory):', history.colour || 'Not set');
      console.log('MOT Status:', history.motStatus || 'Not set');
      console.log('MOT Expiry Date:', history.motExpiryDate || 'Not set');
      console.log('Service History:', history.serviceHistory || 'Not set');
      console.log('Seats:', history.seats || 'Not set');
      console.log('Fuel Type:', history.fuelType || 'Not set');
      
      if (history.motHistory && history.motHistory.length > 0) {
        console.log('\nMOT History (VehicleHistory):', history.motHistory.length, 'tests');
        const latestTest = history.motHistory[0];
        console.log('  Latest Test Date:', latestTest.testDate);
        console.log('  Expiry Date:', latestTest.expiryDate);
        console.log('  Result:', latestTest.testResult);
      }
    } else {
      console.log('\n📋 VEHICLE HISTORY: Not linked');
    }
    
    // Data Sources
    console.log('\n📊 DATA SOURCES:');
    console.log('-'.repeat(80));
    console.log('Data Source:', car.dataSource);
    console.log('DVLA Data:', car.dataSources?.dvla || false);
    console.log('CheckCarDetails Data:', car.dataSources?.checkCarDetails || false);
    console.log('Last Updated:', car.dataSources?.lastUpdated || 'Not set');
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Check complete!');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    await mongoose.disconnect();
  }
}

checkMA21YOXInDatabase();
