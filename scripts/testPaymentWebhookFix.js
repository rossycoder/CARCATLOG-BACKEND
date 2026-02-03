require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const Car = require('../models/Car');
const User = require('../models/User');

async function testPaymentWebhookFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test data for a new user payment
    const testEmail = 'testuser@example.com';
    const testAdvertId = 'test-advert-' + Date.now();
    
    console.log('\n🧪 Testing automatic payment completion fixes...');
    console.log(`   Test email: ${testEmail}`);
    console.log(`   Test advert ID: ${testAdvertId}`);

    // Create a test purchase record (simulating what happens during checkout)
    const testPurchase = new AdvertisingPackagePurchase({
      stripeSessionId: 'test_session_' + Date.now(),
      customSessionId: 'test_custom_' + Date.now(),
      packageId: 'bronze', // Valid enum value
      packageName: 'Bronze Package',
      duration: '4 weeks',
      amount: 1999,
      currency: 'gbp',
      sellerType: 'private',
      vehicleValue: '3000-4999',
      registration: 'TEST123',
      mileage: 50000,
      paymentStatus: 'pending',
      packageStatus: 'pending',
      metadata: {
        advertId: testAdvertId,
        advertData: JSON.stringify({
          price: 3500,
          description: 'Test car description',
          photos: [
            { url: 'https://example.com/photo1.jpg' },
            { url: 'https://example.com/photo2.jpg' }
          ]
        }),
        vehicleData: JSON.stringify({
          make: 'Toyota',
          model: 'Corolla',
          year: 2018,
          mileage: 50000,
          color: 'Blue',
          fuelType: 'Petrol',
          transmission: 'Manual',
          registrationNumber: 'TEST123',
          engineSize: '1.6',
          bodyType: 'Hatchback',
          doors: 5,
          seats: 5
        }),
        contactDetails: JSON.stringify({
          email: testEmail,
          phoneNumber: '07123456789',
          postcode: 'M1 1AA',
          allowEmailContact: true
        }),
        userId: null // No user ID - should trigger automatic user creation
      }
    });

    await testPurchase.save();
    console.log(`✅ Test purchase created: ${testPurchase._id}`);

    // Simulate the payment webhook by calling handlePaymentSuccess
    console.log('\n🔄 Simulating payment success webhook...');
    
    const testPaymentIntent = {
      id: 'test_pi_' + Date.now(),
      metadata: {
        type: 'advertising_package',
        sessionId: testPurchase.stripeSessionId
      }
    };

    // Import and call the payment success handler
    const paymentController = require('../controllers/paymentController');
    
    // We need to access the internal handlePaymentSuccess function
    // Since it's not exported, we'll simulate the webhook call
    const mockReq = {
      body: Buffer.from(JSON.stringify({
        type: 'payment_intent.succeeded',
        data: { object: testPaymentIntent }
      })),
      headers: {
        'stripe-signature': 'test_signature'
      }
    };

    const mockRes = {
      json: (data) => console.log('📤 Webhook response:', data),
      status: (code) => ({ json: (data) => console.log(`📤 Webhook response (${code}):`, data) })
    };

    // Instead of calling the webhook directly, let's test the auto-complete endpoint
    console.log('\n🚀 Testing auto-complete purchase endpoint...');
    
    const autoCompleteReq = {
      body: { sessionId: testPurchase.stripeSessionId }
    };

    const autoCompleteRes = {
      json: (data) => {
        console.log('📤 Auto-complete response:', data);
        return data;
      },
      status: (code) => ({
        json: (data) => {
          console.log(`📤 Auto-complete response (${code}):`, data);
          return data;
        }
      })
    };

    await paymentController.autoCompletePurchase(autoCompleteReq, autoCompleteRes);

    // Check if user was created automatically
    console.log('\n🔍 Checking if user was created automatically...');
    const createdUser = await User.findOne({ email: testEmail });
    
    if (createdUser) {
      console.log('✅ User created successfully!');
      console.log(`   User ID: ${createdUser._id}`);
      console.log(`   Email: ${createdUser.email}`);
      console.log(`   Email verified: ${createdUser.isEmailVerified}`);
    } else {
      console.log('❌ User was NOT created');
    }

    // Check if car was created and linked to user
    console.log('\n🔍 Checking if car was created and linked...');
    const createdCar = await Car.findOne({ advertId: testAdvertId });
    
    if (createdCar) {
      console.log('✅ Car created successfully!');
      console.log(`   Car ID: ${createdCar._id}`);
      console.log(`   Advert ID: ${createdCar.advertId}`);
      console.log(`   User ID: ${createdCar.userId}`);
      console.log(`   Make/Model: ${createdCar.make} ${createdCar.model}`);
      console.log(`   Status: ${createdCar.advertStatus}`);
      console.log(`   Registration: ${createdCar.registrationNumber}`);
      console.log(`   History Check ID: ${createdCar.historyCheckId || 'Not set'}`);
      console.log(`   MOT Status: ${createdCar.motStatus || 'Not set'}`);
      console.log(`   MOT History: ${createdCar.motHistory ? createdCar.motHistory.length + ' records' : 'Not set'}`);
      
      // Check if user ID matches
      if (createdUser && createdCar.userId && createdCar.userId.toString() === createdUser._id.toString()) {
        console.log('✅ Car correctly linked to user!');
      } else {
        console.log('❌ Car NOT linked to user correctly');
        console.log(`   Car userId: ${createdCar.userId}`);
        console.log(`   User _id: ${createdUser?._id}`);
      }
    } else {
      console.log('❌ Car was NOT created');
    }

    // Check if purchase was updated
    console.log('\n🔍 Checking if purchase was updated...');
    const updatedPurchase = await AdvertisingPackagePurchase.findById(testPurchase._id);
    
    if (updatedPurchase) {
      console.log('✅ Purchase found');
      console.log(`   Payment Status: ${updatedPurchase.paymentStatus}`);
      console.log(`   Package Status: ${updatedPurchase.packageStatus}`);
      console.log(`   Customer Email: ${updatedPurchase.customerEmail || 'Not set'}`);
    }

    console.log('\n🎉 Test completed! Summary:');
    console.log(`   User created: ${createdUser ? '✅' : '❌'}`);
    console.log(`   Car created: ${createdCar ? '✅' : '❌'}`);
    console.log(`   Car linked to user: ${createdUser && createdCar && createdCar.userId?.toString() === createdUser._id.toString() ? '✅' : '❌'}`);
    console.log(`   Payment completed: ${updatedPurchase?.paymentStatus === 'paid' ? '✅' : '❌'}`);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    if (createdUser) {
      await User.findByIdAndDelete(createdUser._id);
      console.log('✅ Test user deleted');
    }
    if (createdCar) {
      await Car.findByIdAndDelete(createdCar._id);
      console.log('✅ Test car deleted');
    }
    if (updatedPurchase) {
      await AdvertisingPackagePurchase.findByIdAndDelete(updatedPurchase._id);
      console.log('✅ Test purchase deleted');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testPaymentWebhookFix();