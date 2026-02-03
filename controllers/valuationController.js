/**
 * Valuation Controller
 * Handles HTTP requests for vehicle valuations
 */

const ValuationService = require('../services/valuationService');
const { formatErrorResponse, isAPIUnavailable, handleValuationAPIUnavailable } = require('../utils/errorHandlers');

/**
 * Get vehicle valuation (use cached data first)
 * POST /api/vehicle-valuation
 * Body: { vrm: string, mileage: number, forceRefresh?: boolean }
 */
async function getValuation(req, res) {
  try {
    const { vrm, mileage, forceRefresh = false } = req.body;
    
    // Validate inputs
    if (!vrm) {
      return res.status(400).json({
        success: false,
        error: 'VRM is required',
      });
    }

    if (mileage === undefined || mileage === null) {
      return res.status(400).json({
        success: false,
        error: 'Mileage is required',
      });
    }

    if (typeof mileage !== 'number' || mileage < 0) {
      return res.status(400).json({
        success: false,
        error: 'Mileage must be a non-negative number',
      });
    }

    // CRITICAL: Check for cached valuation data first to avoid API charges
    const Car = require('../models/Car');
    const cachedCar = await Car.findOne({ 
      registrationNumber: vrm.toUpperCase() 
    });

    // If we have cached valuation data and not forcing refresh, use it
    if (cachedCar && cachedCar.valuation && cachedCar.valuation.privatePrice && !forceRefresh) {
      return res.json({
        success: true,
        data: {
          estimatedValue: {
            private: cachedCar.valuation.privatePrice,
            retail: cachedCar.valuation.dealerPrice,
            trade: cachedCar.valuation.partExchangePrice
          },
          confidence: cachedCar.valuation.confidence || 'medium',
          valuationDate: cachedCar.valuation.valuationDate
        },
        source: 'cached'
      });
    }

    // Only call API if no cached data or force refresh (admin only)
    const shouldForceRefresh = forceRefresh && req.headers['x-admin-request'] === 'true';
    
    if (!shouldForceRefresh && !cachedCar) {
      return res.status(404).json({
        success: false,
        error: 'No valuation data available for this vehicle',
        message: 'Vehicle not found in our database. Please create a listing first.'
      });
    }

    if (shouldForceRefresh) {
      const valuationService = new ValuationService();
      const valuation = await valuationService.getValuation(vrm, mileage, true);

      res.json({
        success: true,
        data: valuation,
        source: 'api'
      });
    } else {
      return res.status(403).json({
        success: false,
        error: 'API access restricted',
        message: 'Valuation API calls are restricted to prevent billing charges. Use cached data.'
      });
    }
  } catch (error) {
    console.error('Error in getValuation:', error);
    
    // Handle valuation not found error
    if (error.code === 'VALUATION_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: error.userMessage || 'Valuation data not available for this vehicle',
        code: 'VALUATION_NOT_FOUND',
      });
    }

    // Handle API unavailability
    if (isAPIUnavailable(error)) {
      return res.status(503).json({
        success: false,
        error: 'Valuation service is temporarily unavailable. Please try again later.',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    // Handle other errors with user-friendly messages
    const errorResponse = formatErrorResponse(error, 'valuation');
    const statusCode = error.message.includes('Invalid') ? 400 : 500;
    
    res.status(statusCode).json(errorResponse);
  }
}

/**
 * Get detailed valuation with DVLA data
 * POST /api/vehicle-valuation/detailed
 * Body: { vrm: string, mileage: number }
 */
async function getDetailedValuation(req, res) {
  try {
    const { vrm, mileage } = req.body;
    
    // Validate inputs
    if (!vrm) {
      return res.status(400).json({
        success: false,
        error: 'VRM is required',
      });
    }

    if (mileage === undefined || mileage === null) {
      return res.status(400).json({
        success: false,
        error: 'Mileage is required',
      });
    }

    if (typeof mileage !== 'number' || mileage < 0) {
      return res.status(400).json({
        success: false,
        error: 'Mileage must be a non-negative number',
      });
    }

    const valuationService = new ValuationService();
    const detailedValuation = await valuationService.getDetailedValuation(vrm, mileage);

    res.json({
      success: true,
      data: detailedValuation,
    });
  } catch (error) {
    console.error('Error in getDetailedValuation:', error);
    
    // Handle valuation not found error
    if (error.code === 'VALUATION_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: error.userMessage || 'Valuation data not available for this vehicle',
        code: 'VALUATION_NOT_FOUND',
      });
    }

    // Handle API unavailability
    if (isAPIUnavailable(error)) {
      return res.status(503).json({
        success: false,
        error: 'Valuation service is temporarily unavailable. Please try again later.',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    // Handle other errors with user-friendly messages
    const errorResponse = formatErrorResponse(error, 'valuation');
    const statusCode = error.message.includes('Invalid') ? 400 : 500;
    
    res.status(statusCode).json(errorResponse);
  }
}

module.exports = {
  getValuation,
  getDetailedValuation,
};
