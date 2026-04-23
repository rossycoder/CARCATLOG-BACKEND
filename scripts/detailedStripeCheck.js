require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkStripeDetails() {
    console.log('🔍 Detailed Stripe Analysis');
    console.log('===========================');
    
    try {
        // Get all payment intents
        console.log('\n💳 All Payment Intents:');
        const paymentIntents = await stripe.paymentIntents.list({ limit: 20 });
        
        if (paymentIntents.data.length === 0) {
            console.log('❌ No payment intents found');
        } else {
            console.log(`Found ${paymentIntents.data.length} payment intents:`);
            paymentIntents.data.forEach((pi, index) => {
                const date = new Date(pi.created * 1000);
                console.log(`\n${index + 1}. Payment Intent: ${pi.id}`);
                console.log(`   Amount: £${(pi.amount / 100).toFixed(2)} ${pi.currency.toUpperCase()}`);
                console.log(`   Status: ${pi.status}`);
                console.log(`   Created: ${date.toLocaleString()}`);
                console.log(`   Customer: ${pi.customer || 'No customer'}`);
                console.log(`   Description: ${pi.description || 'No description'}`);
                
                if (pi.metadata && Object.keys(pi.metadata).length > 0) {
                    console.log(`   Metadata:`);
                    Object.entries(pi.metadata).forEach(([key, value]) => {
                        console.log(`     ${key}: ${value}`);
                    });
                }
                
                if (pi.charges && pi.charges.data.length > 0) {
                    console.log(`   Charges: ${pi.charges.data.length}`);
                    pi.charges.data.forEach((charge, i) => {
                        console.log(`     Charge ${i + 1}: ${charge.id} - ${charge.status}`);
                    });
                }
            });
        }
        
        // Get all customers
        console.log('\n\n👥 All Customers:');
        const customers = await stripe.customers.list({ limit: 20 });
        
        if (customers.data.length === 0) {
            console.log('❌ No customers found');
        } else {
            console.log(`Found ${customers.data.length} customers:`);
            customers.data.forEach((customer, index) => {
                const date = new Date(customer.created * 1000);
                console.log(`\n${index + 1}. Customer: ${customer.id}`);
                console.log(`   Email: ${customer.email || 'No email'}`);
                console.log(`   Name: ${customer.name || 'No name'}`);
                console.log(`   Created: ${date.toLocaleString()}`);
                
                if (customer.metadata && Object.keys(customer.metadata).length > 0) {
                    console.log(`   Metadata:`);
                    Object.entries(customer.metadata).forEach(([key, value]) => {
                        console.log(`     ${key}: ${value}`);
                    });
                }
            });
        }
        
        // Get all subscriptions
        console.log('\n\n📋 All Subscriptions:');
        const subscriptions = await stripe.subscriptions.list({ limit: 20 });
        
        if (subscriptions.data.length === 0) {
            console.log('❌ No subscriptions found');
        } else {
            console.log(`Found ${subscriptions.data.length} subscriptions:`);
            subscriptions.data.forEach((sub, index) => {
                const date = new Date(sub.created * 1000);
                console.log(`\n${index + 1}. Subscription: ${sub.id}`);
                console.log(`   Status: ${sub.status}`);
                console.log(`   Customer: ${sub.customer}`);
                console.log(`   Created: ${date.toLocaleString()}`);
                
                if (sub.items && sub.items.data.length > 0) {
                    console.log(`   Items:`);
                    sub.items.data.forEach((item, i) => {
                        console.log(`     ${i + 1}. Price: ${item.price.id} - ${item.price.unit_amount/100} ${item.price.currency}`);
                    });
                }
                
                if (sub.metadata && Object.keys(sub.metadata).length > 0) {
                    console.log(`   Metadata:`);
                    Object.entries(sub.metadata).forEach(([key, value]) => {
                        console.log(`     ${key}: ${value}`);
                    });
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkStripeDetails();