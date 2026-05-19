require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function diagnoseStripe() {
    console.log('🔍 Stripe Diagnostic Report');
    console.log('==========================');
    
    // Check environment
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Stripe Key Type:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'LIVE');
    
    try {
        // Test Stripe connection
        console.log('\n� Testing Stripe Connection...');
        const account = await stripe.accounts.retrieve();
        console.log('✅ Stripe connection successful');
        console.log('Account ID:', account.id);
        console.log('Account Type:', account.type);
        console.log('Country:', account.country);
        
        // List recent payments
        console.log('\n💳 Recent Payment Intents (Last 10):');
        const paymentIntents = await stripe.paymentIntents.list({ limit: 10 });
        
        if (paymentIntents.data.length === 0) {
            console.log('❌ No payment intents found');
        } else {
            paymentIntents.data.forEach((pi, index) => {
                console.log(`${index + 1}. ${pi.id} - ${pi.amount/100} ${pi.currency.toUpperCase()} - ${pi.status}`);
                console.log(`   Created: ${new Date(pi.created * 1000).toLocaleString()}`);
                if (pi.metadata && Object.keys(pi.metadata).length > 0) {
                    console.log(`   Metadata:`, pi.metadata);
                }
            });
        }
        
        // List recent subscriptions
        console.log('\n📋 Recent Subscriptions (Last 10):');
        const subscriptions = await stripe.subscriptions.list({ limit: 10 });
        
        if (subscriptions.data.length === 0) {
            console.log('❌ No subscriptions found');
        } else {
            subscriptions.data.forEach((sub, index) => {
                console.log(`${index + 1}. ${sub.id} - ${sub.status}`);
                console.log(`   Customer: ${sub.customer}`);
                console.log(`   Created: ${new Date(sub.created * 1000).toLocaleString()}`);
                if (sub.metadata && Object.keys(sub.metadata).length > 0) {
                    console.log(`   Metadata:`, sub.metadata);
                }
            });
        }
        
        // List recent customers
        console.log('\n� Recent Customers (Last 5):');
        const customers = await stripe.customers.list({ limit: 5 });
        
        if (customers.data.length === 0) {
            console.log('❌ No customers found');
        } else {
            customers.data.forEach((customer, index) => {
                console.log(`${index + 1}. ${customer.id} - ${customer.email || 'No email'}`);
                console.log(`   Created: ${new Date(customer.created * 1000).toLocaleString()}`);
            });
        }
        
        // Check webhook endpoints
        console.log('\n� Webhook Endpoints:');
        const webhooks = await stripe.webhookEndpoints.list();
        
        if (webhooks.data.length === 0) {
            console.log('❌ No webhook endpoints configured');
        } else {
            webhooks.data.forEach((webhook, index) => {
                console.log(`${index + 1}. ${webhook.url} - ${webhook.status}`);
                console.log(`   Events: ${webhook.enabled_events.join(', ')}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Stripe Error:', error.message);
        if (error.type === 'StripeAuthenticationError') {
            console.error('🔑 Check your Stripe API key in .env file');
        }
    }
}

diagnoseStripe();