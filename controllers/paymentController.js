'use strict';

/**
 * Payment Controller
 * Handles HTTP requests for payment processing
 *
 * KEY RULE: fetchVehicleAPIs() is the ONE place that calls HistoryService and
 * MOTHistoryService.  Every code path that needs vehicle data must go through
 * this single helper — never call those services directly anywhere else in this
 * file.
 */

const mongoose  = require('mongoose');
const StripeService                = require('../services/stripeService');
const EmailService                 = require('../services/emailService');
const AdvertisingPackagePurchase   = require('../models/AdvertisingPackagePurchase');
const { formatErrorResponse }      = require('../utils/errorHandlers');

// ─── ONE-TIME vehicle API helper ────────────────────────────────────────────
/**
 * Calls MOT history + vehicle history APIs exactly once for a registration.
 * Returns { motHistory, motDue, motExpiry, motStatus,
 *           historyCheckId, historyCheckStatus, historyCheckDate,
 *           previousOwners, colourChanges, plateChanges }
 *
 * All errors are caught internally — caller never needs try/catch.
 * Pass forceRefresh=true only on first payment (not on retries / auto-complete).
 */
async function fetchVehicleAPIs(registrationNumber, forceRefresh = false) {
  if (!registrationNumber) return {};

  console.log(`📞 [fetchVehicleAPIs] START — ${registrationNumber} (forceRefresh=${forceRefresh})`);

  const HistoryService    = require('../services/historyService');
  const MOTHistoryService = require('../services/motHistoryService');

  const historyService    = new HistoryService();
  const motHistoryService = new MOTHistoryService();

  const [motResult, histResult] = await Promise.allSettled([
    motHistoryService.getMOTHistory(registrationNumber),
    historyService.checkVehicleHistory(registrationNumber, !forceRefresh) // true = use cache
  ]);

  const out = {};

  // ── MOT ──────────────────────────────────────────────────────────────────
  if (motResult.status === 'fulfilled' && motResult.value) {
    const motData = motResult.value;
    const tests   = motData.motTests || motData.motHistory || [];
    if (tests.length > 0) {
      out.motHistory = tests;
      const latest  = tests[0];
      if (latest.expiryDate) {
        out.motDue    = latest.expiryDate;
        out.motExpiry = latest.expiryDate;
        out.motStatus = latest.testResult === 'PASSED' ? 'Valid' : 'Expired';
      }
      console.log(`✅ [fetchVehicleAPIs] MOT: ${tests.length} tests`);
    }
  } else {
    console.warn(`⚠️  [fetchVehicleAPIs] MOT failed: ${motResult.reason?.message}`);
  }

  // ── History ───────────────────────────────────────────────────────────────
  if (histResult.status === 'fulfilled' && histResult.value) {
    const h = histResult.value;
    if (h._id) {
      out.historyCheckId     = h._id.toString();
      out.historyCheckStatus = 'verified';
      out.historyCheckDate   = h.checkDate || new Date();
    }
    if (h.previousOwners  !== undefined) out.previousOwners  = h.previousOwners;
    if (h.colourChanges   !== undefined) out.colourChanges   = h.colourChanges;
    if (h.plateChanges    !== undefined) out.plateChanges    = h.plateChanges;
    console.log(`✅ [fetchVehicleAPIs] History: historyCheckId=${out.historyCheckId}`);
  } else {
    console.warn(`⚠️  [fetchVehicleAPIs] History failed: ${histResult.reason?.message}`);
  }

  console.log(`✅ [fetchVehicleAPIs] DONE — ${registrationNumber}`);
  return out;
}

// ─── Utility helpers ─────────────────────────────────────────────────────────
function calculateExpiryDate(duration) {
  const now = new Date();
  if (duration && duration.includes('Until sold')) {
    return new Date(new Date().setFullYear(now.getFullYear() + 1));
  }
  const weeks = parseInt(duration?.match(/\d+/)?.[0] || '4', 10);
  return new Date(new Date().setDate(now.getDate() + weeks * 7));
}

function normalizeFuelType(raw) {
  if (!raw) return 'Petrol';
  const low = raw.toLowerCase();
  if (low.includes('plug-in') && low.includes('hybrid')) {
    if (low.includes('petrol'))  return 'Petrol Plug-in Hybrid';
    if (low.includes('diesel'))  return 'Diesel Plug-in Hybrid';
    return 'Plug-in Hybrid';
  }
  if (low.includes('hybrid') || low.includes('/')) {
    if (low.includes('petrol'))  return 'Petrol Hybrid';
    if (low.includes('diesel'))  return 'Diesel Hybrid';
    return 'Hybrid';
  }
  if (low.includes('electric')) return 'Electric';
  if (low.includes('diesel'))   return 'Diesel';
  if (low.includes('petrol'))   return 'Petrol';
  const VALID = ['Petrol','Diesel','Electric','Hybrid','Petrol Hybrid','Diesel Hybrid',
                 'Plug-in Hybrid','Petrol Plug-in Hybrid','Diesel Plug-in Hybrid'];
  return VALID.includes(raw) ? raw : 'Petrol';
}

