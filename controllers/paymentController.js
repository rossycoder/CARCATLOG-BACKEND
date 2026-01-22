/**
 * Payment Controller
 * Handles HTTP requests for payment processing
 */

const StripeService = require('../services/stripeService');
const HistoryService = require('../services/historyService');
const EmailService = require('../services/emailService');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const { formatErrorResponse } = require('../utils/errorHandlers');
const vehicleFormatter = require('../utils/vehicleFormatter');

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
      vehicleType, priceExVat, vatAmount
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
        contactDetails: JSON.stringify(safeContactDetails)
      }
    });

    await purchase.save();
    console.log(`✅ Purchase record created with advert data: ${purchase._id}`);

    // IMMEDIATELY create/update Car in database (even with pending payment)
    if (advertId && vehicleData && advertData) {
      try {
        const Car = require('../models/Car');
        const postcodeService = require('../services/postcodeService');
        
        console.log(`📦 Creating/updating car immediately for advertId: ${advertId}`);
        
        // Calculate expiry date
        const expiryDate = calculateExpiryDate(duration);
        
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
        
        // Check if car already exists
        let car = await Car.findOne({ advertId });
        
        if (car) {
          // Update existing car
          console.log(`📝 Updating existing car: ${car._id}`);
          
          // Generate variant if missing
          if (!car.variant || car.variant === 'null' || car.variant === 'undefined') {
            const parsedEngineSize = car.engineSize || (safeVehicleData.engineSize ? parseFloat(String(safeVehicleData.engineSize).replace(/[^\d.]/g, '')) : undefined);
            
            const variantData = {
              make: car.make || safeVehicleData.make,
              model: car.model || safeVehicleData.model,
              engineSize: parsedEngineSize,
              engineSizeLitres: parsedEngineSize,
              fuelType: car.fuelType || safeVehicleData.fuelType,
              transmission: car.transmission || (safeVehicleData.transmission ? safeVehicleData.transmission.toLowerCase() : 'manual'),
              doors: car.doors || safeVehicleData.doors,
              modelVariant: safeVehicleData.modelVariant
            };
            
            const generatedVariant = vehicleFormatter.formatVariant(variantData);
            if (generatedVariant) {
              car.variant = generatedVariant;
              console.log(`🔧 Auto-generated variant for existing car: "${generatedVariant}"`);
            }
          }
          
          // Only update fields if new data is provided
          if (safeAdvertData.price) car.price = safeAdvertData.price;
          if (safeVehicleData.estimatedValue && !car.price) car.price = safeVehicleData.estimatedValue;
          if (safeAdvertData.description) car.description = safeAdvertData.description;
          if (safeAdvertData.photos && safeAdvertData.photos.length > 0) {
            car.images = safeAdvertData.photos.map(p => p.url || p);
          }
          if (safeContactDetails.postcode) car.postcode = safeContactDetails.postcode;
          if (locationName) car.locationName = locationName;
          if (latitude) car.latitude = latitude;
          if (longitude) car.longitude = longitude;
          
          if (latitude && longitude) {
            car.location = {
              type: 'Point',
              coordinates: [longitude, latitude]
            };
          }
          
          // Update seller contact information
          car.sellerContact = {
            phoneNumber: safeContactDetails.phoneNumber || car.sellerContact?.phoneNumber,
            email: safeContactDetails.email || car.sellerContact?.email,
            allowEmailContact: safeContactDetails.allowEmailContact || car.sellerContact?.allowEmailContact || false,
            postcode: safeContactDetails.postcode || car.sellerContact?.postcode
          };
          
          car.advertisingPackage = {
            packageId: packageId,
            packageName: packageName,
            duration: duration,
            price: price,
            purchaseDate: new Date(),
            expiryDate: expiryDate,
            stripeSessionId: session.sessionId
          };
          
          // In test mode, activate immediately. In production, webhook will activate
          const isTestMode = session.sessionId.startsWith('cs_test_');
          if (isTestMode) {
            car.advertStatus = 'active';
            car.publishedAt = new Date();
            console.log(`✅ Car updated and ACTIVATED (test mode)`);
            console.log(`✅ Variant: "${car.variant}"`);
          } else {
            car.advertStatus = 'pending_payment';
            console.log(`✅ Car updated with pending payment status`);
          }
          
          await car.save();
        } else {
          // Create new car
          console.log(`📝 Creating NEW car document`);
          
          // Parse engine size to number
          const parsedEngineSize = vehicleData.engineSize ? parseFloat(String(vehicleData.engineSize).replace(/[^\d.]/g, '')) || undefined : undefined;
          
          // Generate variant automatically if not provided
          let variant = vehicleData.variant || vehicleData.modelVariant || null;
          if (!variant || variant === 'null' || variant === 'undefined' || variant.trim() === '') {
            // Prepare data for variant generation
            const variantData = {
              make: vehicleData.make,
              model: vehicleData.model,
              engineSize: parsedEngineSize,
              engineSizeLitres: parsedEngineSize,
              fuelType: vehicleData.fuelType,
              transmission: vehicleData.transmission ? vehicleData.transmission.toLowerCase() : 'manual',
              doors: vehicleData.doors,
              modelVariant: vehicleData.modelVariant
            };
            
            // Generate variant using vehicleFormatter
            variant = vehicleFormatter.formatVariant(variantData);
            console.log(`🔧 Auto-generated variant for NEW car: "${variant}"`);
            
            // If still null/empty, create a basic variant
            if (!variant || variant.trim() === '') {
              const engineStr = parsedEngineSize ? `${parsedEngineSize}L` : '';
              const fuelStr = vehicleData.fuelType || 'Petrol';
              const transStr = vehicleData.transmission ? vehicleData.transmission.charAt(0).toUpperCase() + vehicleData.transmission.slice(1).toLowerCase() : 'Manual';
              const doorsStr = vehicleData.doors ? `${vehicleData.doors}dr` : '';
              variant = [engineStr, fuelStr, transStr, doorsStr].filter(Boolean).join(' ');
              console.log(`🔧 Fallback variant generated: "${variant}"`);
            }
          }
          
          // Generate displayTitle in AutoTrader format
          // Format: "Make Model EngineSize Variant Transmission"
          const displayTitleParts = [];
          if (vehicleData.make) displayTitleParts.push(vehicleData.make);
          if (vehicleData.model) displayTitleParts.push(vehicleData.model);
          if (parsedEngineSize) displayTitleParts.push(`${parsedEngineSize}L`);
          if (variant) displayTitleParts.push(variant);
          if (vehicleData.transmission) {
            const trans = vehicleData.transmission.charAt(0).toUpperCase() + vehicleData.transmission.slice(1).toLowerCase();
            displayTitleParts.push(trans);
          }
          const displayTitle = displayTitleParts.join(' ');
          console.log(`📝 Generated displayTitle: "${displayTitle}"`);
          
          car = new Car({
            advertId: advertId,
            make: vehicleData.make || 'Unknown',
            model: vehicleData.model || 'Unknown',
            variant: variant,
            displayTitle: displayTitle,
            year: vehicleData.year || new Date().getFullYear(),
            mileage: vehicleData.mileage || 0,
            color: vehicleData.color || 'Not specified',
            fuelType: vehicleData.fuelType || 'Petrol',
            transmission: vehicleData.transmission ? vehicleData.transmission.toLowerCase() : 'manual',
            registrationNumber: vehicleData.registration || vehicleData.registrationNumber || null,
            engineSize: parsedEngineSize,
            bodyType: vehicleData.bodyType,
            doors: vehicleData.doors,
            seats: vehicleData.seats,
            co2Emissions: vehicleData.co2Emissions ? parseInt(String(vehicleData.co2Emissions).replace(/[^\d]/g, '')) || undefined : undefined,
            taxStatus: vehicleData.taxStatus,
            motStatus: vehicleData.motStatus,
            dataSource: vehicleData.registrationNumber ? 'DVLA' : 'manual',
            condition: 'used',
            price: advertData.price || vehicleData.estimatedValue || 0,
            description: advertData.description || '',
            images: advertData.photos ? advertData.photos.map(p => p.url) : [],
            postcode: contactDetails?.postcode || '',
            locationName: locationName,
            latitude: latitude,
            longitude: longitude,
            location: latitude && longitude ? {
              type: 'Point',
              coordinates: [longitude, latitude]
            } : undefined,
            sellerContact: {
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
            // In test mode, activate immediately. In production, webhook will activate
            advertStatus: session.sessionId.startsWith('cs_test_') ? 'active' : 'pending_payment',
            publishedAt: session.sessionId.startsWith('cs_test_') ? new Date() : undefined,
            createdAt: new Date()
          });
          
          await car.save();
          const statusMsg = car.advertStatus === 'active' ? 'ACTIVATED (test mode)' : 'pending payment status';
          console.log(`✅ Car created with ${statusMsg}`);
          console.log(`✅ Variant saved: "${car.variant}"`);
        }
        
        console.log(`   Car ID: ${car._id}`);
        console.log(`   Status: ${car.advertStatus}`);
        console.log(`   Make/Model: ${car.make} ${car.model}`);
        console.log(`   Price: £${car.price}`);
        
      } catch (carError) {
        console.error(`❌ ERROR creating/updating car:`);
        console.error(`   Message: ${carError.message}`);
        console.error(`   Stack: ${carError.stack}`);
        console.error(`   advertId: ${advertId}`);
        console.error(`   vehicleData:`, vehicleData);
        console.error(`   advertData:`, advertData);
        console.error(`   contactDetails:`, contactDetails);
        // Don't fail the checkout session creation if car save fails
      }
    } else {
      console.warn(`⚠️  Skipping car creation - missing data:`);
      console.warn(`   advertId: ${advertId ? 'YES' : 'NO'}`);
      console.warn(`   vehicleData: ${vehicleData ? 'YES' : 'NO'}`);
      console.warn(`   advertData: ${advertData ? 'YES' : 'NO'}`);
    }
    
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
      // Generate vehicle history report
      const historyService = new HistoryService();
      await historyService.checkVehicleHistory(paymentData.vrm, true);
      
      console.log(`Vehicle history report generated for VRM: ${paymentData.vrm}`);
      
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
                
                bike.sellerContact = {
                  type: 'private',
                  phoneNumber: contactDetails.phoneNumber || bike.sellerContact?.phoneNumber,
                  email: contactDetails.email || bike.sellerContact?.email,
                  allowEmailContact: contactDetails.allowEmailContact || false,
                  postcode: contactDetails.postcode || bike.sellerContact?.postcode
                };
                
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
              } else {
                // Create new bike
                console.log(`📝 Creating NEW bike document`);
                
                bike = new Bike({
                  advertId: advertId,
                  make: vehicleData.make || 'Unknown',
                  model: vehicleData.model || 'Unknown',
                  year: vehicleData.year || new Date().getFullYear(),
                  mileage: vehicleData.mileage || 0,
                  color: vehicleData.color || 'Not specified',
                  fuelType: vehicleData.fuelType || 'Petrol',
                  transmission: 'manual',
                  registrationNumber: vehicleData.registrationNumber || null,
                  engineCC: vehicleData.engineCC || 0,
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
                    type: 'private',
                    phoneNumber: contactDetails.phoneNumber,
                    email: contactDetails.email,
                    allowEmailContact: contactDetails.allowEmailContact || false,
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
                  status: 'active',
                  publishedAt: new Date()
                });
                
                await bike.save();
                console.log(`✅ Bike advert CREATED and published!`);
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
                  postcode: contactDetails.postcode || van.sellerContact?.postcode
                };
                
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
              } else {
                // Create new van
                console.log(`📝 Creating NEW van document`);
                
                van = new Van({
                  advertId: advertId,
                  make: vehicleData.make || 'Unknown',
                  model: vehicleData.model || 'Unknown',
                  year: vehicleData.year || new Date().getFullYear(),
                  mileage: vehicleData.mileage || 0,
                  color: vehicleData.color || 'Not specified',
                  fuelType: vehicleData.fuelType || 'Diesel',
                  transmission: vehicleData.transmission || 'manual',
                  registrationNumber: vehicleData.registrationNumber || null,
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
                  status: 'active',
                  publishedAt: new Date()
                });
                
                await van.save();
                console.log(`✅ Van advert CREATED and published!`);
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
            
            // Handle CAR payments (existing code)
            console.log(`📦 Creating car from purchase data:`);
            console.log(`   Advert ID: ${advertId}`);
            console.log(`   Vehicle: ${vehicleData.make} ${vehicleData.model}`);
            console.log(`   Price: £${advertData.price}`);
            console.log(`   Photos: ${advertData.photos ? advertData.photos.length : 0}`);
            console.log(`   Postcode: ${contactDetails.postcode}`);
            
            // Calculate expiry date
            const expiryDate = calculateExpiryDate(purchase.duration);
            
            // Geocode postcode to get coordinates and location name
            let latitude, longitude, locationName;
            if (contactDetails.postcode) {
              try {
                const postcodeData = await postcodeService.lookupPostcode(contactDetails.postcode);
                latitude = postcodeData.latitude;
                longitude = postcodeData.longitude;
                locationName = postcodeData.locationName;
                console.log(`   Coordinates: ${latitude}, ${longitude}`);
                console.log(`   Location: ${locationName}`);
              } catch (error) {
                console.warn(`⚠️  Could not geocode postcode ${contactDetails.postcode}: ${error.message}`);
              }
            }
            
            // Check if car already exists (from createAdvert step)
            let car = await Car.findOne({ advertId });
            
            if (car) {
              // Check if car is already active (prevent duplicate activation)
              if (car.advertStatus === 'active' && car.advertisingPackage?.stripePaymentIntentId === paymentIntent.id) {
                console.log(`⚠️  Car ${car._id} already activated for payment ${paymentIntent.id}, skipping`);
                return;
              }
              
              // UPDATE existing car with payment data
              console.log(`📝 Updating existing car: ${car._id}`);
              
              car.price = advertData.price || vehicleData.estimatedValue || car.price;
              car.description = advertData.description || car.description;
              car.images = advertData.photos ? advertData.photos.map(p => p.url) : car.images;
              car.postcode = contactDetails.postcode || car.postcode;
              car.locationName = locationName || car.locationName;
              car.latitude = latitude || car.latitude;
              car.longitude = longitude || car.longitude;
              
              if (latitude && longitude) {
                car.location = {
                  type: 'Point',
                  coordinates: [longitude, latitude]
                };
              }
              
              car.sellerContact = {
                phoneNumber: contactDetails.phoneNumber || car.sellerContact?.phoneNumber,
                email: contactDetails.email || car.sellerContact?.email,
                allowEmailContact: contactDetails.allowEmailContact || car.sellerContact?.allowEmailContact || false,
                postcode: contactDetails.postcode || car.sellerContact?.postcode
              };
              
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
              
              await car.save();
              console.log(`✅ Car advert UPDATED and published!`);
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
              
              car = new Car({
              advertId: advertId,
              // Vehicle data
              make: vehicleData.make,
              model: vehicleData.model,
              year: vehicleData.year,
              mileage: vehicleData.mileage || 0,
              color: vehicleData.color || 'Not specified',
              fuelType: vehicleData.fuelType || 'Petrol',
              transmission: vehicleData.transmission || 'manual',
              registrationNumber: vehicleData.registrationNumber,
              engineSize: vehicleData.engineSize,
              bodyType: vehicleData.bodyType,
              doors: vehicleData.doors,
              seats: vehicleData.seats,
              co2Emissions: vehicleData.co2Emissions,
              taxStatus: vehicleData.taxStatus,
              motStatus: vehicleData.motStatus,
              dataSource: vehicleData.registrationNumber ? 'DVLA' : 'manual',
              condition: 'used',
              // Advert data
              price: advertData.price || vehicleData.estimatedValue || 0,
              description: advertData.description || '',
              images: advertData.photos ? advertData.photos.map(p => p.url) : [],
              postcode: contactDetails.postcode || '',
              locationName: locationName,
              // Location data
              latitude: latitude,
              longitude: longitude,
              location: latitude && longitude ? {
                type: 'Point',
                coordinates: [longitude, latitude]
              } : undefined,
              // Seller contact
              sellerContact: {
                phoneNumber: contactDetails.phoneNumber,
                email: contactDetails.email,
                allowEmailContact: contactDetails.allowEmailContact || false,
                postcode: contactDetails.postcode
              },
              // Package details
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
              // Status
              advertStatus: 'active',
              publishedAt: new Date()
            });
            
              await car.save();
              console.log(`✅ Car advert CREATED and published in database!`);
            }
            
            // Log final car details
            console.log(`   Database ID: ${car._id}`);
            console.log(`   Advert ID: ${advertId}`);
            console.log(`   Make/Model: ${car.make} ${car.model}`);
            console.log(`   Price: £${car.price}`);
            console.log(`   Photos: ${car.images.length}`);
            console.log(`   Contact: ${car.sellerContact?.email || 'N/A'}`);
            console.log(`   Location: ${car.postcode} (${car.latitude}, ${car.longitude})`);
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
      vehicleType
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
        contactDetails: JSON.stringify(safeContactDetails)
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
            make: vehicleData.make || 'Unknown',
            model: vehicleData.model || 'Unknown',
            year: vehicleData.year || new Date().getFullYear(),
            mileage: vehicleData.mileage || 0,
            color: vehicleData.color || 'Not specified',
            fuelType: vehicleData.fuelType || 'Petrol',
            transmission: 'manual',
            registrationNumber: vehicleData.registrationNumber || null,
            engineCC: vehicleData.engineCC || 0,
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
      vehicleType
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
        contactDetails: JSON.stringify(safeContactDetails)
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
            make: vehicleData.make || 'Unknown',
            model: vehicleData.model || 'Unknown',
            year: vehicleData.year || new Date().getFullYear(),
            mileage: vehicleData.mileage || 0,
            color: vehicleData.color || 'Not specified',
            fuelType: vehicleData.fuelType || 'Diesel',
            transmission: vehicleData.transmission || 'manual',
            registrationNumber: vehicleData.registrationNumber || null,
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

module.exports = {
  createCheckoutSession,
  createAdvertCheckoutSession,
  createBikeCheckoutSession,
  createVanCheckoutSession,
  createCreditCheckoutSession,
  getSessionDetails,
  getPurchaseDetails,
  handleWebhook,
  getCreditBalance,
  useCreditForCheck,
  createRefund,
};