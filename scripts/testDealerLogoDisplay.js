require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const TradeDealer = require('../models/TradeDealer');

async function testDealerLogoDisplay() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find a trade dealer with a logo
    const dealerWithLogo = await TradeDealer.findOne({ logo: { $exists: true, $ne: null } });
    
    if (!dealerWithLogo) {
      console.log('❌ No trade dealer found with a logo');
      console.log('\nTo test this feature:');
      console.log('1. Upload a logo for a trade dealer');
      console.log('2. Publish a vehicle from that dealer');
      console.log('3. Run this script again\n');
      return;
    }

    console.log('📋 Trade Dealer Found:');
    console.log(`   Business Name: ${dealerWithLogo.businessName}`);
    console.log(`   Logo URL: ${dealerWithLogo.logo}`);
    console.log(`   Dealer ID: ${dealerWithLogo._id}\n`);

    // Find vehicles from this dealer
    const dealerVehicles = await Car.find({ dealerId: dealerWithLogo._id }).limit(5);
    
    if (dealerVehicles.length === 0) {
      console.log('❌ No vehicles found for this dealer');
      console.log('\nTo test this feature:');
      console.log('1. Publish a vehicle from this dealer');
      console.log('2. Run this script again\n');
      return;
    }

    console.log(`🚗 Found ${dealerVehicles.length} vehicle(s) from this dealer:\n`);

    for (const vehicle of dealerVehicles) {
      console.log(`Vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.year})`);
      console.log(`   ID: ${vehicle._id}`);
      console.log(`   Status: ${vehicle.advertStatus}`);
      console.log(`   Dealer ID: ${vehicle.dealerId}`);
      console.log(`   Seller Type: ${vehicle.sellerType || 'Not set'}`);
      
      // Simulate what the API endpoint will return
      const carData = vehicle.toObject();
      carData.dealerLogo = dealerWithLogo.logo;
      
      if (!carData.sellerContact) {
        carData.sellerContact = {};
      }
      carData.sellerContact.businessName = dealerWithLogo.businessName;
      carData.sellerContact.type = 'trade';
      
      console.log(`   ✅ Will display logo: ${carData.dealerLogo}`);
      console.log(`   ✅ Business name: ${carData.sellerContact.businessName}\n`);
    }

    console.log('\n✅ Test complete!');
    console.log('\nTo see the logo on the frontend:');
    console.log(`1. Visit: http://localhost:5173/car/${dealerVehicles[0]._id}`);
    console.log('2. Look for the "Meet the seller" section');
    console.log('3. The dealer logo should be displayed\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

testDealerLogoDisplay();
