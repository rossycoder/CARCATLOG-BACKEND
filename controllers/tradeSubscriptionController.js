const SubscriptionPlan = require('../models/SubscriptionPlan');
const TradeSubscription = require('../models/TradeSubscription');
const stripeSubscriptionService = require('../services/stripeSubscriptionService');

/**
 * Get all subscription plans
 * GET /api/trade/subscriptions/plans
 */
exports.getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.getActivePlans();

    res.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan._id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price: plan.price,
        priceFormatted: plan.priceFormatted,
        trialPrice: plan.trialPrice,
        trialPriceFormatted: plan.trialPriceFormatted,
        listingLimit: plan.listingLimit,
        listingLimitDisplay: plan.listingLimitDisplay,
        features: plan.features,
        isPopular: plan.isPopular,
        badge: plan.badge
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans'
    });
  }
};

/**
 * Get current subscription
 * GET /api/trade/subscriptions/current
 */
exports.getCurrentSubscription = async (req, res) => {
  try {
    const subscription = await TradeSubscription.findActiveForDealer(req.dealerId);

    // Check if dealer has ever used trial (even if expired/failed)
    const hasUsedTrial = await TradeSubscription.findOne({
      dealerId: req.dealerId,
      $or: [
        { isTrialing: true },
        { trialEnd: { $exists: true, $ne: null } }
      ]
    });

    if (!subscription) {
      return res.json({
        success: true,
        subscription: null,
        hasUsedTrial: !!hasUsedTrial,
        message: 'No active subscription'
      });
    }

    res.json({
      success: true,
      subscription: {
        id: subscription._id,
        plan: subscription.planId,
        status: subscription.status,
        listingsUsed: subscription.listingsUsed,
        listingsLimit: subscription.listingsLimit,
        listingsAvailable: subscription.listingsAvailable,
        usagePercentage: subscription.usagePercentage,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysRemaining: subscription.daysRemaining,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        isTrialing: subscription.isTrialing,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        trialDaysLeft: subscription.trialDaysLeft,
        hasUsedTrial: !!hasUsedTrial
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription'
    });
  }
};

/**
 * Create Stripe Checkout Session for Subscription
 * POST /api/trade/subscriptions/create-checkout-session
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    
    const { planSlug } = req.body;

    if (!planSlug) {
      return res.status(400).json({
        success: false,
        message: 'Plan slug is required'
      });
    }


    // Check if dealer already has active subscription
    const existingSubscription = await TradeSubscription.findActiveForDealer(req.dealerId);
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Check if dealer has used trial before
    const hasUsedTrial = await TradeSubscription.findOne({
      dealerId: req.dealerId,
      $or: [
        { isTrialing: true },
        { trialEnd: { $exists: true } }
      ]
    });

    if (hasUsedTrial) {
    }

    // Get plan by slug
    const plan = await SubscriptionPlan.findOne({ slug: planSlug, isActive: true });
    
    if (!plan) {
      const allPlans = await SubscriptionPlan.find({});
      allPlans.forEach(p => {
      });
      
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Get dealer
    const TradeDealer = require('../models/TradeDealer');
    const dealer = await TradeDealer.findById(req.dealerId);
    
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer not found'
      });
    }


    // Check if we should use direct activation (development) or Stripe (production)
    // Set FORCE_STRIPE=true in .env to test Stripe in development
    const forceStripe = process.env.FORCE_STRIPE === 'true';
    const isDevelopment = (process.env.NODE_ENV === 'development' || !process.env.STRIPE_SECRET_KEY) && !forceStripe;

    if (isDevelopment) {
      // DEVELOPMENT: Create subscription directly without Stripe
      
      const subscription = new TradeSubscription({
        dealerId: dealer._id,
        planId: plan._id,
        stripeSubscriptionId: `manual_sub_${Date.now()}`,
        stripeCustomerId: `manual_cus_${Date.now()}`,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        listingsLimit: plan.listingLimit,
        listingsUsed: 0
      });

      await subscription.save();

      // Update dealer
      dealer.currentSubscriptionId = subscription._id;
      dealer.status = 'active';
      dealer.hasActiveSubscription = true;
      await dealer.save();

      // Return success with subscription details
      return res.json({
        success: true,
        message: 'Subscription activated successfully!',
        subscription: {
          id: subscription._id,
          plan: {
            id: plan._id,
            name: plan.name,
            slug: plan.slug,
            price: plan.price,
            listingsLimit: plan.listingLimit
          },
          status: subscription.status,
          listingsUsed: subscription.listingsUsed,
          listingsLimit: subscription.listingsLimit,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      });
    }

    // PRODUCTION: Create Stripe checkout session
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Create or get Stripe customer
    let customerId = dealer.stripeCustomerId;
    if (!customerId || customerId.length < 15 || !customerId.startsWith('cus_')) {
      const customer = await stripe.customers.create({
        email: dealer.email,
        name: dealer.businessName,
        metadata: { dealerId: dealer._id.toString() }
      });
      customerId = customer.id;
      dealer.stripeCustomerId = customerId;
      await dealer.save();
    }

    const priceId = plan.stripePriceId;
    if (!priceId) {
      return res.status(500).json({
        success: false,
        message: 'Plan pricing not configured. Please contact support.'
      });
    }

    // Trial fees in pence (GBP) — one-off fee charged today for new users (ex-VAT, Stripe adds VAT)
    const TRIAL_FEES = {
      bronze: 6000,   // £60.00 + VAT
      silver: 10500,  // £105.00 + VAT
      gold:   15000,  // £150.00 + VAT
    };

    // Monthly prices in pence (GBP) — for description display in checkout only
    const MONTHLY_PRICES = {
      bronze: 120000,  // £1,200/month + VAT
      silver: 180000,  // £1,800/month + VAT
      gold:   240000,  // £2,400/month + VAT
    };

    const isNewUser = !hasUsedTrial;
    const trialFeeAmount = TRIAL_FEES[plan.slug];

    let sessionConfig;

    if (isNewUser && trialFeeAmount) {
      // NEW USER: mode=payment — only show the trial fee today, no subscription confusion.
      // After payment, verifyPayment creates the Stripe subscription with trial_end=30 days.
      sessionConfig = {
        mode: 'payment',
        customer: customerId,
        customer_update: { address: 'auto' },
        payment_method_types: ['card'],
        automatic_tax: { enabled: true },
        payment_intent_data: {
          setup_future_usage: 'off_session', // save card for future subscription charges
          metadata: {
            dealerId: dealer._id.toString(),
            planId: plan._id.toString(),
            planSlug: plan.slug,
            isTrial: 'true',
            trialPrice: trialFeeAmount.toString()
          }
        },
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: `${plan.name} — 30-Day Trial`,
                description: `Unlock your 30-day trial. After 30 days, £${(MONTHLY_PRICES[plan.slug] / 100).toLocaleString('en-GB')}/month applies automatically.`
              },
              unit_amount: trialFeeAmount,
            },
            quantity: 1,
          }
        ],
        success_url: `${baseUrl}/trade/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/trade/subscription?cancelled=true`,
        metadata: {
          dealerId: dealer._id.toString(),
          planId: plan._id.toString(),
          planSlug: plan.slug,
          isTrial: 'true',
          trialPrice: trialFeeAmount.toString()
        }
      };
    } else {
      // RETURNING USER: mode=subscription — no trial, charged full price immediately
      sessionConfig = {
        mode: 'subscription',
        customer: customerId,
        customer_update: { address: 'auto' },
        payment_method_types: ['card'],
        automatic_tax: { enabled: true },
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          metadata: {
            dealerId: dealer._id.toString(),
            planId: plan._id.toString(),
            planSlug: plan.slug,
            isTrial: 'false'
          }
        },
        success_url: `${baseUrl}/trade/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/trade/subscription?cancelled=true`,
        metadata: {
          dealerId: dealer._id.toString(),
          planId: plan._id.toString(),
          planSlug: plan.slug,
          isTrial: 'false'
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      message: 'Redirecting to Stripe checkout...',
      trial: {
        enabled: isNewUser,
        days: isNewUser ? 30 : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating checkout session',
      error: error.message
    });
  }
};

/**
 * Create subscription
 * POST /api/trade/subscriptions/create
 */
exports.createSubscription = async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;

    if (!planId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID and payment method are required'
      });
    }

    // Check if dealer already has active subscription
    const existingSubscription = await TradeSubscription.findActiveForDealer(req.dealerId);
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    const subscription = await stripeSubscriptionService.createSubscription(
      req.dealerId,
      planId,
      paymentMethodId
    );

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription: {
        id: subscription._id,
        plan: subscription.planId,
        status: subscription.status,
        listingsLimit: subscription.listingsLimit,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error: error.message
    });
  }
};

