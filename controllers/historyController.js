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
    
    // Handle API unavailability with fallback - return mock data instead of error
    if (isAPIUnavailable(error) || error.isNetworkError) {
      console.log('History API unavailable, returning mock data for:', vrm || 'UNKNOWN');
      return res.json({
        success: true,
        data: getMockHistoryData(vrm || 'UNKNOWN'),
        isMockData: true,
        message: 'Using demonstration data - History API temporarily unavailable'
      });
    }

    // Handle other errors with user-friendly messages
    const errorResponse = formatErrorResponse(error, 'history');
    const statusCode = error.message.includes('Invalid VRM') ? 400 : 500;
    
    res.status(statusCode).json(errorResponse);
  }
}

/**
 * Generate mock history data for fallback
 */
function getMockHistoryData(vrm) {
  const currentDate = new Date();
  return {
    vrm: vrm.toUpperCase(),
    checkDate: currentDate,
    stolen: false,
    scrapped: false,
    imported: false,
    exported: false,
    writeOff: false,
    colourChanges: 0,
    plateChanges: 0,
    previousKeepers: 2,
    outstandingFinance: false,
    motHistory: {
      currentStatus: 'Valid',
      expiryDate: new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate()),
      tests: [
        {
          testDate: new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 15),
          result: 'PASSED',
          mileage: 45000,
          advisories: ['Nearside Front Tyre worn close to legal limit']
        }
      ]
    },
    taxStatus: 'Taxed',
    taxDueDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 6, 1),
    isMockData: true
  };
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
