const VehicleHistory = require('../models/VehicleHistory');
const Car = require('../models/Car');

/**
 * Get vehicle history from database (no API calls)
 * GET /api/vehicle-history/cached/:vrm
 */
async function getCachedVehicleHistory(req, res) {
  try {
    const { vrm } = req.params;
    
    if (!vrm) {
      return res.status(400).json({
        success: false,
        error: 'VRM is required'
      });
    }

    // First try to find via Car document
    const car = await Car.findOne({ 
      registrationNumber: vrm.toUpperCase() 
    }).populate('historyCheckId');

    if (car && car.historyCheckId) {
      return res.json({
        success: true,
        data: car.historyCheckId,
        source: 'car_reference'
      });
    }

    // Fallback: search VehicleHistory directly
    const history = await VehicleHistory.findOne({ 
      vrm: vrm.toUpperCase() 
    }).sort({ checkDate: -1 });

    if (history) {
      return res.json({
        success: true,
        data: history,
        source: 'direct_lookup'
      });
    }

    // No cached data found
    return res.status(404).json({
      success: false,
      error: 'No cached vehicle history found',
      message: 'Vehicle history data not available. This may be a new listing or the data has expired.'
    });

  } catch (error) {
    console.error('Error in getCachedVehicleHistory:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve cached vehicle history'
    });
  }
}

module.exports = {
  getCachedVehicleHistory
};