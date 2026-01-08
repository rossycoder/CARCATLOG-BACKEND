const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const TradeDealer = require('../models/TradeDealer');

async function diagnoseTradeDashboard() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!\n');

    // Get all trade dealers
    const dealers = await TradeDealer.find({});
    console.log(`Found ${dealers.length} trade dealer(s)\n`);

    for (const dealer of dealers) {
      console.log('='.repeat(60));
      console.log(`Dealer: ${dealer.businessName}`);
      console.log(`Email: ${dealer.email}`);
      console.log(`Dealer ID: ${dealer._id}`);
      console.log('='.repeat(60));

      // Find all cars for this dealer
      const allCars = await Car.find({ dealerId: dealer._id });
      console.log(`\nTotal cars with dealerId: ${allCars.length}`);

      // Find cars with isDealerListing flag
      const dealerListings = await Car.find({ 
        dealerId: dealer._id,
        isDealerListing: true 
      });
      console.log(`Cars with isDealerListing=true: ${dealerListings.length}`);

      // Find active listings
      const activeListings = await Car.find({
        dealerId: dealer._id,
        isDealerListing: true,
        advertStatus: 'active'
      });
      console.log(`Active dealer listings: ${activeListings.length}`);

      // Show all cars for this dealer
      if (allCars.length > 0) {
        console.log('\n--- All Cars for this Dealer ---');
        allCars.forEach((car, index) => {
          console.log(`\n${index + 1}. ${car.year} ${car.make} ${car.model}`);
          console.log(`   Car ID: ${car._id}`);
          console.log(`   Advert ID: ${car.advertId || 'N/A'}`);
          console.log(`   Dealer ID: ${car.dealerId}`);
          console.log(`   isDealerListing: ${car.isDealerListing}`);
          console.log(`   advertStatus: ${car.advertStatus}`);
          console.log(`   sellerType: ${car.sellerType}`);
          console.log(`   Created: ${car.createdAt}`);
          console.log(`   Published: ${car.publishedAt || 'Not published'}`);
        });
      }

      // Check for cars without isDealerListing flag
      const carsWithoutFlag = await Car.find({
        dealerId: dealer._id,
        $or: [
          { isDealerListing: { $exists: false } },
          { isDealerListing: false }
        ]
      });

      if (carsWithoutFlag.length > 0) {
        console.log(`\n⚠️  WARNING: Found ${carsWithoutFlag.length} car(s) with dealerId but isDealerListing is false or missing!`);
        console.log('These cars will NOT show in the trade dashboard.');
        console.log('\nCars needing fix:');
        carsWithoutFlag.forEach((car, index) => {
          console.log(`${index + 1}. ${car.year} ${car.make} ${car.model} (ID: ${car._id})`);
        });
      }

      console.log('\n');
    }

    // Check for orphaned cars (no dealer but has dealerId)
    const orphanedCars = await Car.find({
      dealerId: { $exists: true, $ne: null },
      isDealerListing: { $ne: true }
    });

    if (orphanedCars.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('⚠️  ORPHANED CARS (have dealerId but isDealerListing is not true)');
      console.log('='.repeat(60));
      orphanedCars.forEach((car, index) => {
        console.log(`\n${index + 1}. ${car.year} ${car.make} ${car.model}`);
        console.log(`   Car ID: ${car._id}`);
        console.log(`   Dealer ID: ${car.dealerId}`);
        console.log(`   isDealerListing: ${car.isDealerListing}`);
        console.log(`   advertStatus: ${car.advertStatus}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSIS COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

diagnoseTradeDashboard();
