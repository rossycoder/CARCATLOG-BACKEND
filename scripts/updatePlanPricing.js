require('dotenv').config();
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function updatePlanPricing() {
    console.log('💰 Updating Plan Pricing');
    console.log('========================');
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // New pricing structure - Full monthly prices
        const newPricing = {
            'bronze': { full: 100000, trial: 6000 },   // Full: £1000, Trial: £60
            'silver': { full: 150000, trial: 10500 },  // Full: £1500, Trial: £105  
            'gold': { full: 200000, trial: 18000 }     // Full: £2000, Trial: £180
        };
        
        console.log('📋 New Pricing:');
        Object.entries(newPricing).forEach(([slug, prices]) => {
            console.log(`   ${slug.toUpperCase()}: Full £${(prices.full / 100).toFixed(2)}, Trial £${(prices.trial / 100).toFixed(2)}`);
        });
        
        // Update each plan
        for (const [slug, prices] of Object.entries(newPricing)) {
            console.log(`\n🔄 Updating ${slug.toUpperCase()} plan...`);
            
            const plan = await SubscriptionPlan.findOne({ slug });
            if (!plan) {
                console.log(`❌ Plan not found: ${slug}`);
                continue;
            }
            
            console.log(`   Current price: £${(plan.price / 100).toFixed(2)}`);
            console.log(`   New full price: £${(prices.full / 100).toFixed(2)}`);
            console.log(`   Trial price: £${(prices.trial / 100).toFixed(2)}`);
            
            // Create new Stripe prices for both full and trial
            console.log('📝 Creating Stripe prices...');
            
            // Full monthly price
            const fullStripePrice = await stripe.prices.create({
                unit_amount: prices.full,
                currency: 'gbp',
                recurring: { interval: 'month' },
                product: plan.stripeProductId,
                metadata: {
                    plan_slug: slug,
                    price_type: 'full',
                    updated_at: new Date().toISOString()
                }
            });
            
            // Trial price (one-time payment)
            const trialStripePrice = await stripe.prices.create({
                unit_amount: prices.trial,
                currency: 'gbp',
                product: plan.stripeProductId,
                metadata: {
                    plan_slug: slug,
                    price_type: 'trial',
                    updated_at: new Date().toISOString()
                }
            });
            
            // Update plan in database - store full price as main price
            const oldPriceId = plan.stripePriceId;
            plan.price = prices.full; // Store full price as main price
            plan.stripePriceId = fullStripePrice.id; // Full price ID
            plan.trialPrice = prices.trial; // Add trial price field
            plan.trialPriceId = trialStripePrice.id; // Add trial price ID field
            await plan.save();
            
            console.log(`✅ Updated plan in database`);
            console.log(`   Old Stripe Price ID: ${oldPriceId}`);
            console.log(`   New Full Price ID: ${fullStripePrice.id}`);
            console.log(`   New Trial Price ID: ${trialStripePrice.id}`);
        }
        
        console.log('\n🎉 All plans updated successfully!');
        
        // Show final pricing
        console.log('\n📋 Final Pricing Structure:');
        const updatedPlans = await SubscriptionPlan.find({}).sort({ price: 1 });
        updatedPlans.forEach((plan, index) => {
            console.log(`${index + 1}. ${plan.name}`);
            console.log(`   Full Monthly Price: £${(plan.price / 100).toFixed(2)}`);
            console.log(`   Trial Price: £${((plan.trialPrice || 0) / 100).toFixed(2)}`);
            console.log(`   Listings: ${plan.listingLimit || 'Unlimited'}`);
            console.log(`   Full Price ID: ${plan.stripePriceId}`);
            console.log(`   Trial Price ID: ${plan.trialPriceId || 'N/A'}`);
        });
        
        console.log('\n💡 Trial System:');
        console.log('   - User pays trial price during signup (£60/£105/£180)');
        console.log('   - Gets 30 days access');
        console.log('   - After 30 days, full monthly price charges automatically');
        console.log('   - Frontend always shows full prices (£1000/£1500/£2000)');
        console.log('   - If payment fails, subscription cancels + email notification');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

updatePlanPricing();