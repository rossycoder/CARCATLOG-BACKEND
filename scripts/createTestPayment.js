require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createTestPayment() {
    console.log('🧪 Creating Test Payment...');
    
    try {
        // Create a simple test payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1000, // £10.00
            currency: 'gbp',
            description: 'Test Payment - Dashboard Check',
            metadata: {
                test: 'dashboard_visibility',
                created_at: new Date().toISOString(),
                purpose: 'testing_stripe_dashboard'
            }
        });
        
        console.log('✅ Test Payment Created Successfully!');
        console.log('Payment Intent ID:', paymentIntent.id);
        console.log('Amount: £' + (paymentIntent.amount / 100).toFixed(2));
        console.log('Status:', paymentIntent.status);
        console.log('Created:', new Date(paymentIntent.created * 1000).toLocaleString());
        
        console.log('\n📋 Dashboard Instructions:');
        console.log('1. Go to Stripe Dashboard > Payments');
        console.log('2. Look for payment ID:', paymentIntent.id);
        console.log('3. If not visible, clear all filters');
        console.log('4. Check date range is set to "All time"');
        
        return paymentIntent;
        
    } catch (error) {
        console.error('❌ Error creating test payment:', error.message);
    }
}

createTestPayment();