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

module.exports = {
  getVehicleHistory,
  checkVehicleHistory,
  getMOTHistory,
};
