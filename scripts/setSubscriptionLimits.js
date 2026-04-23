require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function setSubscriptionLimits() {
  try {
    console.log('🔧 Setting subscription listing limits...\n');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Define listing limits for each plan
    const planLimits = {
      bronze: 20,
      silver: 35,
      gold: 50
    };

    // Update each plan
    for (const [slug, limit] of Object.entries(planLimits)) {
      const plan = await SubscriptionPlan.findOne({ slug });
      
      if (plan) {
        plan.listingLimit = limit;
        await plan.save();
        console.log(`✅ ${plan.name} (${slug}): listingLimit set to ${limit}`);
      } else {
        console.log(`⚠️  Plan not found: ${slug}`);
      }
    }

    console.log('\n✅ All subscription limits updated successfully!');
    
    // Display current plans
    console.log('\n📋 Current Subscription Plans:');
    const plans = await SubscriptionPlan.find().sort({ displayOrder: 1 });
    plans.forEach(plan => {
      console.log(`\n${plan.name} (${plan.slug}):`);
      console.log(`  Price: £${(plan.price / 100).toFixed(2)}/month`);
      console.log(`  Trial Price: £${(plan.trialPrice / 100).toFixed(2)}`);
      console.log(`  Listing Limit: ${plan.listingLimit || 'Unlimited'}`);
      console.log(`  Status: ${plan.isActive ? 'Active' : 'Inactive'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setSubscriptionLimits();
