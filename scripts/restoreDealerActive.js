require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');

async function restoreDealerActive(email) {
    console.log('🔄 Restoring Dealer to Active Status');
    console.log('====================================');
    console.log(`Email: ${email}`);
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        const dealer = await TradeDealer.findOne({ email: email.toLowerCase() });
        if (!dealer) {
            console.log('❌ Dealer not found');
            return;
        }
        
        console.log(`\n📋 Current Status: ${dealer.status}`);
        console.log(`Email Verified: ${dealer.emailVerified}`);
        
        // Restore to active
        dealer.status = 'active';
        dealer.emailVerified = true;
        
        await dealer.save();
        
        console.log('\n✅ Dealer restored to active status');
        console.log('✅ Email verification enabled');
        console.log('\n💡 Dealer can now login and purchase subscription');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from database');
    }
}

const email = process.argv[2] || 'rossy4586879@gmail.com';
restoreDealerActive(email);
