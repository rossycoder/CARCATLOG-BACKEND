const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('./models/Car');
const VehicleHistory = require('./models/VehicleHistory');

async function checkNL70NPA() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const registration = 'NL70NPA';
    
    // Check Car model
    console.log('📋 Checking Car Model:');
    console.log('═══════════════════════════════════════');
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found!');
      return;
    }

    console.log('✅ Car found:');
    console.log('   ID:', car._id);
    console.log('   Make:', car.make);
    console.log('   Model:', car.model);
    console.log('   Year:', car.year);
    console.log('   Registration:', car.registrationNumber);
    console.log('   Mileage:', car.mileage);
    console.log('   Price:', car.price);
    console.log('\n📊 Color Information:');
    console.log('   Color:', car.color);
    console.log('   Color Type:', typeof car.color);
    console.log('   Color === null:', car.color === null);
    console.log('   Color === "null":', car.color === 'null');
    console.log('   Color === undefined:', car.color === undefined);
    console.log('   Color === "":', car.color === '');
    console.log('\n📊 Other Details:');
    console.log('   Body Type:', car.bodyType);
    console.log('   Fuel Type:', car.fuelType);
    console.log('   Transmission:', car.transmission);
    console.log('   Engine Size:', car.engineSize);
    console.log('   Doors:', car.doors);
    console.log('   Seats:', car.seats);
    console.log('   MOT Due:', car.motDue);
    console.log('   Status:', car.advertStatus);

    // Check VehicleHistory
    console.log('\n📋 Checking VehicleHistory Model:');
    console.log('═══════════════════════════════════════');
    const history = await VehicleHistory.findOne({ registrationNumber: registration });
    
    if (history) {
      console.log('✅ VehicleHistory found:');
      console.log('   Color:', history.colour);
      console.log('   Color Type:', typeof history.colour);
    } else {
      console.log('❌ VehicleHistory not found');
    }

    // Check userEditedFields
    console.log('\n📋 User Edited Fields:');
    console.log('═══════════════════════════════════════');
    if (car.userEditedFields && car.userEditedFields.length > 0) {
      console.log('✅ Protected fields:', car.userEditedFields);
    } else {
      console.log('⚠️  No protected fields');
    }

    // Recommendation
    console.log('\n💡 Recommendation:');
    console.log('═══════════════════════════════════════');
    if (!car.color || car.color === 'null' || car.color === null) {
      console.log('❌ Color is missing or null');
      console.log('   Current value:', car.color);
      
      if (history && history.colour) {
        console.log('✅ VehicleHistory has color:', history.colour);
        console.log('   Should sync color from VehicleHistory to Car');
      } else {
        console.log('⚠️  VehicleHistory also missing color');
        console.log('   Need to fetch from DVLA API');
      }
    } else {
      console.log('✅ Color is present:', car.color);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkNL70NPA();
