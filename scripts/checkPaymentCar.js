require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');

async function checkPaymentCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check the car from the payment success page (EK11XHZ)
    const registration = 'EK11XHZ';
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found with registration:', registration);
      return;
    }

    console.log(`🚗 Car Analysis: ${car.advertId}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Status: ${car.advertStatus}`);
    console.log(`   User ID: ${car.userId || 'MISSING ❌'}`);
    console.log(`   Published: ${car.publishedAt || 'NOT SET ❌'}`);
    console.log(`   Price: £${car.price}`);
    console.log(`   Images: ${car.images?.length || 0}`);
    console.log(`   Description: ${car.description ? 'SET ✅' : 'MISSING ❌'}`);
    
    console.log('\n📦 Advertising Package:');
    if (car.advertisingPackage) {
      console.log(`   Package ID: ${car.advertisingPackage.packageId || 'NOT SET ❌'}`);
      console.log(`   Package Name: ${car.advertisingPackage.packageName || 'NOT SET ❌'}`);
      console.log(`   Purchase Date: ${car.advertisingPackage.purchaseDate || 'NOT SET ❌'}`);
      console.log(`   Expiry Date: ${car.advertisingPackage.expiryDate || 'NOT SET ❌'}`);
      console.log(`   Stripe Session: ${car.advertisingPackage.stripeSessionId || 'NOT SET ❌'}`);
    } else {
      console.log('   ❌ NO ADVERTISING PACKAGE SET');
    }

    console.log('\n👤 Seller Contact:');
    if (car.sellerContact) {
      console.log(`   Phone: ${car.sellerContact.phoneNumber || 'NOT SET ❌'}`);
      console.log(`   Email: ${car.sellerContact.email || 'NOT SET ❌'}`);
      console.log(`   Postcode: ${car.sellerContact.postcode || 'NOT SET ❌'}`);
      console.log(`   Type: ${car.sellerContact.type || 'NOT SET ❌'}`);
    } else {
      console.log('   ❌ NO SELLER CONTACT SET');
    }

    // Check for recent purchases
    console.log('\n💳 Recent Purchases:');
    const recentPurchases = await AdvertisingPackagePurchase.find({
      $or: [
        { registration: registration },
        { vehicleId: car._id },
        { 'metadata.registration': registration }
      ]
    }).sort({ createdAt: -1 }).limit(3);

    if (recentPurchases.length > 0) {
      recentPurchases.forEach((purchase, index) => {
        console.log(`   Purchase ${index + 1}:`);
        console.log(`     ID: ${purchase._id}`);
        console.log(`     Status: ${purchase.paymentStatus}`);
        console.log(`     Package: ${purchase.packageName}`);
        console.log(`     Amount: £${purchase.amount}`);
        console.log(`     Vehicle ID: ${purchase.vehicleId || 'NOT SET ❌'}`);
        console.log(`     Registration: ${purchase.registration || purchase.metadata?.registration || 'NOT SET ❌'}`);
        console.log(`     Created: ${purchase.createdAt}`);
        console.log('');
      });
    } else {
      console.log('   ❌ NO PURCHASES FOUND');
    }

    // Determine why car might not be showing
    console.log('\n🔍 Visibility Analysis:');
    const issues = [];
    
    if (!car.userId) issues.push('Missing userId - car won\'t appear in My Listings');
    if (car.advertStatus !== 'active') issues.push(`Status is '${car.advertStatus}' instead of 'active'`);
    if (!car.advertisingPackage?.packageId) issues.push('No advertising package - payment not linked');
    if (!car.publishedAt) issues.push('No published date set');
    if (!car.sellerContact?.email) issues.push('No seller email - can\'t link to user');
    if (!car.sellerContact?.phoneNumber) issues.push('No seller phone number');
    if (!car.description || car.description.trim() === '') issues.push('No description set');
    if (!car.images || car.images.length === 0) issues.push('No images uploaded');

    if (issues.length > 0) {
      console.log('   ❌ ISSUES FOUND:');
      issues.forEach(issue => console.log(`     - ${issue}`));
    } else {
      console.log('   ✅ Car should be visible - check frontend filters');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkPaymentCar();