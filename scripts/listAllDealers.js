const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');

async function listAllDealers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const dealers = await TradeDealer.find({}).sort({ createdAt: -1 });

    console.log(`\n📋 Found ${dealers.length} dealer accounts:\n`);
    
    dealers.forEach((dealer, index) => {
      console.log(`--- Dealer ${index + 1} ---`);
      console.log('ID:', dealer._id.toString());
      console.log('Business Name:', dealer.businessName);
      console.log('Email:', dealer.email);
      console.log('Status:', dealer.status);
      console.log('Created At:', dealer.createdAt);
      console.log('');
    });

    // Check the specific dealer IDs
    const dealerId1 = '693dc03448280631f3d30ebc';
    const dealerId2 = '6939bfa24ade509021e018e0';

    console.log('\n🔍 Checking specific dealers:');
    
    const dealer1 = await TradeDealer.findById(dealerId1);
    if (dealer1) {
      console.log(`\nDealer 1 (${dealerId1}):`);
      console.log('Business Name:', dealer1.businessName);
      console.log('Email:', dealer1.email);
    }

    const dealer2 = await TradeDealer.findById(dealerId2);
    if (dealer2) {
      console.log(`\nDealer 2 (${dealerId2}):`);
      console.log('Business Name:', dealer2.businessName);
      console.log('Email:', dealer2.email);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

listAllDealers();
