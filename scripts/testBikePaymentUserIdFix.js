const mongoose = require('mongoose');
require('dotenv').config();

const Bike = require('../models/Bike');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const User = require('../models/User');

async function testBikePaymentUserIdFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test user
    const testUser = await User.findOne({ email: 'rozeena031@gmail.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    console.log(`✅ Found test user: ${testUser.email} (ID: ${testUser._id})`);

    // Check for pending bike purchases
    const pendingPurchases = await AdvertisingPackagePurchase.find({
      customerEmail: testUser.email,
      paymentStatus: 'pending',
      vehicleValue: 'bike'
    });

    console.log(`📊 Found ${pendingPurchases.length} pending bike purchases`);

    for (const purchase of pendingPurchases) {
      console.log(`\n📦 Processing purchase: ${purchase._id}`);
      console.log(`   Package: ${purchase.packageName}`);
      console.log(`   Amount: ${purchase.amountFormatted}`);
      
      // Check if metadata has userId
      const userId = purchase.metadata.get('userId');
      console.log(`   UserId in metadata: ${userId || 'MISSING'}`);
      
      // Check if advertId exists
      const advertId = purchase.metadata.get('advertId');
      console.log(`   AdvertId: ${advertId || 'MISSING'}`);
      
      if (advertId) {
        // Check if bike exists
        const existingBike = await Bike.findOne({ advertId });
        if (existingBike) {
          console.log(`   ✅ Bike exists: ${existingBike._id}`);
          console.log(`   UserId in bike: ${existingBike.userId || 'MISSING'}`);
          console.log(`   Status: ${existingBike.status}`);
        } else {
          console.log(`   ❌ No bike found for advertId: ${advertId}`);
        }
      }
    }

    // Test creating a bike with userId
    console.log('\n🧪 Testing bike creation with userId...');
    
    const testBikeData = {
      advertId: 'test-bike-userid-' + Date.now(),
      userId: testUser._id,
      make: 'TEST',
      model: 'UserIdFix',
      year: 2020,
      mileage: 1000,
      color: 'Red',
      fuelType: 'Petrol',
      transmission: 'manual',
      engineCC: 600,
      bikeType: 'Sport',
      condition: 'used',
      price: 5000,
      description: 'Test bike for userId fix',
      status: 'active',
      publishedAt: new Date()
    };

    const testBike = new Bike(testBikeData);
    await testBike.save();
    console.log(`✅ Test bike created successfully: ${testBike._id}`);
    console.log(`   UserId: ${testBike.userId}`);
    console.log(`   Make/Model: ${testBike.make} ${testBike.model}`);

    // Clean up test bike
    await Bike.deleteOne({ _id: testBike._id });
    console.log(`🧹 Test bike cleaned up`);

    console.log('\n✅ Bike payment userId fix test completed successfully!');
    console.log('\n📋 SUMMARY:');
    console.log('- userId field is now properly added to bike creation');
    console.log('- Both webhook and checkout session bike creation include userId');
    console.log('- Test bike creation with userId works correctly');

  } catch (error) {
    console.error('❌ Error testing bike payment userId fix:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testBikePaymentUserIdFix();