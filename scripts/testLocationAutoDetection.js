require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const postcodeService = require('../services/postcodeService');

async function testLocationAutoDetection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if postcode service works
    console.log('\n🧪 Test 1: Testing postcode lookup...');
    try {
      const testPostcode = 'M1 1AA';
      const locationData = await postcodeService.lookupPostcode(testPostcode);
      console.log(`✅ Postcode lookup works:`, locationData);
    } catch (error) {
      console.log(`❌ Postcode lookup failed:`, error.message);
    }

    // Test 2: Create a test car and see if location is auto-detected
    console.log('\n🧪 Test 2: Creating test car with postcode...');
    
    const testCar = new Car({
      make: 'Test',
      model: 'LocationTest',
      year: 2020,
      price: 15000,
      mileage: 50000,
      fuelType: 'Petrol',
      transmission: 'manual',
      color: 'Blue',
      description: 'Test car for location detection',
      postcode: 'L1 1AA', // Liverpool postcode
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'test@example.com'
      },
      advertStatus: 'active'
    });

    console.log('📍 Before save - Coordinates:', {
      latitude: testCar.latitude,
      longitude: testCar.longitude,
      locationName: testCar.locationName,
      location: testCar.location
    });

    await testCar.save();

    console.log('📍 After save - Coordinates:', {
      latitude: testCar.latitude,
      longitude: testCar.longitude,
      locationName: testCar.locationName,
      location: testCar.location
    });

    if (testCar.latitude && testCar.longitude) {
      console.log('✅ Location auto-detection WORKING!');
    } else {
      console.log('❌ Location auto-detection NOT working');
    }

    // Test 3: Check existing cars without coordinates
    console.log('\n🧪 Test 3: Checking existing cars without coordinates...');
    const carsWithoutCoords = await Car.find({
      postcode: { $exists: true, $ne: null },
      $or: [
        { latitude: { $exists: false } },
        { longitude: { $exists: false } },
        { latitude: null },
        { longitude: null }
      ]
    }).limit(5);

    console.log(`Found ${carsWithoutCoords.length} cars without coordinates but with postcodes`);
    
    if (carsWithoutCoords.length > 0) {
      console.log('Sample cars missing coordinates:');
      carsWithoutCoords.forEach(car => {
        console.log(`- ${car.make} ${car.model} (${car.postcode}) - ID: ${car._id}`);
      });
    }

    // Test 4: Test distance calculation
    console.log('\n🧪 Test 4: Testing distance calculation...');
    const carsWithCoords = await Car.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
      advertStatus: 'active'
    }).limit(3);

    if (carsWithCoords.length > 0) {
      console.log(`Found ${carsWithCoords.length} cars with coordinates for distance test`);
      
      // Use Liverpool coordinates as reference point
      const referencePoint = { lat: 53.4084, lon: -2.9916 };
      
      const carsWithDistance = await postcodeService.searchCarsByLocation(
        referencePoint.lat, 
        referencePoint.lon, 
        50 // 50 mile radius
      );
      
      console.log(`✅ Distance calculation works! Found ${carsWithDistance.length} cars within 50 miles of Liverpool`);
      
      if (carsWithDistance.length > 0) {
        console.log('Sample cars with distances:');
        carsWithDistance.slice(0, 3).forEach(car => {
          console.log(`- ${car.make} ${car.model} - ${car.distance} miles away (${car.locationName})`);
        });
      }
    } else {
      console.log('❌ No cars found with coordinates for distance test');
    }

    // Clean up test car
    await Car.deleteOne({ _id: testCar._id });
    console.log('\n🧹 Cleaned up test car');

    await mongoose.disconnect();
    console.log('\n✅ Test completed - Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testLocationAutoDetection();