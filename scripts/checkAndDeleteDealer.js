require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');

async function checkAndDeleteDealer(email) {
    console.log('🔍 Checking and Deleting Dealer');
    console.log('===============================');
    console.log(`Email: ${email}`);
    
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // Find the dealer
        const dealer = await TradeDealer.findOne({ email: email.toLowerCase() });
        if (!dealer) {
            console.log('❌ Dealer not found in database');
            console.log('💡 Email is available for new registration');
            return;
        }
        
        console.log(`\n📋 Found Dealer:`);
        console.log(`ID: ${dealer._id}`);
        console.log(`Business Name: ${dealer.businessName || 'Not set'}`);
        console.log(`Contact Person: ${dealer.contactPerson || 'Not set'}`);
        console.log(`Status: ${dealer.status}`);
        console.log(`Email Verified: ${dealer.emailVerified}`);
        console.log(`Created: ${dealer.createdAt}`);
        console.log(`Last Login: ${dealer.lastLoginAt || 'Never'}`);
        
        // Check for subscription
        const subscription = await TradeSubscription.findOne({ dealerId: dealer._id });
        if (subscription) {
            console.log(`\n📋 Found Subscription:`);
            console.log(`Status: ${subscription.status}`);
            console.log(`Is Trialing: ${subscription.isTrialing}`);
            console.log(`Trial End: ${subscription.trialEnd}`);
            console.log(`Stripe ID: ${subscription.stripeSubscriptionId}`);
            
            // Delete subscription
            await TradeSubscription.deleteOne({ _id: subscription._id });
            console.log('✅ Subscription deleted');
        }
        
        // Delete the dealer
        await TradeDealer.deleteOne({ _id: dealer._id });
        console.log('✅ Dealer deleted');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from database');
    }
}

const email = process.argv[2];
if (!email) {
    console.log('Usage: node checkAndDeleteDealer.js <email>');
    process.exit(1);
}

checkAndDeleteDealer(email);