function normalizeTransmission(raw) {
  if (!raw) return 'manual';
  const low = raw.toLowerCase();
  if (low.includes('cvt') || low.includes('automatic') || low.includes('auto')) return 'automatic';
  if (low.includes('semi') || low.includes('dsg') || low.includes('tiptronic'))  return 'semi-automatic';
  return 'manual';
}

function calculatePriceRangeForValidation(valuation, isTradeType) {
  if (!valuation || isNaN(valuation)) return null;
  const v = parseFloat(valuation);
  if (isTradeType) {
    if (v < 1000)   return 'under-1000';
    if (v <= 2000)  return '1001-2000';
    if (v <= 3000)  return '2001-3000';
    if (v <= 5000)  return '3001-5000';
    if (v <= 7000)  return '5001-7000';
    if (v <= 10000) return '7001-10000';
    if (v <= 17000) return '10001-17000';
    return 'over-17000';
  }
  if (v < 1000)   return 'under-1000';
  if (v <= 2999)  return '1000-2999';
  if (v <= 4999)  return '3000-4999';
  if (v <= 6999)  return '5000-6999';
  if (v <= 9999)  return '7000-9999';
  if (v <= 12999) return '10000-12999';
  if (v <= 16999) return '13000-16999';
  if (v <= 24999) return '17000-24999';
  return 'over-24995';
}

// ─── Merge API data into a vehicle document ──────────────────────────────────
// Shared between car / bike / van update paths
function applyAPIDataToVehicle(vehicle, apiData) {
  if (!apiData || !Object.keys(apiData).length) return;

  if (apiData.motHistory?.length) {
    vehicle.motHistory = apiData.motHistory;
    vehicle.motDue     = apiData.motDue    || vehicle.motDue;
    vehicle.motExpiry  = apiData.motExpiry || vehicle.motExpiry;
    vehicle.motStatus  = apiData.motStatus || vehicle.motStatus;
  }
  if (apiData.historyCheckId) {
    vehicle.historyCheckId     = apiData.historyCheckId;
    vehicle.historyCheckStatus = apiData.historyCheckStatus;
    vehicle.historyCheckDate   = apiData.historyCheckDate;
  }
  if (apiData.previousOwners !== undefined) vehicle.previousOwners = apiData.previousOwners;
  if (apiData.colourChanges  !== undefined) vehicle.colourChanges  = apiData.colourChanges;
  if (apiData.plateChanges   !== undefined) vehicle.plateChanges   = apiData.plateChanges;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/payments/create-advert-checkout-session
 */
async function createAdvertCheckoutSession(req, res) {
  try {
    const {
      packageId, packageName, price, duration, sellerType, vehicleValue,
      registration, mileage, advertId, advertData, vehicleData, contactDetails,
      vehicleType, priceExVat, vatAmount, actualVehicleValue
    } = req.body;

    console.log('📦 createAdvertCheckoutSession:', { packageId, packageName, price, duration, sellerType });

    if (!packageId || !packageName || !price) {
      return res.status(400).json({ success: false, error: 'Package details are required' });
    }

    // Price range validation (log only — never blocks payment)
    let valuation = null;
    if (vehicleData?.valuation?.estimatedValue?.private)        valuation = vehicleData.valuation.estimatedValue.private;
    else if (vehicleData?.allValuations?.private)               valuation = vehicleData.allValuations.private;
    else if (typeof actualVehicleValue === 'number')            valuation = actualVehicleValue;
    else if (typeof advertData?.price === 'number')             valuation = advertData.price;
    else if (vehicleData?.valuation?.estimatedValue?.retail)    valuation = vehicleData.valuation.estimatedValue.retail;
    else if (typeof vehicleData?.price === 'number')            valuation = vehicleData.price;

    if (valuation && vehicleValue) {
      const expected = calculatePriceRangeForValidation(valuation, sellerType === 'trade');
      if (expected && expected !== vehicleValue) {
        console.warn(`⚠️  Price range mismatch (not blocking): expected=${expected}, got=${vehicleValue}`);
      }
    }

    const stripeService = new StripeService();
    const baseUrl       = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await stripeService.createAdvertCheckoutSession(
      packageId, packageName, price, duration,
      sellerType || 'private', vehicleValue || vehicleType || 'car',
      registration, mileage, advertId, advertData, vehicleData, contactDetails,
      `${baseUrl}/sell-my-car/advert-payment-success?session_id={CHECKOUT_SESSION_ID}&package=${encodeURIComponent(packageName)}&advertId=${advertId}`,
      `${baseUrl}/sell-my-car/advertising-prices?cancelled=true`
    );

    const purchase = new AdvertisingPackagePurchase({
      stripeSessionId:   session.sessionId,
      customSessionId:   session.customSessionId,
      packageId, packageName, duration,
      amount:            price,
      currency:          'gbp',
      sellerType, vehicleValue,
      registration:      registration || vehicleData?.registrationNumber || null,
      mileage:           mileage || vehicleData?.mileage || null,
      paymentStatus:     'pending',
      packageStatus:     'pending',
      metadata: {
        advertId:       advertId || null,
        advertData:     JSON.stringify(advertData    || {}),
        vehicleData:    JSON.stringify(vehicleData   || {}),
        contactDetails: JSON.stringify(contactDetails || {}),
        userId:         req.user ? (req.user._id || req.user.id).toString() : null
      }
    });

    await purchase.save();
    console.log(`✅ Purchase record created: ${purchase._id}`);

    res.json({
      success: true,
      data: {
        sessionId:       session.sessionId,
        url:             session.url,
        customSessionId: session.customSessionId,
        packageName:     session.packageName,
        amount:          session.amount,
        currency:        session.currency,
        purchaseId:      purchase._id
      }
    });
  } catch (error) {
    console.error('❌ createAdvertCheckoutSession:', error);
    res.status(500).json(formatErrorResponse(error, 'payment'));
  }
}

/**
 * POST /api/payments/create-checkout-session
 */
async function createCheckoutSession(req, res) {
  try {
    const { vrm, customerEmail } = req.body;
    if (!vrm) return res.status(400).json({ success: false, error: 'VRM is required' });

    const stripeService = new StripeService();
    const baseUrl       = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await stripeService.createCheckoutSession(
      vrm, customerEmail,
      `${baseUrl}/vehicle-check/payment/success?session_id={CHECKOUT_SESSION_ID}&registration=${encodeURIComponent(vrm.toUpperCase())}&channel=cars`,
      `${baseUrl}/vehicle-check?cancelled=true&registration=${encodeURIComponent(vrm.toUpperCase())}`
    );

    res.json({
      success: true,
      data: {
        sessionId:       session.sessionId,
        url:             session.url,
        customSessionId: session.customSessionId,
        vrm:             session.vrm,
        amount:          session.amount,
        currency:        session.currency,
        paymentUrl:      `${baseUrl}/vehicle-check/payment/${session.customSessionId}?registration=${encodeURIComponent(vrm.toUpperCase())}&channel=cars`
      }
    });
  } catch (error) {
    console.error('Error in createCheckoutSession:', error);
    res.status(500).json(formatErrorResponse(error, 'payment'));
  }
}

/**
 * POST /api/payments/create-credit-session
 */
async function createCreditCheckoutSession(req, res) {
  try {
    const { creditAmount, customerEmail } = req.body;
    if (!creditAmount || ![5, 10, 25].includes(creditAmount)) {
      return res.status(400).json({ success: false, error: 'Valid credit amount required (5, 10, or 25)' });
    }
    const stripeService = new StripeService();
    const baseUrl       = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session       = await stripeService.createCreditCheckoutSession(
      creditAmount, customerEmail,
      `${baseUrl}/credits/success?session_id={CHECKOUT_SESSION_ID}&credits=${creditAmount}`,
      `${baseUrl}/credits?cancelled=true`
    );
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error in createCreditCheckoutSession:', error);
    res.status(500).json(formatErrorResponse(error, 'payment'));
  }
}

/**
 * GET /api/payments/session/:sessionId
 */
async function getSessionDetails(req, res) {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID is required' });

    const stripeService = new StripeService();
    const session       = await stripeService.getCheckoutSession(sessionId);

    res.json({
      success: true,
      data: {
        sessionId:     session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email,
        amountTotal:   session.amount_total,
        currency:      session.currency,
        metadata:      session.metadata,
        created:       new Date(session.created * 1000)
      }
    });
  } catch (error) {
    console.error('Error in getSessionDetails:', error);
    res.status(500).json(formatErrorResponse(error, 'payment'));
  }
}

