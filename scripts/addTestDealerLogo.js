require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');

async function addTestDealerLogo() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find the first active dealer
    const dealer = await TradeDealer.findOne({ status: 'active' });
    
    if (!dealer) {
      console.log('❌ No active trade dealer found');
      return;
    }

    console.log('📋 Found Trade Dealer:');
    console.log(`   Business Name: ${dealer.businessName}`);
    console.log(`   Email: ${dealer.email}`);
    console.log(`   Current Logo: ${dealer.logo || 'None'}\n`);

    // Add a test logo URL (you can replace this with a real Cloudinary URL)
    const testLogoUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    
    dealer.logo = testLogoUrl;
    await dealer.save();

    console.log('✅ Logo added successfully!');
    console.log(`   New Logo URL: ${dealer.logo}\n`);

    console.log('📝 Next Steps:');
    console.log('1. Make sure this dealer has published vehicles');
    console.log('2. Visit a vehicle detail page from this dealer');
    console.log('3. Check the "Meet the Seller" section');
    console.log('4. The logo should now be displayed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

addTestDealerLogo();
