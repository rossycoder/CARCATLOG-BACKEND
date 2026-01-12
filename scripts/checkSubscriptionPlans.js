require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function checkPlans() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📋 Fetching all subscription plans...\n');
    const plans = await SubscriptionPlan.find({});
    
    if (plans.length === 0) {
      console.log('❌ No plans found in database!');
      console.log('   Run: node backend/scripts/seedSubscriptionPlans.js');
    } else {
      console.log(`✅ Found ${plans.length} plans:\n`);
      plans.forEach(plan => {
        console.log(`Plan: ${plan.name}`);
        console.log(`  Slug: ${plan.slug}`);
        console.log(`  Active: ${plan.isActive}`);
        console.log(`  Price: £${plan.price / 100}`);
        console.log(`  Listing Limit: ${plan.listingLimit || 'Unlimited'}`);
        console.log(`  Stripe Price ID: ${plan.stripePriceId || 'Not set'}`);
        console.log('');
      });
    }

    await mongoose.connection.close();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPlans();
