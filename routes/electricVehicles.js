/**
 * Electric Vehicle Routes
 * Specialized routes for electric vehicle data and functionality
 */

const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const ElectricVehicleEnhancementService = require('../services/electricVehicleEnhancementService');
const { addElectricVehicleInfo } = require('../middleware/electricVehicleEnhancement');

// Apply electric vehicle info middleware to all routes
router.use(addElectricVehicleInfo);

/**
 * GET /api/electric-vehicles
 * Get all electric vehicles with enhanced data
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      make,
      model,
      minRange,
      maxRange,
      minBattery,
      maxBattery,
      chargingType,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter for electric vehicles
    const filter = { fuelType: 'Electric' };

    // Add optional filters
    if (make) filter.make = new RegExp(make, 'i');
    if (model) filter.model = new RegExp(model, 'i');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    // Electric vehicle specific filters
    if (minRange || maxRange) {
      filter.$or = [
        { electricRange: {} },
        { 'runningCosts.electricRange': {} }
      ];
      if (minRange) {
        filter.$or[0].electricRange.$gte = parseInt(minRange);
        filter.$or[1]['runningCosts.electricRange'].$gte = parseInt(minRange);
      }
      if (maxRange) {
        filter.$or[0].electricRange.$lte = parseInt(maxRange);
        filter.$or[1]['runningCosts.electricRange'].$lte = parseInt(maxRange);
      }
    }

    if (minBattery || maxBattery) {
      if (!filter.$or) filter.$or = [];
      filter.$or.push(
        { batteryCapacity: {} },
        { 'runningCosts.batteryCapacity': {} }
      );
      if (minBattery) {
        filter.$or[filter.$or.length - 2].batteryCapacity.$gte = parseFloat(minBattery);
        filter.$or[filter.$or.length - 1]['runningCosts.batteryCapacity'].$gte = parseFloat(minBattery);
      }
      if (maxBattery) {
        filter.$or[filter.$or.length - 2].batteryCapacity.$lte = parseFloat(maxBattery);
        filter.$or[filter.$or.length - 1]['runningCosts.batteryCapacity'].$lte = parseFloat(maxBattery);
      }
    }

    if (chargingType) {
      filter.$or = [
        { chargingPortType: new RegExp(chargingType, 'i') },
        { 'runningCosts.chargingPortType': new RegExp(chargingType, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const electricVehicles = await Car.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Car.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: electricVehicles,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error fetching electric vehicles:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch electric vehicles'
      }
    });
  }
});

/**
 * GET /api/electric-vehicles/stats
 * Get electric vehicle statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const electricVehicles = await Car.find({ fuelType: 'Electric' }).lean();

    if (electricVehicles.length === 0) {
      return res.json({
        success: true,
        data: {
          totalCount: 0,
          message: 'No electric vehicles found'
        }
      });
    }

    // Calculate statistics
    const stats = {
      totalCount: electricVehicles.length,
      averageRange: Math.round(
        electricVehicles.reduce((sum, car) => 
          sum + (car.electricRange || car.runningCosts?.electricRange || 0), 0
        ) / electricVehicles.length
      ),
      averageBatteryCapacity: Math.round(
        electricVehicles.reduce((sum, car) => 
          sum + (car.batteryCapacity || car.runningCosts?.batteryCapacity || 0), 0
        ) / electricVehicles.length * 10
      ) / 10,
      averagePrice: Math.round(
        electricVehicles.reduce((sum, car) => sum + (car.price || 0), 0) / electricVehicles.length
      ),
      makes: [...new Set(electricVehicles.map(car => car.make))].sort(),
      models: [...new Set(electricVehicles.map(car => `${car.make} ${car.model}`))].sort(),
      chargingTypes: [...new Set(
        electricVehicles.map(car => 
          car.chargingPortType || car.runningCosts?.chargingPortType
        ).filter(Boolean)
      )].sort(),
      rangeDistribution: {
        under200: electricVehicles.filter(car => 
          (car.electricRange || car.runningCosts?.electricRange || 0) < 200
        ).length,
        range200to300: electricVehicles.filter(car => {
          const range = car.electricRange || car.runningCosts?.electricRange || 0;
          return range >= 200 && range < 300;
        }).length,
        range300to400: electricVehicles.filter(car => {
          const range = car.electricRange || car.runningCosts?.electricRange || 0;
          return range >= 300 && range < 400;
        }).length,
        over400: electricVehicles.filter(car => 
          (car.electricRange || car.runningCosts?.electricRange || 0) >= 400
        ).length
      },
      batteryDistribution: {
        under50: electricVehicles.filter(car => 
          (car.batteryCapacity || car.runningCosts?.batteryCapacity || 0) < 50
        ).length,
        range50to75: electricVehicles.filter(car => {
          const battery = car.batteryCapacity || car.runningCosts?.batteryCapacity || 0;
          return battery >= 50 && battery < 75;
        }).length,
        range75to100: electricVehicles.filter(car => {
          const battery = car.batteryCapacity || car.runningCosts?.batteryCapacity || 0;
          return battery >= 75 && battery < 100;
        }).length,
        over100: electricVehicles.filter(car => 
          (car.batteryCapacity || car.runningCosts?.batteryCapacity || 0) >= 100
        ).length
      },
      priceDistribution: {
        under20k: electricVehicles.filter(car => (car.price || 0) < 20000).length,
        range20to40k: electricVehicles.filter(car => {
          const price = car.price || 0;
          return price >= 20000 && price < 40000;
        }).length,
        range40to60k: electricVehicles.filter(car => {
          const price = car.price || 0;
          return price >= 40000 && price < 60000;
        }).length,
        over60k: electricVehicles.filter(car => (car.price || 0) >= 60000).length
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching electric vehicle stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: 'Failed to fetch electric vehicle statistics'
      }
    });
  }
});

/**
 * GET /api/electric-vehicles/charging-calculator
 * Calculate charging costs and times for electric vehicles
 */
