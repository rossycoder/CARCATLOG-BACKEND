/**
 * Script to verify the advertising payment flow
 * Checks if data is being saved to both models correctly
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Car = require('../models/Car');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');

async function verifyAdvertFlow() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check recent advertising purchases
    console.log('=== ADVERTISING PACKAGE PURCHASES ===');
    const purchases = await AdvertisingPackagePurchase.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`Found ${purchases.length} recent purchases:\n`);
    
    for (const purchase of purchases) {
      console.log(`Purchase ID: ${purchase._id}`);
      console.log(`  Package: ${purchase.packageName}`);
      console.log(`  Amount: ${purchase.amountFormatted}`);
      console.log(`  Status: ${purchase.paymentStatus} / ${purchase.packageStatus}`);
      console.log(`  Session ID: ${purchase.stripeSessionId}`);
      console.log(`  Created: ${purchase.createdAt}`);
      
      // Check if metadata contains advertId
      if (purchase.metadata) {
        const advertId = purchase.metadata.get('advertId');
        console.log(`  Advert ID in metadata: ${advertId || 'NONE'}`);
        
        if (advertId) {
          // Check if corresponding Car exists
          const car = await Car.findOne({ advertId });
          if (car) {
            console.log(`  ✅ Car found in database:`);
            console.log(`     Database ID: ${car._id}`);
            console.log(`     Make/Model: ${car.make} ${car.model}`);
            console.log(`     Price: £${car.price}`);
            console.log(`     Status: ${car.advertStatus}`);
            console.log(`     Images: ${car.images.length}`);
            console.log(`     Published: ${car.publishedAt || 'Not published'}`);
          } else {
            console.log(`  ❌ NO CAR FOUND for advertId: ${advertId}`);
          }
        }
      } else {
        console.log(`  ⚠️  No metadata found`);
      }
      console.log('');
    }

    // Check recent cars
    console.log('\n=== RECENT CARS IN DATABASE ===');
    const cars = await Car.find()
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`Found ${cars.length} recent cars:\n`);
    
    for (const car of cars) {
      console.log(`Car ID: ${car._id}`);
      console.log(`  Advert ID: ${car.advertId || 'NONE'}`);
      console.log(`  Make/Model: ${car.make} ${car.model}`);
      console.log(`  Year: ${car.year}`);
      console.log(`  Price: £${car.price}`);
      console.log(`  Status: ${car.advertStatus}`);
      console.log(`  Images: ${car.images.length}`);
      console.log(`  Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`  Postcode: ${car.postcode || 'N/A'}`);
      console.log(`  Created: ${car.createdAt}`);
      console.log(`  Published: ${car.publishedAt || 'Not published'}`);
      
      if (car.advertisingPackage && car.advertisingPackage.packageName) {
        console.log(`  Package: ${car.advertisingPackage.packageName}`);
        console.log(`  Package Expiry: ${car.advertisingPackage.expiryDate}`);
      }
      console.log('');
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    const totalPurchases = await AdvertisingPackagePurchase.countDocuments();
    const totalCars = await Car.countDocuments();
    const activeCars = await Car.countDocuments({ advertStatus: 'active' });
    const incompleteCars = await Car.countDocuments({ advertStatus: 'incomplete' });
    
    console.log(`Total Purchases: ${totalPurchases}`);
    console.log(`Total Cars: ${totalCars}`);
    console.log(`Active Cars: ${activeCars}`);
    console.log(`Incomplete Cars: ${incompleteCars}`);
    
    // Check for orphaned purchases (purchases without cars)
    const purchasesWithAdvertId = await AdvertisingPackagePurchase.find({
      'metadata.advertId': { $exists: true, $ne: null }
    });
    
    let orphanedCount = 0;
    for (const purchase of purchasesWithAdvertId) {
      const advertId = purchase.metadata.get('advertId');
      const car = await Car.findOne({ advertId });
      if (!car) {
        orphanedCount++;
      }
    }
    
    console.log(`\n⚠️  Orphaned Purchases (no matching car): ${orphanedCount}`);
    
    if (orphanedCount > 0) {
      console.log('\n❌ ISSUE DETECTED: Some purchases don\'t have corresponding cars!');
      console.log('This means the payment webhook is not creating Car documents properly.');
    } else {
      console.log('\n✅ All purchases have corresponding cars!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the verification
verifyAdvertFlow();
