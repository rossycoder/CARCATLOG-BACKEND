/**
 * Payment Controller
 * Handles HTTP requests for payment processing
 */

const mongoose = require('mongoose');
const StripeService = require('../services/stripeService');
const HistoryService = require('../services/historyService');
const EmailService = require('../services/emailService');
const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const { formatErrorResponse } = require('../utils/errorHandlers');
const vehicleFormatter = require('../utils/vehicleFormatter');
const safeAPI = require('../services/safeAPIService');

// Initialize services
const universalService = new UniversalAutoCompleteService();

/**
 * Calculate the appropriate price range based on vehicle valuation
 * Used for server-side validation
 */
function calculatePriceRangeForValidation(valuation, isTradeType) {
  if (!valuation || isNaN(valuation)) return null;
  
  const value = parseFloat(valuation);
  
  if (isTradeType) {
    // Trade pricing tiers
    if (value < 1000) return 'under-1000';
    if (value <= 2000) return '1001-2000';
    if (value <= 3000) return '2001-3000';
    if (value <= 5000) return '3001-5000';
    if (value <= 7000) return '5001-7000';
    if (value <= 10000) return '7001-10000';
    if (value <= 17000) return '10001-17000';
    return 'over-17000';
  } else {
    // Private pricing tiers
    if (value < 1000) return 'under-1000';
    if (value <= 2999) return '1000-2999';
    if (value <= 4999) return '3000-4999';
    if (value <= 6999) return '5000-6999';
    if (value <= 9999) return '7000-9999';
    if (value <= 12999) return '10000-12999';
    if (value <= 16999) return '13000-16999';
    if (value <= 24999) return '17000-24999';
    return 'over-24995';
  }
}

/**
 * Create Stripe checkout session for advertising package
 * POST /api/payments/create-advert-checkout-session
 * Body: { packageId, packageName, price, duration, sellerType, vehicleValue, registration?, mileage? }
 */
async function createAdvertCheckoutSession(req, res) {
  try {
    const { 
      packageId, packageName, price, duration, sellerType, vehicleValue, 
      registration, mileage, advertId, advertData, vehicleData, contactDetails,
      vehicleType, priceExVat, vatAmount, actualVehicleValue
    } = req.body;
    
    console.log('📦 createAdvertCheckoutSession called with:', {
      packageId, packageName, price, duration, sellerType, vehicleValue,
      vehicleType, advertId: advertId ? 'YES' : 'NO',
      photosCount: advertData?.photos?.length || 0
    });
    
    if (advertData?.photos && advertData.photos.length > 0) {
      console.log('📸 Received', advertData.photos.length, 'photos from frontend');
      console.log('📸 First 3 photo URLs:', advertData.photos.slice(0, 3).map(p => p.url || p));
    } else {
      console.warn('⚠️  NO PHOTOS received in advertData!');
    }
    
    if (!packageId || !packageName || !price) {
      console.error('❌ Missing required fields:', { packageId, packageName, price });
      return res.status(400).json({
        success: false,
        error: 'Package details are required',
      });
    }

    // Validate price range matches vehicle valuation if valuation is provided
    // Extract numeric valuation from various possible sources - prioritize private values
    let valuation = null;
    
    // Try private values first (most relevant for private sellers)
    if (vehicleData?.valuation?.estimatedValue?.private && typeof vehicleData.valuation.estimatedValue.private === 'number') {
      valuation = vehicleData.valuation.estimatedValue.private;
    }
    else if (vehicleData?.allValuations?.private && typeof vehicleData.allValuations.private === 'number') {
      valuation = vehicleData.allValuations.private;
    }
    // Try actualVehicleValue (should be numeric)
    else if (actualVehicleValue && typeof actualVehicleValue === 'number' && !isNaN(actualVehicleValue)) {
      valuation = actualVehicleValue;
    }
    // Try advertData.price
    else if (advertData?.price && typeof advertData.price === 'number' && !isNaN(advertData.price)) {
      valuation = advertData.price;
    }
    // Try retail values as fallback
    else if (vehicleData?.valuation?.estimatedValue?.retail && typeof vehicleData.valuation.estimatedValue.retail === 'number') {
      valuation = vehicleData.valuation.estimatedValue.retail;
    }
    // Try vehicleData.price
    else if (vehicleData?.price && typeof vehicleData.price === 'number' && !isNaN(vehicleData.price)) {
      valuation = vehicleData.price;
    }
    
    console.log('💰 Valuation extraction debug:', {
      actualVehicleValue,
      'advertData.price': advertData?.price,
      'vehicleData.valuation.estimatedValue.private': vehicleData?.valuation?.estimatedValue?.private,
      'vehicleData.valuation.estimatedValue.retail': vehicleData?.valuation?.estimatedValue?.retail,
      'vehicleData.allValuations.private': vehicleData?.allValuations?.private,
      'vehicleData.estimatedValue': vehicleData?.estimatedValue,
      'vehicleData.estimatedValue type': typeof vehicleData?.estimatedValue,
      'vehicleData.price': vehicleData?.price,
      'extracted valuation': valuation,
      'valuation type': typeof valuation
    });
    
    // DISABLED: Price range validation was causing too many false positives
    // Only log for debugging purposes, don't block payments
    if (valuation && typeof valuation === 'number' && !isNaN(valuation) && valuation > 0 && vehicleValue) {
      const expectedPriceRange = calculatePriceRangeForValidation(valuation, sellerType === 'trade');
      if (expectedPriceRange && expectedPriceRange !== vehicleValue) {
        console.warn('⚠️  Price range mismatch (NOT BLOCKING):', {
          valuation,
          actualVehicleValue,
          expectedPriceRange,
          providedPriceRange: vehicleValue,
          sellerType
        });
        // DISABLED: Don't block payment, just log the mismatch
        // return res.status(400).json({
        //   success: false,
        //   error: `Price range mismatch. Vehicle valued at £${valuation.toLocaleString()} should use ${expectedPriceRange} price range, but ${vehicleValue} was provided.`,
        // });
      } else {
        console.log('✅ Price range validation passed:', { valuation, actualVehicleValue, priceRange: vehicleValue });
      }
    } else if (vehicleValue) {
      // If no valid valuation found but price range is provided, just log and continue
      console.log('⚠️  No valid numeric valuation found, skipping price range validation:', {
        valuation,
        actualVehicleValue,
        'vehicleData.estimatedValue': vehicleData?.estimatedValue,
        providedPriceRange: vehicleValue
      });
    }

    const stripeService = new StripeService();
    
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/sell-my-car/advert-payment-success?session_id={CHECKOUT_SESSION_ID}&package=${encodeURIComponent(packageName)}&advertId=${advertId}`;
    const cancelUrl = `${baseUrl}/sell-my-car/advertising-prices?cancelled=true`;

    // Use vehicleType if vehicleValue is not provided (for backwards compatibility)
    const finalVehicleValue = vehicleValue || vehicleType || 'car';
    const finalSellerType = sellerType || 'private';

    // Pass all data to Stripe metadata
    const session = await stripeService.createAdvertCheckoutSession(
      packageId,
      packageName,
      price,
      duration,
      finalSellerType,
      finalVehicleValue,
      registration,
      mileage,
      advertId,
      advertData,
      vehicleData,
      contactDetails,
      successUrl,
      cancelUrl
    );

    // Validate and prepare metadata
    const safeAdvertData = advertData || {};
    const safeVehicleData = vehicleData || {};
    const safeContactDetails = contactDetails || {};
    
    console.log('📦 Preparing purchase record with data:');
    console.log('   Advert ID:', advertId || 'None');
    console.log('   Vehicle Data keys:', Object.keys(safeVehicleData));
    console.log('   Advert Data keys:', Object.keys(safeAdvertData));
    console.log('   Contact Data keys:', Object.keys(safeContactDetails));

    // Save purchase record to database with all advert data
    const purchase = new AdvertisingPackagePurchase({
      stripeSessionId: session.sessionId,
      customSessionId: session.customSessionId,
      packageId,
      packageName,
      duration,
      amount: price,
      currency: 'gbp',
      sellerType,
      vehicleValue,
      registration: registration || safeVehicleData.registrationNumber || null,
      mileage: mileage || safeVehicleData.mileage || null,
      paymentStatus: 'pending',
      packageStatus: 'pending',
      // Store advert data temporarily
      metadata: {
        advertId: advertId || null,
        advertData: JSON.stringify(safeAdvertData),
        vehicleData: JSON.stringify(safeVehicleData),
        contactDetails: JSON.stringify(safeContactDetails),
        userId: req.user ? (req.user._id || req.user.id).toString() : null
      }
    });

    await purchase.save();
    console.log(`✅ Purchase record created with advert data: ${purchase._id}`);

    // DO NOT create car here - wait for payment confirmation via webhook
    // This prevents unpaid cars from being saved to database
    console.log(`⏳ Car will be created after payment confirmation via webhook`);
    
    // Helper function to calculate expiry date
    function calculateExpiryDate(duration) {
      const now = new Date();
      
      if (duration.includes('Until sold')) {
        return new Date(now.setFullYear(now.getFullYear() + 1));
      }
      
      const weeks = parseInt(duration.match(/\d+/)?.[0] || 4);
      return new Date(now.setDate(now.getDate() + (weeks * 7)));
    }

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        url: session.url,
        customSessionId: session.customSessionId,
        packageName: session.packageName,
        amount: session.amount,
        currency: session.currency,
        purchaseId: purchase._id
      }
    });
  } catch (error) {
    console.error('❌ Error in createAdvertCheckoutSession:', error);
    console.error('   Stack:', error.stack);
    console.error('   Request body:', req.body);
    
    let statusCode = 500;
    let errorMessage = 'Payment processing failed. Please try again.';
    
    if (error.message.includes('Stripe')) {
      errorMessage = 'Payment service temporarily unavailable. Please try again.';
    } else if (error.message.includes('validation')) {
      statusCode = 400;
      errorMessage = 'Invalid payment information provided.';
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }
    
    const errorResponse = formatErrorResponse(error, 'payment');
    errorResponse.error = errorMessage; // Override with user-friendly message
    
    res.status(statusCode).json(errorResponse);
  }
}

/**
 * Create Stripe checkout session for vehicle history report
 * POST /api/payments/create-checkout-session
 * Body: { vrm: string, customerEmail?: string }
 */
async function createCheckoutSession(req, res) {
  try {
    const { vrm, customerEmail } = req.body;
    
    if (!vrm) {
      return res.status(400).json({
        success: false,
        error: 'VRM is required',
      });
    }

    const stripeService = new StripeService();
    
    // Create URLs with session ID
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/vehicle-check/payment/success?session_id={CHECKOUT_SESSION_ID}&registration=${encodeURIComponent(vrm.toUpperCase())}&channel=cars`;
    const cancelUrl = `${baseUrl}/vehicle-check?cancelled=true&registration=${encodeURIComponent(vrm.toUpperCase())}`;

    const session = await stripeService.createCheckoutSession(
      vrm,
      customerEmail,
      successUrl,
      cancelUrl
    );

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        url: session.url,
        customSessionId: session.customSessionId,
        vrm: session.vrm,
        amount: session.amount,
        currency: session.currency,
        // Create the payment route URL
        paymentUrl: `${baseUrl}/vehicle-check/payment/${session.customSessionId}?registration=${encodeURIComponent(vrm.toUpperCase())}&channel=cars`
      }
    });
  } catch (error) {
    console.error('Error in createCheckoutSession:', error);
    const errorResponse = formatErrorResponse(error, 'payment');
    res.status(500).json(errorResponse);
  }
}

/**
 * Create Stripe checkout session for credit packages
 * POST /api/payments/create-credit-session
 * Body: { creditAmount: number, customerEmail?: string }
 */
