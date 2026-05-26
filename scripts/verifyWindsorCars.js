require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');

const ATLAS_URI = 'mongodb+srv://dbuser:dbuser123@cluster0.5stgkwi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&serverSelectionTimeoutMS=15000';

mongoose.connect(ATLAS_URI).then(async () => {
  const dealer = await TradeDealer.findOneAndUpdate(
    { email: 'windsorcars2026@gmail.com' },
    {
      $set: {
        emailVerified: true,
        status: 'active',
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    },
    { new: true }
  );

  if (dealer) {
    console.log('✅ Verified successfully!');
    console.log('📧 Email:', dealer.email);
    console.log('🏢 Business:', dealer.businessName);
    console.log('✓ Status:', dealer.status);
    console.log('✓ Verified:', dealer.emailVerified);
  } else {
    console.log('❌ Not found');
  }
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
