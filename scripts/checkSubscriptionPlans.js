require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function checkSubscriptionPlans() {
    console.log('📋 Checking Subscription Plans');
    console.log('==============================');
    
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found in environment variables');
        }
        
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to database');
        
        const plans = await SubscriptionPlan.find({});
        
        if (plans.length === 0) {
            console.log('❌ No subscription plans found in database');
            console.log('💡 You need to create subscription plans first');
            return;
        }
        
        console.log(`\n📋 Found ${plans.length} subscription plan(s):`);
        
        plans.forEach((plan, index) => {
            console.log(`\n${index + 1}. ${plan.name}`);
            console.log(`   Slug: ${plan.slug}`);
            console.log(`   Price: £${(plan.price / 100).toFixed(2)} ${plan.billingPeriod}`);
            console.log(`   Stripe Price ID: ${plan.stripePriceId}`);
            console.log(`   Stripe Product ID: ${plan.stripeProductId}`);
            console.log(`   Listing Limit: ${plan.listingLimit || 'Unlimited'}`);
            console.log(`   Active: ${plan.isActive}`);
            console.log(`   Features: ${plan.features.join(', ')}`);
        });
        
        console.log('\n🔍 Checking for "bronze" plan specifically...');
        const bronzePlan = await SubscriptionPlan.findOne({ slug: 'bronze' });
        
        if (bronzePlan) {
            console.log('✅ Bronze plan found!');
            console.log(`   Expected Stripe Price ID: ${bronzePlan.stripePriceId}`);
            console.log(`   Error shows looking for: 'price_bronze_monthly'`);
            
            if (bronzePlan.stripePriceId !== 'price_bronze_monthly') {
                console.log('❌ MISMATCH! The database has different price ID than what code is looking for');
                console.log('💡 Need to either:');
                console.log('   1. Update database to use correct Stripe price ID');
                console.log('   2. Create the missing price in Stripe dashboard');
            }
        } else {
            console.log('❌ Bronze plan not found in database');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkSubscriptionPlans();