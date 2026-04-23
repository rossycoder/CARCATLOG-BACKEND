require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');

async function quickDeleteDealer() {
    const email = 'rossy4586879@gmail.com';
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // Find dealer
        const dealer = await TradeDealer.findOne({ email: email.toLowerCase() });
        if (!dealer) {
            console.log('❌ Dealer not found');
            return;
        }
        
        console.log(`Found dealer: ${dealer.businessName || dealer.contactPerson}`);
        
        // Delete subscription
        await TradeSubscription.deleteMany({ dealerId: dealer._id });
        console.log('✅ Deleted subscriptions');
        
        // Delete cars
        const Car = require('../models/Car');
        const deletedCars = await Car.deleteMany({ dealerId: dealer._id });
        console.log(`✅ Deleted ${deletedCars.deletedCount} cars`);
        
        // Delete dealer
        await TradeDealer.deleteOne({ _id: dealer._id });
        console.log('✅ Deleted dealer account');
        
        console.log('\n🎉 Dealer completely deleted!');
        console.log('💡 Email is now available for new registration');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

quickDeleteDealer();