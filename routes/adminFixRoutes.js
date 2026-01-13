const express = require('express');
const router = express.Router();
const TradeDealer = require('../models/TradeDealer');
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

/**
 * TEMPORARY ADMIN ROUTE - Remove after fixing subscription
 * POST /api/admin/fix-subscription
 * Body: { email: "dealer@email.com", adminSecret: "your-secret" }
 */
router.post('/fix-subscription', async (req, res) => {
  try {
    const { email, adminSecret } = req.body;

    // Simple security check - use a secret from env
    const ADMIN_SECRET = process.env.ADMIN_FIX_SECRET || 'temp-fix-secret-123';
    
    if (adminSecret !== ADMIN_SECRET) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log('🔧 Fixing subscription for:', email);

    // Find dealer
    const dealer = await TradeDealer.findOne({ email: email.toLowerCase() });

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer not found'
      });
    }

    // Check for existing subscription
    let subscription = await TradeSubscription.findOne({ 
      dealerId: dealer._id 
    }).populate('planId');

    if (subscription) {
      // Subscription exists, check if active
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        return res.json({
          success: true,
          message: 'Subscription already active',
          subscription: {
            id: subscription._id,
            status: subscription.status,
            plan: subscription.planId?.name
          }
        });
      }

      // Activate existing subscription
      subscription.status = 'active';
      
      // Ensure dates are valid
      if (!subscription.currentPeriodStart || isNaN(subscription.currentPeriodStart.getTime())) {
        subscription.currentPeriodStart = new Date();
      }
      if (!subscription.currentPeriodEnd || isNaN(subscription.currentPeriodEnd.getTime())) {
        subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      
      await subscription.save();

      return res.json({
        success: true,
        message: 'Subscription activated',
        subscription: {
          id: subscription._id,
          status: subscription.status,
          plan: subscription.planId?.name
        }
      });
    }

    // No subscription exists, create one
    console.log('Creating new subscription...');

    // Get a plan
    let plan = await SubscriptionPlan.findOne({ slug: 'starter' });
    
    if (!plan) {
      plan = await SubscriptionPlan.findOne();
    }

    if (!plan) {
      return res.status(500).json({
        success: false,
        message: 'No subscription plans found. Please seed plans first.'
      });
    }

    // Create subscription
    subscription = new TradeSubscription({
      dealerId: dealer._id,
      planId: plan._id,
      stripeSubscriptionId: dealer.stripeCustomerId || `manual_${Date.now()}`,
      stripeCustomerId: dealer.stripeCustomerId || `cus_${Date.now()}`,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      listingsLimit: plan.listingLimit,
      listingsUsed: 0
    });

    await subscription.save();

    // Update dealer
    dealer.currentSubscriptionId = subscription._id;
    dealer.hasActiveSubscription = true;
    dealer.status = 'active';
    await dealer.save();

    // Verify
    const finalCheck = await TradeSubscription.findActiveForDealer(dealer._id);

    res.json({
      success: true,
      message: 'Subscription created and activated',
      subscription: {
        id: subscription._id,
        status: subscription.status,
        plan: plan.name,
        listingsLimit: subscription.listingsLimit,
        verified: !!finalCheck
      }
    });

  } catch (error) {
    console.error('Fix subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing subscription',
      error: error.message
    });
  }
});

/**
 * Check subscription status
 * GET /api/admin/check-subscription/:email
 */
router.get('/check-subscription/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { adminSecret } = req.query;

    const ADMIN_SECRET = process.env.ADMIN_FIX_SECRET || 'temp-fix-secret-123';
    
    if (adminSecret !== ADMIN_SECRET) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const dealer = await TradeDealer.findOne({ email: email.toLowerCase() });

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer not found'
      });
    }

    const subscription = await TradeSubscription.findOne({ 
      dealerId: dealer._id 
    }).populate('planId');

    const activeSubscription = await TradeSubscription.findActiveForDealer(dealer._id);

    res.json({
      success: true,
      dealer: {
        id: dealer._id,
        businessName: dealer.businessName,
        email: dealer.email,
        status: dealer.status,
        emailVerified: dealer.emailVerified
      },
      subscription: subscription ? {
        id: subscription._id,
        status: subscription.status,
        plan: subscription.planId?.name,
        listingsUsed: subscription.listingsUsed,
        listingsLimit: subscription.listingsLimit
      } : null,
      hasActiveSubscription: !!activeSubscription
    });

  } catch (error) {
    console.error('Check subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription',
      error: error.message
    });
  }
});

module.exports = router;
