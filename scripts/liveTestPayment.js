require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createLiveTestPayment() {
    console.log('🚀 Creating LIVE Test Payment...');
    console.log('This payment will appear IMMEDIATELY in dashboard');
    
    try {
        const uniqueAmount = Math.floor(Math.random() * 1000) + 1000; // Random amount £10-20
        const timestamp = new Date().toLocaleTimeString();
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: uniqueAmount,
            currency: 'gbp',
            description: `LIVE TEST ${timestamp}`,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                live_test: 'true',
                created_at: new Date().toISOString(),
                unique_identifier: `test_${Date.now()}`
            }
        });
        
        // Confirm with test card
        const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id, {
            payment_method: 'pm_card_visa'
        });
        
        console.log('✅ LIVE Payment Created & Confirmed!');
        console.log('==========================================');
        console.log('💰 Amount:', `£${(uniqueAmount/100).toFixed(2)}`);
        console.log('🆔 Payment ID:', paymentIntent.id);
        console.log('📝 Description:', `LIVE TEST ${timestamp}`);
        console.log('✅ Status:', confirmed.status);
        console.log('⏰ Time:', new Date().toLocaleString());
        
        console.log('\n🎯 IMMEDIATE ACTION:');
        console.log('1. Go to: https://dashboard.stripe.com/test/payments');
        console.log('2. Look for amount: £' + (uniqueAmount/100).toFixed(2));
        console.log('3. Description: "LIVE TEST ' + timestamp + '"');
        console.log('4. This should appear at the TOP of the list');
        
        console.log('\n🔄 If not visible:');
        console.log('- Refresh the page (F5)');
        console.log('- Check you\'re on Payments page, not Home');
        console.log('- Ensure Test Mode is active (orange banner)');
        
        return confirmed;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createLiveTestPayment();