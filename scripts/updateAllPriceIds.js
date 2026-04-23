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

async function updateAllPriceIds() {
  try {
    console.log('🔧 Update All Price IDs (Monthly + Trial)');
    console.log('==========================================\n');
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const plans = await SubscriptionPlan.find().sort({ displayOrder: 1 });
    
    console.log('📋 Current Plans:\n');
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   Monthly Price ID: ${plan.stripePriceId || 'Not set'}`);
      console.log(`   Trial Price ID: ${plan.trialPriceId || 'Not set'}`);
      console.log('');
    });

    console.log('\n📝 Enter Price IDs from Stripe Dashboard');
    console.log('   (Press Enter to skip)\n');

    for (const plan of plans) {
      console.log(`\n--- ${plan.name} ---`);
      
      const monthlyId = await question(`Monthly price ID (£${(plan.price/100).toFixed(0)}/month): `);
      if (monthlyId && monthlyId.trim()) {
        plan.stripePriceId = monthlyId.trim();
      }
      
      const trialId = await question(`Trial price ID (£${(plan.trialPrice/100).toFixed(0)} one-off): `);
      if (trialId && trialId.trim()) {
        plan.trialPriceId = trialId.trim();
      }
      
      await plan.save();
      console.log(`✅ Updated ${plan.name}\n`);
    }

    console.log('\n✅ All price IDs updated!\n');
    
    const updated = await SubscriptionPlan.find().sort({ displayOrder: 1 });
    console.log('📋 Final Configuration:\n');
    updated.forEach(plan => {
      console.log(`${plan.name}:`);
      console.log(`  Monthly: ${plan.stripePriceId || '❌ Not set'}`);
      console.log(`  Trial: ${plan.trialPriceId || '❌ Not set'}`);
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

updateAllPriceIds();
