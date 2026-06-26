/**
 * fetchVehicleAPIs.js
 * Shared utility — fetch MOT + History APIs for any vehicle.
 * Used by paymentController (normal users) and tradeInventoryController (dealers).
 *
 * Cost: ~£1.84 per registration (History £1.82 + MOT £0.02)
 * Always uses VehicleHistory cache — never double-charges for same reg.
 */

/**
 * Fetch MOT history + vehicle history for a registration number.
 * Returns structured data ready to apply to a Car/Bike/Van document.
 *
 * @param {string} registrationNumber
 * @param {boolean} forceRefresh - true = skip cache (first-time payment)
 * @returns {Promise<Object>} { motHistory, motDue, motExpiry, motStatus,
 *                              historyCheckId, historyCheckStatus, historyCheckDate,
 *                              previousOwners, colourChanges, plateChanges }
 */
async function fetchVehicleAPIs(registrationNumber, forceRefresh = false) {
  if (!registrationNumber) return {};

  const HistoryService    = require('../services/historyService');
  const MOTHistoryService = require('../services/motHistoryService');

  const historyService    = new HistoryService();
  const motHistoryService = new MOTHistoryService();

  const [motResult, histResult] = await Promise.allSettled([
    motHistoryService.getMOTHistory(registrationNumber),
    historyService.checkVehicleHistory(registrationNumber, !forceRefresh) // true = use cache
  ]);

  const out = {};

  // ── MOT ──────────────────────────────────────────────────────────────────
  if (motResult.status === 'fulfilled' && motResult.value) {
    const motData = motResult.value;
    const tests   = motData.motTests || motData.motHistory || [];
    if (tests.length > 0) {
      out.motHistory = tests;
      const latest  = tests[0];
      if (latest.expiryDate) {
        out.motDue    = latest.expiryDate;
        out.motExpiry = latest.expiryDate;
        out.motStatus = latest.testResult === 'PASSED' ? 'Valid' : 'Expired';
      }
    }
  } else {
  }

  // ── History ───────────────────────────────────────────────────────────────
  if (histResult.status === 'fulfilled' && histResult.value) {
    const h = histResult.value;
    if (h._id) {
      out.historyCheckId     = h._id.toString();
      out.historyCheckStatus = 'verified';
      out.historyCheckDate   = h.checkDate || new Date();
    }
    if (h.previousOwners !== undefined) out.previousOwners = h.previousOwners;
    if (h.colourChanges  !== undefined) out.colourChanges  = h.colourChanges;
    if (h.plateChanges   !== undefined) out.plateChanges   = h.plateChanges;
  } else {
  }

  return out;
}

/**
 * Apply API data (from fetchVehicleAPIs) into a Mongoose vehicle document.
 * Works for Car, Bike, Van documents.
 *
 * @param {Object} vehicle  - Mongoose document
 * @param {Object} apiData  - Result from fetchVehicleAPIs()
 */
function applyAPIDataToVehicle(vehicle, apiData) {
  if (!apiData || !Object.keys(apiData).length) return;

  if (apiData.motHistory?.length) {
    vehicle.motHistory = apiData.motHistory;
    vehicle.motDue     = apiData.motDue    || vehicle.motDue;
    vehicle.motExpiry  = apiData.motExpiry || vehicle.motExpiry;
    vehicle.motStatus  = apiData.motStatus || vehicle.motStatus;
  }
  if (apiData.historyCheckId) {
    vehicle.historyCheckId     = apiData.historyCheckId;
    vehicle.historyCheckStatus = apiData.historyCheckStatus;
    vehicle.historyCheckDate   = apiData.historyCheckDate;
  }
  if (apiData.previousOwners !== undefined) vehicle.previousOwners = apiData.previousOwners;
  if (apiData.colourChanges  !== undefined) vehicle.colourChanges  = apiData.colourChanges;
  if (apiData.plateChanges   !== undefined) vehicle.plateChanges   = apiData.plateChanges;
}

module.exports = { fetchVehicleAPIs, applyAPIDataToVehicle };
