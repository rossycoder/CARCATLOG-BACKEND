require('dotenv').config();

console.log('🔍 Simple Stripe Test');
console.log('====================');

console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('STRIPE_SECRET_KEY type:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'LIVE');

try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe module loaded successfully');
    
    // Simple test
    stripe.paymentIntents.list({ limit: 1 })
        .then(result => {
            console.log('✅ Stripe API connection successful');
            console.log('Payment Intents found:', result.data.length);
            if (result.data.length > 0) {
                console.log('Latest payment:', result.data[0].id, result.data[0].status);
            } else {
                console.log('❌ No payment intents found in Stripe dashboard');
                console.log('💡 This means no test payments have been made yet');
            }
        })
        .catch(error => {
            console.error('❌ Stripe API Error:', error.message);
        });
        
} catch (error) {
    console.error('❌ Error loading Stripe:', error.message);
}