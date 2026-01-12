require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function testPlanLookup() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const testSlugs = ['bronze', 'silver', 'gold'];

    for (const slug of testSlugs) {
      console.log(`🔍 Looking up plan with slug: "${slug}"`);
      console.log(`   Query: { slug: "${slug}", isActive: true }`);
      
      const plan = await SubscriptionPlan.findOne({ slug: slug, isActive: true });
      
      if (plan) {
        console.log(`✅ Found plan:`);
        console.log(`   ID: ${plan._id}`);
        console.log(`   Name: ${plan.name}`);
        console.log(`   Slug: ${plan.slug}`);
        console.log(`   Active: ${plan.isActive}`);
        console.log(`   Price: £${plan.price / 100}`);
      } else {
        console.log(`❌ Plan not found!`);
      }
      console.log('');
    }

    await mongoose.connection.close();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPlanLookup();
