const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

async function checkSkodaDisplay() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the Skoda Octavia
    const skoda = await Car.findOne({ 
      make: 'SKODA',
      model: 'Octavia'
    });

    if (!skoda) {
      console.log('Skoda Octavia not found');
      return;
    }

    console.log('\n=== SKODA OCTAVIA DATA ===');
    console.log('ID:', skoda._id);
    console.log('Make:', skoda.make);
    console.log('Model:', skoda.model);
    console.log('Submodel:', skoda.submodel);
    console.log('Variant:', skoda.variant);
    console.log('ModelVariant:', skoda.modelVariant);
    console.log('DisplayTitle:', skoda.displayTitle);
    console.log('Engine Size:', skoda.engineSize);
    console.log('Fuel Type:', skoda.fuelType);
    console.log('Transmission:', skoda.transmission);
    console.log('Body Type:', skoda.bodyType);
    console.log('Doors:', skoda.doors);

    console.log('\n=== WHAT SHOULD DISPLAY ===');
    console.log('Expected: 1.6 TDI S 5dr');
    console.log('Current variant field:', skoda.variant);
    console.log('Current displayTitle field:', skoda.displayTitle);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkSkodaDisplay();
