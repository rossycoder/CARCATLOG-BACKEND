const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function findUnlinkedVehicles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all dealer listings
    const allDealerListings = await Car.find({ isDealerListing: true })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`\n📋 Last 10 dealer listings:\n`);
    
    allDealerListings.forEach((vehicle, index) => {
      console.log(`--- Vehicle ${index + 1} ---`);
      console.log('ID:', vehicle._id);
      console.log('Make/Model:', `${vehicle.make} ${vehicle.model} ${vehicle.year}`);
      console.log('Dealer ID:', vehicle.dealerId?.toString() || 'NOT SET');
      console.log('Is Dealer Listing:', vehicle.isDealerListing);
      console.log('Advert Status:', vehicle.advertStatus);
      console.log('Created At:', vehicle.createdAt);
      console.log('Seller Contact:', vehicle.sellerContact?.businessName || 'N/A');
      console.log('');
    });

    // Find vehicles without dealerId
    const unlinkedVehicles = await Car.find({ 
      isDealerListing: true,
      dealerId: { $exists: false }
    });

    console.log(`\n⚠️  Found ${unlinkedVehicles.length} dealer listings without dealerId`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

findUnlinkedVehicles();
