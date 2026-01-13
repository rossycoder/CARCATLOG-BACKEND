const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Setup Stripe products and prices for subscription plans
 * Run with: node backend/scripts/setupStripeProducts.js
 */

const planConfigs = [
  {
    slug: 'bronze',
    name: 'BRONZE Package',
    description: 'Our Bronze Subscription lets you list up to 20 cars',
    price: 100000, // £1000.00 in pence
    listingLimit: 20
  },
  {
    slug: 'silver',
    name: 'SILVER Package',
    description: 'Our Silver Subscription lets you list up to 35 cars',
    price: 150000, // £1500.00 in pence
    listingLimit: 35
  },
  {
    slug: 'gold',
    name: 'GOLD Package',
    description: 'Our Gold Subscription has unlimited vehicle listings',
    price: 200000, // £2000.00 in pence
    listingLimit: null // Unlimited
  }
];

async function setupStripeProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔧 Setting up Stripe products and prices...\n');

    for (const config of planConfigs) {
      console.log(`\n📦 Processing ${config.name}...`);

      // Check if plan exists in database
      let plan = await SubscriptionPlan.findOne({ slug: config.slug });

      // Create or update Stripe product
      let product;
      if (plan && plan.stripeProductId) {
        try {
          product = await stripe.products.retrieve(plan.stripeProductId);
          console.log(`  ✓ Found existing Stripe product: ${product.id}`);
        } catch (error) {
          console.log(`  ⚠️  Stripe product not found, creating new one...`);
          product = null;
        }
      }

      if (!product) {
        product = await stripe.products.create({
          name: config.name,
          description: config.description,
          metadata: {
            slug: config.slug,
            listingLimit: config.listingLimit || 'unlimited'
          }
        });
        console.log(`  ✓ Created Stripe product: ${product.id}`);
      }

      // Create or update Stripe price
      let price;
      if (plan && plan.stripePriceId) {
        try {
          price = await stripe.prices.retrieve(plan.stripePriceId);
          console.log(`  ✓ Found existing Stripe price: ${price.id}`);
        } catch (error) {
          console.log(`  ⚠️  Stripe price not found, creating new one...`);
          price = null;
        }
      }

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: config.price,
          currency: 'gbp',
          recurring: {
            interval: 'month'
          },
          metadata: {
            slug: config.slug
          }
        });
        console.log(`  ✓ Created Stripe price: ${price.id} (£${config.price / 100}/month)`);
      }

      // Create or update plan in database
      if (!plan) {
        plan = new SubscriptionPlan({
          name: config.name,
          slug: config.slug,
          description: config.description,
          price: config.price,
          currency: 'GBP',
          listingLimit: config.listingLimit,
          features: [
            `List up to ${config.listingLimit || 'unlimited'} cars`,
            'Up to 100 photos per vehicle',
            'YouTube video attachment',
            'Free basic HPI check & MOT status',
            'Dealer dashboard access',
            'Unlimited listing alterations'
          ],
          stripePriceId: price.id,
          stripeProductId: product.id,
          isActive: true,
          isPopular: config.slug === 'silver',
          displayOrder: config.slug === 'bronze' ? 1 : config.slug === 'silver' ? 2 : 3
        });

        if (config.slug === 'silver') {
          plan.badge = 'Most Popular';
        } else if (config.slug === 'gold') {
          plan.badge = 'Best Value';
        }

        await plan.save();
        console.log(`  ✓ Created database plan: ${plan.name}`);
      } else {
        plan.stripePriceId = price.id;
        plan.stripeProductId = product.id;
        plan.price = config.price;
        await plan.save();
        console.log(`  ✓ Updated database plan: ${plan.name}`);
      }

      console.log(`  ✅ ${config.name} setup complete!`);
    }

    console.log('\n🎉 All Stripe products and prices setup successfully!');
    
    // Display summary
    console.log('\n📊 Plans Summary:');
    const allPlans = await SubscriptionPlan.find().sort({ displayOrder: 1 });
    allPlans.forEach(plan => {
      console.log(`\n${plan.name} (${plan.slug})`);
      console.log(`  Price: ${plan.priceFormatted}/month`);
      console.log(`  Listings: ${plan.listingLimitDisplay}`);
      console.log(`  Stripe Product ID: ${plan.stripeProductId}`);
      console.log(`  Stripe Price ID: ${plan.stripePriceId}`);
      console.log(`  Status: ${plan.isActive ? 'Active' : 'Inactive'}`);
      if (plan.badge) console.log(`  Badge: ${plan.badge}`);
    });

  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the setup function
setupStripeProducts();
