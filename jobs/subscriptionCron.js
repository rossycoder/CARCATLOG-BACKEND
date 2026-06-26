'use strict';

/**
 * Subscription Cron Job
 * Handles subscription expiration checks, email notifications,
 * and trial → full subscription conversion.
 */

const cron             = require('node-cron');
const TradeSubscription = require('../models/TradeSubscription');
const TradeDealer       = require('../models/TradeDealer');
const SubscriptionPlan  = require('../models/SubscriptionPlan');
const EmailService      = require('../services/emailService');
const Car               = require('../models/Car');

const emailService = new EmailService();

// ─── Full monthly prices (in pence, excl. VAT) ───────────────────────────────
const FULL_PRICES = {
  bronze: 100000, // £1000
  silver: 150000, // £1500
  gold:   200000  // £2000
};

// ─── 1. Convert expired trials to full Stripe subscriptions ──────────────────
/**
 * When a 30-day trial ends, create a real recurring Stripe subscription
 * so the dealer is charged the full monthly price going forward.
 */
async function convertExpiredTrials() {
  try {

    const now = new Date();

    const expiredTrials = await TradeSubscription.find({
      status:   'trialing',
      trialEnd: { $lte: now }
    }).populate('planId dealerId');


    for (const sub of expiredTrials) {
      if (!sub.dealerId || !sub.planId) {
        continue;
      }

      const dealer   = sub.dealerId;
      const plan     = sub.planId;
      const planSlug = plan.slug;


      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        // ── Ensure Stripe customer exists ─────────────────────────────────
        let customerId = dealer.stripeCustomerId || sub.stripeCustomerId;

        // Check if customer ID is valid (real Stripe IDs start with "cus_" and are longer)
        const isValidStripeCustomer = customerId && customerId.startsWith('cus_') && customerId.length > 15;

        if (!isValidStripeCustomer) {
          
          const customer = await stripe.customers.create({
            email: dealer.email,
            name:  dealer.businessName,
            metadata: { dealerId: dealer._id.toString() }
          });
          customerId = customer.id;
          dealer.stripeCustomerId = customerId;
          await dealer.save();
        } else {
          // Verify customer exists in Stripe
          try {
            await stripe.customers.retrieve(customerId);
          } catch (err) {
            
            const customer = await stripe.customers.create({
              email: dealer.email,
              name:  dealer.businessName,
              metadata: { dealerId: dealer._id.toString() }
            });
            customerId = customer.id;
            dealer.stripeCustomerId = customerId;
            await dealer.save();
          }
        }

        // ── Get or create a Stripe Price for this plan ────────────────────
        // We store stripePriceId on the plan; if missing, create it once.
        let stripePriceId = plan.stripePriceId;
        const fullPricePence = FULL_PRICES[planSlug] || 100000;

        // Always verify price exists in Stripe, create new if not
        let priceExists = false;
        if (stripePriceId) {
          try {
            await stripe.prices.retrieve(stripePriceId);
            priceExists = true;
          } catch (err) {
            priceExists = false;
          }
        }

        if (!priceExists) {
          
          // Create a recurring price in Stripe
          const stripePrice = await stripe.prices.create({
            unit_amount: fullPricePence,
            currency:    'gbp',
            recurring:   { interval: 'month' },
            product_data: { name: `${plan.name} Monthly Subscription` }
          });

          stripePriceId      = stripePrice.id;
          plan.stripePriceId = stripePriceId;
          await plan.save();
        }

        // ── Create the recurring Stripe subscription ──────────────────────
        const stripeSub = await stripe.subscriptions.create({
          customer:   customerId,
          items:      [{ price: stripePriceId }],
          metadata:   { dealerId: dealer._id.toString(), planId: plan._id.toString() }
        });


        // ── Update our database record ────────────────────────────────────
        sub.status                = 'active';
        sub.isTrialing            = false;
        sub.stripeSubscriptionId  = stripeSub.id;
        sub.stripeCustomerId      = customerId;
        
        // Safely convert timestamps
        const startTime = stripeSub.current_period_start;
        const endTime = stripeSub.current_period_end;
        
        if (startTime && !isNaN(startTime)) {
          sub.currentPeriodStart = new Date(startTime * 1000);
        } else {
          sub.currentPeriodStart = new Date();
        }
        
        if (endTime && !isNaN(endTime)) {
          sub.currentPeriodEnd = new Date(endTime * 1000);
        } else {
          sub.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        
        sub.cancelAtPeriodEnd     = false;
        await sub.save();

        // ── Reactivate expired listings ────────────────────────────────────
        const reactivateResult = await Car.updateMany(
          { dealerId: sub.dealerId._id, advertStatus: 'expired' },
          { $set: { advertStatus: 'active' } }
        );

        // ── Notify dealer ─────────────────────────────────────────────────
        await emailService.sendSubscriptionRenewed(dealer, sub);

      } catch (err) {
        // Mark as past_due so the payment-failed cron picks it up
        sub.status = 'past_due';
        await sub.save();
        await emailService.sendSubscriptionPaymentFailed(dealer, sub);
      }
    }

  } catch (error) {
  }
}

