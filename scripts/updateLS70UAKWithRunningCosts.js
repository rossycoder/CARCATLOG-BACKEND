/**
 * Update LS70UAK Car with Running Costs from CheckCarDetails
 * Car ID: 90c9b82e-c588-4e81-a477-79cdb52ca2ee
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

const CAR_ID = '90c9b82e-c588-4e81-a477-79cdb52ca2ee';
const VRM = 'LS70UAK';

async function updateCar() {
  try {
    console.log('🔧 Updating LS70UAK with Running Costs\n');
    console.log(`Car ID: ${CAR_ID}`);
    console.log(`Registration: ${VRM}\n`);

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find car by registration number
    const car = await Car.findOne({ registrationNumber: VRM });
    if (!car) {
      console.error('❌ Car not found!');
      console.log('\nSearching for any car with LS70UAK...');
      const allCars = await Car.find({ registrationNumber: /LS70/i }).limit(5);
      console.log(`Found ${allCars.length} cars:`);
      allCars.forEach(c => {
        console.log(`   ${c._id} - ${c.registrationNumber} - ${c.make} ${c.model}`);
      });
      process.exit(1);
    }

    console.log(`✅ Car found! ID: ${car._id}\n`);

    console.log('📋 Current Car Data:');
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Variant: ${car.variant || 'MISSING'}`);
    console.log(`   Transmission: ${car.transmission || 'MISSING'}`);
    console.log(`   Urban MPG: ${car.urbanMpg || 'MISSING'}`);
    console.log(`   Combined MPG: ${car.combinedMpg || 'MISSING'}`);
    console.log(`   Annual Tax: ${car.annualTax || 'MISSING'}`);
    console.log(`   Emission Class: ${car.emissionClass || 'MISSING'}\n`);

    // Fetch fresh data from CheckCarDetails
    console.log('🔄 Fetching fresh data from CheckCarDetails...');
    const client = new CheckCarDetailsClient();
    const rawData = await client.getUKVehicleData(VRM);
    const parsedData = client.parseResponse(rawData);

    console.log('\n✅ Fresh Data Retrieved:');
    console.log(`   Variant: ${parsedData.variant}`);
    console.log(`   Transmission: ${parsedData.transmission}`);
    console.log(`   Seats: ${parsedData.seats}`);
    console.log(`   Doors: ${parsedData.doors}`);
    console.log(`   Emission Class: ${parsedData.emissionClass}`);
    console.log(`   Urban MPG: ${parsedData.urbanMpg}`);
    console.log(`   Extra Urban MPG: ${parsedData.extraUrbanMpg}`);
    console.log(`   Combined MPG: ${parsedData.combinedMpg}`);
    console.log(`   Annual Tax: £${parsedData.annualTax}`);
    console.log(`   CO2 Emissions: ${parsedData.co2Emissions}g/km\n`);

    // Update car with CheckCarDetails data
    console.log('🔄 Updating car record...');
    
    if (parsedData.variant) car.variant = parsedData.variant;
    if (parsedData.transmission) car.transmission = parsedData.transmission;
    if (parsedData.seats) car.seats = parsedData.seats;
    if (parsedData.doors) car.doors = parsedData.doors;
    if (parsedData.emissionClass) car.emissionClass = parsedData.emissionClass;
    if (parsedData.urbanMpg) car.urbanMpg = parsedData.urbanMpg;
    if (parsedData.extraUrbanMpg) car.extraUrbanMpg = parsedData.extraUrbanMpg;
    if (parsedData.combinedMpg) car.combinedMpg = parsedData.combinedMpg;
    if (parsedData.annualTax) car.annualTax = parsedData.annualTax;
    if (parsedData.co2Emissions) car.co2Emissions = parsedData.co2Emissions;
    if (parsedData.bodyType) car.bodyType = parsedData.bodyType;

    await car.save();
    console.log('✅ Car updated!\n');

    // Verify update
    const updatedCar = await Car.findById(CAR_ID);
    console.log('📋 Updated Car Data:');
    console.log(`   Variant: ${updatedCar.variant || 'MISSING'}`);
    console.log(`   Transmission: ${updatedCar.transmission || 'MISSING'}`);
    console.log(`   Seats: ${updatedCar.seats || 'MISSING'}`);
    console.log(`   Doors: ${updatedCar.doors || 'MISSING'}`);
    console.log(`   Emission Class: ${updatedCar.emissionClass || 'MISSING'}`);
    console.log(`   Urban MPG: ${updatedCar.urbanMpg || 'MISSING'}`);
    console.log(`   Extra Urban MPG: ${updatedCar.extraUrbanMpg || 'MISSING'}`);
    console.log(`   Combined MPG: ${updatedCar.combinedMpg || 'MISSING'}`);
    console.log(`   Annual Tax: £${updatedCar.annualTax || 'MISSING'}`);
    console.log(`   CO2 Emissions: ${updatedCar.co2Emissions || 'MISSING'}g/km\n`);

    console.log('✅ Update complete!');
    console.log(`\n🔗 View car: https://carcatlog.vercel.app/selling/advert/edit/${CAR_ID}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

updateCar();
