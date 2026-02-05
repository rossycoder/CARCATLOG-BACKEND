/**
 * Add a test bike to the database to verify listing functionality
 */

const mongoose = require('mongoose');
const Bike = require('../models/Bike');

async function addTestBike() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name');
    console.log('✅ Connected to MongoDB');

    console.log('🏍️ ADDING TEST BIKE TO DATABASE');
    console.log('='.repeat(50));

    // Create test bike data
    const testBike = new Bike({
      make: 'YAMAHA',
      model: 'MT-09',
      submodel: 'ABS',
      year: 2020,
      price: 7500,
      mileage: 15000,
      color: 'Blue',
      transmission: 'manual',
      fuelType: 'Petrol',
      description: 'Excellent condition Yamaha MT-09. Well maintained with full service history. Perfect for both city commuting and weekend rides.',
      images: [
        'https://example.com/bike1.jpg',
        'https://example.com/bike2.jpg'
      ],
      features: [
        'ABS',
        'LED Headlights',
        'Quick Shifter',
        'TFT Display',
        'Traction Control'
      ],
      postcode: 'SW1A 1AA',
      locationName: 'London',
      latitude: 51.5074,
      longitude: -0.1278,
      location: {
        type: 'Point',
        coordinates: [-0.1278, 51.5074]
      },
      condition: 'used',
      engineCC: 900,
      bikeType: 'Naked',
      registrationNumber: 'MT20ABC',
      dataSource: 'manual',
      co2Emissions: 135,
      taxStatus: 'Taxed',
      motStatus: 'Valid',
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'seller@example.com',
        allowEmailContact: true,
        postcode: 'SW1A 1AA',
        city: 'London'
      },
      runningCosts: {
        fuelEconomy: {
          urban: 45,
          extraUrban: 65,
          combined: 55
        },
        co2Emissions: 135,
        insuranceGroup: '12',
        annualTax: 150
      },
      videoUrl: 'https://www.youtube.com/watch?v=example',
      status: 'active', // IMPORTANT: Set to active so it shows in listings
      advertId: 'test-bike-' + Date.now(),
      publishedAt: new Date(),
      viewCount: 0,
      uniqueViewCount: 0
    });

    // Save to database
    const savedBike = await testBike.save();
    
    console.log('✅ TEST BIKE ADDED SUCCESSFULLY!');
    console.log('');
    console.log('📋 BIKE DETAILS:');
    console.log(`   ID: ${savedBike._id}`);
    console.log(`   Make/Model: ${savedBike.make} ${savedBike.model}`);
    console.log(`   Year: ${savedBike.year}`);
    console.log(`   Price: £${savedBike.price.toLocaleString()}`);
    console.log(`   Status: ${savedBike.status}`);
    console.log(`   Registration: ${savedBike.registrationNumber}`);
    console.log(`   Engine CC: ${savedBike.engineCC}cc`);
    console.log(`   Bike Type: ${savedBike.bikeType}`);
    console.log(`   Location: ${savedBike.locationName}`);
    console.log('');
    
    // Verify it can be found in listings
    const activeBikes = await Bike.find({ status: 'active' });
    console.log(`🔍 VERIFICATION: Found ${activeBikes.length} active bike(s) in database`);
    
    if (activeBikes.length > 0) {
      console.log('✅ This bike should now appear in your listings!');
      console.log('');
      console.log('🌐 TO VIEW IN FRONTEND:');
      console.log('   1. Go to your bike listings page');
      console.log('   2. The bike should appear in the results');
      console.log('   3. You can filter by make "YAMAHA" to find it easily');
    }

    console.log('');
    console.log('🔧 ADDITIONAL TEST BIKES:');
    console.log('   Run this script multiple times to add more test bikes');
    console.log('   Each run will create a new bike with different advertId');

  } catch (error) {
    console.error('❌ Error adding test bike:', error);
    
    if (error.name === 'ValidationError') {
      console.log('');
      console.log('📝 VALIDATION ERRORS:');
      Object.keys(error.errors).forEach(key => {
        console.log(`   ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the function
addTestBike();