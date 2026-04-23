require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');

async function checkIncompleteActiveCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all active cars
    const activeCars = await Car.find({ advertStatus: 'active' })
      .populate('userId', 'name email')
      .lean();

    console.log(`📊 Total Active Cars: ${activeCars.length}\n`);
    console.log('=' .repeat(80));

    for (const car of activeCars) {
      console.log(`\n🚗 Car ID: ${car._id}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Make/Model: ${car.make || 'N/A'} ${car.model || 'N/A'}`);
      console.log(`   Year: ${car.year || 'N/A'}`);
      console.log(`   Owner: ${car.userId?.name || 'N/A'} (${car.userId?.email || 'N/A'})`);
      console.log(`   Status: ${car.advertStatus}`);
      
      // Check if data is incomplete
      const missingFields = [];
      if (!car.make) missingFields.push('make');
      if (!car.model) missingFields.push('model');
      if (!car.year) missingFields.push('year');
      if (!car.color) missingFields.push('color');
      if (!car.fuelType) missingFields.push('fuelType');
      if (!car.transmission) missingFields.push('transmission');
      if (!car.mileage) missingFields.push('mileage');
      if (!car.price) missingFields.push('price');
      if (!car.bodyType) missingFields.push('bodyType');
      if (!car.doors) missingFields.push('doors');
      if (!car.engineSize) missingFields.push('engineSize');
      
      if (missingFields.length > 0) {
        console.log(`   ⚠️  INCOMPLETE DATA - Missing: ${missingFields.join(', ')}`);
      } else {
        console.log(`   ✅ Complete data`);
      }
      
      // Check payment status
      if (car.purchaseId) {
        const purchase = await AdvertisingPackagePurchase.findById(car.purchaseId);
        if (purchase) {
          console.log(`   💳 Payment Status: ${purchase.status}`);
          console.log(`   📦 Package: ${purchase.packageName}`);
          console.log(`   💰 Amount: £${purchase.amount}`);
          console.log(`   📅 Expires: ${purchase.expiresAt ? new Date(purchase.expiresAt).toLocaleDateString() : 'N/A'}`);
        } else {
          console.log(`   ❌ Payment record not found (purchaseId: ${car.purchaseId})`);
        }
      } else {
        console.log(`   ❌ No purchaseId linked`);
      }
      
      // Check coordinates
      if (!car.latitude || !car.longitude) {
        console.log(`   ⚠️  Missing coordinates (lat: ${car.latitude}, lon: ${car.longitude})`);
      } else {
        console.log(`   📍 Coordinates: ${car.latitude}, ${car.longitude}`);
      }
      
      console.log(`   🕐 Created: ${new Date(car.createdAt).toLocaleString()}`);
      console.log('-'.repeat(80));
    }

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY:');
    const incompleteCars = activeCars.filter(car => {
      return !car.make || !car.model || !car.year || !car.color || 
             !car.fuelType || !car.transmission || !car.mileage || 
             !car.price || !car.bodyType || !car.doors || !car.engineSize;
    });
    console.log(`Total Active Cars: ${activeCars.length}`);
    console.log(`Incomplete Cars: ${incompleteCars.length}`);
    console.log(`Complete Cars: ${activeCars.length - incompleteCars.length}`);
    
    const carsWithoutCoordinates = activeCars.filter(car => !car.latitude || !car.longitude);
    console.log(`Cars without coordinates: ${carsWithoutCoordinates.length}`);
    
    const carsWithoutPayment = activeCars.filter(car => !car.purchaseId);
    console.log(`Cars without payment link: ${carsWithoutPayment.length}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkIncompleteActiveCars();
