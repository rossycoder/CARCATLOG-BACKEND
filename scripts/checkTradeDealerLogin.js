const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');

async function checkLogin() {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const email = 'rozeena91@gmail.com';
    
    // Find dealer
    const dealer = await TradeDealer.findOne({ email: email.toLowerCase() })
      .select('+password');

    if (!dealer) {
      console.log('❌ No dealer found with email:', email);
      process.exit(0);
    }

    console.log('\n📋 Dealer Information:');
    console.log('ID:', dealer._id);
    console.log('Business Name:', dealer.businessName);
    console.log('Email:', dealer.email);
    console.log('Status:', dealer.status);
    console.log('Email Verified:', dealer.emailVerified);
    console.log('Role:', dealer.role);
    console.log('Password Hash:', dealer.password ? 'Present' : 'Missing');
    console.log('Created At:', dealer.createdAt);
    console.log('Last Login:', dealer.lastLoginAt);

    // Test password
    const testPassword = 'Rozeena@123';
    console.log('\n🔐 Testing password:', testPassword);
    
    const isValid = await dealer.comparePassword(testPassword);
    console.log('Password Valid:', isValid);

    if (!isValid) {
      console.log('\n⚠️  Password does not match!');
      console.log('Possible issues:');
      console.log('1. Password was changed');
      console.log('2. Password was not hashed correctly');
      console.log('3. Wrong password being tested');
    } else {
      console.log('\n✓ Password is correct!');
      
      if (!dealer.emailVerified) {
        console.log('❌ But email is not verified');
      }
      
      if (dealer.status !== 'active') {
        console.log('❌ But account status is:', dealer.status);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLogin();
