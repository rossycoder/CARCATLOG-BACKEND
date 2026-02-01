/**
 * Test Script: Add Car to Production Database
 * This simulates a successful payment and creates a car in production
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

async function testProductionCarAdd() {
  try {
    console.log('🚀 Connecting to production database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const Car = require('../models/Car');
    
    // Test car data
    const advertId = uuidv4();
    const testCar = {
      advertId: advertId,
      make: 'BMW',
      model: '3 Series',
      variant: '320d M Sport',
      displayTitle: 'BMW 3 Series 320d M Sport',
      year: 2020,
      mileage: 25000,
      color: 'Black',
      fuelType: 'Diesel',
      transmission: 'automatic',
      registrationNumber: 'TEST123',
      engineSize: 2.0,
      bodyType: 'Saloon',
      doors: 4,
      seats: 5,
      price: 25000,
      estimatedValue: 25000,
      description: 'Test car added from production script. Beautiful BMW 3 Series in excellent condition.',
      images: [
        'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      ],
      postcode: 'M1 1AA',
      locationName: 'Manchester',
      latitude: 53.4808,
      longitude: -2.2426,
      location: {
        type: 'Point',
        coordinates: [-2.2426, 53.4808]
      },
      sellerContact: {
        type: 'private',
        phoneNumber: '07700900000',
        email: 'test@example.com',
        allowEmailContact: true,
        postcode: 'M1 1AA'
      },
      advertisingPackage: {
        packageId: 'test-package',
        packageName: 'Premium Package',
        duration: '4 weeks',
        price: 4995,
        purchaseDate: new Date(),
        expiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks
        stripeSessionId: 'test_session_' + Date.now(),
        stripePaymentIntentId: 'test_pi_' + Date.now()
      },
      dataSource: 'DVLA',
      condition: 'used',
      advertStatus: 'active',
      publishedAt: new Date(),
      historyCheckStatus: 'not_required'
    };
    
    console.log('📝 Creating test car in production database...');
    console.log(`   Advert ID: ${advertId}`);
    console.log(`   Vehicle: ${testCar.make} ${testCar.model}`);
    console.log(`   Price: £${testCar.price}`);
    console.log(`   Location: ${testCar.locationName}\n`);
    
    const car = new Car(testCar);
    await car.save();
    
    console.log('✅ SUCCESS! Car added to production database!\n');
    console.log('📊 Car Details:');
    console.log(`   Database ID: ${car._id}`);
    console.log(`   Advert ID: ${car.advertId}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Year: ${car.year}`);
    console.log(`   Price: £${car.price}`);
    console.log(`   Status: ${car.advertStatus}`);
    console.log(`   Published: ${car.publishedAt}\n`);
    
    // Verify car count
    const totalCars = await Car.countDocuments({ advertStatus: 'active' });
    console.log(`📈 Total active cars in database: ${totalCars}\n`);
    
    console.log('🌐 Check your website:');
    console.log('   Frontend: https://carcatlog.vercel.app');
    console.log('   API: https://carcatlog-backend-1.onrender.com/api/vehicles\n');
    
    await mongoose.connection.close();
    console.log('✅ Done!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testProductionCarAdd();
