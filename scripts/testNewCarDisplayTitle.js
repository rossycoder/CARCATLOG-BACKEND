require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const vehicleFormatter = require('../utils/vehicleFormatter');

async function testNewCarDisplayTitle() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the newly created car
    const car = await Car.findOne({ registrationNumber: 'RJ08PFA' });
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }

    console.log('\n📋 Current Car Data:');
    console.log('Registration:', car.registrationNumber);
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('ModelVariant:', car.modelVariant);
    console.log('DisplayTitle:', car.displayTitle);
    console.log('Engine Size:', car.engineSize);
    console.log('Transmission:', car.transmission);
    console.log('Doors:', car.doors);

    // Generate what the displayTitle should be
    const expectedDisplayTitle = vehicleFormatter.buildFullTitle(
      car.make,
      car.model,
      car.engineSize,
      car.variant,
      car.transmission
    );

    console.log('\n🎯 Expected DisplayTitle:', expectedDisplayTitle);
    
    if (!car.displayTitle) {
      console.log('\n⚠️  DisplayTitle is missing - needs to be added');
      
      // Update the car with displayTitle
      car.displayTitle = expectedDisplayTitle;
      await car.save();
      console.log('✅ DisplayTitle added and saved');
    } else if (car.displayTitle !== expectedDisplayTitle) {
      console.log('\n⚠️  DisplayTitle exists but is incorrect');
      console.log('Current:', car.displayTitle);
      console.log('Expected:', expectedDisplayTitle);
    } else {
      console.log('\n✅ DisplayTitle is correct');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testNewCarDisplayTitle();