// ─── 2. Send 7-day renewal reminders ─────────────────────────────────────────
async function checkExpiringSubscriptions() {
  try {

    const now             = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiring = await TradeSubscription.find({
      status:           { $in: ['active', 'trialing'] },
      currentPeriodEnd: { $gte: now, $lte: sevenDaysFromNow },
      cancelAtPeriodEnd: false,
      $or: [
        { lastReminderSent: { $exists: false } },
        { lastReminderSent: { $lt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) } }
      ]
    }).populate('planId dealerId');


    for (const sub of expiring) {
      if (!sub.dealerId || !sub.planId) continue;

      const sent = await emailService.sendSubscriptionRenewalReminder(sub.dealerId, sub);
      if (sent) {
        sub.lastReminderSent = new Date();
        await sub.save();
      }
    }

  } catch (error) {
  }
}

// ─── 3. Deactivate expired subscriptions ─────────────────────────────────────
async function checkExpiredSubscriptions() {
  try {

    const now = new Date();

    const expired = await TradeSubscription.find({
      status:           { $in: ['active', 'trialing'] },
      currentPeriodEnd: { $lt: now },
      cancelAtPeriodEnd: false
    }).populate('planId dealerId');


    for (const sub of expired) {
      if (!sub.dealerId || !sub.planId) continue;


      sub.status    = 'expired';
      sub.expiredAt = new Date();
      await sub.save();

      // Deactivate listings
      const result = await Car.updateMany(
        { dealerId: sub.dealerId._id, advertStatus: 'active' },
        { $set: { advertStatus: 'expired' } }
      );

      // Update dealer
      const dealer = await TradeDealer.findById(sub.dealerId._id);
      if (dealer) {
        dealer.hasActiveSubscription = false;
        dealer.status = 'suspended';
        await dealer.save();
      }

      await emailService.sendSubscriptionExpired(sub.dealerId, sub);
    }

  } catch (error) {
  }
}

// ─── 4. Notify past-due dealers ───────────────────────────────────────────────
async function checkPastDueSubscriptions() {
  try {

    const pastDue = await TradeSubscription.find({
      status: 'past_due',
      $or: [
        { lastPaymentFailedNotification: { $exists: false } },
        { lastPaymentFailedNotification: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    }).populate('planId dealerId');


    for (const sub of pastDue) {
      if (!sub.dealerId || !sub.planId) continue;

      const sent = await emailService.sendSubscriptionPaymentFailed(sub.dealerId, sub);
      if (sent) {
        sub.lastPaymentFailedNotification = new Date();
        await sub.save();
      }
    }

  } catch (error) {
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function initSubscriptionCron() {

  // Trial → full conversion: every hour
  cron.schedule('0 * * * *', async () => {
    await convertExpiredTrials();
  });

  // 7-day reminder: daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    await checkExpiringSubscriptions();
  });

  // Expired deactivation: every hour
  cron.schedule('0 * * * *', async () => {
    await checkExpiredSubscriptions();
  });

  // Past-due notifications: every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    await checkPastDueSubscriptions();
  });


  // Dev: run immediately
  if (process.env.NODE_ENV === 'development') {
    setTimeout(async () => {
      await convertExpiredTrials();
      await checkExpiringSubscriptions();
      await checkExpiredSubscriptions();
      await checkPastDueSubscriptions();
    }, 5000);
  }
}

module.exports = {
  initSubscriptionCron,
  convertExpiredTrials,
  checkExpiringSubscriptions,
  checkExpiredSubscriptions,
  checkPastDueSubscriptions
};