const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');

async function listDealers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const dealers = await TradeDealer.find({}).select('+password');
    
    console.log(`Found ${dealers.length} trade dealer(s):\n`);
    
    dealers.forEach((dealer, index) => {
      console.log(`${index + 1}. ${dealer.businessName}`);
      console.log(`   Email: ${dealer.email}`);
      console.log(`   Status: ${dealer.status}`);
      console.log(`   Email Verified: ${dealer.emailVerified}`);
      console.log(`   Created: ${dealer.createdAt}`);
      console.log(`   Password Hash: ${dealer.password ? 'Present' : 'Missing'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listDealers();
