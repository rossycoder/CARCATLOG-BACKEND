require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function finalDiagnosis() {
    console.log('🔍 FINAL STRIPE DIAGNOSIS');
    console.log('========================');
    
    try {
        // 1. Account Info
        const account = await stripe.accounts.retrieve();
        console.log('✅ API Connection Working');
        console.log('Account ID:', account.id);
        console.log('Email:', account.email);
        console.log('Display Name:', account.display_name || 'Not set');
        
        // 2. API Key Info
        console.log('\n🔑 API Key Details:');
        console.log('Key Type:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'LIVE');
        console.log('Key starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 15) + '...');
        
        // 3. Recent Payments Count
        const payments = await stripe.paymentIntents.list({ limit: 100 });
        console.log('\n💳 Payment Summary:');
        console.log('Total Payments Found:', payments.data.length);
        
        if (payments.data.length > 0) {
            console.log('\n📋 Last 5 Payments:');
            payments.data.slice(0, 5).forEach((pi, i) => {
                console.log(`${i + 1}. ${pi.id} - £${(pi.amount/100).toFixed(2)} - ${pi.status}`);
                console.log(`   Created: ${new Date(pi.created * 1000).toLocaleString()}`);
            });
            
            // Check if any payments are from today
            const today = new Date().toDateString();
            const todayPayments = payments.data.filter(p => 
                new Date(p.created * 1000).toDateString() === today
            );
            console.log(`\n📅 Payments from today: ${todayPayments.length}`);
        }
        
        // 4. Dashboard URL Check
        console.log('\n🌐 Dashboard URLs:');
        console.log('Test Dashboard:', 'https://dashboard.stripe.com/test');
        console.log('Live Dashboard:', 'https://dashboard.stripe.com/');
        console.log('Direct Payments:', 'https://dashboard.stripe.com/test/payments');
        
        // 5. Account Status
        console.log('\n📊 Account Status:');
        console.log('Charges Enabled:', account.charges_enabled);
        console.log('Payouts Enabled:', account.payouts_enabled);
        console.log('Details Submitted:', account.details_submitted);
        
        // 6. Possible Issues
        console.log('\n⚠️  POSSIBLE ISSUES:');
        console.log('1. You might be logged into a DIFFERENT Stripe account in browser');
        console.log('2. Browser might be in LIVE mode instead of TEST mode');
        console.log('3. Multiple Stripe accounts - check account switcher');
        console.log('4. Browser cache/cookies issue');
        
        console.log('\n🔧 SOLUTIONS TO TRY:');
        console.log('1. Logout from Stripe dashboard completely');
        console.log('2. Login with email:', account.email);
        console.log('3. Ensure TEST mode is active (orange banner)');
        console.log('4. Clear browser cache/cookies for stripe.com');
        console.log('5. Try incognito/private browser window');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

finalDiagnosis();