/**
 * POST /api/payments/webhook
 */
async function handleWebhook(req, res) {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) return res.status(400).json({ success: false, error: 'Missing Stripe signature' });

    const stripeService = new StripeService();
    const event         = stripeService.verifyWebhookSignature(req.body, signature);
    console.log('Stripe webhook:', event.type);

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
        console.log(`Unhandled event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error in handleWebhook:', error);
    res.status(400).json({ success: false, error: 'Webhook processing failed' });
  }
}

// ─── handlePaymentSuccess ────────────────────────────────────────────────────
async function handlePaymentSuccess(paymentIntent) {
  try {
    console.log('💳 handlePaymentSuccess:', paymentIntent.id);

    // Idempotency guard — don't process same payment twice
    const alreadyDone = await AdvertisingPackagePurchase.findOne({
      stripePaymentIntentId: paymentIntent.id,
      paymentStatus: 'paid'
    });
    if (alreadyDone) {
      console.log(`⚠️  Payment ${paymentIntent.id} already processed — skipping`);
      return;
    }

    const stripeService = new StripeService();
    const paymentData   = await stripeService.processSuccessfulPayment(paymentIntent);

    // ── Vehicle history report purchase ──────────────────────────────────────
    if (paymentData.type === 'vehicle_history_report' && paymentData.vrm) {
      console.log(`🔍 [Payment] Vehicle history report for: ${paymentData.vrm}`);
      try {
        // fetchVehicleAPIs is the ONLY place we call these services
        await fetchVehicleAPIs(paymentData.vrm, false);
        console.log(`✅ [Payment] History report generated for: ${paymentData.vrm}`);
      } catch (err) {
        console.error(`❌ [Payment] History report failed:`, err.message);
      }
      return;
    }

    // ── Credit package purchase ───────────────────────────────────────────────
    if (paymentData.type === 'credit_package') {
      console.log(`Credits purchase: ${paymentData.creditAmount}`);
      // TODO: update user credit balance
      return;
    }

    // ── Advertising package purchase ─────────────────────────────────────────
    if (paymentData.type !== 'advertising_package') return;

    const purchase = await AdvertisingPackagePurchase.findBySessionId(paymentData.sessionId);
    if (!purchase) {
      console.error(`⚠️  Purchase not found for session: ${paymentData.sessionId}`);
      return;
    }

    await purchase.markAsPaid(paymentIntent.id);
    await purchase.activatePackage();
    console.log(`✅ Package activated: ${purchase._id} — ${purchase.packageName}`);

    const advertId      = purchase.metadata.get('advertId');
    if (!advertId) {
      console.warn('⚠️  No advertId in metadata — nothing to publish');
      return;
    }

    const vehicleType   = purchase.metadata.get('vehicleType') || 'car';
    const advertData    = JSON.parse(purchase.metadata.get('advertData')     || '{}');
    const vehicleData   = JSON.parse(purchase.metadata.get('vehicleData')    || '{}');
    const contactDetails= JSON.parse(purchase.metadata.get('contactDetails') || '{}');
    const userId        = purchase.metadata.get('userId');

    const expiryDate    = calculateExpiryDate(purchase.duration);
    const postcodeService = require('../services/postcodeService');

    // Geocode postcode once
    let latitude, longitude, locationName;
    if (contactDetails.postcode) {
      try {
        const pc = await postcodeService.lookupPostcode(contactDetails.postcode);
        latitude    = pc.latitude;
        longitude   = pc.longitude;
        locationName= pc.locationName;
      } catch (err) {
        console.warn(`⚠️  Postcode geocode failed: ${err.message}`);
      }
    }

    const packageBlock = {
      packageId:             purchase.packageId,
      packageName:           purchase.packageName,
      duration:              purchase.duration,
      price:                 purchase.amount,
      purchaseDate:          new Date(),
      expiryDate,
      stripeSessionId:       paymentData.sessionId,
      stripePaymentIntentId: paymentIntent.id
    };

    const locationBlock = {
      postcode:     contactDetails.postcode || '',
      locationName, latitude, longitude,
      location:     latitude && longitude
        ? { type: 'Point', coordinates: [longitude, latitude] }
        : undefined
    };

    // ── Seller type detection ─────────────────────────────────────────────────
    const hasLogo    = !!(advertData?.businessLogo    && advertData.businessLogo.trim());
    const hasWebsite = !!(advertData?.businessWebsite && advertData.businessWebsite.trim());
    const sellerType = (hasLogo || hasWebsite) ? 'trade' : 'private';

    // ── Ensure user exists ────────────────────────────────────────────────────
    const resolvedUserId = await ensureUser(userId, contactDetails.email || purchase.customerEmail);

    // ════════════════════════════════════════════════════════════════════════
    // BIKE
    // ════════════════════════════════════════════════════════════════════════
    if (vehicleType === 'bike') {
      const Bike = require('../models/Bike');
      let bike   = await Bike.findOne({ advertId });

      if (bike) {
        if (bike.status === 'active' && bike.advertisingPackage?.stripePaymentIntentId === paymentIntent.id) {
          console.log(`⚠️  Bike already activated — skipping`);
        } else {
          // Update existing
          const isRelistBike = bike.status === 'draft' || bike.status === 'expired';
          
          Object.assign(bike, {
            make:   vehicleData.make  || bike.make,
            model:  vehicleData.model || bike.model,
            variant:vehicleData.variant|| bike.variant,
            color:  vehicleData.color || bike.color,
            engineCC: parseInt(vehicleData.engineCC || vehicleData.engineSize || '0') || bike.engineCC,
            registrationNumber: vehicleData.registrationNumber || vehicleData.registration || bike.registrationNumber,
            price:       advertData.price  || bike.price,
            description: advertData.description || bike.description,
            images:      advertData.photos ? advertData.photos.map(p => p.url || p) : bike.images,
            ...locationBlock,
            sellerContact: buildSellerContact(sellerType, contactDetails, advertData, bike.sellerContact),
            advertisingPackage: packageBlock,
            status:      'active',
            publishedAt: new Date()
          });

          if (advertData.runningCosts) bike.runningCosts = advertData.runningCosts;

          // ── ONE API call for this bike (skip if relist) ────────────────────
          if (bike.registrationNumber && !isRelistBike) {
            const apiData = await fetchVehicleAPIs(bike.registrationNumber, true);
            applyAPIDataToVehicle(bike, apiData);
          } else if (isRelistBike) {
            console.log(`🔄 [Bike Payment] RELIST detected — skipping API calls`);
          }

          bike._skipAPICallsInHooks = true;
          await bike.save();
          console.log(`✅ Bike UPDATED and published: ${bike._id}`);
        }
      } else {
        // Create new bike
        bike = new Bike({
          advertId, userId: resolvedUserId,
          make:   vehicleData.make  || 'Unknown',
          model:  vehicleData.model || 'Unknown',
          year:   vehicleData.year  || new Date().getFullYear(),
          mileage:vehicleData.mileage || 0,
          color:  vehicleData.color || 'Not specified',
          fuelType: vehicleData.fuelType || 'Petrol',
          transmission: 'manual',
          registrationNumber: vehicleData.registrationNumber || null,
          engineCC: parseInt(vehicleData.engineCC || vehicleData.engineSize || '0') || 0,
          bikeType: vehicleData.bikeType || 'Other',
          condition: 'used',
          price:       advertData.price || 0,
          description: advertData.description || '',
          images:      advertData.photos ? advertData.photos.map(p => p.url || p) : [],
          ...locationBlock,
          sellerContact:      buildSellerContact(sellerType, contactDetails, advertData),
          runningCosts:       advertData.runningCosts || undefined,
          advertisingPackage: packageBlock,
          status:      'active',
          publishedAt: new Date()
        });

        // ── ONE API call for new bike ─────────────────────────────────────
        if (bike.registrationNumber) {
          const apiData = await fetchVehicleAPIs(bike.registrationNumber, true);
          applyAPIDataToVehicle(bike, apiData);
        }

        bike._skipAPICallsInHooks = true;
        await bike.save();
        console.log(`✅ Bike CREATED and published: ${bike._id}`);
      }

      await sendConfirmationEmail(purchase);
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // VAN
    // ════════════════════════════════════════════════════════════════════════
    if (vehicleType === 'van') {
      const Van = require('../models/Van');
      let van   = await Van.findOne({ advertId });

      if (van) {
        if (van.status === 'active' && van.advertisingPackage?.stripePaymentIntentId === paymentIntent.id) {
          console.log(`⚠️  Van already activated — skipping`);
        } else {
          const isRelistVan = van.status === 'draft' || van.status === 'expired';
          
          Object.assign(van, {
            price:       advertData.price || van.price,
            description: advertData.description || van.description,
            images:      advertData.photos ? advertData.photos.map(p => p.url || p) : van.images,
            ...locationBlock,
            sellerContact: buildSellerContact('private', contactDetails, advertData, van.sellerContact),
            advertisingPackage: packageBlock,
            status:      'active',
            publishedAt: new Date()
          });

          if (advertData.runningCosts)  van.runningCosts = advertData.runningCosts;
          if (advertData.features)      van.features     = advertData.features;

          // ── ONE API call for this van (skip if relist) ─────────────────────
          if (van.registrationNumber && !isRelistVan) {
            const apiData = await fetchVehicleAPIs(van.registrationNumber, true);
            applyAPIDataToVehicle(van, apiData);
          } else if (isRelistVan) {
            console.log(`🔄 [Van Payment] RELIST detected — skipping API calls`);
          }

          van._skipAPICallsInHooks = true;
          await van.save();
          console.log(`✅ Van UPDATED and published: ${van._id}`);
        }
      } else {
        van = new (require('../models/Van'))({
          advertId, userId: resolvedUserId,
          make:   vehicleData.make  || 'Unknown',
          model:  vehicleData.model || 'Unknown',
          year:   vehicleData.year  || new Date().getFullYear(),
          mileage:vehicleData.mileage || 0,
          color:  vehicleData.color || 'Not specified',
          fuelType: vehicleData.fuelType || 'Diesel',
          transmission: vehicleData.transmission || 'Manual',
          registrationNumber: vehicleData.registration || vehicleData.registrationNumber || null,
          vanType:         vehicleData.vanType || 'Panel Van',
          payloadCapacity: vehicleData.payloadCapacity || 0,
          condition: 'used',
          price:       advertData.price || 0,
          description: advertData.description || '',
          images:      advertData.photos ? advertData.photos.map(p => p.url || p) : [],
          ...locationBlock,
          sellerContact:      buildSellerContact('private', contactDetails, advertData),
          runningCosts:       advertData.runningCosts || undefined,
          features:           advertData.features || [],
          advertisingPackage: packageBlock,
          status:      'active',
          publishedAt: new Date()
        });

        // ── ONE API call for new van ──────────────────────────────────────
        if (van.registrationNumber) {
          const apiData = await fetchVehicleAPIs(van.registrationNumber, true);
          applyAPIDataToVehicle(van, apiData);
        }

        van._skipAPICallsInHooks = true;
        await van.save();
        console.log(`✅ Van CREATED and published: ${van._id}`);
      }

      await sendConfirmationEmail(purchase);
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // CAR (default)
    // ════════════════════════════════════════════════════════════════════════
    const Car            = require('../models/Car');
    const CarDataValidator = require('../utils/carDataValidator');

    // Check if car already exists for this advertId
    let car = await Car.findOne({ advertId });

    // Idempotency: skip if already activated for this payment
    if (car && car.advertStatus === 'active' && car.advertisingPackage?.stripePaymentIntentId === paymentIntent.id) {
      console.log(`⚠️  Car already activated for payment ${paymentIntent.id} — skipping`);
      return;
    }

    // Prevent duplicate creation
    if (!car) {
      const byPayment = await Car.findOne({ 'advertisingPackage.stripePaymentIntentId': paymentIntent.id });
      if (byPayment) {
        console.log(`⚠️  Car already exists for payment ${paymentIntent.id} — skipping`);
        return;
      }
    }

    // Normalise data from frontend
    const normalizedEngineSize    = vehicleData.engineSize
      ? parseFloat(String(vehicleData.engineSize).replace(/[^0-9.]/g, ''))
      : null;
    const normalizedTransmission  = normalizeTransmission(vehicleData.transmission);
    const normalizedFuelType      = normalizeFuelType(vehicleData.fuelType);

    // ── FETCH MOT + History API (£1.84) ──────────────────────────────────────
    // Car.js pre-save hook does NOT call History/MOT APIs (Step 12 & 13 removed)
    // Payment controller must call fetchVehicleAPIs() to get MOT + History data
    // SKIP API calls if this is a RELIST (car already exists with data)
    let apiData = {};
    const isRelist = car && (car.advertStatus === 'draft' || car.advertStatus === 'expired');
    
    if (vehicleData.registrationNumber && !isRelist) {
      console.log(`📞 [Car Payment] Fetching MOT + History for: ${vehicleData.registrationNumber}`);
      try {
        apiData = await fetchVehicleAPIs(vehicleData.registrationNumber, false); // use cache
        console.log(`✅ [Car Payment] API data fetched:`, {
          motHistory: apiData.motHistory?.length || 0,
          historyCheckId: apiData.historyCheckId || 'none'
        });
      } catch (error) {
        console.error(`❌ [Car Payment] fetchVehicleAPIs failed:`, error.message);
        // Continue without API data - car will still be created
      }
    } else if (isRelist) {
      console.log(`🔄 [Car Payment] RELIST detected — skipping API calls (data already in database)`);
    }

    // Build the base price
    const carPrice =
      (typeof advertData.price === 'number'  ? advertData.price  : null) ||
      vehicleData.estimatedValue?.private ||
      vehicleData.allValuations?.private  ||
      (typeof vehicleData.estimatedValue === 'number' ? vehicleData.estimatedValue : null) ||
      (typeof vehicleData.price === 'number' ? vehicleData.price : null) ||
      0;

    if (car) {
      // ── UPDATE existing car ─────────────────────────────────────────────
      console.log(`📝 Updating existing car: ${car._id}`);

      if (resolvedUserId && !car.userId) car.userId = resolvedUserId;

      car.price          = carPrice;
      car.description    = advertData.description || car.description;
      car.images         = (advertData.photos && advertData.photos.length > 0) ? advertData.photos.map(p => p.url || p) : car.images;
      car.features       = advertData.features  || car.features;
      car.videoUrl       = advertData.videoUrl  || car.videoUrl;
      car.fuelType       = normalizedFuelType;
      car.transmission   = normalizedTransmission;
      car.engineSize     = normalizedEngineSize  || car.engineSize;
      car.advertisingPackage = packageBlock;
      car.advertStatus   = 'active';
      car.publishedAt    = new Date();

      Object.assign(car, locationBlock);

      // Seller contact
      const sc = buildSellerContact(sellerType, contactDetails, advertData, car.sellerContact);
      car.sellerContact  = sc;
      car.markModified('sellerContact');

      // Apply MOT + History data from fetchVehicleAPIs()
      applyAPIDataToVehicle(car, apiData);

      // Car.js pre-save hook will handle DVLA, variant, coordinates
      // History/MOT already fetched above via fetchVehicleAPIs()
      await car.save();
      console.log(`✅ Car UPDATED and published: ${car._id}`);

    } else {
      // ── CREATE new car ──────────────────────────────────────────────────
      console.log(`📝 Creating new car`);

      // Check for orphaned pending car with same registration
      let existingPending = null;
      if (vehicleData.registrationNumber) {
        existingPending = await Car.findOne({
          registrationNumber: vehicleData.registrationNumber,
          advertStatus: { $in: ['pending', 'draft', 'pending_payment'] },
          $or: [
            { userId: resolvedUserId },
            { userId: { $exists: false } }
          ]
        });
      }

      const rawCarData = {
        advertId, userId: resolvedUserId,
        make:       vehicleData.make,
        model:      vehicleData.model,
        variant:    vehicleData.variant,
        displayTitle: vehicleData.displayTitle,
        year:       vehicleData.year,
        mileage:    vehicleData.mileage,
        color:      vehicleData.color,
        fuelType:   normalizedFuelType,
        transmission: normalizedTransmission,
        registrationNumber: vehicleData.registrationNumber,
        engineSize: normalizedEngineSize,
        bodyType:   vehicleData.bodyType,
        doors:      vehicleData.doors,
        seats:      vehicleData.seats,
        co2Emissions: vehicleData.co2Emissions,
        taxStatus:  vehicleData.taxStatus,
        // motStatus, motDue, motExpiry, motHistory, historyCheckId
        // will all be fetched by Car.js pre-save hook automatically
        dataSource:   vehicleData.registrationNumber ? 'DVLA' : 'manual',
        condition:    'used',
        price:        carPrice,
        description:  advertData.description,
        images:       advertData.photos ? advertData.photos.map(p => p.url) : [],
        features:     advertData.features,
        videoUrl:     advertData.videoUrl,
        ...locationBlock,
        sellerContact:      buildSellerContact(sellerType, contactDetails, advertData),
        advertisingPackage: packageBlock,
        advertStatus:       'active',
        publishedAt:        new Date()
      };

      const cleanedData  = CarDataValidator.validateAndClean(rawCarData);
      const validation   = CarDataValidator.validateRequired(cleanedData);
      if (!validation.isValid) {
        throw new Error(`Invalid car data: ${validation.errors.join(', ')}`);
      }

      if (existingPending) {
        // Smart-merge into existing pending document
        console.log(`🔄 Merging into existing pending car: ${existingPending._id}`);
        Object.assign(existingPending, cleanedData);
        // Car.js pre-save hook must run — do NOT set _skipAPICallsInHooks
        car = existingPending;
      } else {
        // Car.js pre-save hook must run — do NOT set _skipAPICallsInHooks
        car = new Car(cleanedData);
      }

      await car.save();
      console.log(`✅ Car CREATED and published: ${car._id}`);
    }

    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Price: £${car.price}`);
    console.log(`   userId: ${car.userId || 'NOT SET'}`);
    console.log(`   MOT tests: ${car.motHistory?.length || 0}`);
    console.log(`   historyCheckId: ${car.historyCheckId || 'not set'}`);

    await sendConfirmationEmail(purchase);

  } catch (error) {
    console.error('❌ handlePaymentSuccess:', error);
  }
}

