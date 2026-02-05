const mongoose = require('mongoose');
const Bike = require('../models/Bike');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
require('dotenv').config();

async function testBikePaymentIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔍 STEP 1: Checking recent bike payment attempts...');
    
    // Check for recent purchases with bike data
    const recentPurchases = await AdvertisingPackagePurchase.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      $or: [
        { 'metadata.vehicleType': 'bike' },
        { 'metadata.advertData': { $regex: /bike/i } }
      ]
    }).sort({ createdAt: -1 }).limit(10);
    
    console.log(`Found ${recentPurchases.length} recent bike-related purchases:`);
    
    for (const purchase of recentPurchases) {
      console.log(`\n📦 Purchase ID: ${purchase._id}`);
      console.log(`   Status: ${purchase.paymentStatus}`);
      console.log(`   Created: ${purchase.createdAt}`);
      console.log(`   Package: ${purchase.packageName}`);
      console.log(`   Amount: ${purchase.amountFormatted}`);
      
      if (purchase.metadata) {
        const advertId = purchase.metadata.get('advertId');
        const vehicleType = purchase.metadata.get('vehicleType');
        
        console.log(`   Advert ID: ${advertId}`);
        console.log(`   Vehicle Type: ${vehicleType}`);
        
        if (advertId) {
          // Check if bike was created
          const bike = await Bike.findOne({ advertId });
          if (bike) {
            console.log(`   ✅ Bike found in database: ${bike._id}`);
            console.log(`      Status: ${bike.status}`);
            console.log(`      Make/Model: ${bike.make} ${bike.model}`);
            console.log(`      Price: £${bike.price}`);
          } else {
            console.log(`   ❌ NO BIKE FOUND in database for advertId: ${advertId}`);
            
            // This is the issue - let's check the metadata
            try {
              const vehicleData = JSON.parse(purchase.metadata.get('vehicleData') || '{}');
              const advertData = JSON.parse(purchase.metadata.get('advertData') || '{}');
              
              console.log(`   📋 Vehicle Data:`, {
                make: vehicleData.make,
                model: vehicleData.model,
                registration: vehicleData.registrationNumber
              });
              console.log(`   📋 Advert Data:`, {
                price: advertData.price,
                hasPhotos: advertData.photos?.length > 0,
                hasDescription: !!advertData.description
              });
            } catch (error) {
              console.log(`   ⚠️  Could not parse metadata: ${error.message}`);
            }
          }
        }
      }
    }
    
    console.log('\n🔍 STEP 2: Checking all bikes in database...');
    const allBikes = await Bike.find({}).sort({ createdAt: -1 }).limit(5);
    console.log(`Found ${allBikes.length} bikes in database:`);
    
    for (const bike of allBikes) {
      console.log(`\n🏍️  Bike ID: ${bike._id}`);
      console.log(`   Advert ID: ${bike.advertId}`);
      console.log(`   Status: ${bike.status}`);
      console.log(`   Make/Model: ${bike.make} ${bike.model}`);
      console.log(`   Created: ${bike.createdAt}`);
      console.log(`   Published: ${bike.publishedAt}`);
    }
    
    console.log('\n🔍 STEP 3: Checking for failed payments...');
    const failedPurchases = await AdvertisingPackagePurchase.find({
      paymentStatus: { $in: ['pending', 'failed'] },
      'metadata.vehicleType': 'bike'
    }).sort({ createdAt: -1 }).limit(5);
    
    console.log(`Found ${failedPurchases.length} failed/pending bike purchases:`);
    
    for (const purchase of failedPurchases) {
      console.log(`\n❌ Failed Purchase: ${purchase._id}`);
      console.log(`   Status: ${purchase.paymentStatus}`);
      console.log(`   Created: ${purchase.createdAt}`);
      console.log(`   Stripe Session: ${purchase.stripeSessionId}`);
      
      const advertId = purchase.metadata?.get('advertId');
      if (advertId) {
        console.log(`   Advert ID: ${advertId}`);
        
        // Check if there's a bike with this advertId
        const bike = await Bike.findOne({ advertId });
        if (bike) {
          console.log(`   ✅ Bike exists: ${bike._id} (Status: ${bike.status})`);
        } else {
          console.log(`   ❌ No bike found for this advertId`);
        }
      }
    }
    
    console.log('\n📊 SUMMARY:');
    const totalBikes = await Bike.countDocuments();
    const activeBikes = await Bike.countDocuments({ status: 'active' });
    const pendingBikes = await Bike.countDocuments({ status: 'pending' });
    
    console.log(`   Total bikes: ${totalBikes}`);
    console.log(`   Active bikes: ${activeBikes}`);
    console.log(`   Pending bikes: ${pendingBikes}`);
    
    const totalBikePurchases = await AdvertisingPackagePurchase.countDocuments({
      'metadata.vehicleType': 'bike'
    });
    const paidBikePurchases = await AdvertisingPackagePurchase.countDocuments({
      'metadata.vehicleType': 'bike',
      paymentStatus: 'paid'
    });
    
    console.log(`   Total bike purchases: ${totalBikePurchases}`);
    console.log(`   Paid bike purchases: ${paidBikePurchases}`);
    
    if (paidBikePurchases > activeBikes) {
      console.log(`\n⚠️  ISSUE DETECTED: ${paidBikePurchases} paid purchases but only ${activeBikes} active bikes!`);
      console.log(`   This suggests bikes are not being created after payment.`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testBikePaymentIssue();