const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const Car = require('../models/Car');

async function checkDealerInventory() {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find dealer by email
    const email = 'rossy4586879@gmail.com';
    const dealer = await TradeDealer.findOne({ email: email.toLowerCase() });
    
    if (!dealer) {
      console.log('❌ Dealer not found with email:', email);
      return;
    }

    console.log('\n✅ Dealer found:');
    console.log('ID:', dealer._id);
    console.log('Business Name:', dealer.businessName);
    console.log('Email:', dealer.email);
    console.log('Status:', dealer.status);

    // Find all vehicles for this dealer
    console.log('\n🔍 Searching for vehicles...');
    console.log('Dealer ID:', dealer._id.toString());

    const vehicles = await Car.find({ dealerId: dealer._id });
    console.log(`\n📊 Found ${vehicles.length} total vehicles for this dealer`);

    if (vehicles.length > 0) {
      console.log('\n📋 Vehicle Details:');
      vehicles.forEach((vehicle, index) => {
        console.log(`\n--- Vehicle ${index + 1} ---`);
        console.log('ID:', vehicle._id);
        console.log('Make/Model:', `${vehicle.make} ${vehicle.model}`);
        console.log('Year:', vehicle.year);
        console.log('Dealer ID:', vehicle.dealerId?.toString());
        console.log('Is Dealer Listing:', vehicle.isDealerListing);
        console.log('Advert Status:', vehicle.advertStatus);
        console.log('Created At:', vehicle.createdAt);
      });
    }

    // Check with different queries
    console.log('\n🔍 Testing different queries:');
    
    const query1 = await Car.find({ dealerId: dealer._id, isDealerListing: true });
    console.log(`Query 1 (dealerId + isDealerListing): ${query1.length} vehicles`);
    
    const query2 = await Car.find({ dealerId: dealer._id.toString() });
    console.log(`Query 2 (dealerId as string): ${query2.length} vehicles`);
    
    const query3 = await Car.find({ isDealerListing: true });
    console.log(`Query 3 (all dealer listings): ${query3.length} vehicles`);

    // Check active vehicles
    const activeVehicles = await Car.find({ 
      dealerId: dealer._id, 
      isDealerListing: true,
      advertStatus: 'active'
    });
    console.log(`\n✅ Active vehicles: ${activeVehicles.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkDealerInventory();
