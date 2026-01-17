require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');

async function testDealerLogo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the dealer you mentioned
    const dealer = await TradeDealer.findOne({ 
      email: 'rozeenacareers031@gmail.com' 
    });

    if (!dealer) {
      console.log('Dealer not found');
      return;
    }

    console.log('\n=== Dealer Information ===');
    console.log('Business Name:', dealer.businessName);
    console.log('Email:', dealer.email);
    console.log('Logo:', dealer.logo);
    console.log('Logo is null?', dealer.logo === null);
    console.log('Logo is undefined?', dealer.logo === undefined);
    console.log('\nFull dealer object:');
    console.log(JSON.stringify(dealer, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testDealerLogo();
