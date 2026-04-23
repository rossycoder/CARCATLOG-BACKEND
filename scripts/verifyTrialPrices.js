require('dotenv').config();
const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function verifyTrialPrices() {
    console.log('🔍 Verifying Trial Prices in Database');
    console.log('=====================================\n');
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');
        
        const plans = await SubscriptionPlan.find({});
        
        if (plans.length === 0) {
            console.log('❌ No plans found in database');
            return;
        }
        
        console.log(`📋 Found ${plans.length} plan(s):\n`);
        
        let allHaveTrialPrices = true;
        
        plans.forEach((plan, index) => {
            console.log(`${index + 1}. ${plan.name}`);
            console.log(`   Slug: ${plan.slug}`);
            console.log(`   Full Price: £${(plan.price / 100).toFixed(2)}`);
            
            if (plan.trialPrice) {
                console.log(`   ✅ Trial Price: £${(plan.trialPrice / 100).toFixed(2)}`);
            } else {
                console.log(`   ❌ Trial Price: NOT SET`);
                allHaveTrialPrices = false;
            }
            
            console.log(`   Full Price ID: ${plan.stripePriceId || 'NOT SET'}`);
            
            if (plan.trialPriceId) {
                console.log(`   ✅ Trial Price ID: ${plan.trialPriceId}`);
            } else {
                console.log(`   ❌ Trial Price ID: NOT SET`);
                allHaveTrialPrices = false;
            }
            
            console.log('');
        });
        
        if (allHaveTrialPrices) {
            console.log('✅ All plans have trial prices configured!');
            console.log('\n💡 Next Steps:');
            console.log('   1. Restart backend server');
            console.log('   2. Delete test dealer: node scripts/quickDeleteDealer.js');
            console.log('   3. Test signup with fresh account');
        } else {
            console.log('❌ Some plans are missing trial prices!');
            console.log('\n💡 Fix by running:');
            console.log('   node scripts/updatePlanPricing.js');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

verifyTrialPrices();
