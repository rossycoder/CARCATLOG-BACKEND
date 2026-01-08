const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SubscriptionPlan = require('../models/SubscriptionPlan');

dotenv.config();

/**
 * Seed subscription plans
 * Run with: node backend/scripts/seedSubscriptionPlans.js
 */

const plans = [
  {
    name: 'Starter',
    slug: 'starter',
    description: 'Perfect for small dealerships getting started',
    price: 9900, // £99.00 in pence
    currency: 'GBP',
    listingLimit: 10,
    features: [
      'Up to 10 active listings',
      'Unlimited photos per listing',
      'Basic analytics dashboard',
      'Email support',
      'DVLA vehicle lookup',
      'Mobile responsive listings'
    ],
    stripePriceId: 'price_starter_monthly', // Replace with actual Stripe price ID
    stripeProductId: 'prod_starter', // Replace with actual Stripe product ID
    isActive: true,
    isPopular: false,
    displayOrder: 1
  },
  {
    name: 'Professional',
    slug: 'professional',
    description: 'Most popular choice for growing dealerships',
    price: 19900, // £199.00 in pence
    currency: 'GBP',
    listingLimit: 25,
    features: [
      'Up to 25 active listings',
      'Unlimited photos per listing',
      'Advanced analytics & insights',
      'Priority email support',
      'DVLA vehicle lookup',
      'Featured listing (1 per month)',
      'Mobile responsive listings',
      'Export analytics reports'
    ],
    stripePriceId: 'price_professional_monthly', // Replace with actual Stripe price ID
    stripeProductId: 'prod_professional', // Replace with actual Stripe product ID
    isActive: true,
    isPopular: true,
    displayOrder: 2,
    badge: 'Most Popular'
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'For established dealerships with high volume',
    price: 39900, // £399.00 in pence
    currency: 'GBP',
    listingLimit: 50,
    features: [
      'Up to 50 active listings',
      'Unlimited photos per listing',
      'Advanced analytics & insights',
      'Priority support (email & phone)',
      'DVLA vehicle lookup',
      'Featured listings (5 per month)',
      'Mobile responsive listings',
      'Export analytics reports',
      'Bulk upload capability',
      'Custom branding options'
    ],
    stripePriceId: 'price_business_monthly', // Replace with actual Stripe price ID
    stripeProductId: 'prod_business', // Replace with actual Stripe product ID
    isActive: true,
    isPopular: false,
    displayOrder: 3,
    badge: 'Best Value'
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Unlimited listings for large dealerships',
    price: 79900, // £799.00 in pence
    currency: 'GBP',
    listingLimit: null, // Unlimited
    features: [
      'Unlimited active listings',
      'Unlimited photos per listing',
      'Advanced analytics & insights',
      'Dedicated account manager',
      'DVLA vehicle lookup',
      'Unlimited featured listings',
      'Mobile responsive listings',
      'Export analytics reports',
      'Bulk upload capability',
      'Custom branding options',
      'API access',
      'Priority listing placement',
      'Custom integrations'
    ],
    stripePriceId: 'price_enterprise_monthly', // Replace with actual Stripe price ID
    stripeProductId: 'prod_enterprise', // Replace with actual Stripe product ID
    isActive: true,
    isPopular: false,
    displayOrder: 4
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
