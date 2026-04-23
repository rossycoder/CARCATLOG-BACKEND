require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');

async function expireTrialKeepActive(email) {
    console.log('⏰ Expiring Trial - Keeping Dealer Active');
    console.log('=========================================');
    console.log(`Email: ${email}`);
    
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // Find the dealer
        const dealer = await TradeDealer.findOne({ email: email.toLowerCase() });
        if (!dealer) {
            console.log('❌ Dealer not found');
            return;
        }
        
        console.log(`\n📋 Current Dealer Status:`);
        console.log(`Business Name: ${dealer.businessName}`);
        console.log(`Contact Person: ${dealer.contactPerson}`);
        console.log(`Status: ${dealer.status}`);
        console.log(`Email Verified: ${dealer.emailVerified}`);
        
        // Find current subscription
        const subscription = await TradeSubscription.findOne({ dealerId: dealer._id });
        if (subscription) {
            console.log(`\n📋 Current Subscription:`);
            console.log(`Status: ${subscription.status}`);
            console.log(`Is Trialing: ${subscription.isTrialing}`);
            console.log(`Trial End: ${subscription.trialEnd}`);
            
            // Expire the subscription
            subscription.status = 'expired';
            subscription.isTrialing = false;
            subscription.trialEnd = new Date(); // Set to now
            subscription.currentPeriodEnd = new Date();
            
            await subscription.save();
            console.log('✅ Trial subscription expired');
        } else {
            console.log('\n📋 No subscription found');
        }
        
        // Keep dealer active and verified
        dealer.status = 'active';
        dealer.emailVerified = true;
        dealer.currentSubscriptionId = null; // Remove subscription reference
        
        await dealer.save();
        console.log('✅ Dealer kept active with email verified');
        
        console.log('\n🎉 Trial Expired Successfully!');
        console.log('📋 Summary:');
        console.log('- Trial subscription expired');
        console.log('- Dealer status: active');
        console.log('- Email verified: true');
        console.log('- Dealer can now purchase a new subscription');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from database');
    }
}

// Get email from command line argument
const email = process.argv[2] || 'rossy4586879@gmail.com';
expireTrialKeepActive(email);
