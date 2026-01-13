const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Seed subscription plans
 * Run with: node backend/scripts/seedSubscriptionPlans.js
 */

const plans = [
  {
    name: 'BRONZE Package',
    slug: 'bronze',
    description: 'Our Bronze Subscription lets you list up to 20 cars',
    price: 100000, // £1000.00 in pence
    currency: 'GBP',
    listingLimit: 20,
    features: [
      'Attract buyers – Display your vehicle\'s best features with up to 100 photos',
      'Attach a YouTube video for each vehicle to boost sales',
      'We will provide your listing with a free basic HPI check & MOT status',
      'A designated login area with a dealer dashboard to manage & update your stock',
      'Unlimited listing alterations to keep your ads up to date'
    ],
    stripePriceId: 'price_bronze_monthly', // Replace with actual Stripe price ID
    stripeProductId: 'prod_bronze', // Replace with actual Stripe product ID
    isActive: true,
    isPopular: false,
    displayOrder: 1
  },
  {
    name: 'SILVER Package',
    slug: 'silver',
    description: 'Our Silver Subscription lets you list up to 35 cars',
    price: 150000, // £1500.00 in pence
    currency: 'GBP',
    listingLimit: 35,
    features: [
      'Attract buyers – Display your vehicle\'s best features with up to 100 photos',
      'Attach a YouTube video for each vehicle to boost sales',
      'We will provide your listing with a free basic HPI check & MOT status',
      'A designated login area with a dealer dashboard to manage & update your stock',
      'Unlimited listing alterations to keep your ads up to date'
    ],
    stripePriceId: 'price_silver_monthly', // Replace with actual Stripe price ID
    stripeProductId: 'prod_silver', // Replace with actual Stripe product ID
    isActive: true,
    isPopular: true,
    displayOrder: 2,
    badge: 'Most Popular'
  },
  {
    name: 'GOLD Package',
    slug: 'gold',
    description: 'Our Gold Subscription has unlimited vehicle listings',
    price: 200000, // £2000.00 in pence
    currency: 'GBP',
    listingLimit: null, // Unlimited
    features: [
      'Attract buyers – Display your vehicle\'s best features with up to 100 photos',
      'Attach a YouTube video for each vehicle to boost sales',
      'We will provide your listing with a free basic HPI check & MOT status',
      'A designated login area with a dealer dashboard to manage & update your stock',
      'Unlimited listing alterations to keep your ads up to date'
    ],
    stripePriceId: 'price_gold_monthly', // Replace with actual Stripe price ID
    stripeProductId: 'prod_gold', // Replace with actual Stripe product ID
    isActive: true,
    isPopular: false,
    displayOrder: 3,
    badge: 'Best Value'
  }
];

async function seedPlans() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing plans (optional - comment out if you want to keep existing)
    // await SubscriptionPlan.deleteMany({});
    // console.log('🗑️  Cleared existing plans');

    // Insert plans
    for (const planData of plans) {
      const existingPlan = await SubscriptionPlan.findOne({ slug: planData.slug });
      
      if (existingPlan) {
        console.log(`⚠️  Plan "${planData.name}" already exists, skipping...`);
        continue;
      }

      const plan = new SubscriptionPlan(planData);
      await plan.save();
      console.log(`✅ Created plan: ${plan.name} - ${plan.priceFormatted}/month`);
    }

    console.log('\n🎉 Subscription plans seeded successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Create products in Stripe Dashboard');
    console.log('2. Create monthly prices for each product');
    console.log('3. Update stripePriceId and stripeProductId in this script');
    console.log('4. Run this script again to update the plans');
    
    // Display summary
    console.log('\n📊 Plans Summary:');
    const allPlans = await SubscriptionPlan.find().sort({ displayOrder: 1 });
    allPlans.forEach(plan => {
      console.log(`\n${plan.name} (${plan.slug})`);
      console.log(`  Price: ${plan.priceFormatted}/month`);
      console.log(`  Listings: ${plan.listingLimitDisplay}`);
      console.log(`  Features: ${plan.features.length}`);
      console.log(`  Status: ${plan.isActive ? 'Active' : 'Inactive'}`);
      if (plan.badge) console.log(`  Badge: ${plan.badge}`);
    });

  } catch (error) {
    console.error('❌ Error seeding plans:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the seed function
seedPlans();