async function createCreditCheckoutSession(req, res) {
  try {
    const { creditAmount, customerEmail } = req.body;
    
    if (!creditAmount || ![5, 10, 25].includes(creditAmount)) {
      return res.status(400).json({
        success: false,
        error: 'Valid credit amount is required (5, 10, or 25)',
      });
    }

    const stripeService = new StripeService();
    
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/credits/success?session_id={CHECKOUT_SESSION_ID}&credits=${creditAmount}`;
    const cancelUrl = `${baseUrl}/credits?cancelled=true`;

    const session = await stripeService.createCreditCheckoutSession(
      creditAmount,
      customerEmail,
      successUrl,
      cancelUrl
    );

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error in createCreditCheckoutSession:', error);
    const errorResponse = formatErrorResponse(error, 'payment');
    res.status(500).json(errorResponse);
  }
}

/**
 * Get checkout session details
 * GET /api/payments/session/:sessionId
 */
async function getSessionDetails(req, res) {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    const stripeService = new StripeService();
    const session = await stripeService.getCheckoutSession(sessionId);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
        created: new Date(session.created * 1000)
      }
    });
  } catch (error) {
    console.error('Error in getSessionDetails:', error);
    const errorResponse = formatErrorResponse(error, 'payment');
    res.status(500).json(errorResponse);
  }
}

/**
 * Handle Stripe webhooks
 * POST /api/payments/webhook
 */
async function handleWebhook(req, res) {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing Stripe signature',
      });
    }

    const stripeService = new StripeService();
    const event = stripeService.verifyWebhookSignature(req.body, signature);

    console.log('Received Stripe webhook:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error in handleWebhook:', error);
    res.status(400).json({
      success: false,
      error: 'Webhook processing failed',
    });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent) {
  try {
    console.log('Processing successful payment:', paymentIntent.id);
    
    // Check if this payment has already been processed (idempotency)
    const existingPurchase = await AdvertisingPackagePurchase.findOne({
      stripePaymentIntentId: paymentIntent.id,
      paymentStatus: 'paid'
    });
    
    if (existingPurchase) {
      console.log(`⚠️  Payment ${paymentIntent.id} already processed, skipping`);
      return;
    }
    
    const stripeService = new StripeService();
    const paymentData = await stripeService.processSuccessfulPayment(paymentIntent);
    
    if (paymentData.type === 'vehicle_history_report' && paymentData.vrm) {
      // CRITICAL: Only call API during payment processing, not for display
      // Generate vehicle history report only if payment is successful
      if (paymentData.vrm) {
        console.log(`🔍 [Payment] Generating vehicle history report for: ${paymentData.vrm}`);
        
        // Use safeAPI to ensure proper caching and limits
        try {
          const historyService = new HistoryService();
          
          // CRITICAL: ALWAYS fetch fresh data after payment (bypass cache)
          // Payment is a trigger event that requires up-to-date MOT and history data
          console.log(`📞 [Payment] Fetching FRESH vehicle history for: ${paymentData.vrm}`);
          await historyService.checkVehicleHistory(paymentData.vrm, true); // forceRefresh = true
          console.log(`✅ [Payment] Vehicle history report generated for VRM: ${paymentData.vrm}`);
        } catch (error) {
          console.error(`❌ [Payment] Error generating vehicle history:`, error.message);
          // Don't fail payment if history generation fails
        }
      }
      
      // TODO: Send email with report link
      // TODO: Store payment record in database
    } else if (paymentData.type === 'credit_package' && paymentData.creditAmount) {
      // Add credits to user account
      console.log(`Adding ${paymentData.creditAmount} credits to user account`);
      
      // TODO: Update user credit balance
      // TODO: Send email confirmation
    } else if (paymentData.type === 'advertising_package') {
      // Handle advertising package purchase
      console.log(`Processing advertising package purchase: ${paymentData.packageName}`);
      
      // Find and update purchase record
      const purchase = await AdvertisingPackagePurchase.findBySessionId(paymentData.sessionId);
      
      if (purchase) {
        await purchase.markAsPaid(paymentIntent.id);
        await purchase.activatePackage();
        
        console.log(`✅ Advertising package activated: ${purchase._id}`);
        console.log(`   Package: ${purchase.packageName}`);
        console.log(`   Duration: ${purchase.duration}`);
        console.log(`   Amount: ${purchase.amountFormatted}`);
        
        // Create and publish the advert if advertId exists in metadata
        if (purchase.metadata && purchase.metadata.get('advertId')) {
          const Car = require('../models/Car');
          const Bike = require('../models/Bike');
          const postcodeService = require('../services/postcodeService');
          const advertId = purchase.metadata.get('advertId');
          const vehicleType = purchase.metadata.get('vehicleType') || 'car';
          
          try {
            // Parse stored advert data (metadata is a Map, use .get())
            const advertData = JSON.parse(purchase.metadata.get('advertData') || '{}');
            const vehicleData = JSON.parse(purchase.metadata.get('vehicleData') || '{}');
            const contactDetails = JSON.parse(purchase.metadata.get('contactDetails') || '{}');
            const userId = purchase.metadata.get('userId');
            
            // DEBUG: Log business info from advertData
            console.log('🔍 DEBUG: Business info in advertData:');
            console.log('   businessName:', advertData.businessName);
            console.log('   businessLogo:', advertData.businessLogo);
            console.log('   businessWebsite:', advertData.businessWebsite);
            console.log('   advertData keys:', Object.keys(advertData));
            console.log('🔍 DEBUG: Full advertData:', JSON.stringify(advertData, null, 2));
            
            // Handle BIKE payments
            if (vehicleType === 'bike') {
              console.log(`📦 Creating BIKE from purchase data:`);
              console.log(`   Advert ID: ${advertId}`);
              console.log(`   Vehicle: ${vehicleData.make} ${vehicleData.model}`);
              console.log(`   Price: £${advertData.price}`);
              
              // Calculate expiry date
              const expiryDate = calculateExpiryDate(purchase.duration);
              
              // Geocode postcode
              let latitude, longitude, locationName;
              if (contactDetails.postcode) {
                try {
                  const postcodeData = await postcodeService.lookupPostcode(contactDetails.postcode);
                  latitude = postcodeData.latitude;
                  longitude = postcodeData.longitude;
                  locationName = postcodeData.locationName;
                } catch (error) {
                  console.warn(`⚠️  Could not geocode postcode: ${error.message}`);
                }
              }
              
              // Auto-detect seller type based on business info
              const hasLogo = advertData?.businessLogo && advertData.businessLogo.trim() !== '';
              const hasWebsite = advertData?.businessWebsite && advertData.businessWebsite.trim() !== '';
              const detectedSellerType = (hasLogo || hasWebsite) ? 'trade' : 'private';
              
              console.log(`🔍 Bike Auto-detected seller type: ${detectedSellerType}`);
              console.log(`   Has logo: ${hasLogo} (value: "${advertData?.businessLogo}")`);
              console.log(`   Has website: ${hasWebsite} (value: "${advertData?.businessWebsite}")`);
              console.log(`   Business name: "${advertData?.businessName}"`);
              
              // Check if bike already exists
              let bike = await Bike.findOne({ advertId });
              
              if (bike) {
                // Check if already active
                if (bike.status === 'active' && bike.advertisingPackage?.stripePaymentIntentId === paymentIntent.id) {
                  console.log(`⚠️  Bike ${bike._id} already activated, skipping`);
                  return;
                }
                
                // Update existing bike
                console.log(`📝 Updating existing bike: ${bike._id}`);
                
                // CRITICAL FIX: Update registration number and model from vehicleData
                if (vehicleData.registrationNumber || vehicleData.registration) {
                  bike.registrationNumber = vehicleData.registrationNumber || vehicleData.registration;
                  console.log(`✅ Updated registration: ${bike.registrationNumber}`);
                }
                
                if (vehicleData.make) {
                  bike.make = vehicleData.make;
                  console.log(`✅ Updated make: ${bike.make}`);
                }
                
                if (vehicleData.model) {
                  bike.model = vehicleData.model;
                  console.log(`✅ Updated model: ${bike.model}`);
                }
                
                if (vehicleData.variant) {
                  bike.variant = vehicleData.variant;
                  console.log(`✅ Updated variant: ${bike.variant}`);
                }
                
                if (vehicleData.color) {
                  bike.color = vehicleData.color;
                  console.log(`✅ Updated color: ${bike.color}`);
                }
                
                if (vehicleData.engineCC || vehicleData.engineSize) {
                  bike.engineCC = parseInt(vehicleData.engineCC || vehicleData.engineSize || '0') || 0;
                  console.log(`✅ Updated engineCC: ${bike.engineCC}`);
                }
                
                bike.price = advertData.price || bike.price;
                bike.description = advertData.description || bike.description;
                bike.images = advertData.photos ? advertData.photos.map(p => p.url || p) : bike.images;
                bike.postcode = contactDetails.postcode || bike.postcode;
                bike.locationName = locationName || bike.locationName;
                bike.latitude = latitude || bike.latitude;
                bike.longitude = longitude || bike.longitude;
                
                if (latitude && longitude) {
                  bike.location = {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                  };
                }
                
                // Preserve existing business info if new data is empty
                const finalBusinessName = advertData?.businessName || bike.sellerContact?.businessName;
                const finalBusinessLogo = advertData?.businessLogo || bike.sellerContact?.businessLogo;
                const finalBusinessWebsite = advertData?.businessWebsite || bike.sellerContact?.businessWebsite;
                
                console.log(`📝 Final bike business info to save:`);
                console.log(`   Business Name: "${finalBusinessName}"`);
                console.log(`   Business Logo: "${finalBusinessLogo}"`);
                console.log(`   Business Website: "${finalBusinessWebsite}"`);
                
                bike.sellerContact = {
                  type: detectedSellerType,
                  phoneNumber: contactDetails.phoneNumber || bike.sellerContact?.phoneNumber,
                  email: contactDetails.email || bike.sellerContact?.email,
                  allowEmailContact: contactDetails.allowEmailContact || false,
                  postcode: contactDetails.postcode || bike.sellerContact?.postcode,
                  businessName: finalBusinessName,
                  businessLogo: finalBusinessLogo,
                  businessWebsite: finalBusinessWebsite
                };
                
                // Save running costs from advertData
                if (advertData.runningCosts) {
                  console.log(`💰 Saving running costs from advertData:`, advertData.runningCosts);
                  bike.runningCosts = advertData.runningCosts;
                }
                
                bike.advertisingPackage = {
                  packageId: purchase.packageId,
                  packageName: purchase.packageName,
                  duration: purchase.duration,
                  price: purchase.amount,
                  purchaseDate: new Date(),
                  expiryDate: expiryDate,
                  stripeSessionId: paymentData.sessionId,
                  stripePaymentIntentId: paymentIntent.id
                };
                
                bike.status = 'active';
                bike.publishedAt = new Date();
                
                await bike.save();
                console.log(`✅ Bike advert UPDATED and published!`);
                
                // CRITICAL: Only call Vehicle History API after payment (MOT + Previous Owners)
                // Vehicle Specs API was already called when bike was created
                if (bike.registrationNumber) {
                  console.log(`🔍 [Payment] Checking vehicle history for bike: ${bike.registrationNumber}`);
                  try {
                    // CRITICAL: ALWAYS fetch fresh data after payment (bypass cache)
                    console.log(`📞 [Payment] Fetching FRESH MOT and history data for ${bike.registrationNumber}`);
                    
                    const HistoryService = require('../services/historyService');
                    const MOTHistoryService = require('../services/motHistoryService');
                    
                    const historyService = new HistoryService();
                    const motHistoryService = new MOTHistoryService();
                    
                    // Fetch MOT history and vehicle history in parallel - FORCE REFRESH
                    const [motResult, historyResult] = await Promise.allSettled([
                      motHistoryService.getMOTHistory(bike.registrationNumber),
                      historyService.checkVehicleHistory(bike.registrationNumber, true) // forceRefresh = true
                    ]);
                    
                    // Update MOT data
                    if (motResult.status === 'fulfilled' && motResult.value) {
                      const motData = motResult.value;
                      bike.motHistory = motData.motTests || motData.motHistory || [];
                      bike.motDue = motData.motDueDate || motData.motExpiryDate || null;
                      bike.motStatus = motData.motStatus || null;
                      bike.motExpiry = motData.motDueDate || motData.motExpiryDate || null;
                      console.log(`✅ [Payment] MOT history fetched: ${bike.motHistory.length} tests`);
                    }
                    
                    // Update history data (previous owners)
                    if (historyResult.status === 'fulfilled' && historyResult.value) {
                      const histData = historyResult.value;
                      if (!bike.historyCheckData) bike.historyCheckData = {};
                      bike.historyCheckData.previousKeepers = histData.previousOwners || histData.numberOfPreviousKeepers || null;
                      bike.historyCheckData.isWrittenOff = histData.writeOffCategory !== 'none';
                      bike.historyCheckData.writeOffCategory = histData.writeOffCategory || 'none';
                      console.log(`✅ [Payment] Vehicle history fetched: ${bike.historyCheckData.previousKeepers} previous owners`);
                    }
                    
                    await bike.save();
                    console.log(`✅ [Payment] Vehicle history data saved to database`);
                  } catch (error) {
                    console.error(`❌ [Payment] Error fetching vehicle history for bike:`, error.message);
                    // Don't fail payment if history fetch fails
                  }
                }
              } else {
                // Create new bike
                console.log(`📝 Creating NEW bike document`);
                
                // Preserve business info
                const finalBusinessName = advertData?.businessName;
                const finalBusinessLogo = advertData?.businessLogo;
                const finalBusinessWebsite = advertData?.businessWebsite;
                
                bike = new Bike({
                  advertId: advertId,
                  userId: userId,
                  make: vehicleData.make || 'Unknown',
                  model: vehicleData.model || 'Unknown',
                  year: vehicleData.year || new Date().getFullYear(),
                  mileage: vehicleData.mileage || 0,
                  color: vehicleData.color || 'Not specified',
                  fuelType: vehicleData.fuelType || 'Petrol',
                  transmission: 'manual',
                  registrationNumber: vehicleData.registrationNumber || null,
                  engineCC: parseInt(vehicleData.engineCC || vehicleData.engineSize || '0') || 0,
                  bikeType: vehicleData.bikeType || 'Other',
                  condition: 'used',
                  price: advertData.price || 0,
                  description: advertData.description || '',
                  images: advertData.photos ? advertData.photos.map(p => p.url || p) : [],
                  postcode: contactDetails.postcode || '',
                  locationName: locationName,
                  latitude: latitude,
                  longitude: longitude,
                  location: latitude && longitude ? {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                  } : undefined,
                  sellerContact: {
                    type: detectedSellerType,
                    phoneNumber: contactDetails.phoneNumber,
                    email: contactDetails.email,
                    allowEmailContact: contactDetails.allowEmailContact || false,
                    postcode: contactDetails.postcode,
                    businessName: finalBusinessName,
                    businessLogo: finalBusinessLogo,
                    businessWebsite: finalBusinessWebsite
                  },
                  runningCosts: advertData.runningCosts || undefined,
                  advertisingPackage: {
                    packageId: purchase.packageId,
                    packageName: purchase.packageName,
                    duration: purchase.duration,
                    price: purchase.amount,
                    purchaseDate: new Date(),
                    expiryDate: expiryDate,
                    stripeSessionId: paymentData.sessionId,
                    stripePaymentIntentId: paymentIntent.id
                  },
                  status: 'active',
                  publishedAt: new Date()
                });
                
                await bike.save();
                console.log(`✅ Bike advert CREATED and published!`);
                
                // Call UniversalAutoCompleteService to fetch MOT history and vehicle history
                if (bike.registrationNumber) {
                  console.log(`🔍 Calling UniversalAutoCompleteService for bike: ${bike.registrationNumber}`);
                  try {
                    const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');
                    const service = new UniversalAutoCompleteService();
                    await service.completeCarData(bike, false);
                    console.log(`✅ MOT history and vehicle data fetched and saved for bike`);
                  } catch (error) {
                    console.error(`❌ Error fetching MOT history for bike:`, error.message);
                  }
                }
              }
              
              console.log(`   Database ID: ${bike._id}`);
              console.log(`   Make/Model: ${bike.make} ${bike.model}`);
              console.log(`   Price: £${bike.price}`);
              
              // Send confirmation email and return early
              if (purchase.customerEmail) {
                const emailService = new EmailService();
                await emailService.sendAdvertisingPackageConfirmation(purchase);
                console.log(`📧 Confirmation email sent to: ${purchase.customerEmail}`);
              }
              return;
            }
            
            // Handle VAN payments
            if (vehicleType === 'van') {
              const Van = require('../models/Van');
              
              console.log(`📦 Creating VAN from purchase data:`);
              console.log(`   Advert ID: ${advertId}`);
              console.log(`   Vehicle: ${vehicleData.make} ${vehicleData.model}`);
              console.log(`   Price: £${advertData.price}`);
              
              // Calculate expiry date (in weeks)
              const expiryDate = calculateExpiryDate(purchase.duration);
              
              // Geocode postcode
              let latitude, longitude, locationName;
              if (contactDetails.postcode) {
                try {
                  const postcodeData = await postcodeService.lookupPostcode(contactDetails.postcode);
                  latitude = postcodeData.latitude;
                  longitude = postcodeData.longitude;
                  locationName = postcodeData.locationName;
                } catch (error) {
                  console.warn(`⚠️  Could not geocode postcode: ${error.message}`);
                }
              }
              
              // Check if van already exists
              let van = await Van.findOne({ advertId });
              
              if (van) {
                // Check if already active
                if (van.status === 'active' && van.advertisingPackage?.stripePaymentIntentId === paymentIntent.id) {
                  console.log(`⚠️  Van ${van._id} already activated, skipping`);
                  return;
                }
                
                // Update existing van
                console.log(`📝 Updating existing van: ${van._id}`);
                
                van.price = advertData.price || van.price;
                van.description = advertData.description || van.description;
                van.images = advertData.photos ? advertData.photos.map(p => p.url || p) : van.images;
                van.postcode = contactDetails.postcode || van.postcode;
                van.locationName = locationName || van.locationName;
                van.latitude = latitude || van.latitude;
                van.longitude = longitude || van.longitude;
                
                if (latitude && longitude) {
                  van.location = {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                  };
                }
                
                van.sellerContact = {
                  type: 'private',
                  phoneNumber: contactDetails.phoneNumber || van.sellerContact?.phoneNumber,
                  email: contactDetails.email || van.sellerContact?.email,
                  allowEmailContact: contactDetails.allowEmailContact || false,
                  postcode: contactDetails.postcode || van.sellerContact?.postcode,
                  businessName: advertData.businessName || van.sellerContact?.businessName || null,
                  businessLogo: advertData.businessLogo || van.sellerContact?.businessLogo || null,
                  businessWebsite: advertData.businessWebsite || van.sellerContact?.businessWebsite || null
                };
                
                // Save running costs from advertData
                if (advertData.runningCosts) {
                  console.log(`💰 Saving running costs from advertData:`, advertData.runningCosts);
                  van.runningCosts = advertData.runningCosts;
                }
                
                // Save features from advertData
                if (advertData.features && Array.isArray(advertData.features)) {
                  console.log(`✨ Saving features from advertData:`, advertData.features);
                  van.features = advertData.features;
                }
                
                van.advertisingPackage = {
                  packageId: purchase.packageId,
                  packageName: purchase.packageName,
                  duration: purchase.duration,
                  price: purchase.amount,
                  purchaseDate: new Date(),
                  expiryDate: expiryDate,
                  stripeSessionId: paymentData.sessionId,
                  stripePaymentIntentId: paymentIntent.id
                };
                
                van.status = 'active';
                van.publishedAt = new Date();
                
                await van.save();
                console.log(`✅ Van advert UPDATED and published!`);
                
                // CRITICAL: Use UniversalAutoCompleteService like bike (fetches FRESH data)
                if (van.registrationNumber) {
                  console.log(`🔍 [Van Payment] Calling UniversalAutoCompleteService for van: ${van.registrationNumber}`);
                  console.log(`   💰 Payment completed - fetching FRESH vehicle data (not cache)`);
                  
                  try {
                    const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');
                    const service = new UniversalAutoCompleteService();
                    await service.completeCarData(van, true); // forceRefresh = true for fresh data
                    console.log(`✅ [Van Payment] MOT history and vehicle data fetched and saved`);
                  } catch (error) {
                    console.error(`❌ [Van Payment] Error fetching vehicle data:`, error.message);
                    // Don't fail payment if data fetch fails
                  }
                }
              } else {
                // Create new van
                console.log(`📝 Creating NEW van document`);
                
                van = new Van({
                  advertId: advertId,
                  userId: userId, // Add userId field
                  make: vehicleData.make || 'Unknown',
                  model: vehicleData.model || 'Unknown',
                  year: vehicleData.year || new Date().getFullYear(),
                  mileage: vehicleData.mileage || 0,
                  color: vehicleData.color || 'Not specified',
                  fuelType: vehicleData.fuelType || 'Diesel',
                  transmission: vehicleData.transmission || 'Manual',
                  registrationNumber: vehicleData.registration || vehicleData.registrationNumber || null,
                  vanType: vehicleData.vanType || 'Panel Van',
                  payloadCapacity: vehicleData.payloadCapacity || 0,
                  condition: 'used',
                  price: advertData.price || 0,
                  description: advertData.description || '',
                  images: advertData.photos ? advertData.photos.map(p => p.url || p) : [],
                  postcode: contactDetails.postcode || '',
                  locationName: locationName,
                  latitude: latitude,
                  longitude: longitude,
                  location: latitude && longitude ? {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                  } : undefined,
                  sellerContact: {
                    type: 'private',
                    phoneNumber: contactDetails.phoneNumber,
                    email: contactDetails.email,
                    allowEmailContact: contactDetails.allowEmailContact || false,
                    postcode: contactDetails.postcode,
                    businessName: advertData.businessName || null,
                    businessLogo: advertData.businessLogo || null,
                    businessWebsite: advertData.businessWebsite || null
                  },
                  runningCosts: advertData.runningCosts || undefined,
                  features: advertData.features || [],
                  advertisingPackage: {
                    packageId: purchase.packageId,
                    packageName: purchase.packageName,
                    duration: purchase.duration,
                    price: purchase.amount,
                    purchaseDate: new Date(),
                    expiryDate: expiryDate,
                    stripeSessionId: paymentData.sessionId,
                    stripePaymentIntentId: paymentIntent.id
                  },
                  status: 'active',
                  publishedAt: new Date()
                });
                
                await van.save();
                console.log(`✅ Van advert CREATED and published!`);
                
                // CRITICAL: Use UniversalAutoCompleteService like bike (fetches FRESH data)
                if (van.registrationNumber) {
                  console.log(`🔍 [Van Payment - New] Calling UniversalAutoCompleteService for van: ${van.registrationNumber}`);
                  
                  try {
                    const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');
                    const service = new UniversalAutoCompleteService();
                    await service.completeCarData(van, true); // forceRefresh = true for fresh data
                    console.log(`✅ [Van Payment - New] MOT history and vehicle data fetched and saved`);
                  } catch (error) {
                    console.error(`❌ [Van Payment - New] Error fetching vehicle data:`, error.message);
                    // Don't fail payment if data fetch fails
                  }
                }
              }
              
              console.log(`   Database ID: ${van._id}`);
              console.log(`   Make/Model: ${van.make} ${van.model}`);
              console.log(`   Price: £${van.price}`);
              
              // Send confirmation email and return early
              if (purchase.customerEmail) {
                const emailService = new EmailService();
                await emailService.sendAdvertisingPackageConfirmation(purchase);
                console.log(`📧 Confirmation email sent to: ${purchase.customerEmail}`);
              }
              return;
            }
          } catch (error) {
            console.error(`⚠️  Error processing vehicle payment:`, error.message);
            console.error(error.stack);
            // Continue to allow other payment processing
          }
          
          // Handle CAR payments (existing code)
          try {
            // Parse stored data from metadata
            const advertData = JSON.parse(purchase.metadata.get('advertData') || '{}');
            const vehicleData = JSON.parse(purchase.metadata.get('vehicleData') || '{}');
            const contactDetails = JSON.parse(purchase.metadata.get('contactDetails') || '{}');
            
            console.log(`📦 Creating car from purchase data:`);
            console.log(`   Advert ID: ${advertId}`);
            console.log(`   Vehicle: ${vehicleData.make} ${vehicleData.model}`);
            console.log(`   Price: £${advertData.price}`);
            console.log(`   Photos: ${advertData.photos ? advertData.photos.length : 0}`);
            console.log(`   Postcode: ${contactDetails.postcode}`);
            
            // Calculate expiry date
            const expiryDate = calculateExpiryDate(purchase.duration);
            
            // Check if car already exists (from createAdvert step)
            let car = await Car.findOne({ advertId });
            
            // Fetch location data from postcode (for both new and existing cars)
            let locationName, latitude, longitude;
            if (contactDetails.postcode) {
              try {
                const postcodeData = await postcodeService.lookupPostcode(contactDetails.postcode);
                locationName = postcodeData.locationName;
                latitude = postcodeData.latitude;
                longitude = postcodeData.longitude;
                console.log(`   Location: ${locationName} (${latitude}, ${longitude})`);
              } catch (error) {
                console.warn(`⚠️  Could not geocode postcode ${contactDetails.postcode}: ${error.message}`);
              }
            }
            
            if (car) {
              // Check if car is already active (prevent duplicate activation)
              if (car.advertStatus === 'active' && car.advertisingPackage?.stripePaymentIntentId === paymentIntent.id) {
                console.log(`⚠️  Car ${car._id} already activated for payment ${paymentIntent.id}, skipping`);
                return;
              }
              
              // UPDATE existing car with payment data
              console.log(`📝 Updating existing car: ${car._id}`);
              
              // Get userId from purchase metadata or create user automatically
              let userId = purchase.metadata.get('userId');
              
              // AUTOMATIC FIX: Create user account if it doesn't exist
              if (!userId && contactDetails.email) {
                console.log(`👤 No userId found, checking if user exists for email: ${contactDetails.email}`);
                
                const User = require('../models/User');
                let user = await User.findOne({ email: contactDetails.email });
                
                if (!user) {
                  // Create user account automatically
                  console.log(`👤 Creating new user account for: ${contactDetails.email}`);
                  const bcrypt = require('bcryptjs');
                  
                  const tempPassword = Math.random().toString(36).slice(-8);
                  const hashedPassword = await bcrypt.hash(tempPassword, 10);
                  
                  user = new User({
                    name: contactDetails.email.split('@')[0],
                    email: contactDetails.email,
                    password: hashedPassword,
                    isEmailVerified: true, // Auto-verify since they completed payment
                    provider: 'local',
                    role: 'user'
                  });
                  
                  await user.save();
                  console.log(`✅ User created automatically: ${user._id}`);
                  console.log(`   Temp password: ${tempPassword}`);
                } else {
                  console.log(`✅ Found existing user: ${user._id}`);
                }
                
                userId = user._id;
              }
              
              if (userId && !car.userId) {
                car.userId = userId;
                console.log(`   Setting userId: ${userId}`);
              }
              
              // Use private sale price from valuation if available
              const privatePrice = vehicleData.estimatedValue?.private || vehicleData.allValuations?.private;
              
              // Ensure price is always a number, not an object
              let finalPrice = car.price; // Default to existing price
              
              if (advertData.price && typeof advertData.price === 'number') {
                finalPrice = advertData.price;
              } else if (privatePrice && typeof privatePrice === 'number') {
                finalPrice = privatePrice;
              } else if (vehicleData.estimatedValue && typeof vehicleData.estimatedValue === 'number') {
                finalPrice = vehicleData.estimatedValue;
              } else if (vehicleData.price && typeof vehicleData.price === 'number') {
                finalPrice = vehicleData.price;
              }
              
              car.price = finalPrice;
              car.description = advertData.description || car.description;
              car.images = advertData.photos ? advertData.photos.map(p => p.url) : car.images;
              car.postcode = contactDetails.postcode || car.postcode;
              car.locationName = locationName || car.locationName;
              car.latitude = latitude || car.latitude;
              car.longitude = longitude || car.longitude;
              
              // Set location object if coordinates are available
              if (longitude && latitude) {
                car.location = {
                  type: 'Point',
                  coordinates: [longitude, latitude]
                };
              }
              
              // Auto-detect seller type based on business info
              const hasLogo = advertData?.businessLogo && advertData.businessLogo.trim() !== '';
              const hasWebsite = advertData?.businessWebsite && advertData.businessWebsite.trim() !== '';
              const detectedSellerType = (hasLogo || hasWebsite) ? 'trade' : 'private';
              
              console.log(`🔍 Auto-detected seller type: ${detectedSellerType}`);
              console.log(`   Has logo: ${hasLogo} (value: "${advertData?.businessLogo}")`);
              console.log(`   Has website: ${hasWebsite} (value: "${advertData?.businessWebsite}")`);
              console.log(`   Business name: "${advertData?.businessName}"`);
              console.log(`🔍 FULL advertData received:`, JSON.stringify(advertData, null, 2));
              
              // CRITICAL: Preserve existing business info if new data is empty
              // Use empty string as fallback to avoid "undefined" strings
              const finalBusinessName = advertData?.businessName || car.sellerContact?.businessName || '';
              const finalBusinessLogo = advertData?.businessLogo || car.sellerContact?.businessLogo || '';
              const finalBusinessWebsite = advertData?.businessWebsite || car.sellerContact?.businessWebsite || '';
              
              console.log(`📝 Final business info to save:`);
              console.log(`   Business Name: "${finalBusinessName}"`);
              console.log(`   Business Logo: "${finalBusinessLogo}"`);
              console.log(`   Business Website: "${finalBusinessWebsite}"`);
              
              // Build sellerContact preserving existing nested fields
              if (!car.sellerContact) car.sellerContact = {};
              car.sellerContact.type = detectedSellerType;
              car.sellerContact.phoneNumber = contactDetails.phoneNumber || car.sellerContact.phoneNumber;
              car.sellerContact.email = contactDetails.email || car.sellerContact.email;
              car.sellerContact.allowEmailContact = contactDetails.allowEmailContact || car.sellerContact.allowEmailContact || false;
              car.sellerContact.postcode = contactDetails.postcode || car.sellerContact.postcode;
              
              // CRITICAL: Don't set on car object - Mongoose Mixed type doesn't track changes
              // We'll add directly to updateFields later
              if (finalBusinessName) car.sellerContact.businessName = finalBusinessName;
              
              // Mark as modified for Mongoose
              car.markModified('sellerContact');
              
              console.log('📝 sellerContact after update (before save):', JSON.stringify(car.sellerContact, null, 2));
              
              car.advertisingPackage = {
                packageId: purchase.packageId,
                packageName: purchase.packageName,
                duration: purchase.duration,
                price: purchase.amount,
                purchaseDate: new Date(),
                expiryDate: expiryDate,
                stripeSessionId: paymentData.sessionId,
                stripePaymentIntentId: paymentIntent.id
              };
              
              car.advertStatus = 'active';
              car.publishedAt = new Date();
              
              // CRITICAL: Call Universal Service to get correct PHEV detection and electric data
              // This is needed because the car was created in "pending" status without full data
              if (car.registrationNumber) {
                try {
                  console.log(`🔍 [Payment] Checking vehicle data for car: ${car.registrationNumber}`);
                  
                  // CRITICAL: ALWAYS fetch fresh data after payment (bypass cache)
                  console.log(`📞 [Payment] Fetching FRESH MOT and vehicle history for: ${car.registrationNumber}`);
                  
                  try {
                    const HistoryService = require('../services/historyService');
                    const MOTHistoryService = require('../services/motHistoryService');
                    
                    const historyService = new HistoryService();
                    const motHistoryService = new MOTHistoryService();
                    
                    // Fetch MOT history and vehicle history in parallel - FORCE REFRESH
                    const [motResult, historyResult] = await Promise.allSettled([
                      motHistoryService.getMOTHistory(car.registrationNumber),
                      historyService.checkVehicleHistory(car.registrationNumber, true) // forceRefresh = true
                    ]);
                    
                    // Process MOT history result
                    if (motResult.status === 'fulfilled' && motResult.value) {
                      console.log(`✅ [Car Payment] MOT history fetched successfully`);
                      
                      // Update car with MOT data
                      if (motResult.value.motTests && motResult.value.motTests.length > 0) {
                        car.motHistory = motResult.value.motTests;
                        
                        const latestTest = motResult.value.motTests[0];
                        if (latestTest.expiryDate) {
                          car.motDue = latestTest.expiryDate;
                          car.motExpiry = latestTest.expiryDate;
                          car.motStatus = latestTest.testResult === 'PASSED' ? 'Valid' : 'Expired';
                        }
                      }
                    } else {
                      console.warn(`⚠️  [Car Payment] MOT history fetch failed:`, motResult.reason?.message);
                    }
                    
                    // Process vehicle history result
                    if (historyResult.status === 'fulfilled' && historyResult.value) {
                      console.log(`✅ [Car Payment] Vehicle history fetched successfully`);
                      
                      // Update car with history data
                      if (historyResult.value.previousOwners !== undefined) {
                        car.previousOwners = historyResult.value.previousOwners;
                      }
                      if (historyResult.value.colourChanges !== undefined) {
                        car.colourChanges = historyResult.value.colourChanges;
                      }
                      if (historyResult.value.plateChanges !== undefined) {
                        car.plateChanges = historyResult.value.plateChanges;
                      }
                      
                      // CRITICAL: Save historyCheckId to link Car with VehicleHistory
                      if (historyResult.value._id) {
                        car.historyCheckId = historyResult.value._id.toString();
                        car.historyCheckStatus = 'verified';
                        car.historyCheckDate = historyResult.value.checkDate || new Date();
                        console.log(`✅ [Car Payment] Linked history check: ${car.historyCheckId}`);
                      }
                    } else {
                      console.warn(`⚠️  [Car Payment] Vehicle history fetch failed:`, historyResult.reason?.message);
                    }
                    
                    console.log(`✅ [Car Payment] API calls completed for ${car.registrationNumber}`);
                  } catch (error) {
                    console.error(`❌ [Car Payment] Error fetching vehicle data:`, error.message);
                    // Don't fail payment if data fetch fails
                  }
                } catch (error) {
                  console.error(`⚠️  [Payment] Vehicle data check failed: ${error.message}`);
                  // Continue with save even if check fails
                }
              }
              
              // CRITICAL: Use findOneAndUpdate with $set to properly save Mixed type fields (sellerContact)
              // This ensures business logo and website are saved correctly
              const updateFields = {
                userId: userId || car.userId, // CRITICAL FIX: Always save userId
                price: car.price,
                description: car.description,
                images: car.images,
                postcode: car.postcode,
                locationName: car.locationName,
                latitude: car.latitude,
                longitude: car.longitude,
                location: car.location,
                advertisingPackage: car.advertisingPackage,
                advertStatus: car.advertStatus,
                publishedAt: car.publishedAt,
                // Use dot notation for sellerContact to preserve existing fields
                'sellerContact.type': car.sellerContact.type,
                'sellerContact.phoneNumber': car.sellerContact.phoneNumber,
                'sellerContact.email': car.sellerContact.email,
                'sellerContact.allowEmailContact': car.sellerContact.allowEmailContact,
                'sellerContact.postcode': car.sellerContact.postcode
              };
              
              console.log(`🔍 CRITICAL FIELDS in updateFields:`, {
                userId: updateFields.userId,
                latitude: updateFields.latitude,
                longitude: updateFields.longitude,
                postcode: updateFields.postcode
              });
              
              // Add business info if present
              if (finalBusinessName) updateFields['sellerContact.businessName'] = finalBusinessName;
              if (finalBusinessLogo) updateFields['sellerContact.businessLogo'] = finalBusinessLogo;
              if (finalBusinessWebsite) updateFields['sellerContact.businessWebsite'] = finalBusinessWebsite;
              
              console.log(`🔍 Business info in updateFields:`, {
                businessName: updateFields['sellerContact.businessName'],
                businessLogo: updateFields['sellerContact.businessLogo'],
                businessWebsite: updateFields['sellerContact.businessWebsite']
              });
              
              // Update all other modified fields from universalService
              if (car.isModified('fuelType')) updateFields.fuelType = car.fuelType;
              if (car.isModified('batteryCapacity')) updateFields.batteryCapacity = car.batteryCapacity;
              if (car.isModified('electricRange')) updateFields.electricRange = car.electricRange;
              if (car.isModified('runningCosts')) updateFields.runningCosts = car.runningCosts;
              if (car.isModified('variant')) updateFields.variant = car.variant;
              if (car.isModified('model')) updateFields.model = car.model;
              
              // CRITICAL FIX: Add MOT history and vehicle history data to updateFields
              if (car.motHistory && car.motHistory.length > 0) {
                updateFields.motHistory = car.motHistory;
                updateFields.motDue = car.motDue;
                updateFields.motExpiry = car.motExpiry;
                updateFields.motStatus = car.motStatus;
                console.log(`✅ Adding MOT history to update: ${car.motHistory.length} tests`);
              }
              
              if (car.historyCheckId) {
                updateFields.historyCheckId = car.historyCheckId;
                updateFields.historyCheckStatus = car.historyCheckStatus;
                updateFields.historyCheckDate = car.historyCheckDate;
                console.log(`✅ Adding historyCheckId to update: ${car.historyCheckId}`);
              }
              
              if (car.previousOwners !== undefined) {
                updateFields.previousOwners = car.previousOwners;
              }
              if (car.colourChanges !== undefined) {
                updateFields.colourChanges = car.colourChanges;
              }
              if (car.plateChanges !== undefined) {
                updateFields.plateChanges = car.plateChanges;
              }
              
              console.log(`🔍 Update fields to save:`, JSON.stringify(updateFields, null, 2));
              
              // CRITICAL FIX: Use MongoDB driver directly for Mixed type fields (sellerContact)
              // Mongoose's findByIdAndUpdate doesn't properly handle Mixed type with dot notation
              await mongoose.connection.db.collection('cars').updateOne(
                { _id: car._id },
                { $set: updateFields }
              );
              
              console.log(`✅ Car advert UPDATED and published!`);
              
              // Verify what was actually saved
              const savedCar = await Car.findById(car._id).lean();
              console.log(`🔍 Verification - Business info in saved car:`, {
                businessName: savedCar.sellerContact?.businessName,
                businessLogo: savedCar.sellerContact?.businessLogo,
                businessWebsite: savedCar.sellerContact?.businessWebsite,
                sellerType: savedCar.sellerContact?.type
              });
              
              console.log(`🔍 Verification - Critical fields in saved car:`, {
                userId: savedCar.userId,
                latitude: savedCar.latitude,
                longitude: savedCar.longitude,
                postcode: savedCar.postcode,
                historyCheckId: savedCar.historyCheckId,
                motHistoryCount: savedCar.motHistory?.length || 0
              });
              
            } else {
              // Check if a car with this payment intent already exists (prevent duplicates)
              const existingCarWithPayment = await Car.findOne({
                'advertisingPackage.stripePaymentIntentId': paymentIntent.id
              });
              
              if (existingCarWithPayment) {
                console.log(`⚠️  Car already exists for payment ${paymentIntent.id}, skipping creation`);
                return;
              }
              
              // CREATE new car document with ALL data
              console.log(`📝 Creating NEW car document`);
              
              // Get userId from purchase metadata or create user automatically
              let userId = purchase.metadata.get('userId');
              
              console.log(`🔍 [CAR Payment] Checking userId for new car creation`);
              console.log(`   userId from metadata: ${userId || 'NULL'}`);
              console.log(`   contactDetails.email: ${contactDetails.email || 'NULL'}`);
              console.log(`   purchase.customerEmail: ${purchase.customerEmail || 'NULL'}`);
              
              // AUTOMATIC FIX: Create user account if it doesn't exist
              const userEmail = contactDetails.email || purchase.customerEmail;
              if (!userId && userEmail) {
                console.log(`👤 No userId found, checking if user exists for email: ${userEmail}`);
                
                const User = require('../models/User');
                let user = await User.findOne({ email: userEmail });
                
                if (!user) {
                  // Create user account automatically
                  console.log(`👤 Creating new user account for: ${userEmail}`);
                  const bcrypt = require('bcryptjs');
                  
                  const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
                  const hashedPassword = await bcrypt.hash(tempPassword, 10);
                  
                  user = new User({
                    name: userEmail.split('@')[0],
                    email: userEmail,
                    password: hashedPassword,
                    isEmailVerified: true, // Auto-verify since they completed payment
                    provider: 'local',
                    role: 'user'
                  });
                  
                  await user.save();
                  console.log(`✅ User created automatically: ${user._id}`);
                  console.log(`   Email: ${userEmail}`);
                  console.log(`   Temp password: ${tempPassword}`);
                  console.log(`   ⚠️  SEND THIS PASSWORD TO USER VIA EMAIL!`);
                } else {
                  console.log(`✅ Found existing user: ${user._id}`);
                }
                
                userId = user._id;
                console.log(`✅ userId set to: ${userId}`);
              } else if (!userId) {
                console.error(`❌ CRITICAL: No userId and no email found! Car will be created without userId!`);
                console.error(`   contactDetails:`, contactDetails);
                console.error(`   purchase.customerEmail:`, purchase.customerEmail);
                console.error(`   This car will NOT appear in My Listings!`);
              }
              
              if (userId) {
                console.log(`   ✅ Final userId for car: ${userId}`);
              } else {
                console.error(`   ❌ NO userId - car will be orphaned!`);
              }
              
              // CRITICAL FIX: Normalize data before creating car
              const normalizedEngineSize = vehicleData.engineSize ? 
                parseFloat(String(vehicleData.engineSize).replace(/[^0-9.]/g, '')) : null;
              
              // CRITICAL FIX: Map transmission types to valid enum values
              let normalizedTransmission = 'manual'; // default
              if (vehicleData.transmission) {
                const trans = vehicleData.transmission.toLowerCase();
                if (trans.includes('cvt') || trans.includes('automatic') || trans.includes('auto')) {
                  normalizedTransmission = 'automatic';
                } else if (trans.includes('semi') || trans.includes('dsg') || trans.includes('tiptronic')) {
                  normalizedTransmission = 'semi-automatic';
                } else {
                  normalizedTransmission = 'manual';
                }
              }
              
              // CRITICAL FIX: Map fuel types to valid enum values (including hybrid subtypes)
              let normalizedFuelType = vehicleData.fuelType || 'Petrol';
              const fuelLower = normalizedFuelType.toLowerCase();
              
              // Check for hybrid types FIRST (before checking for petrol/diesel alone)
              if (fuelLower.includes('plug-in') && fuelLower.includes('hybrid')) {
                if (fuelLower.includes('petrol')) {
                  normalizedFuelType = 'Petrol Plug-in Hybrid';
                } else if (fuelLower.includes('diesel')) {
                  normalizedFuelType = 'Diesel Plug-in Hybrid';
                } else {
                  normalizedFuelType = 'Plug-in Hybrid';
                }
              } else if (fuelLower.includes('hybrid') || fuelLower.includes('/')) {
                // "Petrol/Electric" or "Petrol Hybrid Electric"
                if (fuelLower.includes('petrol')) {
                  normalizedFuelType = 'Petrol Hybrid';
                } else if (fuelLower.includes('diesel')) {
                  normalizedFuelType = 'Diesel Hybrid';
                } else {
                  normalizedFuelType = 'Hybrid';
                }
              } else if (fuelLower.includes('electric')) {
                normalizedFuelType = 'Electric';
              } else if (fuelLower.includes('diesel')) {
                normalizedFuelType = 'Diesel';
              } else if (fuelLower.includes('petrol')) {
                normalizedFuelType = 'Petrol';
              } else if (!['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Petrol Hybrid', 'Diesel Hybrid', 'Plug-in Hybrid', 'Petrol Plug-in Hybrid', 'Diesel Plug-in Hybrid'].includes(normalizedFuelType)) {
                normalizedFuelType = 'Petrol'; // default
              }
              
              console.log(`   Engine size: "${vehicleData.engineSize}" → ${normalizedEngineSize}`);
              console.log(`   Transmission: "${vehicleData.transmission}" → "${normalizedTransmission}"`);
              console.log(`   Fuel type: "${vehicleData.fuelType}" → "${normalizedFuelType}"`);
              
              // CRITICAL: Fetch coordinates from postcode for NEW car
              let locationName, latitude, longitude;
              if (contactDetails.postcode) {
                try {
                  console.log(`📍 Fetching coordinates for postcode: ${contactDetails.postcode}`);
                  const postcodeService = require('../services/postcodeService');
                  const postcodeData = await postcodeService.lookupPostcode(contactDetails.postcode);
                  locationName = postcodeData.locationName;
                  latitude = postcodeData.latitude;
                  longitude = postcodeData.longitude;
                  console.log(`✅ Coordinates: ${latitude}, ${longitude} (${locationName})`);
                } catch (error) {
                  console.warn(`⚠️  Could not geocode postcode ${contactDetails.postcode}: ${error.message}`);
                }
              }
              
              // Import validator
              const CarDataValidator = require('../utils/carDataValidator');
              
              // Prepare raw car data
              const rawCarData = {
              advertId: advertId,
              userId: userId || null,
              make: vehicleData.make,
              model: vehicleData.model,
              variant: vehicleData.variant,
              displayTitle: vehicleData.displayTitle,
              year: vehicleData.year,
              mileage: vehicleData.mileage,
              color: vehicleData.color,
              fuelType: normalizedFuelType,
              transmission: normalizedTransmission,
              registrationNumber: vehicleData.registrationNumber,
              engineSize: normalizedEngineSize,
              bodyType: vehicleData.bodyType,
              doors: vehicleData.doors,
              seats: vehicleData.seats,
              co2Emissions: vehicleData.co2Emissions,
              taxStatus: vehicleData.taxStatus,
              motStatus: vehicleData.motStatus,
              motDue: vehicleData.motDue,
              motExpiry: vehicleData.motExpiry,
              dataSource: vehicleData.registrationNumber ? 'DVLA' : 'manual',
              condition: 'used',
              price: advertData.price || vehicleData.estimatedValue?.private || vehicleData.allValuations?.private || vehicleData.estimatedValue,
              description: advertData.description,
              images: advertData.photos ? advertData.photos.map(p => p.url) : [],
              features: advertData.features,
              videoUrl: advertData.videoUrl,
              postcode: contactDetails.postcode,
              locationName: locationName,
              latitude: latitude,
              longitude: longitude,
              sellerContact: {
                type: purchase.sellerType || 'private',
                phoneNumber: contactDetails.phoneNumber,
                email: contactDetails.email,
                allowEmailContact: contactDetails.allowEmailContact,
                postcode: contactDetails.postcode
              },
              advertisingPackage: {
                packageId: purchase.packageId,
                packageName: purchase.packageName,
                duration: purchase.duration,
                price: purchase.amount,
                purchaseDate: new Date(),
                expiryDate: expiryDate,
                stripeSessionId: paymentData.sessionId,
                stripePaymentIntentId: paymentIntent.id
              },
              // CRITICAL FIX: Don't set historyCheckId if it's empty string or invalid
              historyCheckId: (vehicleData.historyCheckId && vehicleData.historyCheckId !== '') ? vehicleData.historyCheckId : undefined,
              historyCheckStatus: vehicleData.registrationNumber ? 'pending' : 'not_required',
              advertStatus: 'active',
              publishedAt: new Date()
            };
            
              // Validate and clean data - removes all null values
              const cleanedCarData = CarDataValidator.validateAndClean(rawCarData);
              
              // Validate required fields
              const validation = CarDataValidator.validateRequired(cleanedCarData);
              if (!validation.isValid) {
                console.error('❌ Car data validation failed:', validation.errors);
                throw new Error(`Invalid car data: ${validation.errors.join(', ')}`);
              }
              
              console.log('✅ Car data validated and cleaned - no null values');
              
              // CRITICAL: Check if car with same registration already exists
              let existingCar = null;
              if (vehicleData.registrationNumber) {
                // First, try to find pending car by same user
                if (purchase.userId) {
                  existingCar = await Car.findOne({
                    registrationNumber: vehicleData.registrationNumber,
                    userId: purchase.userId,
                    advertStatus: { $in: ['pending', 'draft', 'pending_payment'] }
                  });
                  
                  if (existingCar) {
                    console.log(`🔄 Found existing pending car by SAME USER with registration ${vehicleData.registrationNumber}`);
                    console.log(`   User ID: ${purchase.userId}`);
                    console.log(`   Existing car ID: ${existingCar._id}`);
                    console.log(`   Updating existing car instead of creating new one`);
                  }
                }
                
                // If no pending car by same user, check for any pending car without userId
                if (!existingCar) {
                  existingCar = await Car.findOne({
                    registrationNumber: vehicleData.registrationNumber,
                    userId: { $exists: false },
                    advertStatus: { $in: ['pending', 'draft', 'pending_payment'] }
                  });
                  
                  if (existingCar) {
                    console.log(`🔄 Found existing pending car WITHOUT USER with registration ${vehicleData.registrationNumber}`);
                    console.log(`   Existing car ID: ${existingCar._id}`);
                    console.log(`   Will assign to current user and update`);
                  }
                }
              }
              
              // CRITICAL: Use Universal Auto Complete Service BEFORE creating car
              // This ensures we have the correct fuel type (including PHEV detection) and electric data
              if (cleanedCarData.registrationNumber) {
                try {
                  console.log(`🔍 [Payment] Checking vehicle data for new car: ${cleanedCarData.registrationNumber}`);
                  
                  // CRITICAL: ALWAYS fetch fresh data after payment (bypass cache)
                  console.log(`📞 [Payment - New Car] Fetching FRESH MOT and vehicle history: ${cleanedCarData.registrationNumber}`);
                  
                  try {
                    const HistoryService = require('../services/historyService');
                    const MOTHistoryService = require('../services/motHistoryService');
                    
                    const historyService = new HistoryService();
                    const motHistoryService = new MOTHistoryService();
                    
                    // Fetch MOT history and vehicle history in parallel - FORCE REFRESH
                    const [motResult, historyResult] = await Promise.allSettled([
                      motHistoryService.getMOTHistory(cleanedCarData.registrationNumber),
                      historyService.checkVehicleHistory(cleanedCarData.registrationNumber, true) // forceRefresh = true
                    ]);
                    
                    // Process MOT history result
                    if (motResult.status === 'fulfilled' && motResult.value) {
                      console.log(`✅ [Payment - New Car] MOT history fetched successfully`);
                      
                      // Add MOT data to cleanedCarData
                      if (motResult.value.motTests && motResult.value.motTests.length > 0) {
                        cleanedCarData.motHistory = motResult.value.motTests;
                        
                        const latestTest = motResult.value.motTests[0];
                        if (latestTest.expiryDate) {
                          cleanedCarData.motDue = latestTest.expiryDate;
                          cleanedCarData.motExpiry = latestTest.expiryDate;
                          cleanedCarData.motStatus = latestTest.testResult === 'PASSED' ? 'Valid' : 'Expired';
                        }
                      }
                    } else {
                      console.warn(`⚠️  [Payment - New Car] MOT history fetch failed:`, motResult.reason?.message);
                    }
                    
                    // Process vehicle history result
                    if (historyResult.status === 'fulfilled' && historyResult.value) {
                      console.log(`✅ [Payment - New Car] Vehicle history fetched successfully`);
                      
                      // Add history data to cleanedCarData
                      if (historyResult.value.previousOwners !== undefined) {
                        cleanedCarData.previousOwners = historyResult.value.previousOwners;
                      }
                      if (historyResult.value.colourChanges !== undefined) {
                        cleanedCarData.colourChanges = historyResult.value.colourChanges;
                      }
                      if (historyResult.value.plateChanges !== undefined) {
                        cleanedCarData.plateChanges = historyResult.value.plateChanges;
                      }
                      
                      // CRITICAL: Save historyCheckId to link Car with VehicleHistory
                      if (historyResult.value._id) {
                        cleanedCarData.historyCheckId = historyResult.value._id.toString();
                        cleanedCarData.historyCheckStatus = 'verified';
                        cleanedCarData.historyCheckDate = historyResult.value.checkDate || new Date();
                        console.log(`✅ [Payment - New Car] Linked history check: ${cleanedCarData.historyCheckId}`);
                      }
                    } else {
                      console.warn(`⚠️  [Payment - New Car] Vehicle history fetch failed:`, historyResult.reason?.message);
                    }
                    
                    console.log(`✅ [Payment - New Car] API calls completed for ${cleanedCarData.registrationNumber}`);
                  } catch (error) {
                    console.error(`❌ [Payment - New Car] Error fetching vehicle data:`, error.message);
                    // Don't fail payment if data fetch fails
                  }
                  
                  console.log(`   Using vehicle data provided from frontend`);
                  console.log(`   Fuel type: ${cleanedCarData.fuelType}`);
                  console.log(`   Battery capacity: ${cleanedCarData.batteryCapacity || 'N/A'} kWh`);
                  console.log(`   Electric range: ${cleanedCarData.electricRange || 'N/A'} miles`);
                } catch (error) {
                  console.error(`⚠️  [Payment] Vehicle data check failed: ${error.message}`);
                  // Continue with original data if check fails
                }
              }
              
              if (existingCar) {
                // Update existing pending car - SMART MERGE
                // Preserve correct data from first attempt, only update missing/empty fields
                console.log(`🔄 Smart merging data from 2nd attempt with existing car data`);
                
                // Set flag to skip API calls in pre-save hooks (we already called Universal Service)
                existingCar._skipAPICallsInHooks = true;
                
                // Fields that should ALWAYS be updated (payment/advert related)
                existingCar.price = cleanedCarData.price;
                existingCar.description = cleanedCarData.description;
                existingCar.images = cleanedCarData.images;
                existingCar.features = cleanedCarData.features;
                existingCar.videoUrl = cleanedCarData.videoUrl;
                existingCar.postcode = cleanedCarData.postcode;
                existingCar.locationName = cleanedCarData.locationName;
                existingCar.latitude = cleanedCarData.latitude;
                existingCar.longitude = cleanedCarData.longitude;
                existingCar.sellerContact = cleanedCarData.sellerContact;
                existingCar.advertisingPackage = cleanedCarData.advertisingPackage;
                existingCar.advertStatus = 'active';
                existingCar.publishedAt = new Date();
                existingCar.userId = cleanedCarData.userId;
                
                // CRITICAL: Always update fuel type from Universal Service (it has proper PHEV detection)
                existingCar.fuelType = cleanedCarData.fuelType;
                console.log(`   Updated fuel type to: ${existingCar.fuelType}`);
                
                // Update electric data if present (for PHEVs and EVs)
                if (cleanedCarData.batteryCapacity) {
                  existingCar.batteryCapacity = cleanedCarData.batteryCapacity;
                  existingCar.electricRange = cleanedCarData.electricRange;
                  existingCar.homeChargingSpeed = cleanedCarData.homeChargingSpeed;
                  existingCar.rapidChargingSpeed = cleanedCarData.rapidChargingSpeed;
                  existingCar.electricMotorPower = cleanedCarData.electricMotorPower;
                  existingCar.electricMotorTorque = cleanedCarData.electricMotorTorque;
                  existingCar.chargingPortType = cleanedCarData.chargingPortType;
                  existingCar.chargingTime = cleanedCarData.chargingTime;
                  console.log(`   Updated electric data: ${existingCar.batteryCapacity}kWh, ${existingCar.electricRange} miles`);
                }
                
                // Fields that should only be updated if missing in existing car
                if (!existingCar.engineSize || existingCar.engineSize === 0) {
                  existingCar.engineSize = cleanedCarData.engineSize;
                } else {
                  console.log(`   Preserving existing engine size: ${existingCar.engineSize}`);
                }
                
                if (!existingCar.transmission || existingCar.transmission === 'Unknown') {
                  existingCar.transmission = cleanedCarData.transmission;
                } else {
                  console.log(`   Preserving existing transmission: ${existingCar.transmission}`);
                }
                
                // MOT data - update if new data has it and existing doesn't
                if ((!existingCar.motHistory || existingCar.motHistory.length === 0) && 
                    cleanedCarData.motHistory && cleanedCarData.motHistory.length > 0) {
                  existingCar.motHistory = cleanedCarData.motHistory;
                  existingCar.motStatus = cleanedCarData.motStatus;
                  existingCar.motExpiry = cleanedCarData.motExpiry;
                  existingCar.motDue = cleanedCarData.motDue;
                  console.log(`   Added MOT data from 2nd attempt`);
                }
                
                // History check - update if new data has it
                if (cleanedCarData.historyCheckId && !existingCar.historyCheckId) {
                  existingCar.historyCheckId = cleanedCarData.historyCheckId;
                  existingCar.historyCheckStatus = cleanedCarData.historyCheckStatus;
                  existingCar.historyCheckDate = cleanedCarData.historyCheckDate;
                  console.log(`   Added history check data from 2nd attempt`);
                }
                
                // Running costs - update if new data has it
                if (cleanedCarData.runningCosts && Object.keys(cleanedCarData.runningCosts).length > 0) {
                  existingCar.runningCosts = cleanedCarData.runningCosts;
                  console.log(`   Added running costs from 2nd attempt`);
                }
                
                // Other fields - update if missing
                if (!existingCar.variant) existingCar.variant = cleanedCarData.variant;
                if (!existingCar.displayTitle) existingCar.displayTitle = cleanedCarData.displayTitle;
                if (!existingCar.bodyType) existingCar.bodyType = cleanedCarData.bodyType;
                if (!existingCar.doors) existingCar.doors = cleanedCarData.doors;
                if (!existingCar.seats) existingCar.seats = cleanedCarData.seats;
                if (!existingCar.color) existingCar.color = cleanedCarData.color;
                
                car = existingCar;
                // CRITICAL: Skip API calls in pre-save hooks
                car._skipAPICallsInHooks = true;
                await car.save();
                console.log(`✅ Existing car UPDATED and published with smart merge!`);
                console.log(`   Final fuel type: ${car.fuelType}`);
                console.log(`   Final engine size: ${car.engineSize}`);
                console.log(`   Car now belongs to user: ${car.userId || 'N/A'}`);
              } else {
                // Create new car with correct fuel type and electric data
                // Set flag to skip API calls in pre-save hooks (we already called Universal Service)
                cleanedCarData._skipAPICallsInHooks = true;
                car = new Car(cleanedCarData);
                await car.save();
                console.log(`✅ New car advert CREATED and published in database!`);
                console.log(`   Fuel type: ${car.fuelType}`);
                console.log(`   Battery: ${car.batteryCapacity || 'N/A'} kWh`);
                console.log(`   Electric range: ${car.electricRange || 'N/A'} miles`);
              }
            }
            
            // Log final car details
            console.log(`   Database ID: ${car._id}`);
            console.log(`   Advert ID: ${advertId}`);
            console.log(`   Make/Model: ${car.make} ${car.model}`);
            console.log(`   Price: £${car.price}`);
            console.log(`   Photos: ${car.images.length}`);
            console.log(`   Contact: ${car.sellerContact?.email || 'N/A'}`);
            console.log(`   Location: ${car.postcode} (${car.latitude}, ${car.longitude})`);
            console.log(`   User ID: ${car.userId || 'NOT SET - ERROR!'}`);
            console.log(`   History Check ID: ${car.historyCheckId || 'NOT SET'}`);
            console.log(`   MOT History: ${car.motHistory?.length || 0} tests`);
            
            // CRITICAL VERIFICATION
            if (!car.userId) {
              console.error(`❌ CRITICAL ERROR: Car created without userId!`);
            }
            if (!car.latitude || !car.longitude) {
              console.error(`❌ WARNING: Car created without coordinates!`);
            }
            if (!car.historyCheckId && car.registrationNumber) {
              console.error(`❌ WARNING: Car created without historyCheckId link!`);
            }
          } catch (error) {
            console.error(`⚠️  Error creating car advert: ${error.message}`);
            console.error(error.stack);
          }
        }
        
        // Send confirmation email
        if (purchase.customerEmail) {
          const emailService = new EmailService();
          await emailService.sendAdvertisingPackageConfirmation(purchase);
          console.log(`📧 Confirmation email sent to: ${purchase.customerEmail}`);
        }
      } else {
        console.error(`⚠️  Purchase record not found for session: ${paymentData.sessionId}`);
      }
    }
    
    // Helper function to calculate expiry date
    function calculateExpiryDate(duration) {
      const now = new Date();
      
      if (duration.includes('Until sold')) {
        // Set expiry to 1 year from now for "until sold" packages
        return new Date(now.setFullYear(now.getFullYear() + 1));
      }
      
      // Extract weeks from duration string (e.g., "3 weeks" -> 3)
      const weeks = parseInt(duration.match(/\d+/)?.[0] || 4);
      return new Date(now.setDate(now.getDate() + (weeks * 7)));
    }
    
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle payment failure
 */
async function handlePaymentFailure(paymentIntent) {
  try {
    console.log('Processing payment failure:', paymentIntent.id);
    
    // TODO: Log payment failure
    // TODO: Send failure notification if needed
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Handle checkout session completion
 */
async function handleCheckoutCompleted(session) {
  try {
    console.log('Processing checkout completion:', session.id);
    
    // Update purchase record with customer details
    if (session.metadata && session.metadata.type === 'advertising_package') {
      const purchase = await AdvertisingPackagePurchase.findBySessionId(session.id);
      
      if (purchase) {
        // Update customer information
        if (session.customer_details) {
          purchase.customerEmail = session.customer_details.email;
          purchase.customerName = session.customer_details.name;
        }
        
        await purchase.save();
        console.log(`✅ Purchase record updated with customer details: ${purchase._id}`);
      }
    }
    
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

/**
 * Get user credit balance (placeholder - requires auth)
 * GET /api/payments/credits
 */
async function getCreditBalance(req, res) {
  try {
    // TODO: Implement user authentication and credit balance retrieval
    res.json({
      success: true,
      data: {
        balance: 0,
        message: 'Credit system not yet implemented'
      }
    });
  } catch (error) {
    console.error('Error in getCreditBalance:', error);
    const errorResponse = formatErrorResponse(error, 'payment');
    res.status(500).json(errorResponse);
  }
}

/**
 * Use credit for vehicle check (placeholder - requires auth)
 * POST /api/payments/use-credit
 */
async function useCreditForCheck(req, res) {
  try {
    const { vrm } = req.body;
    
    if (!vrm) {
      return res.status(400).json({
        success: false,
        error: 'VRM is required',
      });
    }

    // TODO: Implement credit deduction and vehicle check
    res.json({
      success: false,
      error: 'Credit system not yet implemented'
    });
  } catch (error) {
    console.error('Error in useCreditForCheck:', error);
    const errorResponse = formatErrorResponse(error, 'payment');
    res.status(500).json(errorResponse);
  }
}

/**
 * Get purchase details by session ID
 * GET /api/payments/purchase/:sessionId
 */
async function getPurchaseDetails(req, res) {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    const purchase = await AdvertisingPackagePurchase.findBySessionId(sessionId);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: purchase._id,
        packageId: purchase.packageId,
        packageName: purchase.packageName,
        duration: purchase.duration,
        amount: purchase.amount,
        amountFormatted: purchase.amountFormatted,
        currency: purchase.currency,
        sellerType: purchase.sellerType,
        vehicleValue: purchase.vehicleValue,
        registration: purchase.registration,
        mileage: purchase.mileage,
        customerEmail: purchase.customerEmail,
        paymentStatus: purchase.paymentStatus,
        packageStatus: purchase.packageStatus,
        paidAt: purchase.paidAt,
        activatedAt: purchase.activatedAt,
        expiresAt: purchase.expiresAt,
        createdAt: purchase.createdAt
      }
    });
  } catch (error) {
    console.error('Error in getPurchaseDetails:', error);
    const errorResponse = formatErrorResponse(error, 'payment');
    res.status(500).json(errorResponse);
  }
}

/**
 * Create refund (placeholder - requires admin auth)
 * POST /api/payments/refund
 */
async function createRefund(req, res) {
  try {
    const { paymentIntentId, amount, reason } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required',
      });
    }

    const stripeService = new StripeService();
    const refund = await stripeService.createRefund(paymentIntentId, amount, reason);

    res.json({
      success: true,
      data: refund
    });
  } catch (error) {
    console.error('Error in createRefund:', error);
    const errorResponse = formatErrorResponse(error, 'payment');
    res.status(500).json(errorResponse);
  }
}

/**
 * Create Stripe checkout session for bike advertising package
 * POST /api/payments/create-bike-checkout-session
 * Body: { packageId, packageName, price, duration, advertId, advertData, vehicleData, contactDetails }
 */
async function createBikeCheckoutSession(req, res) {
  try {
    const { 
      packageId, packageName, price, duration,
      advertId, advertData, vehicleData, contactDetails,
      vehicleType, userId // Add userId from request body
    } = req.body;
    
    console.log('📦 createBikeCheckoutSession called with:', {
      packageId, packageName, price, duration,
      vehicleType, advertId: advertId ? 'YES' : 'NO'
    });
    
    if (!packageId || !packageName || !price) {
      console.error('❌ Missing required fields:', { packageId, packageName, price });
      return res.status(400).json({
        success: false,
        error: 'Package details are required',
      });
    }

    const stripeService = new StripeService();
    
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/bikes/advert-payment-success?session_id={CHECKOUT_SESSION_ID}&package=${encodeURIComponent(packageName)}&advertId=${advertId}`;
    const cancelUrl = `${baseUrl}/bikes/advertising-prices?cancelled=true`;

    // Use vehicleType if provided, otherwise default to 'bike'
    const finalVehicleValue = vehicleType || 'bike';

    // Create Stripe checkout session
    const session = await stripeService.createAdvertCheckoutSession(
      packageId,
      packageName,
      price,
      duration,
      'private', // Bikes are private seller only for now
      finalVehicleValue,
      null, // registration
      null, // mileage
      advertId,
      advertData,
      vehicleData,
      contactDetails,
      successUrl,
      cancelUrl
    );

    // Validate and prepare metadata
    const safeAdvertData = advertData || {};
    const safeVehicleData = vehicleData || {};
    const safeContactDetails = contactDetails || {};
    
    console.log('📦 Preparing BIKE purchase record with data:');
    console.log('   Advert ID:', advertId || 'None');
    console.log('   Vehicle Data keys:', Object.keys(safeVehicleData));

    // Save purchase record to database
    const purchase = new AdvertisingPackagePurchase({
      stripeSessionId: session.sessionId,
      customSessionId: session.customSessionId,
      packageId,
      packageName,
      duration,
      amount: price,
      currency: 'gbp',
      sellerType: 'private',
      vehicleValue: 'bike',
      registration: safeVehicleData.registrationNumber || null,
      mileage: safeVehicleData.mileage || null,
      paymentStatus: 'pending',
      packageStatus: 'pending',
      metadata: {
        advertId: advertId || null,
        vehicleType: 'bike',
        advertData: JSON.stringify(safeAdvertData),
        vehicleData: JSON.stringify(safeVehicleData),
        contactDetails: JSON.stringify(safeContactDetails),
        userId: userId || (req.user ? (req.user._id || req.user.id).toString() : null)
      }
    });

    await purchase.save();
    console.log(`✅ Bike purchase record created: ${purchase._id}`);

    // Create bike in database with pending_payment status
    if (advertId && vehicleData) {
      try {
        const Bike = require('../models/Bike');
        const postcodeService = require('../services/postcodeService');
        
        console.log(`📦 Creating/updating bike for advertId: ${advertId}`);
        
        // Calculate expiry date
        const expiryDate = calculateBikeExpiryDate(duration);
        
        // Geocode postcode if available
        let latitude, longitude, locationName;
        if (contactDetails?.postcode) {
          try {
            const postcodeData = await postcodeService.lookupPostcode(contactDetails.postcode);
            latitude = postcodeData.latitude;
            longitude = postcodeData.longitude;
            locationName = postcodeData.locationName;
          } catch (error) {
            console.warn(`⚠️  Could not geocode postcode: ${error.message}`);
          }
        }
        
        // Check if bike already exists
        let bike = await Bike.findOne({ advertId });
        
        if (bike) {
          // Update existing bike
          console.log(`📝 Updating existing bike: ${bike._id}`);
          
          if (safeAdvertData.price) bike.price = safeAdvertData.price;
          if (safeAdvertData.description) bike.description = safeAdvertData.description;
          if (safeAdvertData.photos && safeAdvertData.photos.length > 0) {
            bike.images = safeAdvertData.photos.map(p => p.url || p);
          }
          if (safeContactDetails.postcode) bike.postcode = safeContactDetails.postcode;
          if (locationName) bike.locationName = locationName;
          if (latitude) bike.latitude = latitude;
          if (longitude) bike.longitude = longitude;
          
          if (latitude && longitude) {
            bike.location = {
              type: 'Point',
              coordinates: [longitude, latitude]
            };
          }
          
          bike.sellerContact = {
            type: 'private',
            phoneNumber: safeContactDetails.phoneNumber || bike.sellerContact?.phoneNumber,
            email: safeContactDetails.email || bike.sellerContact?.email,
            allowEmailContact: safeContactDetails.allowEmailContact || false,
            postcode: safeContactDetails.postcode || bike.sellerContact?.postcode
          };
          
          bike.advertisingPackage = {
            packageId: packageId,
            packageName: packageName,
            duration: duration,
            price: price,
            purchaseDate: new Date(),
            expiryDate: expiryDate,
            stripeSessionId: session.sessionId
          };
          
          bike.status = 'pending_payment';
          
          await bike.save();
          console.log(`✅ Bike updated with pending payment status`);
        } else {
          // Create new bike
          console.log(`📝 Creating NEW bike document`);
          bike = new Bike({
            advertId: advertId,
            userId: userId || (req.user ? (req.user._id || req.user.id) : null), // Use userId from request body
            make: vehicleData.make || 'Unknown',
            model: vehicleData.model || 'Unknown',
            year: vehicleData.year || new Date().getFullYear(),
            mileage: vehicleData.mileage || 0,
            color: vehicleData.color || 'Not specified',
            fuelType: vehicleData.fuelType || 'Petrol',
            transmission: 'manual',
            registrationNumber: vehicleData.registrationNumber || null,
            engineCC: parseInt(vehicleData.engineCC || vehicleData.engineSize || '0') || 0,
            bikeType: vehicleData.bikeType || 'Other',
            condition: 'used',
            price: advertData?.price || 0,
            description: advertData?.description || '',
            images: advertData?.photos ? advertData.photos.map(p => p.url || p) : [],
            postcode: contactDetails?.postcode || '',
            locationName: locationName,
            latitude: latitude,
            longitude: longitude,
            location: latitude && longitude ? {
              type: 'Point',
              coordinates: [longitude, latitude]
            } : undefined,
            sellerContact: {
              type: 'private',
              phoneNumber: contactDetails?.phoneNumber,
              email: contactDetails?.email,
              allowEmailContact: contactDetails?.allowEmailContact || false,
              postcode: contactDetails?.postcode
            },
            advertisingPackage: {
              packageId: packageId,
              packageName: packageName,
              duration: duration,
              price: price,
              purchaseDate: new Date(),
              expiryDate: expiryDate,
              stripeSessionId: session.sessionId
            },
            status: 'pending_payment',
            createdAt: new Date()
          });
          
          await bike.save();
          console.log(`✅ Bike created with pending payment status`);
        }
        
        console.log(`   Bike ID: ${bike._id}`);
        console.log(`   Status: ${bike.status}`);
        console.log(`   Make/Model: ${bike.make} ${bike.model}`);
        
      } catch (bikeError) {
        console.error(`❌ ERROR creating/updating bike:`, bikeError.message);
        // Don't fail the checkout session creation if bike save fails
      }
    }
    
    // Helper function to calculate expiry date for bikes
    function calculateBikeExpiryDate(duration) {
      const now = new Date();
      const days = parseInt(duration.match(/\d+/)?.[0] || 14);
      return new Date(now.setDate(now.getDate() + days));
    }

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        url: session.url,
        customSessionId: session.customSessionId,
        packageName: session.packageName,
        amount: session.amount,
        currency: session.currency,
        purchaseId: purchase._id
      }
    });
  } catch (error) {
    console.error('❌ Error in createBikeCheckoutSession:', error);
    const errorResponse = formatErrorResponse(error, 'payment');
    res.status(500).json(errorResponse);
  }
}

