/**
 * Stripe Service
 * Handles Stripe payment processing for vehicle history reports
 */

const Stripe = require('stripe');
const { v4: uuidv4 } = require('uuid');

class StripeService {
  constructor() {
    // Initialize Stripe with live keys
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    this.isDemoMode = false; // Using live Stripe integration
  }

  /**
   * Create a checkout session for advertising package
   * @param {string} packageId - Package ID (bronze, silver, gold)
   * @param {string} packageName - Package name
   * @param {number} price - Price in pence
   * @param {string} duration - Package duration
   * @param {string} sellerType - Seller type (private/trade)
   * @param {string} vehicleValue - Vehicle value range
   * @param {string} registration - Vehicle registration (optional)
   * @param {string} mileage - Vehicle mileage (optional)
   * @param {string} advertId - Advert ID (optional)
   * @param {Object} advertData - Advert data (optional)
   * @param {Object} vehicleData - Vehicle data (optional)
   * @param {Object} contactDetails - Contact details (optional)
   * @param {string} successUrl - Success redirect URL
   * @param {string} cancelUrl - Cancel redirect URL
   * @returns {Promise<Object>} Stripe checkout session
   */
  async createAdvertCheckoutSession(packageId, packageName, price, duration, sellerType, vehicleValue, registration, mileage, advertId, advertData, vehicleData, contactDetails, successUrl, cancelUrl) {
    try {
      const sessionId = uuidv4();
      
      console.log(`Creating Stripe checkout session for advertising package: ${packageName}`);
      console.log(`⚠️  PAYMENT - Price: £${(price / 100).toFixed(2)}`);
      if (advertId) {
        console.log(`📝 Advert ID: ${advertId}`);
      }
      
      const sessionParams = {
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          sessionId: sessionId,
          type: 'advertising_package',
          packageId: packageId,
          packageName: packageName,
          duration: duration,
          sellerType: sellerType,
          vehicleValue: vehicleValue,
          registration: registration || '',
          mileage: mileage || '',
          advertId: advertId || ''
        },
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: `${packageName} - Car Advertising`,
                description: `${duration} listing for ${sellerType} seller (${vehicleValue})`,
              },
              unit_amount: price,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          metadata: {
            sessionId: sessionId,
            type: 'advertising_package',
            packageId: packageId,
            packageName: packageName,
            sellerType: sellerType,
            advertId: advertId || ''
          }
        }
      };

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      return {
        sessionId: session.id,
        url: session.url,
        customSessionId: sessionId,
        packageName: packageName,
        amount: price,
        currency: 'gbp'
      };
    } catch (error) {
      console.error('❌ Error creating advertising checkout session:', error);
      console.error('   Error type:', error.type);
      console.error('   Error code:', error.code);
      console.error('   Package details:', { packageId, packageName, price });
      
      if (error.type === 'StripeCardError') {
        throw new Error('Payment method declined. Please try a different card.');
      } else if (error.type === 'StripeRateLimitError') {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (error.type === 'StripeInvalidRequestError') {
        throw new Error('Invalid payment request. Please refresh and try again.');
      } else if (error.type === 'StripeAPIError') {
        throw new Error('Payment service temporarily unavailable. Please try again.');
      } else if (error.type === 'StripeConnectionError') {
        throw new Error('Network connection error. Please check your internet and try again.');
      } else if (error.type === 'StripeAuthenticationError') {
        throw new Error('Payment configuration error. Please contact support.');
      } else {
        throw new Error(`Failed to create payment session: ${error.message}`);
      }
    }
  }

  /**
   * Create a checkout session for vehicle history report
   * @param {string} vrm - Vehicle Registration Mark
   * @param {string} customerEmail - Customer email (optional)
   * @param {string} successUrl - Success redirect URL
   * @param {string} cancelUrl - Cancel redirect URL
   * @returns {Promise<Object>} Stripe checkout session
   */
  async createCheckoutSession(vrm, customerEmail = null, successUrl, cancelUrl) {
    try {
      const sessionId = uuidv4();
      
      // Using live Stripe integration
      console.log(`Creating live Stripe checkout session for VRM: ${vrm.toUpperCase()}`);
      console.log('⚠️  LIVE PAYMENT - This will charge real money!');
      
      const sessionParams = {
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          vrm: vrm.toUpperCase(),
          sessionId: sessionId,
          type: 'vehicle_history_report'
        },
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: 'Vehicle History Report',
                description: `Comprehensive vehicle history check for ${vrm.toUpperCase()}`,
                images: [], // Add your product image URLs here
              },
              unit_amount: 495, // £4.95 in pence
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          metadata: {
            vrm: vrm.toUpperCase(),
            sessionId: sessionId,
            type: 'vehicle_history_report'
          }
        }
      };

      // Add customer email if provided
      if (customerEmail) {
        sessionParams.customer_email = customerEmail;
      }

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      return {
        sessionId: session.id,
        url: session.url,
        customSessionId: sessionId,
        vrm: vrm.toUpperCase(),
        amount: 495,
        currency: 'gbp'
      };
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      throw new Error(`Failed to create payment session: ${error.message}`);
    }
  }

  /**
   * Create checkout session for credit packages
   * @param {number} creditAmount - Number of credits to purchase
   * @param {string} customerEmail - Customer email (optional)
   * @param {string} successUrl - Success redirect URL
   * @param {string} cancelUrl - Cancel redirect URL
   * @returns {Promise<Object>} Stripe checkout session
   */
  async createCreditCheckoutSession(creditAmount, customerEmail = null, successUrl, cancelUrl) {
    try {
      const sessionId = uuidv4();
      
      // Credit package pricing
      const creditPackages = {
        5: { price: 2200, savings: 275 },   // £22.00 (save £2.75)
        10: { price: 4200, savings: 750 },  // £42.00 (save £7.50)
        25: { price: 9900, savings: 2375 }  // £99.00 (save £23.75)
      };

      const packageInfo = creditPackages[creditAmount];
      if (!packageInfo) {
        throw new Error('Invalid credit package amount');
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          sessionId: sessionId,
          type: 'credit_package',
          creditAmount: creditAmount.toString()
        },
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: `${creditAmount} Vehicle Check Credits`,
                description: `Package of ${creditAmount} vehicle history check credits (Save £${(packageInfo.savings / 100).toFixed(2)})`,
              },
              unit_amount: packageInfo.price,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          metadata: {
            sessionId: sessionId,
            type: 'credit_package',
            creditAmount: creditAmount.toString()
          }
        }
      });

      return {
        sessionId: session.id,
        url: session.url,
        customSessionId: sessionId,
        creditAmount: creditAmount,
        amount: packageInfo.price,
        savings: packageInfo.savings,
        currency: 'gbp'
      };
    } catch (error) {
      console.error('Error creating credit checkout session:', error);
      throw new Error(`Failed to create credit payment session: ${error.message}`);
    }
  }

  /**
   * Retrieve a checkout session
   * @param {string} sessionId - Stripe session ID
   * @returns {Promise<Object>} Stripe session object
   */
  async getCheckoutSession(sessionId) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      console.error('Error retrieving checkout session:', error);
      throw new Error(`Failed to retrieve payment session: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature and parse event
   * @param {string} payload - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Stripe event object
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  /**
   * Process successful payment
   * @param {Object} paymentIntent - Stripe payment intent object
   * @returns {Object} Processed payment data
   */
  async processSuccessfulPayment(paymentIntent) {
    try {
      const metadata = paymentIntent.metadata;
      
      return {
        paymentIntentId: paymentIntent.id,
        sessionId: metadata.sessionId,
        type: metadata.type,
        vrm: metadata.vrm,
        creditAmount: metadata.creditAmount ? parseInt(metadata.creditAmount) : null,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        customerEmail: paymentIntent.receipt_email,
        status: paymentIntent.status,
        created: new Date(paymentIntent.created * 1000)
      };
    } catch (error) {
      console.error('Error processing successful payment:', error);
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }

  /**
   * Create a refund
   * @param {string} paymentIntentId - Payment intent ID to refund
   * @param {number} amount - Amount to refund in pence (optional, full refund if not specified)
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Refund object
   */
  async createRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      const refundParams = {
        payment_intent: paymentIntentId,
        reason: reason
      };

      if (amount) {
        refundParams.amount = amount;
      }

      const refund = await this.stripe.refunds.create(refundParams);
      
      return {
        refundId: refund.id,
        paymentIntentId: paymentIntentId,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        created: new Date(refund.created * 1000)
      };
    } catch (error) {
      console.error('Error creating refund:', error);
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Get payment intent details
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment intent object
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw new Error(`Failed to retrieve payment details: ${error.message}`);
    }
  }
}

module.exports = StripeService;