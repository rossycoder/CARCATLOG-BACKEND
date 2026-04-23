require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function completeTestPayment() {
    console.log('💳 Creating Complete Test Payment...');
    
    try {
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1234, // £12.34 - unique amount for easy identification
            currency: 'gbp',
            description: 'DASHBOARD TEST - March 2026',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                test_purpose: 'dashboard_visibility_check',
                created_date: new Date().toISOString(),
                amount_pounds: '12.34'
            }
        });
        
        // Simulate payment with test card
        await stripe.paymentIntents.confirm(paymentIntent.id, {
            payment_method: 'pm_card_visa', // Test card
            return_url: 'https://example.com'
        });
        
        console.log('✅ Complete Test Payment Created!');
        console.log('Payment ID:', paymentIntent.id);
        console.log('Amount: £12.34');
        console.log('Status: succeeded');
        console.log('Date:', new Date().toLocaleString());
        
        console.log('\n🎯 Dashboard Instructions:');
        console.log('1. Change date range to "All time" or "Last 12 months"');
        console.log('2. Look for payment: £12.34');
        console.log('3. Payment ID:', paymentIntent.id);
        console.log('4. Description: "DASHBOARD TEST - March 2026"');
        
        return paymentIntent;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // Try simpler approach
        console.log('\n🔄 Trying simpler payment...');
        
        const simplePayment = await stripe.paymentIntents.create({
            amount: 999, // £9.99
            currency: 'gbp',
            description: 'Simple Test Payment - March 2026',
            metadata: {
                test: 'simple_dashboard_test'
            }
        });
        
        console.log('✅ Simple Payment Created:');
        console.log('Payment ID:', simplePayment.id);
        console.log('Amount: £9.99');
        console.log('Status:', simplePayment.status);
    }
}

completeTestPayment();