// ─── Small helpers used inside handlePaymentSuccess ──────────────────────────

function buildSellerContact(type, contactDetails, advertData, existing = {}) {
  return {
    type,
    phoneNumber:        contactDetails.phoneNumber        || existing.phoneNumber        || '',
    email:              contactDetails.email              || existing.email              || '',
    allowEmailContact:  contactDetails.allowEmailContact  || existing.allowEmailContact  || false,
    postcode:           contactDetails.postcode           || existing.postcode           || '',
    businessName:       advertData?.businessName          || existing.businessName       || '',
    businessLogo:       advertData?.businessLogo          || existing.businessLogo       || '',
    businessWebsite:    advertData?.businessWebsite       || existing.businessWebsite    || ''
  };
}

function buildCarUpdateFields(car, userId, apiData, locationBlock, packageBlock, sc) {
  const fields = {
    userId:            userId || car.userId,
    price:             car.price,
    description:       car.description,
    images:            car.images,
    features:          car.features,
    videoUrl:          car.videoUrl,
    fuelType:          car.fuelType,
    transmission:      car.transmission,
    engineSize:        car.engineSize,
    ...locationBlock,
    advertisingPackage: packageBlock,
    advertStatus:      'active',
    publishedAt:       car.publishedAt,
    'sellerContact.type':             sc.type,
    'sellerContact.phoneNumber':      sc.phoneNumber,
    'sellerContact.email':            sc.email,
    'sellerContact.allowEmailContact':sc.allowEmailContact,
    'sellerContact.postcode':         sc.postcode
  };

  if (sc.businessName)    fields['sellerContact.businessName']    = sc.businessName;
  if (sc.businessLogo)    fields['sellerContact.businessLogo']    = sc.businessLogo;
  if (sc.businessWebsite) fields['sellerContact.businessWebsite'] = sc.businessWebsite;

  if (apiData.motHistory?.length) {
    fields.motHistory = apiData.motHistory;
    fields.motDue     = apiData.motDue;
    fields.motExpiry  = apiData.motExpiry;
    fields.motStatus  = apiData.motStatus;
  }
  if (apiData.historyCheckId) {
    fields.historyCheckId     = apiData.historyCheckId;
    fields.historyCheckStatus = apiData.historyCheckStatus;
    fields.historyCheckDate   = apiData.historyCheckDate;
  }
  if (apiData.previousOwners !== undefined) fields.previousOwners = apiData.previousOwners;
  if (apiData.colourChanges  !== undefined) fields.colourChanges  = apiData.colourChanges;
  if (apiData.plateChanges   !== undefined) fields.plateChanges   = apiData.plateChanges;

  return fields;
}

