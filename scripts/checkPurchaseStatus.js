/**
 * Check Purchase Status Script
 * Checks the status of a purchase record and associated Stripe session
 * 
 * Usage: node scripts/checkPurchaseStatus.js <purchaseId>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const StripeService = require('../services/stripeService');

async function checkPurchaseStatus(purchaseId) {
  try {
    console.log('🔍 Checking Purchase Status\n');
    console.log('='.repeat(60));
    
    // Connect to database
    console.log('\n📊 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carcatalog');
    console.log('✅ Database connected');
    
    // Find purchase
    console.log(`\n📝 Looking up purchase: ${purchaseId}`);
    const purchase = await AdvertisingPackagePurchase.findById(purchaseId);
    
    if (!purchase) {
      console.error('❌ Purchase not found');
      process.exit(1);
    }
    
    console.log('✅ Purchase found:');
    console.log(`   ID: ${purchase._id}`);
    console.log(`   Package: ${purchase.packageName}`);
    console.log(`   Amount: £${(purchase.amount / 100).toFixed(2)}`);
    console.log(`   Payment Status: ${purchase.paymentStatus}`);
    console.log(`   Package Status: ${purchase.packageStatus}`);
    console.log(`   Seller Type: ${purchase.sellerType}`);
    console.log(`   Vehicle Value: ${purchase.vehicleValue}`);
    console.log(`   Created: ${purchase.createdAt}`);
    
    if (purchase.paidAt) {
      console.log(`   Paid At: ${purchase.paidAt}`);
    }
    if (purchase.activatedAt) {
      console.log(`   Activated At: ${purchase.activatedAt}`);
    }
    if (purchase.expiresAt) {
      console.log(`   Expires At: ${purchase.expiresAt}`);
    }
    
    // Check Stripe session
    if (purchase.stripeSessionId) {
      console.log('\n💳 Checking Stripe session...');
      try {
        const stripeService = new StripeService();
        const session = await stripeService.getCheckoutSession(purchase.stripeSessionId);
        
        console.log('✅ Stripe session found:');
        console.log(`   Session ID: ${session.id}`);
        console.log(`   Payment Status: ${session.payment_status}`);
        console.log(`   Status: ${session.status}`);
        console.log(`   Amount Total: £${(session.amount_total / 100).toFixed(2)}`);
        console.log(`   Customer Email: ${session.customer_details?.email || 'N/A'}`);
        
        if (session.payment_intent) {
          console.log(`   Payment Intent: ${session.payment_intent}`);
          
          // Try to get payment intent details
          try {
            const paymentIntent = await stripeService.getPaymentIntent(session.payment_intent);
            console.log('\n💰 Payment Intent Details:');
            console.log(`   Status: ${paymentIntent.status}`);
            console.log(`   Amount: £${(paymentIntent.amount / 100).toFixed(2)}`);
            console.log(`   Created: ${new Date(paymentIntent.created * 1000).toISOString()}`);
            
            if (paymentIntent.charges?.data?.length > 0) {
              const charge = paymentIntent.charges.data[0];
              console.log('\n💳 Charge Details:');
              console.log(`   Charge ID: ${charge.id}`);
              console.log(`   Status: ${charge.status}`);
              console.log(`   Paid: ${charge.paid}`);
              console.log(`   Amount: £${(charge.amount / 100).toFixed(2)}`);
              
              if (charge.failure_code) {
                console.log(`   ❌ Failure Code: ${charge.failure_code}`);
              }
              if (charge.failure_message) {
                console.log(`   ❌ Failure Message: ${charge.failure_message}`);
              }
            }
            
            if (paymentIntent.cancellation_reason) {
              console.log(`\n❌ Cancellation Reason: ${paymentIntent.cancellation_reason}`);
            }
            
            if (paymentIntent.last_payment_error) {
              console.log('\n❌ Last Payment Error:');
              console.log(`   Code: ${paymentIntent.last_payment_error.code}`);
              console.log(`   Message: ${paymentIntent.last_payment_error.message}`);
            }
          } catch (piError) {
            console.warn(`⚠️  Could not retrieve payment intent: ${piError.message}`);
          }
        }
        
      } catch (stripeError) {
        console.error(`❌ Error checking Stripe session: ${stripeError.message}`);
      }
    } else {
      console.log('\n⚠️  No Stripe session ID found');
    }
    
    // Check metadata
    if (purchase.metadata) {
      console.log('\n📋 Metadata:');
      const advertId = purchase.metadata.get('advertId');
      const userId = purchase.metadata.get('userId');
      
      if (advertId) console.log(`   Advert ID: ${advertId}`);
      if (userId) console.log(`   User ID: ${userId}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SUMMARY:\n');
    
    if (purchase.paymentStatus === 'paid') {
      console.log('✅ Payment completed successfully');
    } else if (purchase.paymentStatus === 'pending') {
      console.log('⏳ Payment is still pending');
      console.log('\nPossible reasons:');
      console.log('  - User has not completed checkout');
      console.log('  - Payment is being processed');
      console.log('  - Webhook has not been received yet');
    } else if (purchase.paymentStatus === 'failed') {
      console.log('❌ Payment failed');
    } else if (purchase.paymentStatus === 'cancelled') {
      console.log('❌ Payment was cancelled');
    }
    
    if (purchase.packageStatus === 'active') {
      console.log('✅ Package is active');
    } else if (purchase.packageStatus === 'pending') {
      console.log('⏳ Package activation pending');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed\n');
    process.exit(0);
  }
}

// Get purchase ID from command line
const purchaseId = process.argv[2];

if (!purchaseId) {
  console.error('❌ Usage: node scripts/checkPurchaseStatus.js <purchaseId>');
  process.exit(1);
}

// Run the check
checkPurchaseStatus(purchaseId);
