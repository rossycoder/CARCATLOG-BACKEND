require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createSimpleTestPayment() {
    console.log('💳 Creating Simple Test Payment...');
    
    try {
        const uniqueAmount = Math.floor(Math.random() * 500) + 1500; // £15-20
        const timestamp = new Date().toLocaleTimeString();
        
        // Create simple payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: uniqueAmount,
            currency: 'gbp',
            description: `DASHBOARD TEST ${timestamp}`,
            payment_method_types: ['card'],
            metadata: {
                dashboard_test: 'true',
                created_time: timestamp
            }
        });
        
        console.log('✅ Test Payment Created Successfully!');
        console.log('====================================');
        console.log('💰 Amount:', `£${(uniqueAmount/100).toFixed(2)}`);
        console.log('🆔 Payment ID:', paymentIntent.id);
        console.log('📝 Description:', `DASHBOARD TEST ${timestamp}`);
        console.log('📊 Status:', paymentIntent.status);
        console.log('⏰ Created:', new Date().toLocaleString());
        
        console.log('\n🎯 DASHBOARD INSTRUCTIONS:');
        console.log('1. Open: https://dashboard.stripe.com/test/payments');
        console.log('2. Look for: £' + (uniqueAmount/100).toFixed(2));
        console.log('3. Description: "DASHBOARD TEST ' + timestamp + '"');
        console.log('4. Status: requires_payment_method');
        
        console.log('\n📍 NAVIGATION STEPS:');
        console.log('- Click "Payments" in LEFT SIDEBAR');
        console.log('- NOT "Home" or "Overview"');
        console.log('- Look at the TOP of payments list');
        
        return paymentIntent;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createSimpleTestPayment();