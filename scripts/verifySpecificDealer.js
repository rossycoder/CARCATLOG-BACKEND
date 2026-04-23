require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');

async function verifySpecificDealer(email) {
    console.log('✅ Verifying Trade Dealer');
    console.log('========================');
    console.log(`Email: ${email}\n`);
    
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');
        
        // Find the dealer
        const dealer = await TradeDealer.findOne({ email: email.toLowerCase() });
        
        if (!dealer) {
            console.log('❌ Dealer not found with email:', email);
            return;
        }
        
        console.log('📋 Current Dealer Status:');
        console.log(`  Business Name: ${dealer.businessName}`);
        console.log(`  Contact Person: ${dealer.contactPerson}`);
        console.log(`  Status: ${dealer.status}`);
        console.log(`  Email Verified: ${dealer.emailVerified}`);
        console.log(`  Created: ${dealer.createdAt}\n`);
        
        // Update dealer to verified and active
        dealer.emailVerified = true;
        dealer.status = 'active';
        
        await dealer.save();
        
        console.log('✅ Dealer verified successfully!\n');
        console.log('📋 Updated Status:');
        console.log(`  Email Verified: ${dealer.emailVerified}`);
        console.log(`  Status: ${dealer.status}`);
        console.log('\n💡 Dealer can now login and access the trade dashboard');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');
    }
}

// Get email from command line argument
const email = process.argv[2] || 'windsorcars2026@outlook.com';
verifySpecificDealer(email);
