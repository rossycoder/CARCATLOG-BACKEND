/**
 * Fix Client Car with Complete CheckCarDetails Data
 * Car ID: 698682fd4c9aa2475ac2cb91
 * Registration: LS70UAK
 * 
 * This script:
 * 1. Fetches fresh data from CheckCarDetailsClient (with fixed parser)
 * 2. Updates VehicleHistory with complete data
 * 3. Updates Car record with complete data
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const HistoryService = require('../services/historyService');

const CAR_ID = '698682fd4c9aa2475ac2cb91';
const VRM = 'LS70UAK';

async function fixClientCar() {
  try {
    console.log('🔧 Starting Client Car Fix...\n');
    console.log(`Car ID: ${CAR_ID}`);
    console.log(`Registration: ${VRM}\n`);

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find the car
    const car = await Car.findById(CAR_ID);
    if (!car) {
      console.error('❌ Car not found!');
      process.exit(1);
    }

    console.log('📋 Current Car Data:');
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Variant: ${car.variant || 'MISSING'}`);
    console.log(`   Transmission: ${car.transmission || 'MISSING'}`);
    console.log(`   Seats: ${car.seats || 'MISSING'}`);
    console.log(`   Emission Class: ${car.emissionClass || 'MISSING'}`);
    console.log(`   Urban MPG: ${car.urbanMpg || 'MISSING'}`);
    console.log(`   Combined MPG: ${car.combinedMpg || 'MISSING'}`);
    console.log(`   Annual Tax: ${car.annualTax || 'MISSING'}`);
    console.log(`   Insurance Group: ${car.insuranceGroup || 'MISSING'}\n`);

    // Step 2: Fetch fresh data from CheckCarDetailsClient (with fixed parser)
    console.log('🔄 Fetching fresh data from CheckCarDetails API...');
    const historyService = new HistoryService();
    
    // Force refresh to get latest data
    const historyData = await historyService.checkVehicleHistory(VRM, true);
    
    console.log('\n✅ Fresh Data Retrieved:');
    console.log(`   Make/Model: ${historyData.make} ${historyData.model}`);
    console.log(`   Variant: ${historyData.variant || 'N/A'}`);
    console.log(`   Transmission: ${historyData.transmission || 'N/A'}`);
    console.log(`   Seats: ${historyData.seats || 'N/A'}`);
    console.log(`   Emission Class: ${historyData.emissionClass || 'N/A'}`);
    console.log(`   Urban MPG: ${historyData.urbanMpg || 'N/A'}`);
    console.log(`   Combined MPG: ${historyData.combinedMpg || 'N/A'}`);
    console.log(`   Annual Tax: ${historyData.annualTax || 'N/A'}`);
    console.log(`   Insurance Group: ${historyData.insuranceGroup || 'N/A'}\n`);

    // Step 3: Update Car record with CheckCarDetails data
    console.log('🔄 Updating Car record...');
    
    const updateData = {};
    
    // Only update if CheckCarDetails has the data
    if (historyData.variant) updateData.variant = historyData.variant;
    if (historyData.transmission) updateData.transmission = historyData.transmission;
    if (historyData.seats) updateData.seats = historyData.seats;
    if (historyData.doors) updateData.doors = historyData.doors;
    if (historyData.emissionClass) updateData.emissionClass = historyData.emissionClass;
    if (historyData.urbanMpg) updateData.urbanMpg = historyData.urbanMpg;
    if (historyData.extraUrbanMpg) updateData.extraUrbanMpg = historyData.extraUrbanMpg;
    if (historyData.combinedMpg) updateData.combinedMpg = historyData.combinedMpg;
    if (historyData.annualTax) updateData.annualTax = historyData.annualTax;
    if (historyData.insuranceGroup) updateData.insuranceGroup = historyData.insuranceGroup;
    if (historyData.bodyType) updateData.bodyType = historyData.bodyType;
    if (historyData.colour) updateData.color = historyData.colour;
    
    // Update the car
    Object.assign(car, updateData);
    await car.save();
    
    console.log('✅ Car record updated!\n');

    // Step 4: Verify the update
    const updatedCar = await Car.findById(CAR_ID);
    console.log('📋 Updated Car Data:');
    console.log(`   Make/Model: ${updatedCar.make} ${updatedCar.model}`);
    console.log(`   Variant: ${updatedCar.variant || 'MISSING'}`);
    console.log(`   Transmission: ${updatedCar.transmission || 'MISSING'}`);
    console.log(`   Seats: ${updatedCar.seats || 'MISSING'}`);
    console.log(`   Emission Class: ${updatedCar.emissionClass || 'MISSING'}`);
    console.log(`   Urban MPG: ${updatedCar.urbanMpg || 'MISSING'}`);
    console.log(`   Combined MPG: ${updatedCar.combinedMpg || 'MISSING'}`);
    console.log(`   Annual Tax: ${updatedCar.annualTax || 'MISSING'}`);
    console.log(`   Insurance Group: ${updatedCar.insuranceGroup || 'MISSING'}\n`);

    // Step 5: Verify VehicleHistory
    const vehicleHistory = await VehicleHistory.getMostRecent(VRM);
    console.log('📋 VehicleHistory Data:');
    console.log(`   Variant: ${vehicleHistory.variant || 'MISSING'}`);
    console.log(`   Transmission: ${vehicleHistory.transmission || 'MISSING'}`);
    console.log(`   Seats: ${vehicleHistory.seats || 'MISSING'}`);
    console.log(`   Emission Class: ${vehicleHistory.emissionClass || 'MISSING'}`);
    console.log(`   Urban MPG: ${vehicleHistory.urbanMpg || 'MISSING'}`);
    console.log(`   Combined MPG: ${vehicleHistory.combinedMpg || 'MISSING'}\n`);

    console.log('✅ Client car fix complete!');
    console.log(`\n🔗 View car: https://carcatlog.vercel.app/cars/${CAR_ID}`);

  } catch (error) {
    console.error('❌ Error fixing client car:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the fix
fixClientCar();
