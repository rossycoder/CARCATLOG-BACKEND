require('dotenv').config();
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testTrialCheckout() {
    console.log('🧪 Testing Trial Checkout Flow');
    console.log('==============================\n');
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');
        
        // Get Bronze plan
        const plan = await SubscriptionPlan.findOne({ slug: 'bronze' });
        
        if (!plan) {
            console.log('❌ Bronze plan not found');
            return;
        }
        
        console.log('📋 Plan Details:');
        console.log(`   Name: ${plan.name}`);
        console.log(`   Full Price: £${(plan.price / 100).toFixed(2)}`);
        console.log(`   Trial Price: £${(plan.trialPrice / 100).toFixed(2)}`);
        console.log(`   Full Price ID: ${plan.stripePriceId}`);
        console.log(`   Trial Price ID: ${plan.trialPriceId}\n`);
        
        // Check if trial price exists in Stripe
        if (plan.trialPriceId) {
            console.log('🔍 Checking trial price in Stripe...');
            try {
                const trialPrice = await stripe.prices.retrieve(plan.trialPriceId);
                console.log('✅ Trial price exists in Stripe:');
                console.log(`   ID: ${trialPrice.id}`);
                console.log(`   Amount: £${(trialPrice.unit_amount / 100).toFixed(2)}`);
                console.log(`   Type: ${trialPrice.type}`);
                console.log(`   Currency: ${trialPrice.currency.toUpperCase()}\n`);
            } catch (error) {
                console.log('❌ Trial price not found in Stripe:', error.message);
                return;
            }
        }
        
        // Check if full price exists in Stripe
        if (plan.stripePriceId) {
            console.log('🔍 Checking full price in Stripe...');
            try {
                const fullPrice = await stripe.prices.retrieve(plan.stripePriceId);
                console.log('✅ Full price exists in Stripe:');
                console.log(`   ID: ${fullPrice.id}`);
                console.log(`   Amount: £${(fullPrice.unit_amount / 100).toFixed(2)}`);
                console.log(`   Type: ${fullPrice.type}`);
                console.log(`   Recurring: ${fullPrice.recurring ? fullPrice.recurring.interval : 'N/A'}`);
                console.log(`   Currency: ${fullPrice.currency.toUpperCase()}\n`);
            } catch (error) {
                console.log('❌ Full price not found in Stripe:', error.message);
                return;
            }
        }
        
        console.log('✅ All prices configured correctly!');
        console.log('\n💡 Expected Flow:');
        console.log('   1. User clicks "Get Started" on Bronze plan');
        console.log('   2. Backend creates checkout session with trial price (£60)');
        console.log('   3. User pays £60 in Stripe checkout');
        console.log('   4. After payment, backend creates subscription with 30-day trial');
        console.log('   5. After 30 days, full price (£1000) charges automatically');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testTrialCheckout();
