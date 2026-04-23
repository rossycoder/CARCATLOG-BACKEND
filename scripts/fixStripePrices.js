require('dotenv').config();
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function fixStripePrices() {
    console.log('🔧 Fixing Stripe Price IDs');
    console.log('==========================');
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // Get all plans
        const plans = await SubscriptionPlan.find({});
        console.log(`📋 Found ${plans.length} subscription plans`);
        
        if (plans.length === 0) {
            console.log('❌ No plans found. Creating default plans...');
            await createDefaultPlans();
            return;
        }
        
        // Check and fix each plan
        for (const plan of plans) {
            console.log(`\n🔍 Checking plan: ${plan.name} (${plan.slug})`);
            console.log(`   Current Stripe Price ID: ${plan.stripePriceId || 'None'}`);
            
            // Check if price exists in Stripe
            let priceExists = false;
            if (plan.stripePriceId) {
                try {
                    await stripe.prices.retrieve(plan.stripePriceId);
                    priceExists = true;
                    console.log('✅ Price exists in Stripe');
                } catch (error) {
                    console.log('❌ Price does not exist in Stripe:', error.message);
                }
            }
            
            if (!priceExists) {
                console.log('📝 Creating new Stripe price...');
                
                // Create product first
                const product = await stripe.products.create({
                    name: `${plan.name} Monthly Subscription`,
                    description: plan.description || `${plan.listingLimit || 'Unlimited'} car listings per month`
                });
                
                // Create price
                const price = await stripe.prices.create({
                    unit_amount: plan.price,
                    currency: 'gbp',
                    recurring: { interval: 'month' },
                    product: product.id
                });
                
                // Update plan in database
                plan.stripePriceId = price.id;
                plan.stripeProductId = product.id;
                await plan.save();
                
                console.log('✅ Created new price:', price.id);
                console.log('✅ Updated plan in database');
            }
        }
        
        console.log('\n🎉 All plans fixed!');
        
        // List final state
        console.log('\n📋 Final Plan Configuration:');
        const updatedPlans = await SubscriptionPlan.find({});
        updatedPlans.forEach((plan, index) => {
            console.log(`${index + 1}. ${plan.name}`);
            console.log(`   Slug: ${plan.slug}`);
            console.log(`   Price: £${(plan.price / 100).toFixed(2)}`);
            console.log(`   Stripe Price ID: ${plan.stripePriceId}`);
            console.log(`   Stripe Product ID: ${plan.stripeProductId}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

async function createDefaultPlans() {
    console.log('📝 Creating default subscription plans...');
    
    const defaultPlans = [
        {
            name: 'BRONZE Package',
            slug: 'bronze',
            description: 'Perfect for small dealers',
            price: 100000, // £1000.00 (full monthly price)
            trialPrice: 6000, // £60.00 (trial price)
            listingLimit: 25,
            features: [
                '25 car listings',
                'Basic support',
                'Standard visibility'
            ]
        },
        {
            name: 'SILVER Package',
            slug: 'silver',
            description: 'Great for growing dealers',
            price: 150000, // £1500.00 (full monthly price)
            trialPrice: 10500, // £105.00 (trial price)
            listingLimit: 75,
            features: [
                '75 car listings',
                'Priority support',
                'Enhanced visibility',
                'Analytics dashboard'
            ],
            isPopular: true
        },
        {
            name: 'GOLD Package',
            slug: 'gold',
            description: 'Best for large dealers',
            price: 200000, // £2000.00 (full monthly price)
            trialPrice: 18000, // £180.00 (trial price)
            listingLimit: null, // Unlimited
            features: [
                'Unlimited car listings',
                'Premium support',
                'Maximum visibility',
                'Advanced analytics',
                'Custom branding'
            ]
        }
    ];
    
    for (const planData of defaultPlans) {
        console.log(`📝 Creating plan: ${planData.name}`);
        
        // Create Stripe product
        const product = await stripe.products.create({
            name: `${planData.name} Monthly Subscription`,
            description: planData.description
        });
        
        // Create Stripe price for full monthly amount
        const fullPrice = await stripe.prices.create({
            unit_amount: planData.price,
            currency: 'gbp',
            recurring: { interval: 'month' },
            product: product.id,
            metadata: { price_type: 'full' }
        });
        
        // Create Stripe price for trial amount (one-time)
        const trialPrice = await stripe.prices.create({
            unit_amount: planData.trialPrice,
            currency: 'gbp',
            product: product.id,
            metadata: { price_type: 'trial' }
        });
        
        // Create plan in database
        const plan = new SubscriptionPlan({
            ...planData,
            stripePriceId: fullPrice.id,
            trialPriceId: trialPrice.id,
            stripeProductId: product.id
        });
        
        await plan.save();
        console.log(`✅ Created: ${plan.name}`);
        console.log(`   Full Price: £${(plan.price / 100).toFixed(2)} (${fullPrice.id})`);
        console.log(`   Trial Price: £${(plan.trialPrice / 100).toFixed(2)} (${trialPrice.id})`);
    }
}

fixStripePrices();