router.get('/charging-calculator', async (req, res) => {
  try {
    const { 
      batteryCapacity, 
      electricRange, 
      electricityRate = 0.30,
      publicRate = 0.45,
      rapidRate = 0.65 
    } = req.query;

    if (!batteryCapacity || !electricRange) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Battery capacity and electric range are required'
        }
      });
    }

    const evData = {
      batteryCapacity: parseFloat(batteryCapacity),
      electricRange: parseInt(electricRange),
      homeChargingSpeed: 7.4, // Default home charging speed
      publicChargingSpeed: 50, // Default public charging speed
      rapidChargingSpeed: 100 // Default rapid charging speed
    };

    const chargingCosts = ElectricVehicleEnhancementService.calculateChargingCosts(
      evData, 
      parseFloat(electricityRate)
    );
    
    const chargingTimes = ElectricVehicleEnhancementService.getChargingTimeEstimates(evData);

    // Override costs with custom rates
    chargingCosts.publicChargingCost = {
      full: Math.round(evData.batteryCapacity * parseFloat(publicRate) * 100) / 100,
      per100Miles: Math.round((evData.batteryCapacity * parseFloat(publicRate) * 100 / evData.electricRange) * 100) / 100
    };

    chargingCosts.rapidChargingCost = {
      full: Math.round(evData.batteryCapacity * parseFloat(rapidRate) * 100) / 100,
      per100Miles: Math.round((evData.batteryCapacity * parseFloat(rapidRate) * 100 / evData.electricRange) * 100) / 100
    };

    res.json({
      success: true,
      data: {
        vehicleData: evData,
        rates: {
          home: parseFloat(electricityRate),
          public: parseFloat(publicRate),
          rapid: parseFloat(rapidRate)
        },
        costs: chargingCosts,
        times: chargingTimes
      }
    });

  } catch (error) {
    console.error('Error calculating charging costs:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CALCULATION_ERROR',
        message: 'Failed to calculate charging costs'
      }
    });
  }
});

/**
 * GET /api/electric-vehicles/:id
 * Get specific electric vehicle with enhanced data
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid vehicle ID format'
        }
      });
    }

    const vehicle = await Car.findById(id).lean();

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VEHICLE_NOT_FOUND',
          message: 'Electric vehicle not found'
        }
      });
    }

    if (vehicle.fuelType !== 'Electric') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_ELECTRIC_VEHICLE',
          message: 'Vehicle is not an electric vehicle'
        }
      });
    }

    // The middleware will automatically add charging estimates
    res.json({
      success: true,
      data: vehicle
    });

  } catch (error) {
    console.error('Error fetching electric vehicle:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch electric vehicle'
      }
    });
  }
});

module.exports = router;