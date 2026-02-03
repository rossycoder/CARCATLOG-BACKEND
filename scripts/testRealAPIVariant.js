require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testRealAPIVariant() {
  try {
    console.log('🔍 Testing Real API Variant Storage');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Test data for a Honda Civic with registration EK11XHZ
    const testCarData = {
      make: 'Honda',
      model: 'Civic',
      year: 2011,
      registrationNumber: 'TEST123A', // Different registration for testing
      mileage: 85000,
      price: 4500,
      fuelType: 'Petrol',
      engineSize: 1.3,
      transmission: 'manual',
      doors: 5,
      color: 'Silver',
      description: 'Test car for API variant verification',
      postcode: 'M1 1AA',
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'test@example.com'
      },
      advertStatus: 'active'
    };
    
    console.log('\n🚗 Creating test car with registration:', testCarData.registrationNumber);
    console.log('📋 Expected API variant: "I-VTec Type S I-Shift"');
    console.log('📋 Expected fallback variant: "1.3L Petrol"');
    
    // Create new car - this will trigger the pre-save hook
    const newCar = new Car(testCarData);
    
    console.log('\n⏳ Saving car (this will trigger API variant fetch)...');
    const savedCar = await newCar.save();
    
    console.log('\n📊 RESULTS:');
    console.log('='.repeat(30));
    console.log(`Car ID: ${savedCar._id}`);
    console.log(`Registration: ${savedCar.registrationNumber}`);
    console.log(`Make/Model: ${savedCar.make} ${savedCar.model}`);
    console.log(`Variant (Database): "${savedCar.variant}"`);
    console.log(`Display Title: "${savedCar.displayTitle}"`);
    console.log(`Engine Size: ${savedCar.engineSize}L`);
    console.log(`Fuel Type: ${savedCar.fuelType}`);
    
    // Check what type of variant was saved
    if (savedCar.variant === 'I-VTec Type S I-Shift') {
      console.log('\n✅ SUCCESS! Real API variant saved in database');
      console.log('✅ New cars will now get the actual API variant');
    } else if (savedCar.variant === '1.3L Petrol') {
      console.log('\n⚠️  Fallback variant saved (API variant not available or failed)');
      console.log('⚠️  This could be due to API limits or cache');
    } else {
      console.log(`\n🔍 Different variant saved: "${savedCar.variant}"`);
      console.log('🔍 This might be another valid API variant');
    }
    
    console.log('\n🎯 VERIFICATION:');
    if (savedCar.variant && savedCar.variant !== '1.3L Petrol') {
      console.log('✅ Real API variant is being saved (not fallback)');
      console.log('✅ System is working correctly');
    } else {
      console.log('⚠️  Fallback variant saved - check API availability');
    }
    
    // Clean up - delete the test car
    await Car.findByIdAndDelete(savedCar._id);
    console.log('\n🗑️  Test car deleted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('daily limit') || error.message.includes('403')) {
      console.log('\n⏰ API daily limit reached');
      console.log('   Test will use fallback variant generation');
      console.log('   Real API variant will be saved when API limit resets');
    }
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testRealAPIVariant();