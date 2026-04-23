require('dotenv').config({ path: '../.env' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkStripe() {
  try {
    console.log('🔍 Checking Stripe connection...');
    
    // Check account
    const account = await stripe.accounts.retrieve();
    console.log('✅ Connected to:', account.display_name || account.id);
    console.log('Country:', account.country);
    console.log('Currency:', account.default_currency);
    
    // Check recent payments
    console.log('\n💳 Recent payments:');
    const payments = await stripe.paymentIntents.list({ limit: 5 });
    console.log('Total found:', payments.data.length);
    
    if (payments.data.length > 0) {
      payments.data.forEach((payment, index) => {
        const amount = (payment.amount / 100).toFixed(2);
        const date = new Date(payment.created * 1000).toLocaleDateString();
        console.log(`  ${index + 1}. £${amount} - ${payment.status} - ${date}`);
      });
    } else {
      console.log('  No payments found');
    }
    
    // Check checkout sessions
    console.log('\n🛒 Recent checkout sessions:');
    const sessions = await stripe.checkout.sessions.list({ limit: 5 });
    console.log('Total found:', sessions.data.length);
    
    if (sessions.data.length > 0) {
      sessions.data.forEach((session, index) => {
        const date = new Date(session.created * 1000).toLocaleDateString();
        console.log(`  ${index + 1}. ${session.payment_status} - ${session.mode} - ${date}`);
      });
    } else {
      console.log('  No checkout sessions found');
    }
    
    // Check customers
    console.log('\n👥 Recent customers:');
    const customers = await stripe.customers.list({ limit: 3 });
    console.log('Total found:', customers.data.length);
    
    if (customers.data.length > 0) {
      customers.data.forEach((customer, index) => {
        console.log(`  ${index + 1}. ${customer.email || 'No email'} - ${customer.name || 'No name'}`);
      });
    } else {
      console.log('  No customers found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Invalid API Key')) {
      console.log('💡 Check your Stripe API key in .env file');
    }
  }
}

checkStripe();