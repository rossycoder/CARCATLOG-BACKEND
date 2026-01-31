/**
 * Complete pending car payment manually
 * This script finds the pending purchase and activates the car
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');

const PURCHASE_ID = '697e68a6e60cd5a6ec194dc0';
const ADVERT_ID = '958c5302-992b-479a-a8de-feb4a93bdb41';

async function completePendingPayment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the purchase record
    const purchase = await AdvertisingPackagePurchase.findById(PURCHASE_ID);
    
    if (!purchase) {
      console.error('❌ Purchase not found:', PURCHASE_ID);
      return;
    }

    console.log('\n📦 Purchase Details:');
    console.log('   ID:', purchase._id);
    console.log('   Package:', purchase.packageName);
    console.log('   Amount:', purchase.amountFormatted);
    console.log('   Payment Status:', purchase.paymentStatus);
    console.log('   Package Status:', purchase.packageStatus);
    console.log('   Seller Type:', purchase.sellerType);

    // Find the car
    const car = await Car.findOne({ advertId: ADVERT_ID });
    
    if (!car) {
      console.error('❌ Car not found with advertId:', ADVERT_ID);
      
      // Check if purchase has metadata to create car
      if (purchase.metadata) {
        console.log('\n📝 Creating car from purchase metadata...');
        
        const advertData = JSON.parse(purchase.metadata.get('advertData') || '{}');
        const vehicleData = JSON.parse(purchase.metadata.get('vehicleData') || '{}');
        const contactDetails = JSON.parse(purchase.metadata.get('contactDetails') || '{}');
        const userId = purchase.metadata.get('userId');
        
        console.log('   Vehicle:', vehicleData.make, vehicleData.model);
        console.log('   Price: £', advertData.price);
        console.log('   Photos:', advertData.photos?.length || 0);
        console.log('   User ID:', userId);
        
        // Calculate expiry date
        const now = new Date();
        const expiryDate = new Date(now.setFullYear(now.getFullYear() + 1)); // 1 year for "Until sold"
        
        // Get location from postcode
        const postcodeService = require('../services/postcodeService');
        let locationName;
        try {
          const postcodeData = await postcodeService.lookupPostcode(contactDetails.postcode);
          locationName = postcodeData.locationName;
        } catch (error) {
          console.warn('⚠️  Could not geocode postcode:', error.message);
        }
        
        // Create new car
        const newCar = new Car({
          advertId: ADVERT_ID,
          userId: userId || null,
          // Vehicle data
          make: vehicleData.make,
          model: vehicleData.model,
          variant: vehicleData.variant,
          displayTitle: vehicleData.displayTitle,
          year: vehicleData.year,
          mileage: vehicleData.mileage || 0,
          color: vehicleData.color || 'Not specified',
          fuelType: vehicleData.fuelType || 'Petrol',
          transmission: vehicleData.transmission || 'manual',
          registrationNumber: vehicleData.registrationNumber,
          engineSize: vehicleData.engineSize,
          bodyType: vehicleData.bodyType,
          doors: vehicleData.doors,
          seats: vehicleData.seats,
          co2Emissions: vehicleData.co2Emissions,
          taxStatus: vehicleData.taxStatus,
          motStatus: vehicleData.motStatus,
          motDue: vehicleData.motDue,
          motExpiry: vehicleData.motExpiry,
          dataSource: vehicleData.registrationNumber ? 'DVLA' : 'manual',
          condition: 'used',
          // Advert data
          price: advertData.price || vehicleData.estimatedValue || 0,
          description: advertData.description || '',
          images: advertData.photos ? advertData.photos.map(p => p.url || p) : [],
          features: advertData.features || [],
          videoUrl: advertData.videoUrl || '',
          // Location
          postcode: contactDetails.postcode || '',
          locationName: locationName,
          // Seller contact
          sellerContact: {
            type: purchase.sellerType || 'private',
            phoneNumber: contactDetails.phoneNumber,
            email: contactDetails.email,
            allowEmailContact: contactDetails.allowEmailContact || false,
            postcode: contactDetails.postcode
          },
          // Package details
          advertisingPackage: {
            packageId: purchase.packageId,
            packageName: purchase.packageName,
            duration: purchase.duration,
            price: purchase.amount,
            purchaseDate: new Date(),
            expiryDate: expiryDate,
            stripeSessionId: purchase.stripeSessionId
          },
          // Status
          advertStatus: 'active',
          publishedAt: new Date(),
          historyCheckStatus: vehicleData.registrationNumber ? 'pending' : 'not_required'
        });
        
        await newCar.save();
        console.log('✅ Car created successfully!');
        console.log('   Car ID:', newCar._id);
        console.log('   Status:', newCar.advertStatus);
        
        // Mark purchase as paid and activated
        await purchase.markAsPaid('manual_completion');
        await purchase.activatePackage();
        
        console.log('✅ Purchase marked as paid and activated');
        
      } else {
        console.error('❌ No metadata found in purchase to create car');
      }
      
      return;
    }

    console.log('\n🚗 Car Details:');
    console.log('   ID:', car._id);
    console.log('   Make/Model:', car.make, car.model);
    console.log('   Registration:', car.registrationNumber);
    console.log('   Status:', car.advertStatus);
    console.log('   User ID:', car.userId);
    console.log('   Price: £', car.price);
    console.log('   Images:', car.images?.length || 0);

    // Update car status to active
    if (car.advertStatus !== 'active') {
      console.log('\n📝 Activating car...');
      
      car.advertStatus = 'active';
      car.publishedAt = new Date();
      
      // Calculate expiry date
      const now = new Date();
      const expiryDate = new Date(now.setFullYear(now.getFullYear() + 1)); // 1 year for "Until sold"
      
      car.advertisingPackage = {
        packageId: purchase.packageId,
        packageName: purchase.packageName,
        duration: purchase.duration,
        price: purchase.amount,
        purchaseDate: new Date(),
        expiryDate: expiryDate,
        stripeSessionId: purchase.stripeSessionId
      };
      
      await car.save();
      console.log('✅ Car activated successfully!');
    } else {
      console.log('ℹ️  Car is already active');
    }

    // Mark purchase as paid and activated
    if (purchase.paymentStatus !== 'paid') {
      console.log('\n📝 Marking purchase as paid...');
      await purchase.markAsPaid('manual_completion');
      await purchase.activatePackage();
      console.log('✅ Purchase marked as paid and activated');
    } else {
      console.log('ℹ️  Purchase is already paid');
    }

    console.log('\n✅ All done! Car should now appear in listings.');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

completePendingPayment();
