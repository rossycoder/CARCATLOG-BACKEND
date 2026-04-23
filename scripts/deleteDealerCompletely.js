require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');

async function deleteDealerCompletely(email) {
    console.log('🗑️  Completely Deleting Dealer');
    console.log('==============================');
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
        
        console.log(`\n📋 Found Dealer:`);
        console.log(`Business Name: ${dealer.businessName}`);
        console.log(`Contact Person: ${dealer.contactPerson}`);
        console.log(`Status: ${dealer.status}`);
        console.log(`Created: ${dealer.createdAt}`);
        
        // Delete subscription first
        const subscription = await TradeSubscription.findOne({ dealerId: dealer._id });
        if (subscription) {
            await TradeSubscription.deleteOne({ _id: subscription._id });
            console.log('✅ Deleted subscription');
        }
        
        // Delete or update cars
        const Car = require('../models/Car');
        const cars = await Car.find({ dealerId: dealer._id });
        
        if (cars.length > 0) {
            console.log(`\n🚗 Found ${cars.length} cars. Deleting them...`);
            await Car.deleteMany({ dealerId: dealer._id });
            console.log('✅ Deleted all dealer cars');
        }
        
        // Delete the dealer
        await TradeDealer.deleteOne({ _id: dealer._id });
        console.log('✅ Deleted dealer account');
        
        console.log('\n🎉 Complete Deletion Successful!');
        console.log('📋 Deleted:');
        console.log('- Dealer account');
        console.log('- Subscription (if any)');
        console.log(`- ${cars.length} cars`);
        console.log('\n💡 The email can now be used to create a completely new account');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from database');
    }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'rossy4586879@gmail.com';
deleteDealerCompletely(email);