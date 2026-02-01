/**
 * Activate all pending cars that have completed payment
 * Run this if webhook wasn't configured and cars are stuck
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function activatePendingCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Car = require('../models/Car');
    const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
    
    // Find all paid purchases
    const paidPurchases = await AdvertisingPackagePurchase.find({
      paymentStatus: 'paid'
    });
    
    console.log(`\n📦 Found ${paidPurchases.length} paid purchases\n`);
    
    let activated = 0;
    
    for (const purchase of paidPurchases) {
      const advertId = purchase.metadata?.get('advertId');
      
      if (!advertId) {
        console.log(`⚠️  Purchase ${purchase._id} has no advertId`);
        continue;
      }
      
      // Find car
      const car = await Car.findOne({ advertId });
      
      if (!car) {
        console.log(`⚠️  No car found for advertId: ${advertId}`);
        continue;
      }
      
      // Check if already active
      if (car.advertStatus === 'active') {
        console.log(`✓ Car ${car._id} already active`);
        continue;
      }
      
      // Activate car
      console.log(`\n🚗 Activating car: ${car.make} ${car.model}`);
      console.log(`   Advert ID: ${advertId}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      
      car.advertStatus = 'active';
      car.publishedAt = new Date();
      
      // Add advertising package details
      car.advertisingPackage = {
        packageId: purchase.packageId,
        packageName: purchase.packageName,
        duration: purchase.duration,
        price: purchase.amount,
        purchaseDate: purchase.paidAt,
        expiryDate: purchase.expiryDate,
        stripePaymentIntentId: purchase.stripePaymentIntentId
      };
      
      await car.save();
      console.log(`✅ Car activated!`);
      activated++;
    }
    
    console.log(`\n✅ Activated ${activated} cars`);
    
    // Show all active cars
    const activeCars = await Car.find({ advertStatus: 'active' });
    console.log(`\n📊 Total active cars: ${activeCars.length}`);
    
    if (activeCars.length > 0) {
      console.log('\nActive cars:');
      activeCars.forEach(car => {
        console.log(`  - ${car.make} ${car.model} (${car.year}) - £${car.price}`);
      });
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

activatePendingCars();
