/**
 * Subscription Cron Job
 * Handles subscription expiration checks and email notifications
 */

const cron = require('node-cron');
const TradeSubscription = require('../models/TradeSubscription');
const TradeDealer = require('../models/TradeDealer');
const EmailService = require('../services/emailService');
const Car = require('../models/Car');

const emailService = new EmailService();

/**
 * Check for subscriptions expiring in 7 days and send reminder emails
 */
async function checkExpiringSubscriptions() {
  try {
    console.log('\n🔍 Checking for expiring subscriptions...');
    
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Find subscriptions expiring in 7 days
    const expiringSubscriptions = await TradeSubscription.find({
      status: { $in: ['active', 'trialing'] },
      currentPeriodEnd: {
        $gte: now,
        $lte: sevenDaysFromNow
      },
      cancelAtPeriodEnd: false,
      // Only send reminder once - check if we haven't sent in last 6 days
      $or: [
        { lastReminderSent: { $exists: false } },
        { lastReminderSent: { $lt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) } }
      ]
    }).populate('planId dealerId');

    console.log(`📧 Found ${expiringSubscriptions.length} subscriptions expiring in 7 days`);

    for (const subscription of expiringSubscriptions) {
      if (!subscription.dealerId || !subscription.planId) {
        console.log(`⚠️ Skipping subscription ${subscription._id} - missing dealer or plan`);
        continue;
      }

      console.log(`📤 Sending renewal reminder to ${subscription.dealerId.businessName}`);
      
      const sent = await emailService.sendSubscriptionRenewalReminder(
        subscription.dealerId,
        subscription
      );

      if (sent) {
        // Mark reminder as sent
        subscription.lastReminderSent = new Date();
        await subscription.save();
        console.log(`✅ Reminder sent to ${subscription.dealerId.email}`);
      } else {
        console.log(`❌ Failed to send reminder to ${subscription.dealerId.email}`);
      }
    }

    console.log('✅ Expiring subscriptions check complete\n');
  } catch (error) {
    console.error('❌ Error checking expiring subscriptions:', error);
  }
}

/**
 * Check for expired subscriptions and deactivate listings
 */
async function checkExpiredSubscriptions() {
  try {
    console.log('\n🔍 Checking for expired subscriptions...');
    
    const now = new Date();
    
    // Find subscriptions that have expired
    const expiredSubscriptions = await TradeSubscription.find({
      status: { $in: ['active', 'trialing'] },
      currentPeriodEnd: { $lt: now },
      cancelAtPeriodEnd: false
    }).populate('planId dealerId');

    console.log(`📧 Found ${expiredSubscriptions.length} expired subscriptions`);

    for (const subscription of expiredSubscriptions) {
      if (!subscription.dealerId || !subscription.planId) {
        console.log(`⚠️ Skipping subscription ${subscription._id} - missing dealer or plan`);
        continue;
      }

      console.log(`⚠️ Processing expired subscription for ${subscription.dealerId.businessName}`);
      
      // Update subscription status
      subscription.status = 'expired';
      subscription.expiredAt = new Date();
      await subscription.save();

      // Deactivate all dealer's listings
      const result = await Car.updateMany(
        { dealerId: subscription.dealerId._id, advertStatus: 'active' },
        { $set: { advertStatus: 'expired' } }
      );

      console.log(`📦 Deactivated ${result.modifiedCount} listings for ${subscription.dealerId.businessName}`);

      // Update dealer status
      const dealer = await TradeDealer.findById(subscription.dealerId._id);
      if (dealer) {
        dealer.hasActiveSubscription = false;
        dealer.status = 'inactive';
        await dealer.save();
      }

      // Send expiration email
      const sent = await emailService.sendSubscriptionExpired(
        subscription.dealerId,
        subscription
      );

      if (sent) {
        console.log(`✅ Expiration email sent to ${subscription.dealerId.email}`);
      } else {
        console.log(`❌ Failed to send expiration email to ${subscription.dealerId.email}`);
      }
    }

    console.log('✅ Expired subscriptions check complete\n');
  } catch (error) {
    console.error('❌ Error checking expired subscriptions:', error);
  }
}

/**
 * Check for past_due subscriptions (payment failed)
 */
async function checkPastDueSubscriptions() {
  try {
    console.log('\n🔍 Checking for past due subscriptions...');
    
    const pastDueSubscriptions = await TradeSubscription.find({
      status: 'past_due',
      // Only send notification once per day
      $or: [
        { lastPaymentFailedNotification: { $exists: false } },
        { lastPaymentFailedNotification: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    }).populate('planId dealerId');

    console.log(`📧 Found ${pastDueSubscriptions.length} past due subscriptions`);

    for (const subscription of pastDueSubscriptions) {
      if (!subscription.dealerId || !subscription.planId) {
        console.log(`⚠️ Skipping subscription ${subscription._id} - missing dealer or plan`);
        continue;
      }

      console.log(`📤 Sending payment failed notification to ${subscription.dealerId.businessName}`);
      
      const sent = await emailService.sendSubscriptionPaymentFailed(
        subscription.dealerId,
        subscription
      );

      if (sent) {
        subscription.lastPaymentFailedNotification = new Date();
        await subscription.save();
        console.log(`✅ Payment failed notification sent to ${subscription.dealerId.email}`);
      } else {
        console.log(`❌ Failed to send notification to ${subscription.dealerId.email}`);
      }
    }

    console.log('✅ Past due subscriptions check complete\n');
  } catch (error) {
    console.error('❌ Error checking past due subscriptions:', error);
  }
}

/**
 * Initialize subscription cron jobs
 */
function initSubscriptionCron() {
  console.log('🕐 Initializing subscription cron jobs...');

  // Run every day at 9:00 AM to check expiring subscriptions (7 days before)
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running daily subscription expiration check...');
    await checkExpiringSubscriptions();
  });

  // Run every hour to check for expired subscriptions
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running hourly expired subscription check...');
    await checkExpiredSubscriptions();
  });

  // Run every 6 hours to check for past due subscriptions
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ Running past due subscription check...');
    await checkPastDueSubscriptions();
  });

  console.log('✅ Subscription cron jobs initialized');
  console.log('   - Expiring check: Daily at 9:00 AM');
  console.log('   - Expired check: Every hour');
  console.log('   - Past due check: Every 6 hours');

  // Run checks immediately on startup (for testing)
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🔧 Development mode: Running initial checks...');
    setTimeout(async () => {
      await checkExpiringSubscriptions();
      await checkExpiredSubscriptions();
      await checkPastDueSubscriptions();
    }, 5000); // Wait 5 seconds after startup
  }
}

module.exports = {
  initSubscriptionCron,
  checkExpiringSubscriptions,
  checkExpiredSubscriptions,
  checkPastDueSubscriptions
};
