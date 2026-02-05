const mongoose = require('mongoose');
require('dotenv').config();

const Bike = require('../models/Bike');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const User = require('../models/User');

async function completeSpecificPendingBikePayment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the specific pending purchase
    const purchaseId = '69836c3c70c146a23ef42e8d';
    const purchase = await AdvertisingPackagePurchase.findById(purchaseId);
    
    if (!purchase) {
      console.log('❌ Purchase not found');
      return;
    }

    console.log(`📦 Found purchase: ${purchase._id}`);
    console.log(`   Package: ${purchase.packageName}`);
    console.log(`   Amount: ${purchase.amountFormatted}`);
    console.log(`   Status: ${purchase.paymentStatus}`);

    // Find the test user (from logs we know this is the user)
    const testUser = await User.findOne({ email: 'rozeena031@gmail.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    console.log(`✅ Found user: ${testUser.email} (ID: ${testUser._id})`);

    // Update purchase with user information
    purchase.customerEmail = testUser.email;
    purchase.customerName = testUser.name || testUser.email;
    purchase.metadata.set('userId', testUser._id.toString());
    await purchase.save();
    console.log(`✅ Updated purchase with user information`);

    // Mark as paid and activate
    await purchase.markAsPaid('manual_completion_' + Date.now());
    await purchase.activatePackage();
    console.log(`✅ Purchase marked as paid and activated`);

    // Extract data for bike creation
    const advertId = purchase.metadata.get('advertId');
    const advertData = JSON.parse(purchase.metadata.get('advertData') || '{}');
    const vehicleData = JSON.parse(purchase.metadata.get('vehicleData') || '{}');
    const contactDetails = JSON.parse(purchase.metadata.get('contactDetails') || '{}');
    const userId = purchase.metadata.get('userId');

    console.log(`\n🏍️ Creating bike from purchase data:`);
    console.log(`   AdvertId: ${advertId}`);
    console.log(`   Vehicle: ${vehicleData.make} ${vehicleData.model}`);
    console.log(`   UserId: ${userId}`);

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 28); // 4 weeks

    // Create the bike
    const newBike = new Bike({
      advertId: advertId,
      userId: userId,
      make: vehicleData.make || 'Unknown',
      model: vehicleData.model || 'Unknown',
      year: vehicleData.year || new Date().getFullYear(),
      mileage: vehicleData.mileage || 0,
      color: vehicleData.color || 'Not specified',
      fuelType: vehicleData.fuelType || 'Petrol',
      transmission: 'manual',
      registrationNumber: vehicleData.registration || vehicleData.registrationNumber || null,
      engineCC: parseInt(vehicleData.engineSize || vehicleData.engineCC || '0') || 0,
      bikeType: vehicleData.bikeType || 'Other',
      condition: 'used',
      price: advertData.price || vehicleData.estimatedValue || 0,
      description: advertData.description || '',
      images: advertData.photos ? advertData.photos.map(p => p.url || p) : [],
      postcode: contactDetails.postcode || '',
      sellerContact: {
        type: 'private',
        phoneNumber: contactDetails.phoneNumber,
        email: contactDetails.email || testUser.email,
        allowEmailContact: contactDetails.allowEmailContact || false,
        postcode: contactDetails.postcode
      },
      advertisingPackage: {
        packageId: purchase.packageId,
        packageName: purchase.packageName,
        duration: purchase.duration,
        price: purchase.amount,
        purchaseDate: new Date(),
        expiryDate: expiryDate,
        stripeSessionId: purchase.stripeSessionId,
        stripePaymentIntentId: purchase.stripePaymentIntentId
      },
      status: 'active',
      publishedAt: new Date()
    });

    await newBike.save();
    console.log(`✅ Bike created successfully: ${newBike._id}`);
    console.log(`   Make/Model: ${newBike.make} ${newBike.model}`);
    console.log(`   Registration: ${newBike.registrationNumber}`);
    console.log(`   Price: £${newBike.price}`);
    console.log(`   Status: ${newBike.status}`);

    // Verify bike appears in user's listings
    const userBikes = await Bike.find({ userId: testUser._id });
    console.log(`📊 User now has ${userBikes.length} bikes`);

    console.log('\n🎉 SPECIFIC PENDING BIKE PAYMENT COMPLETED SUCCESSFULLY!');
    console.log('\n📋 COMPLETED:');
    console.log('✅ Updated purchase with user information');
    console.log('✅ Marked purchase as paid and activated');
    console.log('✅ Created bike with proper userId field');
    console.log('✅ Bike is now active and visible in user listings');

  } catch (error) {
    console.error('❌ Error completing specific pending bike payment:', error);
  } finally {
    await mongoose.disconnect();
  }
}

completeSpecificPendingBikePayment();