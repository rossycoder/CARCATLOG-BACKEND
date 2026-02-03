const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testAutoMOTHistoryForNewCar() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🚗 TESTING AUTOMATIC MOT HISTORY FOR NEW CAR');
    console.log('=============================================');
    
    // Create a new test car
    const testCar = new Car({
      make: 'FORD',
      model: 'Focus',
      variant: '1.6 Zetec',
      year: 2015,
      price: 8500,
      mileage: 65000,
      color: 'Blue',
      transmission: 'manual',
      fuelType: 'Petrol',
      description: 'Test car for automatic MOT history',
      registrationNumber: 'AB15XYZ', // Test registration
      postcode: 'M1 1AA',
      condition: 'used',
      advertStatus: 'active',
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'test@example.com'
      }
    });
    
    console.log('💾 Saving new car (this should trigger automatic MOT history)...');
    console.log('   Registration:', testCar.registrationNumber);
    console.log('   Make/Model:', testCar.make, testCar.model);
    console.log('   Year:', testCar.year);
    
    // Save the car - this should trigger the pre-save hook
    const savedCar = await testCar.save();
    
    console.log('\n✅ Car saved successfully!');
    console.log('   Car ID:', savedCar._id);
    console.log('   Registration:', savedCar.registrationNumber);
    console.log('   MOT History Count:', savedCar.motHistory ? savedCar.motHistory.length : 0);
    console.log('   MOT Status:', savedCar.motStatus);
    console.log('   MOT Expiry:', savedCar.motExpiry);
    
    if (savedCar.motHistory && savedCar.motHistory.length > 0) {
      console.log('\n📋 MOT HISTORY DETAILS:');
      console.log('=======================');
      
      savedCar.motHistory.forEach((test, index) => {
        console.log(`   Test ${index + 1}:`);
        console.log(`     Date: ${test.testDate.toDateString()}`);
        console.log(`     Result: ${test.testResult}`);
        console.log(`     Mileage: ${test.odometerValue} ${test.odometerUnit}`);
        console.log(`     Expiry: ${test.expiryDate ? test.expiryDate.toDateString() : 'N/A'}`);
        console.log(`     Defects: ${test.defects.length}`);
        console.log('');
      });
      
      console.log('🎉 SUCCESS! MOT history was automatically added to the new car');
    } else {
      console.log('❌ FAILED! No MOT history was added');
    }
    
    // Clean up - delete the test car
    console.log('\n🗑️ Cleaning up test car...');
    await Car.findByIdAndDelete(savedCar._id);
    console.log('✅ Test car deleted');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAutoMOTHistoryForNewCar();