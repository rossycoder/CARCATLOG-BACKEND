require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

// Dummy car images from placeholder services
const DUMMY_IMAGES = [
  'https://placehold.co/800x600/1a1a1a/white?text=BMW+3+Series',
  'https://placehold.co/800x600/2c3e50/white?text=BMW+X2',
  'https://placehold.co/800x600/34495e/white?text=Aston+Martin',
  'https://placehold.co/800x600/7f8c8d/white?text=Test+Vehicle'
];

// UK city coordinates
const UK_COORDINATES = {
  'London': { latitude: 51.5074, longitude: -0.1278, locationName: 'London' },
  'Manchester': { latitude: 53.4808, longitude: -2.2426, locationName: 'Manchester' },
  'Birmingham': { latitude: 52.4862, longitude: -1.8904, locationName: 'Birmingham' },
  'Liverpool': { latitude: 53.4084, longitude: -2.9916, locationName: 'Liverpool' },
  'Leeds': { latitude: 53.8008, longitude: -1.5491, locationName: 'Leeds' }
};

async function addDummyImagesAndCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the 4 cars without images
    const carsWithoutImages = [
      '69babfd343ecde92018a09a9', // HUM 777A - BMW 3 Series
      '69ac97af62c09db70ba44dea', // TEST123 - BMW X2 #1
      '69ac977fcd03936e507eb096', // TEST123 - BMW X2 #2
      '69a330f1c6bcc840b1bf1ed2'  // F17NNS - Aston Martin
    ];

    console.log('🔧 Adding dummy images and coordinates to 4 cars...\n');
    console.log('='.repeat(80));

    let updateCount = 0;
    const cities = Object.keys(UK_COORDINATES);

    for (let i = 0; i < carsWithoutImages.length; i++) {
      const carId = carsWithoutImages[i];
      const car = await Car.findById(carId);

      if (!car) {
        console.log(`❌ Car not found: ${carId}`);
        continue;
      }

      console.log(`\n🚗 ${car.make} ${car.model} (${car.registrationNumber})`);
      console.log(`   ID: ${car._id}`);

      // Add dummy image if missing
      if (!car.images || car.images.length === 0) {
        car.images = [DUMMY_IMAGES[i % DUMMY_IMAGES.length]];
        console.log(`   ✅ Added dummy image`);
      }

      // Add coordinates if missing
      if (!car.latitude || !car.longitude) {
        const city = cities[i % cities.length];
        const coords = UK_COORDINATES[city];
        
        car.latitude = coords.latitude;
        car.longitude = coords.longitude;
        car.locationName = coords.locationName;
        
        console.log(`   ✅ Added coordinates: ${coords.locationName} (${coords.latitude}, ${coords.longitude})`);
      }

      try {
        // Temporarily disable validation for duplicate registration
        await Car.updateOne(
          { _id: car._id },
          {
            $set: {
              images: car.images,
              latitude: car.latitude,
              longitude: car.longitude,
              locationName: car.locationName
            }
          }
        );
        updateCount++;
        console.log(`   💾 Saved successfully`);
      } catch (saveError) {
        console.log(`   ⚠️  Save error: ${saveError.message}`);
      }
      console.log('-'.repeat(80));
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Updated ${updateCount} cars with dummy images and coordinates`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

addDummyImagesAndCoordinates();
