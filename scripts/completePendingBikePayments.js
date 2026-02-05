const mongoose = require('mongoose');
const Bike = require('../models/Bike');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const postcodeService = require('../services/postcodeService');
require('dotenv').config();

async function completePendingBikePayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔍 Finding pending bike payments...');
    
    // Find all pending bike purchases
    const pendingPurchases = await AdvertisingPackagePurchase.find({
      paymentStatus: 'pending',
      'metadata.vehicleType': 'bike'
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${pendingPurchases.length} pending bike purchases to complete`);
    
    for (const purchase of pendingPurchases) {
      console.log(`\n📦 Processing Purchase: ${purchase._id}`);
      console.log(`   Created: ${purchase.createdAt}`);
      console.log(`   Package: ${purchase.packageName} (${purchase.amountFormatted})`);
      
      const advertId = purchase.metadata?.get('advertId');
      if (!advertId) {
        console.log(`   ❌ No advertId found, skipping`);
        continue;
      }
      
      console.log(`   Advert ID: ${advertId}`);
      
      // Check if bike already exists
      const existingBike = await Bike.findOne({ advertId });
      if (existingBike) {
        console.log(`   ⚠️  Bike already exists: ${existingBike._id}, skipping`);
        continue;
      }
      
      try {
        // Parse metadata
        const vehicleData = JSON.parse(purchase.metadata.get('vehicleData') || '{}');
        const advertData = JSON.parse(purchase.metadata.get('advertData') || '{}');
        const contactDetails = JSON.parse(purchase.metadata.get('contactDetails') || '{}');
        
        console.log(`   🏍️  Creating bike: ${vehicleData.make} ${vehicleData.model}`);
        console.log(`   💰 Price: £${advertData.price}`);
        
        // Calculate expiry date (duration is in weeks)
        const durationWeeks = parseInt(purchase.duration) || 4; // Default to 4 weeks if not set
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (durationWeeks * 7));
        
        // Geocode postcode if available
        let latitude, longitude, locationName;
        if (contactDetails.postcode) {
          try {
            const postcodeData = await postcodeService.lookupPostcode(contactDetails.postcode);
            latitude = postcodeData.latitude;
            longitude = postcodeData.longitude;
            locationName = postcodeData.locationName;
            console.log(`   📍 Geocoded: ${locationName}`);
          } catch (error) {
            console.warn(`   ⚠️  Could not geocode postcode: ${error.message}`);
          }
        }
        
        // Get or create a user ID (we'll use a default user for manual completions)
        let userId = purchase.metadata?.get('userId');
        if (!userId) {
          // Create a default user for manual completions
          const User = require('../models/User');
          let defaultUser = await User.findOne({ email: 'manual-completion@system.local' });
          if (!defaultUser) {
            defaultUser = new User({
              email: 'manual-completion@system.local',
              name: 'Manual Completion User',
              isVerified: true
            });
            await defaultUser.save();
            console.log(`   👤 Created default user: ${defaultUser._id}`);
          }
          userId = defaultUser._id;
        }
        
        // Create the bike
        const bike = new Bike({
          advertId: advertId,
          userId: userId, // Add required userId
          make: vehicleData.make || 'Unknown',
          model: vehicleData.model || 'Unknown',
          year: vehicleData.year || new Date().getFullYear(),
          mileage: vehicleData.mileage || 0,
          color: vehicleData.color || 'Not specified',
          fuelType: vehicleData.fuelType || 'Petrol',
          transmission: 'manual',
          registrationNumber: vehicleData.registrationNumber || null,
          engineCC: vehicleData.engineCC || 600, // Default to 600cc if not specified
          bikeType: vehicleData.bikeType || 'Other',
          condition: 'used',
          price: advertData.price || 0,
          description: advertData.description || '',
          images: advertData.photos ? advertData.photos.map(p => p.url || p) : [],
          postcode: contactDetails.postcode || '',
          locationName: locationName,
          latitude: latitude,
          longitude: longitude,
          location: latitude && longitude ? {
            type: 'Point',
            coordinates: [longitude, latitude]
          } : undefined,
          sellerContact: {
            type: 'private',
            phoneNumber: contactDetails.phoneNumber,
            email: contactDetails.email,
            allowEmailContact: contactDetails.allowEmailContact || false,
            postcode: contactDetails.postcode
          },
          advertisingPackage: {
            packageId: purchase.packageId,
            packageName: purchase.packageName,
            duration: durationWeeks.toString(), // Convert to string as expected
            price: purchase.amount,
            purchaseDate: new Date(),
            expiryDate: expiryDate, // Now properly calculated
            stripeSessionId: purchase.stripeSessionId,
            stripePaymentIntentId: `manual_completion_${Date.now()}`
          },
          status: 'active',
          publishedAt: new Date()
        });
        
        await bike.save();
        console.log(`   ✅ Bike created successfully: ${bike._id}`);
        
        // Update purchase status to paid
        purchase.paymentStatus = 'paid';
        purchase.stripePaymentIntentId = `manual_completion_${Date.now()}`;
        purchase.paidAt = new Date();
        await purchase.save();
        
        console.log(`   ✅ Purchase marked as paid`);
        
      } catch (error) {
        console.error(`   ❌ Error creating bike: ${error.message}`);
      }
    }
    
    console.log('\n📊 FINAL SUMMARY:');
    const totalBikes = await Bike.countDocuments();
    const activeBikes = await Bike.countDocuments({ status: 'active' });
    const paidBikePurchases = await AdvertisingPackagePurchase.countDocuments({
      'metadata.vehicleType': 'bike',
      paymentStatus: 'paid'
    });
    
    console.log(`   Total bikes in database: ${totalBikes}`);
    console.log(`   Active bikes: ${activeBikes}`);
    console.log(`   Paid bike purchases: ${paidBikePurchases}`);
    
    if (totalBikes > 0) {
      console.log('\n✅ SUCCESS: Bikes have been created and are now available!');
      console.log('   Users should now be able to see their bike listings.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

completePendingBikePayments();