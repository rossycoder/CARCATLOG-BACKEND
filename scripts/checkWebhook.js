require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkWebhooks() {
    console.log('🔗 Webhook Configuration Check');
    console.log('==============================');
    
    try {
        // List all webhook endpoints
        const webhooks = await stripe.webhookEndpoints.list();
        
        console.log('Current Webhook Secret in .env:', process.env.STRIPE_WEBHOOK_SECRET);
        console.log('Webhook Secret Format:', process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') ? '✅ Valid' : '❌ Invalid');
        
        console.log('\n📋 Configured Webhooks:');
        if (webhooks.data.length === 0) {
            console.log('❌ No webhooks configured in Stripe dashboard');
            console.log('💡 You need to create webhook endpoints in Stripe dashboard');
        } else {
            webhooks.data.forEach((webhook, index) => {
                console.log(`\n${index + 1}. Webhook Endpoint:`);
                console.log(`   URL: ${webhook.url}`);
                console.log(`   Status: ${webhook.status}`);
                console.log(`   Created: ${new Date(webhook.created * 1000).toLocaleString()}`);
                console.log(`   Events: ${webhook.enabled_events.join(', ')}`);
                console.log(`   ID: ${webhook.id}`);
            });
        }
        
        console.log('\n🔧 Webhook Setup Instructions:');
        console.log('1. Go to Stripe Dashboard > Developers > Webhooks');
        console.log('2. Add endpoint: https://your-domain.com/api/payments/webhook');
        console.log('3. Select events: payment_intent.succeeded, invoice.payment_succeeded');
        console.log('4. Copy the webhook secret and update .env file');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkWebhooks();