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
        listingLimit: plan.listingLimit,
        listingLimitDisplay: plan.listingLimitDisplay,
        features: plan.features,
        isPopular: plan.isPopular,
        badge: plan.badge
      }))
    });
  } catch (error) {
    console.error('Get plans error:', error);
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
    console.error('Get current subscription error:', error);
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
    console.log('\n🔍 CREATE STRIPE CHECKOUT SESSION');
    console.log('📝 Request body:', req.body);
    console.log('👤 Dealer ID:', req.dealerId);
    
    const { planSlug } = req.body;

    if (!planSlug) {
      console.log('❌ No plan slug provided');
      return res.status(400).json({
        success: false,
        message: 'Plan slug is required'
      });
    }

    console.log(`🔍 Looking for plan with slug: "${planSlug}"`);

    // Check if dealer already has active subscription
    const existingSubscription = await TradeSubscription.findActiveForDealer(req.dealerId);
    if (existingSubscription) {
      console.log('❌ Dealer already has active subscription');
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
      console.log('⚠️  Dealer has already used trial period');
    }

    // Get plan by slug
    const plan = await SubscriptionPlan.findOne({ slug: planSlug, isActive: true });
    console.log('📋 Plan lookup result:', plan ? `Found: ${plan.name}` : 'Not found');
    
    if (!plan) {
      console.log(`❌ Plan not found for slug: "${planSlug}"`);
      console.log('   Checking all plans in database...');
      const allPlans = await SubscriptionPlan.find({});
      console.log(`   Total plans in DB: ${allPlans.length}`);
      allPlans.forEach(p => {
        console.log(`   - ${p.name} (slug: "${p.slug}", active: ${p.isActive})`);
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

    console.log('✅ Plan found, creating Stripe checkout session...');

    // Check if we should use direct activation (development) or Stripe (production)
    // Set FORCE_STRIPE=true in .env to test Stripe in development
    const forceStripe = process.env.FORCE_STRIPE === 'true';
    const isDevelopment = (process.env.NODE_ENV === 'development' || !process.env.STRIPE_SECRET_KEY) && !forceStripe;

    if (isDevelopment) {
      // DEVELOPMENT: Create subscription directly without Stripe
      console.log('🔧 Development mode: Creating subscription directly (set FORCE_STRIPE=true to test Stripe)');
      
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
      console.log('✅ Subscription created:', subscription._id);

      // Update dealer
      dealer.currentSubscriptionId = subscription._id;
      dealer.status = 'active';
      dealer.hasActiveSubscription = true;
      await dealer.save();
      console.log('✅ Dealer updated');

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

    // PRODUCTION: Create Stripe checkout with trial price payment
    console.log('💳 Production mode: Creating checkout with trial pricing');
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Create or get Stripe customer
    let customerId = dealer.stripeCustomerId;
    
    if (!customerId || customerId.length < 15 || !customerId.startsWith('cus_')) {
      console.log('📝 Creating Stripe customer...');
      const customer = await stripe.customers.create({
        email: dealer.email,
        name: dealer.businessName,
        metadata: {
          dealerId: dealer._id.toString()
        }
      });
      customerId = customer.id;
      dealer.stripeCustomerId = customerId;
      await dealer.save();
      console.log('✅ Stripe customer created:', customerId);
    }

    // Determine which price to use
    const useTrialPrice = !hasUsedTrial && !!plan.trialPriceId;
    const priceId = useTrialPrice ? plan.trialPriceId : plan.stripePriceId;
    const priceAmount = useTrialPrice ? plan.trialPrice : plan.price;
    
    console.log(`💰 Using ${useTrialPrice ? 'TRIAL' : 'FULL'} price: £${(priceAmount / 100).toFixed(2)}`);
    console.log(`   Price ID: ${priceId}`);
    console.log(`   Has used trial: ${!!hasUsedTrial}`);
    console.log(`   Plan has trialPriceId: ${!!plan.trialPriceId}`);

    if (!priceId) {
      console.log('❌ No Stripe price ID found for plan');
      return res.status(500).json({
        success: false,
        message: 'Plan pricing not configured. Please contact support.'
      });
    }
    
    // If trial price is not configured, fall back to full price with subscription mode
    if (!hasUsedTrial && !plan.trialPriceId) {
      console.log('⚠️  Trial price not configured for this plan, using full subscription price');
    }

    // Create Stripe Checkout Session
    const sessionConfig = {
      mode: useTrialPrice ? 'payment' : 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/trade/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/trade/subscription?cancelled=true`,
      metadata: {
        dealerId: dealer._id.toString(),
        planId: plan._id.toString(),
        planSlug: plan.slug,
        isTrial: useTrialPrice.toString(),
        trialPrice: useTrialPrice ? priceAmount.toString() : '0',
        fullPrice: plan.price.toString()
      }
    };

    // For trial payment, we need to set up future subscription
    if (useTrialPrice) {
      sessionConfig.payment_intent_data = {
        metadata: {
          dealerId: dealer._id.toString(),
          planId: plan._id.toString(),
          setupFutureUsage: 'off_session' // Save payment method for future charges
        },
        setup_future_usage: 'off_session'
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Stripe checkout session created:', session.id);
    if (useTrialPrice) {
      console.log(`   Trial payment: £${(priceAmount / 100).toFixed(2)} for 30 days`);
      console.log(`   After trial: £${(plan.price / 100).toFixed(2)}/month automatically`);
    } else {
      console.log(`   Full subscription: £${(plan.price / 100).toFixed(2)}/month`);
    }

    // Return Stripe checkout URL
    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      message: 'Redirecting to Stripe checkout...',
      trial: {
        enabled: useTrialPrice,
        price: useTrialPrice ? priceAmount : 0,
        days: useTrialPrice ? 30 : 0
      }
    });
  } catch (error) {
    console.error('❌ Create checkout session error:', error);
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
    console.error('Create subscription error:', error);
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
    console.error('Cancel subscription error:', error);
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
    console.error('Reactivate subscription error:', error);
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
    console.log('\n🔍 VERIFY PAYMENT ENDPOINT CALLED');
    const { sessionId } = req.body;
    console.log('📝 Session ID:', sessionId);
    console.log('👤 Dealer ID from auth:', req.dealerId);

    if (!sessionId) {
      console.log('❌ No session ID provided');
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const TradeDealer = require('../models/TradeDealer');
    
    // Retrieve the checkout session
    console.log('🔄 Retrieving Stripe session...');
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('✅ Session retrieved:', session.id);
    console.log('   Mode:', session.mode);
    console.log('   Payment status:', session.payment_status);
    console.log('   Customer:', session.customer);

    if (!session) {
      console.log('❌ Session not found');
      return res.status(404).json({
        success: false,
        message: 'Checkout session not found'
      });
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      console.log('❌ Payment not completed. Status:', session.payment_status);
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
    
    console.log('📋 Metadata:', { planId, isTrial, trialPrice });

    // Verify dealer exists
    console.log('🔍 Looking up dealer:', dealerId);
    const dealer = await TradeDealer.findById(dealerId);
    if (!dealer) {
      console.log('❌ Dealer not found:', dealerId);
      return res.status(404).json({
        success: false,
        message: 'Dealer not found'
      });
    }
    console.log('✅ Dealer found:', dealer.businessName);

    // Verify plan exists
    console.log('🔍 Looking up plan:', planId);
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      console.log('❌ Plan not found:', planId);
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    console.log('✅ Plan found:', plan.name);

    // Check if this is a trial payment (mode='payment') or subscription
    if (session.mode === 'payment' && isTrial) {
      console.log('💳 Trial payment detected - creating trial subscription');
      
      // Get payment intent to retrieve payment method
      console.log('🔍 Retrieving payment intent...');
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      console.log('✅ Payment intent retrieved:', paymentIntent.id);
      console.log('   Payment method:', paymentIntent.payment_method);
      console.log('   Amount paid: £', (paymentIntent.amount / 100).toFixed(2));
      
      // Get customer ID from session (already created during checkout)
      const customerId = session.customer;
      console.log('✅ Using existing customer from checkout:', customerId);
      
      // Update dealer with customer ID if not already set
      if (!dealer.stripeCustomerId || dealer.stripeCustomerId !== customerId) {
        dealer.stripeCustomerId = customerId;
        await dealer.save();
        console.log('✅ Dealer updated with customer ID');
      }
      
      // Set payment method as default for future charges
      console.log('📝 Setting payment method as default...');
      try {
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentIntent.payment_method
          }
        });
        console.log('✅ Payment method set as default');
      } catch (err) {
        console.log('⚠️  Could not set default payment method:', err.message);
      }
      
      // Check if subscription already exists
      let subscription = await TradeSubscription.findOne({
        dealerId: dealer._id,
        planId: plan._id,
        status: { $in: ['active', 'trialing'] }
      }).populate('planId');

      if (!subscription) {
        // Create Stripe subscription that will start after 30 days
        console.log('📝 Creating Stripe subscription to start after trial...');
        
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
        
        console.log('✅ Stripe subscription created:', stripeSubscription.id);
        console.log(`   Status: ${stripeSubscription.status}`);
        console.log(`   Trial ends: ${new Date(stripeSubscription.trial_end * 1000).toISOString()}`);
        console.log(`   First charge: £${(plan.price / 100).toFixed(2)} on ${new Date(stripeSubscription.current_period_end * 1000).toLocaleDateString()}`);
        
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

        console.log('💾 Saving trial subscription to database...');
        try {
          await subscription.save();
          console.log('✅ Trial subscription saved:', subscription._id);
        } catch (saveError) {
          console.error('❌ Failed to save subscription:', saveError.message);
          throw saveError;
        }
        
        subscription = await subscription.populate('planId');

        // Update dealer
        console.log('📝 Updating dealer with subscription reference...');
        dealer.currentSubscriptionId = subscription._id;
        dealer.status = 'active';
        dealer.hasActiveSubscription = true;
        dealer.stripeCustomerId = customerId;
        
        try {
          await dealer.save();
          console.log('✅ Dealer updated with subscription:', dealer._id);
        } catch (dealerError) {
          console.error('❌ Failed to update dealer:', dealerError.message);
          throw dealerError;
        }

        console.log('📧 Trial subscription active:');
        console.log(`   - Paid: £${(trialPrice / 100).toFixed(2)} for 30 days`);
        console.log(`   - Trial ends: ${trialEnd.toLocaleDateString()}`);
        console.log(`   - After trial: £${(plan.price / 100).toFixed(2)}/month will be charged automatically`);
        console.log(`   - If payment fails: Subscription will be cancelled and email sent`);
      } else {
        console.log('ℹ️ Trial subscription already exists:', subscription._id);
      }

      console.log('✅ VERIFY TRIAL PAYMENT COMPLETE\n');

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
      console.log('⚠️  No subscription ID in session - this appears to be a one-time payment');
      console.log('   This should have been handled by trial payment logic above');
      
      return res.status(400).json({
        success: false,
        message: 'Invalid payment session - no subscription found',
        error: 'This payment session does not contain a subscription. Please contact support.'
      });
    }

    console.log('🔄 Retrieving Stripe subscription...');
    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
    console.log('✅ Stripe subscription retrieved:', stripeSubscription.id);
    console.log('   Status:', stripeSubscription.status);

    // Find or create the subscription in our database
    console.log('🔍 Checking for existing subscription:', stripeSubscription.id);
    let subscription = await TradeSubscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    }).populate('planId');

    if (!subscription) {
      // Create subscription immediately
      console.log('📝 Creating new subscription for dealer:', dealerId);
      
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

      console.log('💾 Saving subscription to database...');
      try {
        await subscription.save();
        console.log('✅ Subscription saved to database:', subscription._id);
      } catch (saveError) {
        console.error('❌ Failed to save subscription:', saveError.message);
        console.error('   Error code:', saveError.code);
        console.error('   Error details:', saveError);
        throw saveError;
      }
      
      subscription = await subscription.populate('planId');

      // Update dealer with subscription info
      console.log('📝 Updating dealer with subscription reference...');
      dealer.currentSubscriptionId = subscription._id;
      dealer.status = 'active';
      dealer.hasActiveSubscription = true;
      
      try {
        await dealer.save();
        console.log('✅ Dealer updated with subscription:', dealer._id);
      } catch (dealerError) {
        console.error('❌ Failed to update dealer:', dealerError.message);
        throw dealerError;
      }
    } else {
      console.log('ℹ️ Subscription already exists:', subscription._id);
    }

    console.log('✅ VERIFY PAYMENT COMPLETE\n');

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
    console.error('\n❌ VERIFY PAYMENT ERROR:', error.message);
    console.error('Stack:', error.stack);
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
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await stripeSubscriptionService.handleWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook'
    });
  }
};
