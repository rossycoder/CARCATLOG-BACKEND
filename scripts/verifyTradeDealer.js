/**
 * Manual Trade Dealer Verification Script
 * Use this to manually verify trade dealer accounts when email service is down
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');

async function verifyTradeDealer(email) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find and update the trade dealer
    const dealer = await TradeDealer.findOneAndUpdate(
      { email: email.toLowerCase() },
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

    if (!dealer) {
      console.log('❌ Trade dealer not found with email:', email);
      process.exit(1);
    }

    console.log('✅ Trade dealer verified successfully!');
    console.log('📧 Email:', dealer.email);
    console.log('🏢 Business:', dealer.businessName);
    console.log('✓ Status:', dealer.status);
    console.log('✓ Email Verified:', dealer.emailVerified);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node verifyTradeDealer.js <email>');
  console.log('Example: node verifyTradeDealer.js windsorcars2026@gmail.com');
  process.exit(1);
}

verifyTradeDealer(email);
