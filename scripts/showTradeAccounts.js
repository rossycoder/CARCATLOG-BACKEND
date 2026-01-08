const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const TradeDealer = require('../models/TradeDealer');

async function showTradeAccounts() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!\n');

    const dealers = await TradeDealer.find({});
    
    console.log('='.repeat(70));
    console.log('TRADE DEALER ACCOUNTS');
    console.log('='.repeat(70));

    for (const dealer of dealers) {
      const vehicleCount = await Car.countDocuments({
        dealerId: dealer._id,
        isDealerListing: true
      });

      const activeCount = await Car.countDocuments({
        dealerId: dealer._id,
        isDealerListing: true,
        advertStatus: 'active'
      });

      console.log(`\nBusiness: ${dealer.businessName}`);
      console.log(`Email: ${dealer.email}`);
      console.log(`Dealer ID: ${dealer._id}`);
      console.log(`Total Vehicles: ${vehicleCount}`);
      console.log(`Active Listings: ${activeCount}`);
      console.log(`Verified: ${dealer.isVerified ? 'Yes' : 'No'}`);
      console.log('-'.repeat(70));
    }

    console.log('\n' + '='.repeat(70));
    console.log('RECOMMENDATION');
    console.log('='.repeat(70));
    console.log('\nYou have multiple accounts with the same business name.');
    console.log('To see all your vehicles in one dashboard:');
    console.log('\n1. Choose which email account you want to use');
    console.log('2. Run: node backend/scripts/fixTradeDashboardVehicles.js');
    console.log('3. Select the account you want to consolidate vehicles into');
    console.log('\nOR');
    console.log('\nLog in with the email that has the vehicles you want to see.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

showTradeAccounts();
