require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');

async function resetDealerTrial(email) {
    console.log('🔄 Resetting Dealer Trial');
    console.log('========================');
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
        console.log(`Created: ${dealer.createdAt}`);
        
        // Find current subscription
        const subscription = await TradeSubscription.findOne({ dealerId: dealer._id });
        if (subscription) {
            console.log(`\n📋 Current Subscription:`);
            console.log(`Status: ${subscription.status}`);
            console.log(`Is Trialing: ${subscription.isTrialing}`);
            console.log(`Trial Start: ${subscription.trialStart}`);
            console.log(`Trial End: ${subscription.trialEnd}`);
            console.log(`Current Period End: ${subscription.currentPeriodEnd}`);
            console.log(`Stripe Subscription ID: ${subscription.stripeSubscriptionId}`);
            
            // Delete the subscription
            await TradeSubscription.deleteOne({ _id: subscription._id });
            console.log('✅ Deleted existing subscription');
        } else {
            console.log('\n📋 No existing subscription found');
        }
        
        // Reset dealer to new user state
        dealer.status = 'pending';
        dealer.emailVerified = false;
        dealer.currentSubscriptionId = null;
        dealer.lastLoginAt = null;
        dealer.stats = {
            totalListings: 0,
            activeListings: 0,
            soldListings: 0,
            totalViews: 0
        };
        
        await dealer.save();
        console.log('✅ Reset dealer to new user state');
        
        // Check for any cars associated with this dealer
        const Car = require('../models/Car');
        const cars = await Car.find({ dealerId: dealer._id });
        
        if (cars.length > 0) {
            console.log(`\n🚗 Found ${cars.length} cars associated with dealer:`);
            cars.forEach((car, index) => {
                console.log(`${index + 1}. ${car.make} ${car.model} - Status: ${car.advertStatus}`);
            });
            
            console.log('\n⚠️  Do you want to delete these cars? (They will be removed)');
            console.log('💡 If you want to keep them, you can manually update their dealerId');
            
            // For now, let's set them to inactive
            await Car.updateMany(
                { dealerId: dealer._id },
                { advertStatus: 'inactive' }
            );
            console.log('✅ Set all dealer cars to inactive status');
        }
        
        console.log('\n🎉 Trial Reset Complete!');
        console.log('📋 Summary:');
        console.log('- Dealer status reset to "pending"');
        console.log('- Email verification reset to false');
        console.log('- Subscription deleted');
        console.log('- Stats reset to zero');
        console.log('- Associated cars set to inactive');
        console.log('\n💡 The dealer can now register again as a new user');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from database');
    }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'rossy4586879@gmail.com';
resetDealerTrial(email);