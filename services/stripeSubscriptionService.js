const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TradeSubscription = require('../models/TradeSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const TradeDealer = require('../models/TradeDealer');

class StripeSubscriptionService {
  /**
   * Create Stripe customer for dealer
   */
  async createCustomer(dealer) {
    try {
      const customer = await stripe.customers.create({
        email: dealer.email,
        name: dealer.businessName,
        metadata: {
          dealerId: dealer._id.toString(),
          businessName: dealer.businessName
        }
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Create Stripe Checkout Session
   */
  async createCheckoutSession(dealerId, planId) {
    try {
      const dealer = await TradeDealer.findById(dealerId);
      const plan = await SubscriptionPlan.findById(planId);

      if (!dealer || !plan) {
        throw new Error('Dealer or plan not found');
      }

      // Create customer if doesn't exist
      let customerId = dealer.stripeCustomerId;
      if (!customerId) {
        const customer = await this.createCustomer(dealer);
        customerId = customer.id;
        dealer.stripeCustomerId = customerId;
        await dealer.save();
      }

      // Create checkout session
      // Force localhost:3000 for development
      const frontendUrl = 'http://localhost:3000';
      console.log('Creating checkout session with frontend URL:', frontendUrl);
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${frontendUrl}/trade/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/trade/subscription`,
        metadata: {
          dealerId: dealer._id.toString(),
          planId: plan._id.toString(),
        },
      });

      return session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(dealerId, planId, paymentMethodId) {
    try {
      const dealer = await TradeDealer.findById(dealerId);
      const plan = await SubscriptionPlan.findById(planId);

      if (!dealer || !plan) {
        throw new Error('Dealer or plan not found');
      }

      // Create customer if doesn't exist
      let customerId = dealer.stripeCustomerId;
      if (!customerId) {
        const customer = await this.createCustomer(dealer);
        customerId = customer.id;
        dealer.stripeCustomerId = customerId;
        await dealer.save();
      }

      // Attach payment method
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan.stripePriceId }],
        metadata: {
          dealerId: dealer._id.toString(),
          planId: plan._id.toString()
        }
      });

      // Create local subscription record
      const tradeSubscription = new TradeSubscription({
        dealerId: dealer._id,
        planId: plan._id,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        listingsLimit: plan.listingLimit
      });

      await tradeSubscription.save();

      // Update dealer
      dealer.currentSubscriptionId = tradeSubscription._id;
      dealer.status = 'active';
      await dealer.save();

      return tradeSubscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const tradeSubscription = await TradeSubscription.findById(subscriptionId);

      if (!tradeSubscription) {
        throw new Error('Subscription not found');
      }

      if (cancelAtPeriodEnd) {
        // Cancel at period end
        await stripe.subscriptions.update(tradeSubscription.stripeSubscriptionId, {
          cancel_at_period_end: true
        });

        tradeSubscription.cancelAtPeriodEnd = true;
      } else {
        // Cancel immediately
        await stripe.subscriptions.cancel(tradeSubscription.stripeSubscriptionId);
        tradeSubscription.status = 'cancelled';
        tradeSubscription.cancelledAt = new Date();
      }

      await tradeSubscription.save();

      return tradeSubscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  async handleCheckoutCompleted(session) {
    try {
      const dealerId = session.metadata.dealerId;
      const planId = session.metadata.planId;

      console.log('Processing checkout completed for dealer:', dealerId);

      // Get the subscription from Stripe
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      // Create local subscription record
      const plan = await SubscriptionPlan.findById(planId);
      const dealer = await TradeDealer.findById(dealerId);

      if (!plan || !dealer) {
        console.error('Plan or dealer not found for checkout session:', { dealerId, planId });
        return;
      }

      // Check if subscription already exists (prevent duplicates)
      let tradeSubscription = await TradeSubscription.findOne({
        stripeSubscriptionId: subscription.id
      });

      if (!tradeSubscription) {
        console.log('Creating new subscription record...');
        
        // Ensure timestamps are valid numbers before converting
        const startTime = subscription.current_period_start;
        const endTime = subscription.current_period_end;
        
        const currentPeriodStart = startTime && !isNaN(startTime) 
          ? new Date(startTime * 1000)
          : new Date();
        const currentPeriodEnd = endTime && !isNaN(endTime)
          ? new Date(endTime * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        tradeSubscription = new TradeSubscription({
          dealerId: dealer._id,
          planId: plan._id,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: session.customer,
          status: subscription.status,
          currentPeriodStart: currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd,
          listingsLimit: plan.listingLimit,
          listingsUsed: 0
        });

        await tradeSubscription.save();
        console.log('✅ Subscription created and stored in database:', tradeSubscription._id);
      } else {
        console.log('Subscription already exists:', tradeSubscription._id);
      }

      // Update dealer
      dealer.currentSubscriptionId = tradeSubscription._id;
      dealer.status = 'active';
      dealer.hasActiveSubscription = true;
      await dealer.save();
      console.log('✅ Dealer updated with subscription:', dealer._id);

      console.log('✅ Subscription payment processed and stored:', tradeSubscription._id);
    } catch (error) {
      console.error('Error handling checkout completed:', error);
      throw error;
    }
  }

  async handleSubscriptionCreated(subscription) {
    console.log('Subscription created:', subscription.id);
  }

  async handleSubscriptionUpdated(subscription) {
    const tradeSubscription = await TradeSubscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (tradeSubscription) {
      tradeSubscription.status = subscription.status;
      tradeSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      tradeSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      tradeSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
      await tradeSubscription.save();
    }
  }

  async handleSubscriptionDeleted(subscription) {
    const tradeSubscription = await TradeSubscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (tradeSubscription) {
      tradeSubscription.status = 'cancelled';
      tradeSubscription.cancelledAt = new Date();
      await tradeSubscription.save();
    }
  }

  async handlePaymentSucceeded(invoice) {
    // Payment successful - subscription is active
    console.log('Payment succeeded for invoice:', invoice.id);
  }

  async handlePaymentFailed(invoice) {
    const subscription = await TradeSubscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });

    if (subscription) {
      subscription.status = 'past_due';
      await subscription.save();
    }
  }
}

module.exports = new StripeSubscriptionService();
