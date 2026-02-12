const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const Car = require('./models/Car');
const VehicleHistory = require('./models/VehicleHistory');

async function fixNL70NPAColor() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const registration = 'NL70NPA';
    
    // Get car
    const car = await Car.findOne({ registrationNumber: registration });
    if (!car) {
      console.log('❌ Car not found!');
      return;
    }

    console.log('📋 Current Car Data:');
    console.log('   Registration:', car.registrationNumber);
    console.log('   Make:', car.make);
    console.log('   Model:', car.model);
    console.log('   Color:', car.color);

    // Fetch from DVLA API
    console.log('\n📡 Fetching from DVLA API...');
    const dvlaApiKey = process.env.DVLA_API_KEY;
    
    if (!dvlaApiKey) {
      console.log('❌ DVLA API key not found in .env');
      return;
    }

    try {
      const response = await axios.post(
        'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
        { registrationNumber: registration },
        {
          headers: {
            'x-api-key': dvlaApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ DVLA API Response received');
      const dvlaData = response.data;
      
      console.log('\n📊 DVLA Data:');
      console.log('   Color:', dvlaData.colour);
      console.log('   Make:', dvlaData.make);
      console.log('   Year of Manufacture:', dvlaData.yearOfManufacture);
      console.log('   Engine Capacity:', dvlaData.engineCapacity);
      console.log('   Fuel Type:', dvlaData.fuelType);
      console.log('   Body Type:', dvlaData.typeApproval);

      // Update car with color
      if (dvlaData.colour) {
        console.log('\n✏️ Updating car color...');
        car.color = dvlaData.colour;
        await car.save();
        console.log('✅ Car color updated to:', car.color);
      }

      // Create or update VehicleHistory
      console.log('\n✏️ Creating/Updating VehicleHistory...');
      let history = await VehicleHistory.findOne({ registrationNumber: registration });
      
      if (!history) {
        history = new VehicleHistory({
          registrationNumber: registration,
          make: dvlaData.make,
          colour: dvlaData.colour,
          yearOfManufacture: dvlaData.yearOfManufacture,
          engineCapacity: dvlaData.engineCapacity,
          fuelType: dvlaData.fuelType,
          typeApproval: dvlaData.typeApproval,
          lastFetched: new Date()
        });
        await history.save();
        console.log('✅ VehicleHistory created');
      } else {
        history.colour = dvlaData.colour;
        history.lastFetched = new Date();
        await history.save();
        console.log('✅ VehicleHistory updated');
      }

      // Verify
      console.log('\n📋 Verification:');
      console.log('═══════════════════════════════════════');
      const updatedCar = await Car.findOne({ registrationNumber: registration });
      const updatedHistory = await VehicleHistory.findOne({ registrationNumber: registration });
      
      console.log('Car Color:', updatedCar.color);
      console.log('VehicleHistory Color:', updatedHistory?.colour);
      
      if (updatedCar.color && updatedCar.color !== 'null' && updatedCar.color !== null) {
        console.log('\n✅ SUCCESS! Color fixed for NL70NPA');
      } else {
        console.log('\n❌ Color still missing');
      }

    } catch (apiError) {
      console.error('❌ DVLA API Error:', apiError.response?.data || apiError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixNL70NPAColor();
