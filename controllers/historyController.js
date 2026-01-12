/**
 * History Controller
 * Handles HTTP requests for vehicle history checks
 */

const HistoryService = require('../services/historyService');
const { formatErrorResponse, isAPIUnavailable, handleHistoryAPIUnavailable } = require('../utils/errorHandlers');

/**
 * Get vehicle history by VRM
 * GET /api/vehicle-history/:vrm
 */
async function getVehicleHistory(req, res) {
  try {
    const { vrm } = req.params;
    
    if (!vrm) {
      return res.status(400).json({
        success: false,
        error: 'VRM is required',
      });
    }

    const historyService = new HistoryService();
    const history = await historyService.getCachedHistory(vrm);

    if (!history) {
      return res.status(404).json({
        success: false,
        error: 'No history check found for this vehicle',
      });
    }

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error in getVehicleHistory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve vehicle history',
      message: error.message,
    });
  }
}

/**
 * Perform new vehicle history check
 * POST /api/vehicle-history/check
 * Body: { vrm: string, forceRefresh?: boolean }
 */
/**
 * Check vehicle history
 * POST /api/vehicle-history/check
 * Body: { vrm: string, forceRefresh?: boolean }
 */
async function checkVehicleHistory(req, res) {
  // Extract vrm outside try block so it's available in catch
  const { vrm, forceRefresh = false } = req.body;
  
  try {
    if (!vrm) {
      return res.status(400).json({
        success: false,
        error: 'VRM is required',
      });
    }

    const historyService = new HistoryService();
    const history = await historyService.checkVehicleHistory(vrm, forceRefresh);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error in checkVehicleHistory:', error);
    
    // Return error - no mock data fallback
    const errorResponse = formatErrorResponse(error, 'history');
    const statusCode = error.message.includes('Invalid VRM') ? 400 : 500;
    
    res.status(statusCode).json(errorResponse);
  }
}

/**
 * Get MOT history for a vehicle
 * GET /api/vehicle-history/mot/:vrm
 */
async function getMOTHistory(req, res) {
  try {
    const { vrm } = req.params;
    
    if (!vrm) {
      return res.status(400).json({
        success: false,
        error: 'VRM is required',
      });
    }

    const historyService = new HistoryService();
    const motHistory = await historyService.getMOTHistory(vrm);

    res.json({
      success: true,
      data: motHistory,
    });
  } catch (error) {
    console.error('Error in getMOTHistory:', error);
    
    // Handle API unavailability with fallback
    if (isAPIUnavailable(error)) {
      return res.status(503).json(handleHistoryAPIUnavailable(error));
    }

    const errorResponse = formatErrorResponse(error, 'MOT history');
    const statusCode = error.message.includes('Invalid VRM') ? 400 : 500;
    
    res.status(statusCode).json(errorResponse);
  }
}

/**
 * Get vehicle registration details
 * GET /api/vehicle-history/registration/:vrm
 */
async function getVehicleRegistration(req, res) {
  try {
    const { vrm } = req.params;
    
    if (!vrm) {
      return res.status(400).json({
        success: false,
        error: 'VRM is required',
      });
    }

    const historyService = new HistoryService();
    const registration = await historyService.getVehicleRegistration(vrm);

    res.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error('Error in getVehicleRegistration:', error);
    
    const errorResponse = formatErrorResponse(error, 'vehicle registration');
    const statusCode = error.message.includes('Invalid VRM') ? 400 : 500;
    
    res.status(statusCode).json(errorResponse);
  }
}

/**
 * Get vehicle specifications
 * GET /api/vehicle-history/specs/:vrm
 */
async function getVehicleSpecs(req, res) {
  try {
    const { vrm } = req.params;
    
    if (!vrm) {
      return res.status(400).json({
        success: false,
        error: 'VRM is required',
      });
    }

    const historyService = new HistoryService();
    const specs = await historyService.getVehicleSpecs(vrm);

    res.json({
      success: true,
      data: specs,
    });
  } catch (error) {
    console.error('Error in getVehicleSpecs:', error);
    
    const errorResponse = formatErrorResponse(error, 'vehicle specifications');
    const statusCode = error.message.includes('Invalid VRM') ? 400 : 500;
    
    res.status(statusCode).json(errorResponse);
  }
}

/**
 * Get mileage history
 * GET /api/vehicle-history/mileage/:vrm
 */
async function getMileageHistory(req, res) {
  try {
    const { vrm } = req.params;
    
    if (!vrm) {
      return res.status(400).json({
        success: false,
        error: 'VRM is required',
      });
    }

    const historyService = new HistoryService();
    const mileage = await historyService.getMileageHistory(vrm);

    res.json({
      success: true,
      data: mileage,
    });
  } catch (error) {
    console.error('Error in getMileageHistory:', error);
    
    const errorResponse = formatErrorResponse(error, 'mileage history');
    const statusCode = error.message.includes('Invalid VRM') ? 400 : 500;
    
    res.status(statusCode).json(errorResponse);
  }
}

/**
 * Get comprehensive vehicle data (all data points)
 * GET /api/vehicle-history/comprehensive/:vrm
 */
async function getComprehensiveData(req, res) {
  try {
    const { vrm } = req.params;
    
    if (!vrm) {
      return res.status(400).json({
        success: false,
        error: 'VRM is required',
      });
    }

    const historyService = new HistoryService();
    const data = await historyService.getComprehensiveVehicleData(vrm);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in getComprehensiveData:', error);
    
    const errorResponse = formatErrorResponse(error, 'comprehensive vehicle data');
    const statusCode = error.message.includes('Invalid VRM') ? 400 : 500;
    
    res.status(statusCode).json(errorResponse);
  }
}

module.exports = {
  getVehicleHistory,
  checkVehicleHistory,
  getMOTHistory,
  getVehicleRegistration,
  getVehicleSpecs,
  getMileageHistory,
  getComprehensiveData,
};
