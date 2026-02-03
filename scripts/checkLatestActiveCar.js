require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkLatestActiveCar() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    console.log('🔗 Connecting to MongoDB...');
    console.log('URI:', mongoUri ? mongoUri.substring(0, 30) + '...' : 'NOT FOUND');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find the latest car with active status
    const latestCar = await Car.findOne({ advertStatus: 'active' })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestCar) {
      console.log('❌ No active cars found in database');
      process.exit(0);
    }

    console.log('\n📊 Latest Active Car:');
    console.log('==================');
    console.log('ID:', latestCar._id);
    console.log('Advert ID:', latestCar.advertId);
    console.log('Registration:', latestCar.registrationNumber);
    console.log('Make/Model:', `${latestCar.make} ${latestCar.model}`);
    console.log('Variant:', latestCar.variant || 'NOT SET');
    console.log('Display Title:', latestCar.displayTitle || 'NOT SET');
    console.log('Year:', latestCar.year);
    console.log('Mileage:', latestCar.mileage);
    console.log('Price:', `£${latestCar.price}`);
    console.log('Transmission:', latestCar.transmission);
    console.log('Status:', latestCar.advertStatus);
    console.log('User ID:', latestCar.userId);
    console.log('Dealer ID:', latestCar.dealerId);
    console.log('Is Dealer Listing:', latestCar.isDealerListing);
    console.log('Postcode:', latestCar.postcode);
    console.log('Location:', latestCar.locationName);
    console.log('Coordinates:', latestCar.latitude, latestCar.longitude);
    console.log('Created:', latestCar.createdAt);
    console.log('Published:', latestCar.publishedAt);
    console.log('\n');

    // Check if car has required fields for display
    const issues = [];
    if (!latestCar.userId && !latestCar.dealerId) {
      issues.push('⚠️  No userId or dealerId - car won\'t show in My Listings');
    }
    if (!latestCar.postcode) {
      issues.push('⚠️  No postcode - location search may not work');
    }
    if (!latestCar.latitude || !latestCar.longitude) {
      issues.push('⚠️  No coordinates - distance search won\'t work');
    }
    if (!latestCar.images || latestCar.images.length === 0) {
      issues.push('ℹ️  No images uploaded yet');
    }

    if (issues.length > 0) {
      console.log('🔍 Potential Issues:');
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('✅ Car looks good - should be visible on frontend!');
    }

    // Count total active cars
    const totalActive = await Car.countDocuments({ advertStatus: 'active' });
    console.log(`\n📈 Total active cars in database: ${totalActive}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLatestActiveCar();
