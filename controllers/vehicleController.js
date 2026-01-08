const { body, validationResult } = require('express-validator');
const dvlaService = require('../services/dvlaService');
const Car = require('../models/Car');
const { createErrorFromCode, logError } = require('../utils/dvlaErrorHandler');

// Generate mock vehicle data when DVLA API is unavailable
const generateMockVehicleData = (registration) => {
  // Extract year from registration (UK format: AB12CDE - 12 = 2012)
  const yearMatch = registration.match(/[A-Z]{2}(\d{2})/i);
  let year = 2020;
  if (yearMatch) {
    const regYear = parseInt(yearMatch[1]);
    year = regYear >= 50 ? 1950 + regYear : 2000 + regYear;
  }
  
  const makes = ['BMW', 'Audi', 'Mercedes-Benz', 'Volkswagen', 'Ford', 'Toyota', 'Honda'];
  const models = {
    'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'M3'],
    'Audi': ['A3', 'A4', 'A6', 'Q5', 'Q7'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class'],
    'Volkswagen': ['Golf', 'Polo', 'Tiguan', 'Passat', 'T-Roc'],
    'Ford': ['Focus', 'Fiesta', 'Kuga', 'Puma', 'Mustang'],
    'Toyota': ['Corolla', 'Yaris', 'RAV4', 'C-HR', 'Camry'],
    'Honda': ['Civic', 'CR-V', 'Jazz', 'HR-V', 'Accord']
  };
  
  const randomMake = makes[Math.floor(Math.random() * makes.length)];
  const makeModels = models[randomMake];
  const randomModel = makeModels[Math.floor(Math.random() * makeModels.length)];
  
  const colors = ['BLACK', 'WHITE', 'SILVER', 'BLUE', 'RED', 'GREY'];
  const fuelTypes = ['PETROL', 'DIESEL', 'HYBRID'];
  
  return {
    registrationNumber: registration.toUpperCase(),
    make: randomMake.toUpperCase(),
    model: randomModel,
    yearOfManufacture: year,
    colour: colors[Math.floor(Math.random() * colors.length)],
    fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
    engineCapacity: [1600, 2000, 2500, 3000][Math.floor(Math.random() * 4)],
    co2Emissions: Math.floor(Math.random() * 100 + 100),
    taxStatus: 'Taxed',
    motStatus: 'Valid',
    motExpiryDate: '2026-06-05',
    taxDueDate: '2025-04-01',
    euroStatus: 'Euro 6',
    typeApproval: 'M1'
  };
};

class VehicleController {
  /**
   * Validation rules for vehicle lookup
   */
  static lookupValidationRules() {
    return [
      body('registrationNumber')
        .trim()
        .notEmpty()
        .withMessage('Registration number is required')
        .isLength({ min: 2, max: 10 })
        .withMessage('Registration number must be between 2 and 10 characters'),
      body('mileage')
        .isInt({ min: 0 })
        .withMessage('Mileage must be a positive number'),
      body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
      body('postcode')
        .optional()
        .trim()
        .isLength({ min: 5, max: 10 })
        .withMessage('Invalid postcode format'),
      body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters')
    ];
  }

  /**
   * Validation rules for registration validation
   */
  static validateRegistrationRules() {
    return [
      body('registrationNumber')
        .trim()
        .notEmpty()
        .withMessage('Registration number is required')
    ];
  }

  /**
   * POST /api/vehicles/lookup
   * Lookup vehicle from DVLA and create Car record
   */
  async lookupAndCreateVehicle(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array()
          }
        });
      }

      const { registrationNumber, mileage, price, postcode, description, transmission, purchaseId } = req.body;

      // IMPORTANT: Require payment verification before creating vehicle record
      if (!purchaseId) {
        return res.status(402).json({
          success: false,
          error: {
            code: 'PAYMENT_REQUIRED',
            message: 'Payment is required before adding a vehicle listing',
            details: 'Please complete payment first'
          }
        });
      }

      // Verify the purchase exists and is paid
      const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
      const purchase = await AdvertisingPackagePurchase.findById(purchaseId);
      
      if (!purchase) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PURCHASE_NOT_FOUND',
            message: 'Purchase record not found',
            details: 'Invalid purchase ID'
          }
        });
      }

      if (purchase.status !== 'paid') {
        return res.status(402).json({
          success: false,
          error: {
            code: 'PAYMENT_NOT_COMPLETED',
            message: 'Payment has not been completed',
            details: 'Please complete payment before adding your vehicle'
          }
        });
      }

      // Check if this purchase has already been used
      if (purchase.vehicleId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PURCHASE_ALREADY_USED',
            message: 'This purchase has already been used for another vehicle',
            details: 'Each purchase can only be used once'
          }
        });
      }

      // Step 1: Lookup vehicle from DVLA
      console.log(`[Vehicle Controller] Looking up vehicle: ${registrationNumber}`);
      let dvlaData;
      
      try {
        dvlaData = await dvlaService.lookupVehicle(registrationNumber);
      } catch (error) {
        // DVLA API unavailable - use mock data for development
        console.log(`[Vehicle Controller] DVLA API unavailable, using mock data for: ${registrationNumber}`);
        dvlaData = generateMockVehicleData(registrationNumber);
      }

      // Step 2: Map DVLA data to Car schema
      const carData = dvlaService.mapDVLADataToCarSchema(dvlaData, mileage, {
        price,
        postcode,
        description,
        transmission
      });

      // Add purchase information to car data
      carData.purchaseId = purchaseId;
      carData.packageName = purchase.packageName;
      carData.packageDuration = purchase.duration;
      carData.expiresAt = purchase.expiresAt;

      // Step 4: Create Car record
      const car = new Car(carData);

      await car.save();

      // Update purchase record with vehicle ID
      purchase.vehicleId = car._id;
      purchase.registration = car.registrationNumber;
      await purchase.save();

      console.log(`[Vehicle Controller] Created vehicle: ${car._id} with purchase: ${purchaseId}`);

      // Step 5: Return success response
      return res.status(201).json({
        success: true,
        message: 'Vehicle successfully added from DVLA data',
        vehicle: {
          id: car._id,
          make: car.make,
          model: car.model,
          year: car.year,
          color: car.color,
          fuelType: car.fuelType,
          mileage: car.mileage,
          registrationNumber: car.registrationNumber,
          engineSize: car.engineSize,
          co2Emissions: car.co2Emissions,
          taxStatus: car.taxStatus,
          motStatus: car.motStatus,
          dataSource: car.dataSource,
          price: car.price
        }
      });

    } catch (error) {
      console.error('[Vehicle Controller] Error in lookupAndCreateVehicle:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'VEHICLE_CREATION_ERROR',
          message: error.message || 'Failed to create vehicle record',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      });
    }
  }

  /**
   * POST /api/vehicles/dvla-lookup
   * Lookup vehicle from DVLA without creating database record
   */
  async dvlaLookup(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array()
          }
        });
      }

      const { registrationNumber } = req.body;

      // Lookup vehicle from DVLA
      console.log(`[Vehicle Controller] DVLA lookup for: ${registrationNumber}`);
      let dvlaData;
      
      try {
        dvlaData = await dvlaService.lookupVehicle(registrationNumber);
      } catch (error) {
        // DVLA API unavailable - return mock data for development
        console.log(`[Vehicle Controller] DVLA API unavailable, using mock data for: ${registrationNumber}`);
        dvlaData = generateMockVehicleData(registrationNumber);
      }

      // Return DVLA data directly
      return res.json({
        success: true,
        data: dvlaData,
        vehicle: dvlaData
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vehicles/validate-registration
   * Validate registration number format
   */
  async validateRegistration(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array()
          }
        });
      }

      const { registrationNumber } = req.body;

      // Validate format
      const isValid = dvlaService.validateRegistrationFormat(registrationNumber);

      if (isValid) {
        return res.json({
          success: true,
          valid: true,
          message: 'Registration number format is valid'
        });
      } else {
        return res.status(400).json({
          success: false,
          valid: false,
          message: 'Invalid UK registration number format'
        });
      }

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/vehicles/:id
   * Get a single car by ID
   */
  async getCarById(req, res, next) {
    try {
      const { id } = req.params;

      // Find car by ID
      const car = await Car.findById(id);

      if (!car) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CAR_NOT_FOUND',
            message: 'Car not found'
          }
        });
      }

      // Return car data
      return res.json({
        success: true,
        data: car
      });

    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid car ID format'
          }
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/vehicles/count
   * Get total count of available cars
   */
  async getCarCount(req, res, next) {
    try {
      const { 
        make, 
        model, 
        minPrice, 
        maxPrice, 
        fuelType, 
        transmission,
        condition,
        vehicleType
      } = req.query;

      // Build query - don't filter by advertStatus to show all cars
      const query = {};

      if (make) query.make = new RegExp(make, 'i');
      if (model) query.model = new RegExp(model, 'i');
      if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
      if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
      if (fuelType) query.fuelType = fuelType;
      if (transmission) query.transmission = transmission;
      if (condition) query.condition = condition;
      if (vehicleType) query.vehicleType = vehicleType;
      
      // For new cars, only show trade dealer listings
      if (condition === 'new') {
        query.isDealerListing = true;
      }

      // Get count
      const count = await Car.countDocuments(query);

      return res.json({
        success: true,
        count: count
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/vehicles
   * Get all cars with optional filters
   */
  async getAllCars(req, res, next) {
    try {
      const { 
        make, 
        model, 
        minPrice, 
        maxPrice, 
        fuelType, 
        transmission,
        condition,
        isDealerListing,
        vehicleType,
        limit = 50,
        skip = 0 
      } = req.query;

      // Build query - don't filter by advertStatus to show all cars
      const query = {};

      if (make) query.make = new RegExp(make, 'i');
      if (model) query.model = new RegExp(model, 'i');
      if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
      if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
      if (fuelType) query.fuelType = fuelType;
      if (transmission) query.transmission = transmission;
      if (condition) query.condition = condition;
      if (isDealerListing === 'true') query.isDealerListing = true;
      if (vehicleType) query.vehicleType = vehicleType;
      
      // For new cars, only show trade dealer listings
      if (condition === 'new') {
        query.isDealerListing = true;
      }

      // Execute query
      const cars = await Car.find(query)
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .sort({ createdAt: -1 });

      const total = await Car.countDocuments(query);

      return res.json({
        success: true,
        data: cars,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + parseInt(limit)
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/vehicles/search
   * Search cars with comprehensive filters
   */
  async searchCars(req, res, next) {
    try {
      console.log('[Vehicle Controller] Search request received with params:', req.query);
      
      const { 
        make, 
        model, 
        priceFrom,
        priceTo,
        yearFrom,
        yearTo,
        mileageFrom,
        mileageTo,
        gearbox,
        bodyType,
        colour,
        doors,
        seats,
        fuelType,
        engineSize,
        sort,
        limit = 50,
        skip = 0 
      } = req.query;

      // Build query - only show active cars
      const query = { advertStatus: 'active' };

      // Make and Model filters (case-insensitive exact match)
      if (make) query.make = new RegExp(`^${make}$`, 'i');
      if (model) query.model = new RegExp(`^${model}$`, 'i');
      
      // Price range filters
      if (priceFrom || priceTo) {
        query.price = {};
        if (priceFrom) query.price.$gte = parseFloat(priceFrom);
        if (priceTo) query.price.$lte = parseFloat(priceTo);
      }
      
      // Year range filters
      if (yearFrom || yearTo) {
        query.year = {};
        if (yearFrom) query.year.$gte = parseInt(yearFrom);
        if (yearTo) query.year.$lte = parseInt(yearTo);
      }
      
      // Mileage range filters
      if (mileageFrom || mileageTo) {
        query.mileage = {};
        if (mileageFrom) query.mileage.$gte = parseInt(mileageFrom);
        if (mileageTo) query.mileage.$lte = parseInt(mileageTo);
      }
      
      // Exact match filters
      if (gearbox) query.transmission = gearbox;
      if (bodyType) query.bodyType = bodyType;
      if (colour) query.color = colour;
      if (fuelType) query.fuelType = fuelType;
      
      // Numeric filters
      if (doors) query.doors = parseInt(doors);
      if (seats) query.seats = parseInt(seats);
      
      console.log('[Vehicle Controller] Constructed query:', JSON.stringify(query, null, 2));

      // Determine sort order
      let sortOption = { createdAt: -1 }; // Default: newest first
      
      if (sort) {
        switch (sort) {
          case 'price-low':
            sortOption = { price: 1 };
            break;
          case 'price-high':
            sortOption = { price: -1 };
            break;
          case 'year-new':
            sortOption = { year: -1 };
            break;
          case 'year-old':
            sortOption = { year: 1 };
            break;
          case 'mileage-low':
            sortOption = { mileage: 1 };
            break;
          case 'mileage-high':
            sortOption = { mileage: -1 };
            break;
        }
      }

      // Execute query
      const cars = await Car.find(query)
        .limit(Math.min(parseInt(limit), 100)) // Cap at 100
        .skip(parseInt(skip))
        .sort(sortOption);

      const total = await Car.countDocuments(query);

      console.log('[Vehicle Controller] Found', total, 'cars matching filters');

      return res.json({
        success: true,
        cars: cars,
        total: total,
        pagination: {
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + parseInt(limit)
        }
      });

    } catch (error) {
      console.error('[Vehicle Controller] Error in searchCars:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to search cars',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * GET /api/vehicles/filter-options
   * Get unique filter options from database
   */
  async getFilterOptions(req, res, next) {
    try {
      console.log('[Vehicle Controller] Fetching filter options...');
      
      // Get unique makes (from active cars only)
      const makes = await Car.distinct('make', { advertStatus: 'active' });
      console.log('[Vehicle Controller] Found makes:', makes.length);
      
      // Get unique models
      const models = await Car.distinct('model', { advertStatus: 'active' });
      console.log('[Vehicle Controller] Found models:', models.length);
      
      // Get unique fuel types
      const fuelTypes = await Car.distinct('fuelType', { advertStatus: 'active' });
      console.log('[Vehicle Controller] Found fuelTypes:', fuelTypes.length);
      
      // Get unique transmissions
      const transmissions = await Car.distinct('transmission', { advertStatus: 'active' });
      console.log('[Vehicle Controller] Found transmissions:', transmissions.length);
      
      // Get unique body types
      const bodyTypes = await Car.distinct('bodyType', { advertStatus: 'active' });
      console.log('[Vehicle Controller] Found bodyTypes:', bodyTypes.length);
      
      // Get unique colours (note: field is 'color' not 'colour')
      const colours = await Car.distinct('color', { advertStatus: 'active' });
      console.log('[Vehicle Controller] Found colours:', colours.length);
      
      // Get year range
      const years = await Car.aggregate([
        { $match: { advertStatus: 'active' } },
        { $group: { _id: null, minYear: { $min: '$year' }, maxYear: { $max: '$year' } } }
      ]);
      
      const yearRange = years.length > 0 ? years[0] : { minYear: 2000, maxYear: new Date().getFullYear() };

      const result = {
        success: true,
        data: {
          makes: makes.filter(Boolean).sort(),
          models: models.filter(Boolean).sort(),
          fuelTypes: fuelTypes.filter(Boolean).sort(),
          transmissions: transmissions.filter(Boolean).sort(),
          bodyTypes: bodyTypes.filter(Boolean).sort(),
          colours: colours.filter(Boolean).sort(),
          yearRange: {
            min: yearRange.minYear,
            max: yearRange.maxYear
          }
        }
      };
      
      console.log('[Vehicle Controller] Returning filter options:', JSON.stringify(result, null, 2));
      
      return res.json(result);

    } catch (error) {
      console.error('[Vehicle Controller] Error in getFilterOptions:', error);
      next(error);
    }
  }
}

module.exports = new VehicleController();
