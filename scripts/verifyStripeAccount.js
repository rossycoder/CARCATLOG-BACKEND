require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function verifyAccount() {
    console.log('🔍 Stripe Account Verification');
    console.log('=============================');
    
    try {
        // Get account info
        const account = await stripe.accounts.retrieve();
        
        console.log('✅ Connected Account Info:');
        console.log('Account ID:', account.id);
        console.log('Email:', account.email);
        console.log('Country:', account.country);
        console.log('Display Name:', account.display_name || 'Not set');
        console.log('Type:', account.type);
        
        // Check if this matches your dashboard
        console.log('\n🔑 API Key Info:');
        console.log('Key Type:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST MODE' : 'LIVE MODE');
        console.log('Key Preview:', process.env.STRIPE_SECRET_KEY?.substring(0, 20) + '...');
        
        // Get recent activity
        console.log('\n📊 Recent Activity Check:');
        const events = await stripe.events.list({ limit: 5 });
        
        if (events.data.length === 0) {
            console.log('❌ No recent events found');
        } else {
            console.log(`Found ${events.data.length} recent events:`);
            events.data.forEach((event, i) => {
                console.log(`${i + 1}. ${event.type} - ${new Date(event.created * 1000).toLocaleString()}`);
            });
        }
        
        console.log('\n🎯 Dashboard URL for this account:');
        console.log('Test Mode: https://dashboard.stripe.com/test');
        console.log('Live Mode: https://dashboard.stripe.com/');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.type === 'StripeAuthenticationError') {
            console.log('\n🚨 Authentication Error - Possible Issues:');
            console.log('1. Wrong API key in .env file');
            console.log('2. API key expired or revoked');
            console.log('3. Account access issues');
        }
    }
}

verifyAccount();