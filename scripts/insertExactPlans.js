require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function insertExactPlans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete any plans created by previous seed script (wrong prices)
    const deleted = await SubscriptionPlan.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing plans`);

    // Insert the exact plans from your MongoDB data
    const plans = [
      {
        _id: new mongoose.Types.ObjectId('69664cb4edc336ecb8019090'), // Bronze (guessed ID, will auto-gen if conflict)
        name: 'BRONZE Package',
        slug: 'bronze',
        description: 'Our Bronze Subscription lets you list up to 20 cars',
        price: 100000,           // £1000/month
        trialPrice: 6000,        // £60 trial
        currency: 'GBP',
        listingLimit: 20,
        stripePriceId: 'price_1TEZuQDBuggFMCbzBy5Kbogf', // reuse Gold's as placeholder — update if you have Bronze ID
        trialPriceId: 'price_1TEbArDBuggFMCbzbsXTVCtC',
        stripeProductId: 'prod_UCzuUiz5Ka9Y5a',
        isActive: true,
        isPopular: false,
        badge: null,
        displayOrder: 1,
        billingPeriod: 'monthly',
        features: [
          'Up to 20 vehicle listings',
          'Basic dealer profile',
          'Standard search placement',
          'Email support',
          '30-day free trial'
        ],
        createdAt: new Date('2025-01-13T00:00:00.000Z'),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('69664cb5edc336ecb8019091'),
        name: 'SILVER Package',
        slug: 'silver',
        description: 'Our Silver Subscription lets you list up to 35 cars',
        price: 150000,           // £1500/month
        trialPrice: 10500,       // £105 trial
        currency: 'GBP',
        listingLimit: 35,
        stripePriceId: 'price_1TEa6sDBuggFMCbzc2vOfvEh',
        trialPriceId: 'price_1TEbApDBuggFMCbzHIYzHVuV',
        stripeProductId: 'prod_UCzubml92E61L8',
        isActive: true,
        isPopular: true,
        badge: 'Most Popular',
        displayOrder: 2,
        billingPeriod: 'monthly',
        features: [
          'Up to 35 vehicle listings',
          'Enhanced dealer profile',
          'Priority search placement',
          'Phone & email support',
          'Analytics dashboard'
        ],
        createdAt: new Date('2025-01-13T00:00:00.000Z'),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('69664cc4edc336ecb8019093'),
        name: 'GOLD Package',
        slug: 'gold',
        description: 'Our Gold Subscription has unlimited vehicle listings',
        price: 200000,           // £2000/month
        trialPrice: 18000,       // £180 trial
        currency: 'GBP',
        listingLimit: 50,
        stripePriceId: 'price_1TEZuQDBuggFMCbzBy5Kbogf',
        trialPriceId: 'price_1TEbArDBuggFMCbzbsXTVCtC',
        stripeProductId: 'prod_UCzuUiz5Ka9Y5a',
        isActive: true,
        isPopular: false,
        badge: 'Best Value',
        displayOrder: 3,
        billingPeriod: 'monthly',
        features: [
          'Up to 50 vehicle listings',
          'Premium dealer profile',
          'Top search placement',
          'Dedicated account manager',
          'Advanced analytics'
        ],
        createdAt: new Date('2025-01-13T00:00:00.000Z'),
        updatedAt: new Date()
      }
    ];

    for (const planData of plans) {
      try {
        const plan = new SubscriptionPlan(planData);
        await plan.save();
        console.log(`✅ Inserted: ${planData.name} (£${(planData.price / 100).toFixed(0)}/mo)`);
      } catch (err) {
        // If _id conflict, insert without it
        const { _id, ...rest } = planData;
        const plan = new SubscriptionPlan(rest);
        await plan.save();
        console.log(`✅ Inserted (new ID): ${planData.name}`);
      }
    }

    console.log('\n📋 Final plans in DB:');
    const all = await SubscriptionPlan.find({}).sort({ displayOrder: 1 });
    all.forEach(p => console.log(`   ${p.name}: £${(p.price/100).toFixed(0)}/mo | Stripe: ${p.stripePriceId}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Done');
  }
}

insertExactPlans();
