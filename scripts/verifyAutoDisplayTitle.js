require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function verifyAutoDisplayTitle() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // 1. Check the existing car
    console.log('=== STEP 1: Verify Existing Car ===');
    const existingCar = await Car.findOne({ registrationNumber: 'RJ08PFA' });
    
    if (existingCar) {
      console.log('✅ Car found:', existingCar.registrationNumber);
      console.log('   Make:', existingCar.make);
      console.log('   Model:', existingCar.model);
      console.log('   Variant:', existingCar.variant);
      console.log('   DisplayTitle:', existingCar.displayTitle);
      
      if (existingCar.displayTitle) {
        console.log('✅ DisplayTitle is now populated!\n');
      } else {
        console.log('❌ DisplayTitle is still missing\n');
      }
    }

    // 2. Test automatic generation with a new car
    console.log('=== STEP 2: Test Automatic Generation ===');
    console.log('Creating a test car without displayTitle...');
    
    const testCar = new Car({
      make: 'BMW',
      model: '3 Series',
      variant: 'M Sport',
      year: 2020,
      price: 25000,
      mileage: 15000,
      color: 'BLACK',
      transmission: 'automatic',
      fuelType: 'Diesel',
      description: 'Test car for displayTitle auto-generation',
      engineSize: 2.0,
      doors: 4,
      seats: 5,
      bodyType: '4 DOOR SALOON',
      registrationNumber: 'TEST123',
      condition: 'used',
      postcode: 'M1 1AE',
      sellerContact: {
        phoneNumber: '+44 1234567890',
        email: 'test@example.com',
        postcode: 'M1 1AE'
      },
      advertStatus: 'draft',
      historyCheckStatus: 'not_required'
    });

    console.log('Before save - displayTitle:', testCar.displayTitle);
    
    await testCar.save();
    
    console.log('After save - displayTitle:', testCar.displayTitle);
    
    if (testCar.displayTitle) {
      console.log('✅ DisplayTitle was automatically generated!');
      console.log('   Expected: BMW 3 Series 2.0L M Sport Automatic');
      console.log('   Got:', testCar.displayTitle);
    } else {
      console.log('❌ DisplayTitle was NOT automatically generated');
    }

    // Clean up test car
    await Car.deleteOne({ _id: testCar._id });
    console.log('\n✅ Test car cleaned up');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

verifyAutoDisplayTitle();