/**
 * Cancel subscription
 * POST /api/trade/subscriptions/cancel
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const { cancelAtPeriodEnd = true } = req.body;

    const subscription = await TradeSubscription.findActiveForDealer(req.dealerId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    await stripeSubscriptionService.cancelSubscription(
      subscription._id,
      cancelAtPeriodEnd
    );

    res.json({
      success: true,
      message: cancelAtPeriodEnd
        ? 'Subscription will be cancelled at the end of the billing period'
        : 'Subscription cancelled immediately'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription'
    });
  }
};

/**
 * Reactivate subscription
 * POST /api/trade/subscriptions/reactivate
 */
exports.reactivateSubscription = async (req, res) => {
  try {
    const subscription = await TradeSubscription.findOne({
      dealerId: req.dealerId,
      cancelAtPeriodEnd: true
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription scheduled for cancellation'
      });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    subscription.cancelAtPeriodEnd = false;
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription reactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reactivating subscription'
    });
  }
};

/**
 * Verify payment after Stripe checkout
 * POST /api/trade/subscriptions/verify-payment
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const TradeDealer = require('../models/TradeDealer');
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Checkout session not found'
      });
    }

    // Check if payment was successful
    // For subscriptions with trial, payment_status can be 'no_payment_required'
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Use authenticated dealer ID from middleware, not session metadata
    const dealerId = req.dealerId;
    const planId = session.metadata.planId;
    const isTrial = session.metadata.isTrial === 'true';
    const trialPrice = parseInt(session.metadata.trialPrice || '0');
    

    // Verify dealer exists
    const dealer = await TradeDealer.findById(dealerId);
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer not found'
      });
    }

    // Verify plan exists
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if this is a trial payment (mode='payment') or subscription
    if (session.mode === 'payment' && isTrial) {
      
      // Get payment intent to retrieve payment method
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      
      // Get customer ID from session (already created during checkout)
      const customerId = session.customer;
      
      // Update dealer with customer ID if not already set
      if (!dealer.stripeCustomerId || dealer.stripeCustomerId !== customerId) {
        dealer.stripeCustomerId = customerId;
        await dealer.save();
      }
      
      // Set payment method as default for future charges
      try {
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentIntent.payment_method
          }
        });
      } catch (err) {
      }
      
      // Check if subscription already exists
      let subscription = await TradeSubscription.findOne({
        dealerId: dealer._id,
        planId: plan._id,
        status: { $in: ['active', 'trialing'] }
      }).populate('planId');

      if (!subscription) {
        // Create Stripe subscription that will start after 30 days
        
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        
        // Create the Stripe subscription with trial end date
        const stripeSubscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: plan.stripePriceId }], // Use full price ID
          trial_end: Math.floor(trialEnd.getTime() / 1000), // Unix timestamp
          default_payment_method: paymentIntent.payment_method,
          metadata: {
            dealerId: dealer._id.toString(),
            planId: plan._id.toString(),
            trialPaymentIntent: paymentIntent.id,
            trialAmountPaid: trialPrice.toString()
          }
        });
        
        
        // Create subscription in our database
        subscription = new TradeSubscription({
          dealerId: dealer._id,
          planId: plan._id,
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId: customerId,
          status: 'trialing',
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          listingsLimit: plan.listingLimit,
          listingsUsed: 0,
          isTrialing: true,
          trialStart: now,
          trialEnd: trialEnd
        });

        try {
          await subscription.save();
        } catch (saveError) {
          throw saveError;
        }
        
        subscription = await subscription.populate('planId');

        // Update dealer
        dealer.currentSubscriptionId = subscription._id;
        dealer.status = 'active';
        dealer.hasActiveSubscription = true;
        dealer.stripeCustomerId = customerId;
        
        try {
          await dealer.save();
        } catch (dealerError) {
          throw dealerError;
        }

      } else {
      }


      return res.json({
        success: true,
        message: 'Trial payment verified successfully',
        subscription: {
          id: subscription._id,
          plan: subscription.planId ? {
            id: subscription.planId._id,
            name: subscription.planId.name,
            slug: subscription.planId.slug,
            price: subscription.planId.price,
            listingsLimit: subscription.planId.listingLimit
          } : null,
          status: subscription.status,
          listingsUsed: subscription.listingsUsed,
          listingsLimit: subscription.listingsLimit,
          listingsAvailable: subscription.listingsAvailable,
          usagePercentage: subscription.usagePercentage,
          currentPeriodEnd: subscription.currentPeriodEnd,
          daysRemaining: subscription.daysRemaining,
          isTrialing: subscription.isTrialing,
          trialEnd: subscription.trialEnd
        }
      });
    }

    // Original subscription mode handling (kept for backward compatibility)
    // Check if session has subscription ID
    if (!session.subscription) {
      
      return res.status(400).json({
        success: false,
        message: 'Invalid payment session - no subscription found',
        error: 'This payment session does not contain a subscription. Please contact support.'
      });
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);

    // Find or create the subscription in our database
    let subscription = await TradeSubscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    }).populate('planId');

    if (!subscription) {
      // Create subscription immediately
      
      const startTime = stripeSubscription.current_period_start;
      const endTime = stripeSubscription.current_period_end;
      
      const currentPeriodStart = startTime && !isNaN(startTime) 
        ? new Date(startTime * 1000)
        : new Date();
      const currentPeriodEnd = endTime && !isNaN(endTime)
        ? new Date(endTime * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      subscription = new TradeSubscription({
        dealerId: dealer._id,
        planId: plan._id,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: session.customer,
        status: stripeSubscription.status,
        currentPeriodStart: currentPeriodStart,
        currentPeriodEnd: currentPeriodEnd,
        listingsLimit: plan.listingLimit,
        listingsUsed: 0,
        isTrialing: stripeSubscription.status === 'trialing',
        trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null
      });

      try {
        await subscription.save();
      } catch (saveError) {
        throw saveError;
      }
      
      subscription = await subscription.populate('planId');

      // Update dealer with subscription info
      dealer.currentSubscriptionId = subscription._id;
      dealer.status = 'active';
      dealer.hasActiveSubscription = true;
      
      try {
        await dealer.save();
      } catch (dealerError) {
        throw dealerError;
      }
    } else {
    }


    res.json({
      success: true,
      message: 'Payment verified successfully',
      subscription: {
        id: subscription._id,
        plan: subscription.planId ? {
          id: subscription.planId._id,
          name: subscription.planId.name,
          slug: subscription.planId.slug,
          price: subscription.planId.price,
          listingsLimit: subscription.planId.listingsLimit
        } : null,
        status: subscription.status,
        listingsUsed: subscription.listingsUsed,
        listingsLimit: subscription.listingsLimit,
        listingsAvailable: subscription.listingsAvailable,
        usagePercentage: subscription.usagePercentage,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysRemaining: subscription.daysRemaining
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

/**
 * Handle Stripe webhook
 * POST /api/trade/webhooks/stripe
 */
exports.handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await stripeSubscriptionService.handleWebhook(event);

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing webhook'
    });
  }
};
