require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

// Manual mapping based on known vehicle data
const vehicleMapping = {
  // BMW 320D M SPORT -> BMW 3 Series 320D M Sport
  'BMW_320D M SPORT': {
    make: 'BMW',
    model: '3 Series',
    submodel: '320D M Sport'
  },
  // BMW M6 Gran Coupe Auto M6 -> BMW M6 Gran Coupe Auto
  'BMW_M6 Gran Coupe Auto M6': {
    make: 'BMW',
    model: 'M6',
    submodel: 'Gran Coupe Auto'
  },
  // BMW 335I M SPORT AUTO -> BMW 3 Series 335I M Sport Auto
  'BMW_335I M SPORT AUTO': {
    make: 'BMW',
    model: '3 Series',
    submodel: '335I M Sport Auto'
  },
  // BMW 3 Series -> BMW 3 Series (no submodel)
  'BMW_3 Series': {
    make: 'BMW',
    model: '3 Series',
    submodel: null
  },
  // BMW 320D -> BMW 3 Series 320D
  'BMW_320D': {
    make: 'BMW',
    model: '3 Series',
    submodel: '320D'
  },
  // BMW 335I -> BMW 3 Series 335I
  'BMW_335I': {
    make: 'BMW',
    model: '3 Series',
    submodel: '335I'
  },
  // BMW M6 -> BMW M6 (no submodel)
  'BMW_M6': {
    make: 'BMW',
    model: 'M6',
    submodel: null
  }
};

async function fixAllCarsModelHierarchy() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const cars = await Car.find({});
    console.log(`Found ${cars.length} cars to process\n`);

    let updated = 0;
    let skipped = 0;
    let alreadyCorrect = 0;

    for (const car of cars) {
      const key = `${car.make}_${car.model}`;
      const mapping = vehicleMapping[key];

      console.log(`\nProcessing: ${car.registrationNumber || 'N/A'}`);
      console.log(`Current: ${car.make} ${car.model}${car.submodel ? ' ' + car.submodel : ''}`);

      if (mapping) {
        // Check if already correct
        if (car.make === mapping.make && 
            car.model === mapping.model && 
            car.submodel === mapping.submodel) {
          console.log(`✓ Already correct`);
          alreadyCorrect++;
          continue;
        }

        // Update the car
        car.make = mapping.make;
        car.model = mapping.model;
        car.submodel = mapping.submodel;
        await car.save();

        console.log(`✓ Updated to: ${car.make} ${car.model}${car.submodel ? ' ' + car.submodel : ''}`);
        updated++;
      } else {
        console.log(`⊘ No mapping found for: ${key}`);
        skipped++;
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`Migration Complete!`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Updated: ${updated} cars`);
    console.log(`Already correct: ${alreadyCorrect} cars`);
    console.log(`Skipped (no mapping): ${skipped} cars`);
    console.log(`Total processed: ${cars.length} cars`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

fixAllCarsModelHierarchy();
