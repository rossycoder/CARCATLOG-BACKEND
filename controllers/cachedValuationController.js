const Car = require('../models/Car');

/**
 * Get cached valuation data (no API calls)
 * GET /api/vehicle-valuation/cached/:vrm
 */
async function getCachedValuation(req, res) {
  try {
    const { vrm } = req.params;
    
    if (!vrm) {
      return res.status(400).json({
        success: false,
        error: 'VRM is required'
      });
    }

    // Find car with valuation data
    const car = await Car.findOne({ 
      registrationNumber: vrm.toUpperCase() 
    });

    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found',
        message: 'No vehicle found with this registration number'
      });
    }

    if (!car.valuation || !car.valuation.privatePrice) {
      return res.status(404).json({
        success: false,
        error: 'No valuation data available',
        message: 'Valuation data not available for this vehicle'
      });
    }

    // Return cached valuation data
    return res.json({
      success: true,
      data: {
        estimatedValue: {
          private: car.valuation.privatePrice,
          retail: car.valuation.dealerPrice,
          trade: car.valuation.partExchangePrice
        },
        confidence: car.valuation.confidence || 'medium',
        valuationDate: car.valuation.valuationDate,
        vrm: car.registrationNumber,
        mileage: car.mileage
      },
      source: 'cached'
    });

  } catch (error) {
    console.error('Error in getCachedValuation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve cached valuation data'
    });
  }
}

module.exports = {
  getCachedValuation
};