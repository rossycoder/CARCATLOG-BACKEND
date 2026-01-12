/**
 * Valuation Controller
 * Handles HTTP requests for vehicle valuations
 */

const ValuationService = require('../services/valuationService');
const { formatErrorResponse, isAPIUnavailable, handleValuationAPIUnavailable } = require('../utils/errorHandlers');

/**
 * Get vehicle valuation
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

    const valuationService = new ValuationService();
    const valuation = await valuationService.getValuation(vrm, mileage, forceRefresh);

    res.json({
      success: true,
      data: valuation,
    });
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
