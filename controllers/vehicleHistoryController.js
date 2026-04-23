const VehicleHistory = require('../models/VehicleHistory');
const Car = require('../models/Car');
const HistoryService = require('../services/historyService');
const MOTHistoryService = require('../services/motHistoryService');

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

/**
 * Get cached MOT history from DB — no API call
 * GET /api/vehicle-history/mot-cached/:vrm
 */
async function getCachedMOTHistory(req, res) {
  try {
    const { vrm } = req.params;
    if (!vrm) return res.status(400).json({ success: false, error: 'VRM is required' });

    const reg = vrm.toUpperCase();

    // 1. Try Car document first (most up-to-date after syncMOTDataToCar)
    const car = await Car.findOne({ registrationNumber: reg, 'motHistory.0': { $exists: true } });
    if (car && car.motHistory.length > 0) {
      return res.json({ success: true, data: car.motHistory, source: 'car' });
    }

    // 2. Fallback to VehicleHistory
    const history = await VehicleHistory.findOne({ vrm: reg, 'motHistory.0': { $exists: true } });
    if (history && history.motHistory.length > 0) {
      return res.json({ success: true, data: history.motHistory, source: 'vehicle_history' });
    }

    return res.json({ success: true, data: [], source: 'none', message: 'No cached MOT history found' });
  } catch (error) {
    console.error('Error in getCachedMOTHistory:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve cached MOT history' });
  }
}

/**
 * Run full vehicle check (history + MOT) once, cache results, return combined data
 * POST /api/vehicle-history/complete-check
 * Body: { vrm: string }
 */
async function completeVehicleCheck(req, res) {
  try {
    const { vrm } = req.body;
    if (!vrm) return res.status(400).json({ success: false, error: 'VRM is required' });

    const reg = vrm.toUpperCase();
    const historyService = new HistoryService();
    const motService = new MOTHistoryService();

    // Run all three in parallel
    const [histResult, motResult, mileageResult] = await Promise.allSettled([
      historyService.checkVehicleHistory(reg, false),
      motService.fetchAndSaveMOTHistory(reg, false),
      historyService.getMileageHistory(reg)
    ]);

    const history = histResult.status === 'fulfilled' ? histResult.value : null;

    if (!history) {
      return res.status(500).json({
        success: false,
        error: histResult.reason?.message || 'Failed to fetch vehicle history'
      });
    }

    // MOT — prefer API result, fallback to Car → VehicleHistory DB
    let motData = motResult.status === 'fulfilled' ? motResult.value?.data || [] : [];
    if (motData.length === 0) {
      const car = await Car.findOne({ registrationNumber: reg, 'motHistory.0': { $exists: true } });
      if (car?.motHistory?.length > 0) {
        motData = car.motHistory;
      } else {
        const vh = await VehicleHistory.findOne({ vrm: reg, 'motHistory.0': { $exists: true } });
        if (vh?.motHistory?.length > 0) motData = vh.motHistory;
      }
    }

    // Mileage — parse readings from API response
    let mileageHistory = [];
    if (mileageResult.status === 'fulfilled' && mileageResult.value) {
      const raw = mileageResult.value;
      // API returns { readings: [{mileage, date, source}] } or array directly
      const readings = raw.readings || raw.mileageHistory || (Array.isArray(raw) ? raw : []);
      mileageHistory = readings
        .filter(r => r.mileage && r.date)
        .map(r => ({ mileage: r.mileage, date: r.date, source: r.source || 'MOT' }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Also build mileage history from MOT records if API returned nothing
    if (mileageHistory.length === 0 && motData.length > 0) {
      mileageHistory = motData
        .filter(m => m.odometerValue && (m.testDate || m.completedDate))
        .map(m => ({
          mileage: m.odometerValue,
          date: m.testDate || m.completedDate,
          source: 'MOT'
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    const combined = { ...history, motHistory: motData, mileageHistory };

    return res.json({ success: true, data: combined });
  } catch (error) {
    console.error('Error in completeVehicleCheck:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getCachedVehicleHistory,
  getCachedMOTHistory,
  completeVehicleCheck
};