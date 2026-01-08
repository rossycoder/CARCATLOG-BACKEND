/**
 * Migration Script: Transfer data from advertisingpackagepurchases to cars collection
 * 
 * This script reads existing purchase records and creates corresponding car documents
 * Run with: node scripts/migratePurchasesToCars.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const Car = require('../models/Car');

async function migratePurchasesToCars() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all paid purchases with metadata
    const purchases = await AdvertisingPackagePurchase.find({
      paymentStatus: 'paid',
      packageStatus: 'active'
    });

    console.log(`\n📦 Found ${purchases.length} paid purchases to process\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const purchase of purchases) {
      try {
        // Check if metadata exists and has advertId
        if (!purchase.metadata || !purchase.metadata.get('advertId')) {
          console.log(`⏭️  Skipping purchase ${purchase._id} - no advertId in metadata`);
          skipped++;
          continue;
        }

        const advertId = purchase.metadata.get('advertId');

        // Check if car already exists
        const existingCar = await Car.findOne({ advertId });
        if (existingCar) {
          console.log(`⏭️  Skipping advertId ${advertId} - already exists in cars collection`);
          skipped++;
          continue;
        }

        // Parse metadata
        let advertData = {};
        let vehicleData = {};
        let contactDetails = {};

        try {
          advertData = JSON.parse(purchase.metadata.get('advertData') || '{}');
          vehicleData = JSON.parse(purchase.metadata.get('vehicleData') || '{}');
          contactDetails = JSON.parse(purchase.metadata.get('contactDetails') || '{}');
        } catch (parseError) {
          console.error(`❌ Error parsing metadata for ${advertId}:`, parseError.message);
          errors++;
          continue;
        }

        // Calculate expiry date
        let expiryDate = purchase.expiresAt;
        if (!expiryDate && purchase.duration) {
          if (purchase.duration.toLowerCase().includes('until sold')) {
            expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          } else {
            const weeks = parseInt(purchase.duration.match(/\d+/)?.[0] || 4);
            expiryDate = new Date(purchase.activatedAt || purchase.paidAt);
            expiryDate.setDate(expiryDate.getDate() + (weeks * 7));
          }
        }

        // Create car document
        const car = new Car({
          advertId: advertId,
          // Vehicle data
          make: vehicleData.make || 'Unknown',
          model: vehicleData.model || 'Unknown',
          year: vehicleData.year || new Date().getFullYear(),
          mileage: vehicleData.mileage || purchase.mileage || 0,
          color: vehicleData.color || 'Not specified',
          fuelType: vehicleData.fuelType || 'Petrol',
          transmission: vehicleData.transmission || 'manual',
          registrationNumber: vehicleData.registrationNumber || purchase.registration,
          engineSize: vehicleData.engineSize,
          bodyType: vehicleData.bodyType,
          doors: vehicleData.doors,
          seats: vehicleData.seats,
          co2Emissions: vehicleData.co2Emissions,
          taxStatus: vehicleData.taxStatus,
          motStatus: vehicleData.motStatus,
          dataSource: vehicleData.registrationNumber ? 'DVLA' : 'manual',
          condition: 'used',
          // Advert data
          price: advertData.price || vehicleData.estimatedValue || purchase.amount / 100,
          description: advertData.description || '',
          images: advertData.photos ? advertData.photos.map(p => p.url || p) : [],
          postcode: contactDetails.postcode || '',
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
            purchaseDate: purchase.paidAt || purchase.activatedAt,
            expiryDate: expiryDate,
            stripeSessionId: purchase.stripeSessionId,
            stripePaymentIntentId: purchase.stripePaymentIntentId
          },
          // Status
          advertStatus: 'active',
          publishedAt: purchase.activatedAt || purchase.paidAt,
          createdAt: purchase.createdAt,
          updatedAt: new Date()
        });

        await car.save();
        created++;
        
        console.log(`✅ Created car for advertId: ${advertId}`);
        console.log(`   Make/Model: ${car.make} ${car.model}`);
        console.log(`   Price: £${car.price}`);
        console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
        console.log(`   Photos: ${car.images.length}`);
        console.log('');

      } catch (error) {
        console.error(`❌ Error processing purchase ${purchase._id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total: ${purchases.length}`);

    // Verify
    const totalCars = await Car.countDocuments();
    console.log(`\n🚗 Total cars in collection: ${totalCars}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run migration
migratePurchasesToCars();
