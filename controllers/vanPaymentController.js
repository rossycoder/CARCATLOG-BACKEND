/**
 * Van Payment Controller
 * Handles payment processing specifically for van advertisements
 * Extracted from paymentController.js for better code organization
 */

const StripeService = require('../services/stripeService');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');

/**
 * Create Stripe checkout session for van advertising package
 * POST /api/payments/van/create-checkout-session
 * Body: { packageId, packageName, price, duration, advertId, advertData, vehicleData, contactDetails }
 */
async function createVanCheckoutSession(req, res) {
  try {
    const { 
      packageId, packageName, price, duration, 
      advertId, advertData, vehicleData, contactDetails 
    } = req.body;
    
    console.log('🚐 [Van Payment] Creating checkout session:', {
      packageId, packageName, price, duration, advertId
    });
    
    if (!packageId || !packageName || !price) {
      return res.status(400).json({
        success: false,
        error: 'Package details are required',
      });
    }

    // Create purchase record
    const purchase = new AdvertisingPackagePurchase({
      packageId,
      packageName,
      price,
      duration,
      vehicleType: 'van',
      paymentStatus: 'pending',
      packageStatus: 'pending',
      metadata: new Map([
        ['advertId', advertId],
        ['vehicleType', 'van'],
        ['advertData', JSON.stringify(advertData)],
        ['vehicleData', JSON.stringify(vehicleData)],
        ['contactDetails', JSON.stringify(contactDetails)]
      ])
    });

    await purchase.save();
    console.log('✅ [Van Payment] Purchase record created:', purchase._id);

    // Create Stripe checkout session
    const session = await StripeService.createCheckoutSession({
      priceInPence: Math.round(price * 100),
      successUrl: `${process.env.FRONTEND_URL}/vans/advert-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.FRONTEND_URL}/vans/advertising-prices`,
      metadata: {
        type: 'van_advertising_package',
        purchaseId: purchase._id.toString(),
        packageId,
        packageName,
        duration: duration.toString(),
        advertId,
        vehicleType: 'van'
      },
      customerEmail: contactDetails?.email
    });

    // Update purchase with Stripe session ID
    purchase.stripeSessionId = session.id;
    await purchase.save();

    console.log('✅ [Van Payment] Stripe session created:', session.id);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
        purchaseId: purchase._id
      }
    });

  } catch (error) {
    console.error('❌ [Van Payment] Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
}

module.exports = {
  createVanCheckoutSession
};
