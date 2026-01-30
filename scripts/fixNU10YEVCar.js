require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');
const PostcodeService = require('../services/postcodeService');

async function fixNU10YEVCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the SKODA Octavia car
    const car = await Car.findOne({ registrationNumber: 'NU10YEV' });
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(0);
    }

    console.log('📝 Current Car Details:');
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Status: ${car.advertStatus}`);
    console.log(`   User ID: ${car.userId || 'NOT SET'}`);
    console.log(`   Postcode: ${car.postcode || 'NOT SET'}`);
    console.log(`   Coordinates: ${car.location?.coordinates ? 'SET' : 'NOT SET'}`);
    console.log(`   Seller Email: ${car.sellerContact?.email || 'NOT SET'}`);
    
    let updated = false;

    // Step 1: Add userId if not set
    if (!car.userId) {
      const userEmail = car.sellerContact?.email || 'rozeena031@gmail.com';
      console.log(`\n🔍 Looking for user with email: ${userEmail}`);
      
      let user = await User.findOne({ email: userEmail });
      
      if (!user) {
        console.log(`⚠️  User not found. Creating new user...`);
        
        // Create a new user
        user = new User({
          email: userEmail,
          name: 'Test User',
          password: '$2a$10$dummyhashedpassword', // Dummy hashed password
          role: 'user'
        });
        
        await user.save();
        console.log(`✅ Created new user: ${user._id}`);
      } else {
        console.log(`✅ Found user: ${user._id}`);
      }

      car.userId = user._id;
      updated = true;
      console.log(`✅ User ID added: ${car.userId}`);
    }

    // Step 2: Add coordinates if not set
    if (!car.location?.coordinates && car.postcode) {
      console.log(`\n📍 Fetching coordinates for postcode: ${car.postcode}`);
      
      try {
        const postcodeService = new PostcodeService();
        const coordinates = await postcodeService.getCoordinates(car.postcode);
        
        if (coordinates) {
          car.location = {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude]
          };
          updated = true;
          console.log(`✅ Coordinates added: [${coordinates.longitude}, ${coordinates.latitude}]`);
        } else {
          console.log(`⚠️  Could not fetch coordinates for postcode: ${car.postcode}`);
        }
      } catch (error) {
        console.log(`⚠️  Error fetching coordinates: ${error.message}`);
      }
    }

    // Save if updated
    if (updated) {
      await car.save();
      console.log(`\n✅ Car updated successfully!`);
    } else {
      console.log(`\n✅ Car already has all required fields!`);
    }

    console.log(`\n📊 Final Car Details:`);
    console.log(`   User ID: ${car.userId}`);
    console.log(`   Postcode: ${car.postcode}`);
    console.log(`   Coordinates: ${car.location?.coordinates || 'NOT SET'}`);
    console.log(`\n🎉 Car should now appear in:`);
    console.log(`   ✅ Search results`);
    console.log(`   ✅ My Listings (for user: ${car.sellerContact?.email})`);
    console.log(`   ✅ Location-based searches`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixNU10YEVCar();
