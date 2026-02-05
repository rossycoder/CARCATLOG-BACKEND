/**
 * Test Description Validation Fix
 * Tests the fix for description validation errors when updating features
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function testDescriptionValidationFix() {
  try {
    console.log('🧪 Testing Description Validation Fix');
    console.log('=====================================');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Car = require('../models/Car');
    
    // Find a car to test with
    const testCar = await Car.findOne().sort({ createdAt: -1 });
    
    if (!testCar) {
      console.log('❌ No cars found in database');
      return;
    }
    
    console.log('\n📊 Test Car Info:');
    console.log(`   ID: ${testCar._id}`);
    console.log(`   Registration: ${testCar.registrationNumber}`);
    console.log(`   Data Source: ${testCar.dataSource}`);
    console.log(`   Current Description: "${testCar.description}"`);
    console.log(`   Description Required: ${testCar.dataSource !== 'DVLA'}`);
    
    // Test the update logic
    console.log('\n🔧 Testing Feature Update (without description):');
    
    const updateObj = {
      features: ['Test Feature 1', 'Test Feature 2']
    };
    
    // Add description handling logic (same as in advertController)
    if (testCar.dataSource !== 'DVLA' && (!testCar.description || testCar.description.trim() === '')) {
      updateObj.description = 'No description provided.';
      console.log('📝 Adding default description for non-DVLA car without description');
    }
    
    console.log('📝 Update Object:', updateObj);
    
    // Perform the update
    const updatedCar = await Car.findOneAndUpdate(
      { _id: testCar._id },
      { $set: updateObj },
      { 
        new: true,
        runValidators: true,
        context: 'query'
      }
    );
    
    if (updatedCar) {
      console.log('\n✅ Update Successful!');
      console.log(`   Features: ${updatedCar.features}`);
      console.log(`   Description: "${updatedCar.description}"`);
    } else {
      console.log('\n❌ Update Failed - Car not found');
    }
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.name === 'ValidationError') {
      console.error('   Validation Errors:', Object.keys(error.errors));
      Object.keys(error.errors).forEach(field => {
        console.error(`   - ${field}: ${error.errors[field].message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDescriptionValidationFix();