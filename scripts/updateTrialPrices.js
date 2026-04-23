require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const readline = require('readline');
const SubscriptionPlan = require('../models/SubscriptionPlan');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateTrialPrices() {
  try {
    console.log('🔧 Update Trial Prices in Database');
    console.log('===================================\n');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all plans
    const plans = await SubscriptionPlan.find().sort({ displayOrder: 1 });
    
    if (plans.length === 0) {
      console.log('❌ No plans found in database');
      process.exit(1);
    }

    console.log('📋 Current Plans:\n');
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name} (${plan.slug})`);
      console.log(`   Monthly Price: £${(plan.price / 100).toFixed(2)}`);
      console.log(`   Trial Price: £${plan.trialPrice ? (plan.trialPrice / 100).toFixed(2) : 'Not set'}`);
      console.log(`   Trial Price ID: ${plan.trialPriceId || 'Not set'}`);
      console.log('');
    });

    console.log('\n📝 Enter Trial Price IDs from Stripe Dashboard');
    console.log('   (Press Enter to skip a plan)\n');

    // Update each plan
    for (const plan of plans) {
      const priceId = await question(`${plan.name} trial price ID: `);
      
      if (priceId && priceId.trim()) {
        plan.trialPriceId = priceId.trim();
        await plan.save();
        console.log(`✅ Updated ${plan.name}\n`);
      } else {
        console.log(`⏭️  Skipped ${plan.name}\n`);
      }
    }

    console.log('\n✅ Trial prices updated successfully!');
    console.log('\n📋 Updated Plans:\n');
    
    const updatedPlans = await SubscriptionPlan.find().sort({ displayOrder: 1 });
    updatedPlans.forEach(plan => {
      console.log(`${plan.name}:`);
      console.log(`  Trial Price ID: ${plan.trialPriceId || '❌ Not set'}`);
      console.log(`  Trial Price: £${plan.trialPrice ? (plan.trialPrice / 100).toFixed(2) : 'Not set'}`);
      console.log('');
    });

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    process.exit(1);
  }
}

updateTrialPrices();
