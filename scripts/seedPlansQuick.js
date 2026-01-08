const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function seedPlans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if plans already exist
    const existingPlans = await SubscriptionPlan.countDocuments();
    if (existingPlans > 0) {
      console.log(`✅ ${existingPlans} subscription plans already exist`);
      process.exit(0);
    }

    // Create subscription plans
    const plans = [
      {
        name: 'Bronze',
        slug: 'bronze',
        description: 'Perfect for getting started',
        price: 4.99,
        priceFormatted: '£4.99',
        listingLimit: 5,
        listingLimitDisplay: '5 listings',
        features: ['5 active listings', 'Basic analytics', 'Email support'],
        isPopular: false,
        badge: null,
        stripeProductId: 'prod_test_bronze',
        stripePriceId: 'price_test_bronze'
      },
      {
        name: 'Silver',
        slug: 'silver',
        description: 'For growing dealers',
        price: 9.99,
        priceFormatted: '£9.99',
        listingLimit: 20,
        listingLimitDisplay: '20 listings',
        features: ['20 active listings', 'Advanced analytics', 'Priority support'],
        isPopular: true,
        badge: 'Most Popular',
        stripeProductId: 'prod_test_silver',
        stripePriceId: 'price_test_silver'
      },
      {
        name: 'Gold',
        slug: 'gold',
        description: 'For professional dealers',
        price: 19.99,
        priceFormatted: '£19.99',
        listingLimit: 100,
        listingLimitDisplay: 'Unlimited listings',
        features: ['Unlimited listings', 'Premium analytics', '24/7 support', 'Featured listings'],
        isPopular: false,
        badge: null,
        stripeProductId: 'prod_test_gold',
        stripePriceId: 'price_test_gold'
      }
    ];

    const createdPlans = await SubscriptionPlan.insertMany(plans);
    console.log(`✅ Created ${createdPlans.length} subscription plans`);
    
    createdPlans.forEach(plan => {
      console.log(`  - ${plan.name} (${plan.slug}): £${plan.price}/month, ${plan.listingLimit} listings`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedPlans();
