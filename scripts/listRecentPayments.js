require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function listRecentPayments() {
    console.log('📋 Recent Payments (Last 24 hours)');
    console.log('==================================');
    
    try {
        const yesterday = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
        
        const paymentIntents = await stripe.paymentIntents.list({
            created: { gte: yesterday },
            limit: 10
        });
        
        if (paymentIntents.data.length === 0) {
            console.log('❌ No payments in last 24 hours');
        } else {
            console.log(`Found ${paymentIntents.data.length} recent payments:`);
            
            paymentIntents.data.forEach((pi, index) => {
                const date = new Date(pi.created * 1000);
                console.log(`\n${index + 1}. ${pi.id}`);
                console.log(`   Amount: £${(pi.amount / 100).toFixed(2)}`);
                console.log(`   Status: ${pi.status}`);
                console.log(`   Time: ${date.toLocaleString()}`);
                console.log(`   Description: ${pi.description || 'No description'}`);
            });
        }
        
        console.log('\n🔗 Direct Dashboard Links:');
        console.log('Payments: https://dashboard.stripe.com/test/payments');
        console.log('All Activity: https://dashboard.stripe.com/test/balance/overview');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

listRecentPayments();