/**
 * Create Stripe checkout session for van advertising package
 * POST /api/payments/create-van-checkout-session
 * Body: { packageId, packageName, price, duration, advertId, advertData, vehicleData, contactDetails }
 */
async function createVanCheckoutSession(req, res) {
  try {
    const { 
      packageId, packageName, price, duration, durationDays,
      advertId, advertData, vehicleData, contactDetails,
      vehicleType, userId // Add userId from request body
    } = req.body;
    
    console.log('📦 createVanCheckoutSession called with:', {
      packageId, packageName, price, duration, durationDays,
      vehicleType, advertId: advertId ? 'YES' : 'NO'
    });
    
    if (!packageId || !packageName || !price) {
      console.error('❌ Missing required fields:', { packageId, packageName, price });
      return res.status(400).json({
        success: false,
        error: 'Package details are required',
      });
    }

    const stripeService = new StripeService();
    
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/vans/advert-payment-success?session_id={CHECKOUT_SESSION_ID}&package=${encodeURIComponent(packageName)}&advertId=${advertId}`;
    const cancelUrl = `${baseUrl}/vans/advertising-prices?cancelled=true`;

    // Use vehicleType if provided, otherwise default to 'van'
    const finalVehicleValue = vehicleType || 'van';

    // Create Stripe checkout session
    const session = await stripeService.createAdvertCheckoutSession(
      packageId,
      packageName,
      price,
      duration,
      'private', // Vans are private seller only for now
      finalVehicleValue,
      null, // registration
      null, // mileage
      advertId,
      advertData,
      vehicleData,
      contactDetails,
      successUrl,
      cancelUrl
    );

    // Validate and prepare metadata
    const safeAdvertData = advertData || {};
    const safeVehicleData = vehicleData || {};
    const safeContactDetails = contactDetails || {};
    
    console.log('📦 Preparing VAN purchase record with data:');
    console.log('   Advert ID:', advertId || 'None');
    console.log('   Vehicle Data keys:', Object.keys(safeVehicleData));

    // Save purchase record to database
    const purchase = new AdvertisingPackagePurchase({
      stripeSessionId: session.sessionId,
      customSessionId: session.customSessionId,
      packageId,
      packageName,
      duration,
      amount: price,
      currency: 'gbp',
      sellerType: 'private',
      vehicleValue: 'van',
      registration: safeVehicleData.registrationNumber || null,
      mileage: safeVehicleData.mileage || null,
      paymentStatus: 'pending',
      packageStatus: 'pending',
      metadata: {
        advertId: advertId || null,
        vehicleType: 'van',
        advertData: JSON.stringify(safeAdvertData),
        vehicleData: JSON.stringify(safeVehicleData),
        contactDetails: JSON.stringify(safeContactDetails),
        userId: userId || (req.user ? (req.user._id || req.user.id).toString() : null)
      }
    });

    await purchase.save();
    console.log(`✅ Van purchase record created: ${purchase._id}`);

    // Create van in database with pending_payment status
    if (advertId && vehicleData) {
      try {
        const Van = require('../models/Van');
        const postcodeService = require('../services/postcodeService');
        
        console.log(`📦 Creating/updating van for advertId: ${advertId}`);
        
        // Calculate expiry date based on weeks
        const expiryDate = calculateVanExpiryDate(duration);
        
        // Geocode postcode if available
        let latitude, longitude, locationName;
        if (contactDetails?.postcode) {
          try {
            const postcodeData = await postcodeService.lookupPostcode(contactDetails.postcode);
            latitude = postcodeData.latitude;
            longitude = postcodeData.longitude;
            locationName = postcodeData.locationName;
          } catch (error) {
            console.warn(`⚠️  Could not geocode postcode: ${error.message}`);
          }
        }
        
        // Check if van already exists
        let van = await Van.findOne({ advertId });
        
        if (van) {
          // Update existing van
          console.log(`📝 Updating existing van: ${van._id}`);
          
          if (safeAdvertData.price) van.price = safeAdvertData.price;
          if (safeAdvertData.description) van.description = safeAdvertData.description;
          if (safeAdvertData.photos && safeAdvertData.photos.length > 0) {
            van.images = safeAdvertData.photos.map(p => p.url || p);
          }
          if (safeContactDetails.postcode) van.postcode = safeContactDetails.postcode;
          if (locationName) van.locationName = locationName;
          if (latitude) van.latitude = latitude;
          if (longitude) van.longitude = longitude;
          
          if (latitude && longitude) {
            van.location = {
              type: 'Point',
              coordinates: [longitude, latitude]
            };
          }
          
          van.sellerContact = {
            type: 'private',
            phoneNumber: safeContactDetails.phoneNumber || van.sellerContact?.phoneNumber,
            email: safeContactDetails.email || van.sellerContact?.email,
            allowEmailContact: safeContactDetails.allowEmailContact || false,
            postcode: safeContactDetails.postcode || van.sellerContact?.postcode
          };
          
          van.advertisingPackage = {
            packageId: packageId,
            packageName: packageName,
            duration: duration,
            price: price,
            purchaseDate: new Date(),
            expiryDate: expiryDate,
            stripeSessionId: session.sessionId
          };
          
          van.status = 'pending_payment';
          
          await van.save();
          console.log(`✅ Van updated with pending payment status`);
        } else {
          // Create new van
          console.log(`📝 Creating NEW van document`);
          van = new Van({
            advertId: advertId,
            userId: userId || (req.user ? (req.user._id || req.user.id) : null), // Add userId field
            make: vehicleData.make || 'Unknown',
            model: vehicleData.model || 'Unknown',
            year: vehicleData.year || new Date().getFullYear(),
            mileage: vehicleData.mileage || 0,
            color: vehicleData.color || 'Not specified',
            fuelType: vehicleData.fuelType || 'Diesel',
            transmission: vehicleData.transmission || 'Manual',
            registrationNumber: vehicleData.registration || vehicleData.registrationNumber || null,
            vanType: vehicleData.vanType || 'Panel Van',
            payloadCapacity: vehicleData.payloadCapacity || 0,
            loadLength: vehicleData.loadLength || 0,
            loadWidth: vehicleData.loadWidth || 0,
            loadHeight: vehicleData.loadHeight || 0,
            wheelbase: vehicleData.wheelbase || 'Medium',
            roofHeight: vehicleData.roofHeight || 'Medium',
            condition: 'used',
            price: advertData?.price || 0,
            description: advertData?.description || '',
            images: advertData?.photos ? advertData.photos.map(p => p.url || p) : [],
            postcode: contactDetails?.postcode || '',
            locationName: locationName,
            latitude: latitude,
            longitude: longitude,
            location: latitude && longitude ? {
              type: 'Point',
              coordinates: [longitude, latitude]
            } : undefined,
            sellerContact: {
              type: 'private',
              phoneNumber: contactDetails?.phoneNumber,
              email: contactDetails?.email,
              allowEmailContact: contactDetails?.allowEmailContact || false,
              postcode: contactDetails?.postcode
            },
            advertisingPackage: {
              packageId: packageId,
              packageName: packageName,
              duration: duration,
              price: price,
              purchaseDate: new Date(),
              expiryDate: expiryDate,
              stripeSessionId: session.sessionId
            },
            status: 'pending_payment',
            createdAt: new Date()
          });
          
          await van.save();
          console.log(`✅ Van created with pending payment status`);
        }
        
        console.log(`   Van ID: ${van._id}`);
        console.log(`   Status: ${van.status}`);
        console.log(`   Make/Model: ${van.make} ${van.model}`);
        
      } catch (vanError) {
        console.error(`❌ ERROR creating/updating van:`, vanError.message);
        // Don't fail the checkout session creation if van save fails
      }
    }
    
    // Helper function to calculate expiry date for vans (in weeks)
    function calculateVanExpiryDate(duration) {
      const now = new Date();
      const weeks = parseInt(duration.match(/\d+/)?.[0] || 2);
      return new Date(now.setDate(now.getDate() + (weeks * 7)));
    }

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        url: session.url,
        customSessionId: session.customSessionId,
        packageName: session.packageName,
        amount: session.amount,
        currency: session.currency,
        purchaseId: purchase._id
      }
    });
  } catch (error) {
    console.error('❌ Error in createVanCheckoutSession:', error);
    const errorResponse = formatErrorResponse(error, 'payment');
    res.status(500).json(errorResponse);
  }
}

/**
 * Complete test purchase (for development/testing)
 * POST /api/payments/test-complete-purchase
 */
async function completeTestPurchase(req, res) {
  try {
    const { purchaseId } = req.body;
    
    if (!purchaseId) {
      return res.status(400).json({
        success: false,
        error: 'Purchase ID is required'
      });
    }

    console.log(`🧪 TEST: Completing purchase ${purchaseId}`);

    const purchase = await AdvertisingPackagePurchase.findById(purchaseId);
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }

    if (purchase.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Purchase already completed',
        vehicleId: purchase.vehicleId
      });
    }

    // Simulate payment intent
    const testPaymentIntent = {
      id: 'test_pi_' + Date.now(),
      metadata: {
        type: 'advertising_package',
        sessionId: purchase.stripeSessionId
      }
    };

    // Call the same handler as webhook
    await handlePaymentSuccess(testPaymentIntent);

    // Fetch updated purchase
    const updatedPurchase = await AdvertisingPackagePurchase.findById(purchaseId);

    res.json({
      success: true,
      message: 'Test purchase completed successfully',
      vehicleId: updatedPurchase.vehicleId,
      purchase: {
        id: updatedPurchase._id,
        status: updatedPurchase.paymentStatus,
        packageStatus: updatedPurchase.packageStatus,
        vehicleId: updatedPurchase.vehicleId
      }
    });

  } catch (error) {
    console.error('Error completing test purchase:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete test purchase'
    });
  }
}

/**
 * Auto-complete purchase after payment success (bypasses webhook)
 * POST /api/payments/auto-complete-purchase
 */
async function autoCompletePurchase(req, res) {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    console.log(`🚀 AUTO-COMPLETE: Processing session ${sessionId}`);

    const purchase = await AdvertisingPackagePurchase.findOne({ stripeSessionId: sessionId });
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found for this session'
      });
    }

    if (purchase.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Purchase already completed',
        vehicleId: purchase.vehicleId
      });
    }

    // Simulate payment intent
    const testPaymentIntent = {
      id: 'auto_pi_' + Date.now(),
      metadata: {
        type: 'advertising_package',
        sessionId: purchase.stripeSessionId
      }
    };

    // Call the same handler as webhook
    await handlePaymentSuccess(testPaymentIntent);

    // Fetch updated purchase
    const updatedPurchase = await AdvertisingPackagePurchase.findOne({ stripeSessionId: sessionId });

    // CRITICAL: Fetch MOT and History data for the vehicle (if not already done)
    if (updatedPurchase.vehicleId) {
      const vehicleType = updatedPurchase.metadata?.get('vehicleType') || 'car';
      console.log(`🔍 [Auto-Complete] Fetching MOT/History for ${vehicleType}: ${updatedPurchase.vehicleId}`);
      
      try {
        let vehicle;
        let registrationNumber;
        
        if (vehicleType === 'van') {
          const Van = require('../models/Van');
          vehicle = await Van.findById(updatedPurchase.vehicleId);
          registrationNumber = vehicle?.registrationNumber;
        } else if (vehicleType === 'bike') {
          const Bike = require('../models/Bike');
          vehicle = await Bike.findById(updatedPurchase.vehicleId);
          registrationNumber = vehicle?.registrationNumber;
        } else {
          const Car = require('../models/Car');
          vehicle = await Car.findById(updatedPurchase.vehicleId);
          registrationNumber = vehicle?.registrationNumber;
        }
        
        if (vehicle && registrationNumber) {
          console.log(`📞 [Auto-Complete] Calling MOT/History APIs for: ${registrationNumber}`);
          
          const safeAPI = require('../services/safeAPIService');
          const HistoryService = require('../services/historyService');
          const MOTHistoryService = require('../services/motHistoryService');
          
          const historyService = new HistoryService();
          const motHistoryService = new MOTHistoryService();
          
          // Fetch MOT and History in parallel
          const [motResult, historyResult] = await Promise.allSettled([
            safeAPI.call('mothistory', registrationNumber, null, async () => {
              return await motHistoryService.getMOTHistory(registrationNumber);
            }),
            safeAPI.call('vehiclehistory', registrationNumber, null, async () => {
              return await historyService.checkVehicleHistory(registrationNumber);
            })
          ]);
          
          console.log(`✅ [Auto-Complete] API Results - MOT: ${motResult.status}, History: ${historyResult.status}`);
          
          // Update vehicle with MOT data
          if (motResult.status === 'fulfilled' && motResult.value) {
            const motData = motResult.value.data || motResult.value;
            if (motData.motHistory && Array.isArray(motData.motHistory)) {
              vehicle.motHistory = motData.motHistory;
              if (motData.mot?.motDueDate) {
                vehicle.motDue = motData.mot.motDueDate;
                vehicle.motExpiry = motData.mot.motDueDate;
              }
              if (motData.mot?.motStatus) {
                vehicle.motStatus = motData.mot.motStatus;
              }
              console.log(`✅ [Auto-Complete] MOT data updated: ${vehicle.motHistory.length} tests`);
            }
          }
          
          // Update vehicle with History data
          if (historyResult.status === 'fulfilled' && historyResult.value) {
            const historyData = historyResult.value;
            vehicle.historyCheckData = {
              previousKeepers: historyData.previousKeepers || historyData.keeperChanges || 0,
              writeOffCategory: historyData.writeOffCategory || null,
              stolen: historyData.stolen || false,
              scrapped: historyData.scrapped || false,
              exported: historyData.exported || false,
              colourChanges: historyData.colourChanges || 0,
              plateChanges: historyData.plateChanges || 0,
              outstandingFinance: historyData.outstandingFinance || false
            };
            vehicle.historyCheckStatus = 'completed';
            vehicle.historyCheckDate = new Date();
            console.log(`✅ [Auto-Complete] History data updated: ${vehicle.historyCheckData.previousKeepers} previous keepers`);
          }
          
          // Save vehicle with updated data
          vehicle.markModified('motHistory');
          vehicle.markModified('historyCheckData');
          await vehicle.save();
          console.log(`✅ [Auto-Complete] Vehicle data saved to database`);
        }
      } catch (apiError) {
        console.error(`❌ [Auto-Complete] Error fetching vehicle data:`, apiError.message);
        // Don't fail the response if API calls fail
      }
    }

    res.json({
      success: true,
      message: 'Purchase auto-completed successfully',
      vehicleId: updatedPurchase.vehicleId,
      purchase: {
        id: updatedPurchase._id,
        status: updatedPurchase.paymentStatus,
        packageStatus: updatedPurchase.packageStatus,
        vehicleId: updatedPurchase.vehicleId
      }
    });

  } catch (error) {
    console.error('Error auto-completing purchase:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to auto-complete purchase'
    });
  }
}

module.exports = {
  createCheckoutSession,
  createAdvertCheckoutSession,
  createBikeCheckoutSession,
  createVanCheckoutSession,
  createCreditCheckoutSession,
  getSessionDetails,
  getPurchaseDetails,
  handleWebhook,
  completeTestPurchase,
  autoCompletePurchase,
  getCreditBalance,
  useCreditForCheck,
  createRefund,
};