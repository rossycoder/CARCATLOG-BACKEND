require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PLANS = [
  {
    name: 'Bronze',
    slug: 'bronze',
    description: 'Perfect for small dealers starting out',
    price: 49900,        // £499/month
    trialPrice: 5000,    // £50 trial fee
    listingLimit: 20,
    displayOrder: 1,
    isPopular: false,
    features: [
      'Up to 20 vehicle listings',
      'Basic dealer profile',
      'Standard search placement',
      'Email support',
      '30-day free trial'
    ]
  },
  {
    name: 'Silver',
    slug: 'silver',
    description: 'Great for growing dealerships',
    price: 87500,        // £875/month
    trialPrice: 8750,    // £87.50 trial fee
    listingLimit: 35,
    displayOrder: 2,
    isPopular: true,
    badge: 'Most Popular',
    features: [
      'Up to 35 vehicle listings',
      'Enhanced dealer profile',
      'Priority search placement',
      'Phone & email support',
      'Analytics dashboard',
      '30-day free trial'
    ]
  },
  {
    name: 'Gold',
    slug: 'gold',
    description: 'For established dealers who want maximum exposure',
    price: 150000,       // £1500/month
    trialPrice: 15000,   // £150 trial fee
    listingLimit: 50,
    displayOrder: 3,
    isPopular: false,
    badge: 'Best Value',
    features: [
      'Up to 50 vehicle listings',
      'Premium dealer profile',
      'Top search placement',
      'Dedicated account manager',
      'Advanced analytics',
      'Featured listings',
      '30-day free trial'
    ]
  }
];

async function seedSubscriptionPlans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    for (const planData of PLANS) {
      const existing = await SubscriptionPlan.findOne({ slug: planData.slug });

      if (existing) {
        console.log(`⚠️  Plan already exists: ${planData.name} — skipping`);
        continue;
      }

      console.log(`\n🔄 Creating ${planData.name} plan in Stripe...`);

      // Create Stripe product
      const product = await stripe.products.create({
        name: `CarCatalog Trade - ${planData.name}`,
        description: planData.description,
        metadata: { plan_slug: planData.slug }
      });
      console.log(`   ✅ Stripe product: ${product.id}`);

      // Create monthly recurring price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: planData.price,
        currency: 'gbp',
        recurring: { interval: 'month' },
        metadata: { plan_slug: planData.slug, price_type: 'monthly' }
      });
      console.log(`   ✅ Monthly price: ${monthlyPrice.id}`);

      // Create one-off trial price
      const trialPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: planData.trialPrice,
        currency: 'gbp',
        metadata: { plan_slug: planData.slug, price_type: 'trial' }
      });
      console.log(`   ✅ Trial price: ${trialPrice.id}`);

      // Save to DB
      const plan = new SubscriptionPlan({
        name: planData.name,
        slug: planData.slug,
        description: planData.description,
        price: planData.price,
        trialPrice: planData.trialPrice,
        listingLimit: planData.listingLimit,
        displayOrder: planData.displayOrder,
        isPopular: planData.isPopular,
        badge: planData.badge || null,
        features: planData.features,
        stripePriceId: monthlyPrice.id,
        trialPriceId: trialPrice.id,
        stripeProductId: product.id,
        isActive: true
      });

      await plan.save();
      console.log(`   ✅ Saved to DB: ${planData.name}`);
    }

    console.log('\n✅ Subscription plans seeded successfully!');

    const plans = await SubscriptionPlan.find({}).sort({ displayOrder: 1 });
    console.log('\n📋 Plans in DB:');
    plans.forEach(p => {
      console.log(`   ${p.name}: £${(p.price / 100).toFixed(0)}/mo | Listings: ${p.listingLimit} | Active: ${p.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Done');
  }
}

seedSubscriptionPlans();
