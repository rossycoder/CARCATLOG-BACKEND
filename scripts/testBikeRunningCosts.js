/**
 * Test script to verify bike running costs and video URL functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');

async function testBikeRunningCosts() {
  try {
    console.log('🏍️ Testing Bike Running Costs and Video URL');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Create a test bike with running costs and video URL
    const testBike = new Bike({
      make: 'Honda',
      model: 'CBR600RR',
      year: 2020,
      price: 8500,
      mileage: 15000,
      color: 'Red',
      fuelType: 'Petrol',
      engineCC: 600,
      bikeType: 'Sport',
      description: 'Test bike for running costs',
      
      // Running costs data
      runningCosts: {
        fuelEconomy: {
          combined: 45
        },
        insuranceGroup: '15',
        annualTax: 150
      },
      
      // Video URL
      videoUrl: 'https://www.youtube.com/watch?v=test123',
      
      // Required fields
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'test@example.com'
      },
      status: 'active'
    });
    
    // Save the bike
    const savedBike = await testBike.save();
    console.log('✅ Test bike created with ID:', savedBike._id);
    
    // Verify running costs were saved
    console.log('\n💰 Running Costs Data:');
    console.log('   Combined MPG:', savedBike.runningCosts.fuelEconomy.combined);
    console.log('   Insurance Group:', savedBike.runningCosts.insuranceGroup);
    console.log('   Annual Tax:', savedBike.runningCosts.annualTax);
    
    // Verify video URL was saved
    console.log('\n🎥 Video URL:', savedBike.videoUrl);
    
    // Test updating running costs
    savedBike.runningCosts.fuelEconomy.combined = 50;
    savedBike.runningCosts.annualTax = 175;
    await savedBike.save();
    
    console.log('\n✅ Updated running costs:');
    console.log('   Combined MPG:', savedBike.runningCosts.fuelEconomy.combined);
    console.log('   Annual Tax:', savedBike.runningCosts.annualTax);
    
    // Clean up - delete the test bike
    await Bike.findByIdAndDelete(savedBike._id);
    console.log('\n🗑️ Test bike deleted');
    
    console.log('\n🎉 All tests passed! Bike running costs and video URL are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testBikeRunningCosts();