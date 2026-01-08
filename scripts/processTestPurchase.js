/**
 * Manually process a test purchase and create car listing
 * Run with: node scripts/processTestPurchase.js <sessionId>
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const Car = require('../models/Car');
const postcodeService = require('../services/postcodeService');

async function processTestPurchase(sessionId) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the purchase
    const purchase = await AdvertisingPackagePurchase.findOne({
      $or: [
        { stripeSessionId: sessionId },
        { customSessionId: sessionId }
      ]
    });

    if (!purchase) {
      console.error(`❌ Purchase not found for session: ${sessionId}`);
      process.exit(1);
    }

    console.log(`📦 Found purchase: ${purchase._id}`);
    console.log(`   Package: ${purchase.packageName}`);
    console.log(`   Amount: £${(purchase.amount / 100).toFixed(2)}`);
    console.log(`   Status: ${purchase.paymentStatus}\n`);

    // Check if advertId exists in metadata
    if (!purchase.metadata || !purchase.metadata.get('advertId')) {
      console.error('❌ No advertId found in metadata');
      process.exit(1);
    }

    const advertId = purchase.metadata.get('advertId');
    console.log(`📝 Advert ID: ${advertId}\n`);

    // Check if car already exists
    let car = await Car.findOne({ advertId });
    if (car) {
      console.log(`⚠️  Car already exists: ${car._id}`);
      console.log(`   Current status: ${car.advertStatus}`);
      
      // Update to active if not already
      if (car.advertStatus !== 'active') {
        car.advertStatus = 'active';
        car.publishedAt = new Date();
        await car.save();
        console.log(`✅ Updated car status to active`);
      }
    } else {
      // Parse metadata
      let advertData = {};
      let vehicleData = {};
      let contactDetails = {};

      try {
        advertData = JSON.parse(purchase.metadata.get('advertData') || '{}');
        vehicleData = JSON.parse(purchase.metadata.get('vehicleData') || '{}');
        contactDetails = JSON.parse(purchase.metadata.get('contactDetails') || '{}');
      } catch (parseError) {
        console.error(`❌ Error parsing metadata:`, parseError.message);
        process.exit(1);
      }

      console.log(`📋 Parsed data:`);
      console.log(`   Vehicle: ${vehicleData.make} ${vehicleData.model}`);
      console.log(`   Price: £${advertData.price}`);
      console.log(`   Photos: ${advertData.photos?.length || 0}`);
      console.log(`   Contact: ${contactDetails.email}`);
      console.log(`   Postcode: ${contactDetails.postcode}\n`);

      // Geocode postcode to get coordinates and location name
      let latitude, longitude, locationName;
      if (contactDetails.postcode) {
        try {
          console.log(`🌍 Geocoding postcode: ${contactDetails.postcode}`);
          const postcodeData = await postcodeService.lookupPostcode(contactDetails.postcode);
          latitude = postcodeData.latitude;
          longitude = postcodeData.longitude;
          locationName = postcodeData.admin_district || postcodeData.parish || postcodeData.region;
          console.log(`   Coordinates: ${latitude}, ${longitude}`);
          console.log(`   Location: ${locationName}\n`);
        } catch (error) {
          console.warn(`⚠️  Could not geocode postcode: ${error.message}\n`);
        }
      }

      // Calculate expiry date
      let expiryDate = null;
      if (purchase.duration.toLowerCase().includes('until sold')) {
        expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else {
        const weeks = parseInt(purchase.duration.match(/\d+/)?.[0] || 4);
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (weeks * 7));
      }

      // Create car document
      car = new Car({
        advertId: advertId,
        // Vehicle data
        make: vehicleData.make || 'Unknown',
        model: vehicleData.model || 'Unknown',
        year: vehicleData.year || new Date().getFullYear(),
        mileage: vehicleData.mileage || purchase.mileage || 0,
        color: vehicleData.color || 'Not specified',
        fuelType: vehicleData.fuelType || 'Petrol',
        transmission: vehicleData.transmission ? vehicleData.transmission.toLowerCase() : 'manual',
        registrationNumber: vehicleData.registrationNumber || purchase.registration,
        engineSize: vehicleData.engineSize ? parseFloat(String(vehicleData.engineSize).replace(/[^\d.]/g, '')) || undefined : undefined,
        bodyType: vehicleData.bodyType,
        doors: vehicleData.doors ? parseInt(vehicleData.doors) : undefined,
        seats: vehicleData.seats ? parseInt(vehicleData.seats) : undefined,
        co2Emissions: vehicleData.co2Emissions ? parseInt(String(vehicleData.co2Emissions).replace(/[^\d]/g, '')) || undefined : undefined,
        taxStatus: vehicleData.taxStatus,
        motStatus: vehicleData.motStatus,
        dataSource: vehicleData.registrationNumber ? 'DVLA' : 'manual',
        condition: 'used',
        historyCheckStatus: 'not_required', // Skip history check to avoid pre-save hook
        // Advert data
        price: advertData.price || vehicleData.estimatedValue || purchase.amount / 100,
        description: advertData.description || '',
        images: advertData.photos ? advertData.photos.map(p => p.url || p) : [],
        postcode: contactDetails.postcode || '',
        locationName: locationName || '',
        // Location data
        latitude: latitude,
        longitude: longitude,
        location: latitude && longitude ? {
          type: 'Point',
          coordinates: [longitude, latitude]
        } : undefined,
        // Seller contact
        sellerContact: {
          phoneNumber: contactDetails.phoneNumber || '',
          email: contactDetails.email || purchase.customerEmail || '',
          allowEmailContact: contactDetails.allowEmailContact || false,
          postcode: contactDetails.postcode || ''
        },
        // Package details
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
        // Status
        advertStatus: 'active',
        publishedAt: new Date(),
        createdAt: purchase.createdAt,
        updatedAt: new Date()
      });

      await car.save();
      console.log(`✅ Created car in database!`);
      console.log(`   Car ID: ${car._id}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Registration: ${car.registrationNumber}`);
      console.log(`   Price: £${car.price}`);
      console.log(`   Photos: ${car.images.length}`);
      console.log(`   Location: ${car.locationName || 'N/A'}, ${car.postcode} (${latitude || 'N/A'}, ${longitude || 'N/A'})`);
      console.log(`   Status: ${car.advertStatus}`);
    }

    // Update purchase status
    if (purchase.paymentStatus !== 'paid') {
      purchase.paymentStatus = 'paid';
      purchase.paidAt = new Date();
      await purchase.save();
      console.log(`\n✅ Updated purchase status to paid`);
    }

    if (purchase.packageStatus !== 'active') {
      purchase.packageStatus = 'active';
      purchase.activatedAt = new Date();
      await purchase.save();
      console.log(`✅ Updated package status to active`);
    }

    console.log(`\n🎉 Success! Car is now live and searchable!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Get session ID from command line
const sessionId = process.argv[2];

if (!sessionId) {
  console.error('❌ Please provide a session ID');
  console.log('\nUsage: node scripts/processTestPurchase.js <sessionId>');
  console.log('Example: node scripts/processTestPurchase.js cs_test_a1nwP1mUDKpV...');
  process.exit(1);
}

processTestPurchase(sessionId);
