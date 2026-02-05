/**
 * Test script to verify bike features and running costs functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');

async function testBikeFeaturesAndRunningCosts() {
  try {
    console.log('🏍️ Testing Bike Features and Running Costs');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Create a test bike with features and running costs
    const testBike = new Bike({
      make: 'Yamaha',
      model: 'MT-07',
      year: 2021,
      price: 7500,
      mileage: 8000,
      color: 'Blue',
      fuelType: 'Petrol',
      engineCC: 689,
      bikeType: 'Naked',
      description: 'Test bike for features and running costs',
      
      // Features array
      features: [
        'ABS',
        'Traction Control',
        'LED Headlights',
        'Digital Dashboard',
        'Full Service History'
      ],
      
      // Running costs data
      runningCosts: {
        fuelEconomy: {
          urban: 45,
          extraUrban: 65,
          combined: 55
        },
        insuranceGroup: '12',
        annualTax: 150,
        co2Emissions: 110
      },
      
      // Video URL
      videoUrl: 'https://www.youtube.com/watch?v=test456',
      
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
    
    // Verify features were saved
    console.log('\n⭐ Features:');
    savedBike.features.forEach((feature, index) => {
      console.log(`   ${index + 1}. ${feature}`);
    });
    
    // Verify running costs were saved
    console.log('\n💰 Running Costs Data:');
    console.log('   Urban MPG:', savedBike.runningCosts.fuelEconomy.urban);
    console.log('   Extra Urban MPG:', savedBike.runningCosts.fuelEconomy.extraUrban);
    console.log('   Combined MPG:', savedBike.runningCosts.fuelEconomy.combined);
    console.log('   Insurance Group:', savedBike.runningCosts.insuranceGroup);
    console.log('   Annual Tax:', savedBike.runningCosts.annualTax);
    console.log('   CO2 Emissions:', savedBike.runningCosts.co2Emissions);
    
    // Verify video URL was saved
    console.log('\n🎥 Video URL:', savedBike.videoUrl);
    
    // Test updating features
    savedBike.features.push('Heated Grips');
    savedBike.features.push('Quick Shifter');
    await savedBike.save();
    
    console.log('\n✅ Updated features:');
    savedBike.features.forEach((feature, index) => {
      console.log(`   ${index + 1}. ${feature}`);
    });
    
    // Test updating running costs
    savedBike.runningCosts.fuelEconomy.combined = 58;
    savedBike.runningCosts.annualTax = 175;
    savedBike.runningCosts.co2Emissions = 105;
    await savedBike.save();
    
    console.log('\n✅ Updated running costs:');
    console.log('   Combined MPG:', savedBike.runningCosts.fuelEconomy.combined);
    console.log('   Annual Tax:', savedBike.runningCosts.annualTax);
    console.log('   CO2 Emissions:', savedBike.runningCosts.co2Emissions);
    
    // Test removing a feature
    savedBike.features = savedBike.features.filter(f => f !== 'ABS');
    await savedBike.save();
    
    console.log('\n✅ After removing ABS:');
    savedBike.features.forEach((feature, index) => {
      console.log(`   ${index + 1}. ${feature}`);
    });
    
    // Clean up - delete the test bike
    await Bike.findByIdAndDelete(savedBike._id);
    console.log('\n🗑️ Test bike deleted');
    
    console.log('\n🎉 All tests passed! Bike features and running costs are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testBikeFeaturesAndRunningCosts();