async function ensureUser(userId, email) {
  if (userId) return userId;
  if (!email) {
    console.warn('⚠️ No userId and no email in payment session — will rely on existing car userId');
    return null;
  }
  const User   = require('../models/User');
  const bcrypt = require('bcryptjs');
  let user     = await User.findOne({ email });
  if (!user) {
    const tmp    = Math.random().toString(36).slice(-8) + 'Aa1!';
    const hashed = await bcrypt.hash(tmp, 10);
    user = await new User({
      name: email.split('@')[0], email,
      password: hashed, isEmailVerified: true, provider: 'local', role: 'user'
    }).save();
    console.log(`✅ Auto-created user: ${user._id} (${email})`);
  } else {
    console.log(`✅ Existing user: ${user._id}`);
  }
  return user._id;
}

async function sendConfirmationEmail(purchase) {
  if (!purchase?.customerEmail) return;
  try {
    const emailService = new EmailService();
    await emailService.sendAdvertisingPackageConfirmation(purchase);
    console.log(`📧 Confirmation email sent to: ${purchase.customerEmail}`);
  } catch (err) {
    console.warn(`⚠️  Email send failed: ${err.message}`);
  }
}

// ─── handlePaymentFailure ────────────────────────────────────────────────────
async function handlePaymentFailure(paymentIntent) {
  try {
    console.log('Payment failure:', paymentIntent.id);
    // TODO: log + notify if needed
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// ─── handleCheckoutCompleted ─────────────────────────────────────────────────
async function handleCheckoutCompleted(session) {
  try {
    console.log('Checkout completed:', session.id);
    if (session.metadata?.type === 'advertising_package') {
      const purchase = await AdvertisingPackagePurchase.findBySessionId(session.id);
      if (purchase && session.customer_details) {
        purchase.customerEmail = session.customer_details.email;
        purchase.customerName  = session.customer_details.name;
        await purchase.save();
        console.log(`✅ Purchase customer details saved: ${purchase._id}`);
      }
    }
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

// ─── Remaining route handlers ────────────────────────────────────────────────

async function getCreditBalance(req, res) {
  res.json({ success: true, data: { balance: 0, message: 'Credit system not yet implemented' } });
}

async function useCreditForCheck(req, res) {
  const { vrm } = req.body;
  if (!vrm) return res.status(400).json({ success: false, error: 'VRM is required' });
  res.json({ success: false, error: 'Credit system not yet implemented' });
}

async function getPurchaseDetails(req, res) {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID is required' });

    const purchase = await AdvertisingPackagePurchase.findBySessionId(sessionId);
    if (!purchase)  return res.status(404).json({ success: false, error: 'Purchase not found' });

    res.json({
      success: true,
      data: {
        id:             purchase._id,
        packageId:      purchase.packageId,
        packageName:    purchase.packageName,
        duration:       purchase.duration,
        amount:         purchase.amount,
        amountFormatted:purchase.amountFormatted,
        currency:       purchase.currency,
        sellerType:     purchase.sellerType,
        vehicleValue:   purchase.vehicleValue,
        registration:   purchase.registration,
        mileage:        purchase.mileage,
        customerEmail:  purchase.customerEmail,
        paymentStatus:  purchase.paymentStatus,
        packageStatus:  purchase.packageStatus,
        paidAt:         purchase.paidAt,
        activatedAt:    purchase.activatedAt,
        expiresAt:      purchase.expiresAt,
        createdAt:      purchase.createdAt
      }
    });
  } catch (error) {
    console.error('Error in getPurchaseDetails:', error);
    res.status(500).json(formatErrorResponse(error, 'payment'));
  }
}

async function createRefund(req, res) {
  try {
    const { paymentIntentId, amount, reason } = req.body;
    if (!paymentIntentId) return res.status(400).json({ success: false, error: 'Payment intent ID is required' });
    const stripeService = new StripeService();
    const refund        = await stripeService.createRefund(paymentIntentId, amount, reason);
    res.json({ success: true, data: refund });
  } catch (error) {
    console.error('Error in createRefund:', error);
    res.status(500).json(formatErrorResponse(error, 'payment'));
  }
}

async function completeTestPurchase(req, res) {
  try {
    const { purchaseId } = req.body;
    if (!purchaseId) return res.status(400).json({ success: false, error: 'Purchase ID is required' });

    const purchase = await AdvertisingPackagePurchase.findById(purchaseId);
    if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });
    if (purchase.paymentStatus === 'paid') {
      return res.json({ success: true, message: 'Purchase already completed', vehicleId: purchase.vehicleId });
    }

    await handlePaymentSuccess({ id: 'test_pi_' + Date.now(), metadata: { type: 'advertising_package', sessionId: purchase.stripeSessionId } });
    const updated = await AdvertisingPackagePurchase.findById(purchaseId);
    res.json({ success: true, message: 'Test purchase completed', vehicleId: updated.vehicleId,
      purchase: { id: updated._id, status: updated.paymentStatus, packageStatus: updated.packageStatus, vehicleId: updated.vehicleId } });
  } catch (error) {
    console.error('Error completing test purchase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function autoCompletePurchase(req, res) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID is required' });

    const purchase = await AdvertisingPackagePurchase.findOne({ stripeSessionId: sessionId });
    if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found for this session' });

    if (purchase.paymentStatus === 'paid') {
      return res.json({ success: true, message: 'Purchase already completed', vehicleId: purchase.vehicleId });
    }

    // handlePaymentSuccess already calls fetchVehicleAPIs once internally — no extra API calls here
    await handlePaymentSuccess({ id: 'auto_pi_' + Date.now(), metadata: { type: 'advertising_package', sessionId: purchase.stripeSessionId } });

    const updated = await AdvertisingPackagePurchase.findOne({ stripeSessionId: sessionId });
    res.json({
      success: true,
      message: 'Purchase auto-completed',
      vehicleId: updated.vehicleId,
      purchase: { id: updated._id, status: updated.paymentStatus, packageStatus: updated.packageStatus, vehicleId: updated.vehicleId }
    });
  } catch (error) {
    console.error('Error auto-completing purchase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  createCheckoutSession,
  createAdvertCheckoutSession,
  createCreditCheckoutSession,
  getSessionDetails,
  getPurchaseDetails,
  handleWebhook,
  completeTestPurchase,
  autoCompletePurchase,
  getCreditBalance,
  useCreditForCheck,
  createRefund
};