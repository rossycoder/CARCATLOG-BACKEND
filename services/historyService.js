/**
 * History Service
 * Business logic for vehicle history checks
 *
 * KEY RULE: checkVehicleHistory() makes EXACTLY ONE API call — carhistorycheck.
 * Vehicle specs and MOT history are fetched by UniversalAutoCompleteService
 * (which calls them in parallel as part of its full data fetch).
 * Do NOT add getVehicleSpecs() or getMOTHistory() calls inside this service.
 */

const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const VehicleHistory = require('../models/VehicleHistory');
const { loadAPICredentials, getActiveAPIKey, getActiveBaseUrl } = require('../config/apiCredentials');

class HistoryService {
  constructor() {
    const credentials = loadAPICredentials();
    const environment = credentials.environment;
    const isTestMode = environment === 'test';

    const apiKey = getActiveAPIKey(credentials.historyAPI, environment);
    const baseUrl = getActiveBaseUrl(credentials.historyAPI, environment);

    this.client = new CheckCarDetailsClient(apiKey, baseUrl, isTestMode);
    this.isTestMode = isTestMode;
  }

  // ─── Cache ────────────────────────────────────────────────────────────────

  async getCachedHistory(vrm) {
    try {
      const cached = await VehicleHistory.getMostRecent(vrm);
      if (cached) {
        const daysSinceCheck = (Date.now() - cached.checkDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCheck <= 30) {
          console.log(`✅ Using cached history for ${vrm} (${Math.floor(daysSinceCheck)}d old) — saved £1.82`);
          return cached;
        }
        console.log(`⏰ Cache expired for ${vrm} (${Math.floor(daysSinceCheck)}d old)`);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving cached history:', error);
      return null;
    }
  }

  // ─── Store ────────────────────────────────────────────────────────────────

  async storeHistoryResult(vrm, result) {
    try {
      // Preserve existing running costs so we don't overwrite them
      let preservedAnnualTax = null;
      let preservedInsuranceGroup = null;

      const existingHistory = await VehicleHistory.findOne({ vrm: vrm.toUpperCase() });
      if (existingHistory) {
        preservedAnnualTax    = existingHistory.annualTax;
        preservedInsuranceGroup = existingHistory.insuranceGroup;
      }

      const historyData = {
        vrm: vrm.toUpperCase(),
        make:               result.make,
        model:              result.model,
        colour:             result.colour,
        fuelType:           result.fuelType,
        yearOfManufacture:  result.yearOfManufacture,
        firstRegistered:    result.firstRegistered,
        engineCapacity:     typeof result.engineCapacity === 'object'
                              ? (result.engineCapacity?.value || null)
                              : (typeof result.engineCapacity === 'number' ? result.engineCapacity : null),
        bodyType:           result.bodyType,
        transmission:       result.transmission,
        vin:                result.vin,
        engineNumber:       result.engineNumber,
        co2Emissions:       result.co2Emissions,
        doors:              result.doors,
        seats:              result.seats,
        variant:            result.variant,
        emissionClass:      result.emissionClass,
        urbanMpg:           result.urbanMpg,
        extraUrbanMpg:      result.extraUrbanMpg,
        combinedMpg:        result.combinedMpg,
        annualTax:          result.annualTax    || preservedAnnualTax    || null,
        insuranceGroup:     result.insuranceGroup || preservedInsuranceGroup || null,
        electricRange:      result.electricRange,
        chargingTime:       result.chargingTime,
        batteryCapacity:    result.batteryCapacity,

        // Owner / keeper info — try all possible field names from API
        numberOfPreviousKeepers: result.numberOfPreviousKeepers || result.previousOwners ||
                                  result.numberOfOwners || 0,
        previousOwners:          result.numberOfPreviousKeepers || result.previousOwners ||
                                  result.numberOfOwners || 0,
        numberOfOwners:          result.numberOfPreviousKeepers || result.previousOwners ||
                                  result.numberOfOwners || 0,

        plateChanges:          result.plateChanges       || 0,
        plateChangesList:      result.plateChangesList    || [],
        colourChanges:         result.colourChanges      || 0,
        colourChangesList:     result.colourChangesList   || [],
        colourChangeDetails:   result.colourChangeDetails || {},
        v5cCertificateCount:   result.v5cCertificateCount || 0,
        v5cCertificateList:    result.v5cCertificateList  || [],
        keeperChangesList:     result.keeperChangesList   || [],
        vicCount:              result.vicCount            || 0,

        exported:       result.exported    || result.isExported  || false,
        scrapped:       result.scrapped    || result.isScrapped  || false,
        imported:       result.imported    || result.isImported  || false,
        isExported:     result.exported    || result.isExported  || false,
        isScrapped:     result.scrapped    || result.isScrapped  || false,
        isImported:     result.imported    || result.isImported  || false,
        isWrittenOff:   result.isWrittenOff || false,
        writeOffCategory: result.writeOffCategory || result.writeOffDetails?.category || 'none',
        writeOffDetails: result.writeOffDetails || {
          category:    result.writeOffCategory || 'none',
          date:        result.writeOffDate     || null,
          description: result.writeOffDescription || null
        },

        numberOfKeys:   result.numberOfKeys || result.keys || 1,
        keys:           result.numberOfKeys || result.keys || 1,
        serviceHistory: result.serviceHistory || 'Contact seller',

        // MOT — only what carhistorycheck returns (no separate MOT fetch here)
        motStatus:     result.motStatus,
        motExpiryDate: result.motExpiryDate,
        motHistory:    result.motHistory || result.motTests || [],

        checkDate:            result.checkDate || new Date(),
        hasAccidentHistory:   result.hasAccidentHistory   || false,
        accidentDetails:      result.accidentDetails      || { count: 0, severity: 'unknown', dates: [] },
        isStolen:             result.isStolen             || false,
        stolenDetails:        result.stolenDetails        || {},
        hasOutstandingFinance: result.hasOutstandingFinance || false,
        financeDetails:       result.financeDetails       || { amount: 0, lender: 'Unknown', type: 'unknown' },
        checkStatus:          result.checkStatus          || 'success',
        apiProvider:          result.apiProvider          || 'checkcardetails',
        testMode:             result.testMode             || this.isTestMode,
        mileage:              result.mileage,

        valuation: result.valuation ? {
          privatePrice:      result.valuation.privatePrice,
          dealerPrice:       result.valuation.dealerPrice,
          partExchangePrice: result.valuation.partExchangePrice,
          confidence:        result.valuation.confidence,
          estimatedValue:    result.valuation.estimatedValue
        } : undefined
      };

      // Replace any existing record for this VRM
      await VehicleHistory.deleteMany({ vrm: vrm.toUpperCase() });

      const historyDoc = new VehicleHistory(historyData);
      await historyDoc.save();

      console.log(`✅ Stored history for ${vrm} — owners: ${historyData.numberOfPreviousKeepers}, colour: ${historyData.colour}`);
      return historyDoc;

    } catch (error) {
      console.error('❌ Error storing history result:', error.message);
      throw error;
    }
  }

  // ─── Main: ONE API call only ──────────────────────────────────────────────

  /**
   * Check vehicle history.
   * Makes EXACTLY ONE external API call: carhistorycheck (£1.82).
   * Vehicle specs (MPG, CO2, insurance group) and MOT history are fetched
   * separately by UniversalAutoCompleteService — do NOT add them here.
   */
  async checkVehicleHistory(vrm, forceRefresh = false) {
    const startTime = Date.now();

    try {
      // Cache check — skip API if data is fresh (≤30 days)
      if (!forceRefresh) {
        const cached = await this.getCachedHistory(vrm);
        if (cached) return cached.toObject();
      }

      console.log(`📞 [HistoryService] Calling carhistorycheck API for ${vrm} (£1.82)`);

      // ── SINGLE API CALL ──────────────────────────────────────────────────
      const result = await this.client.checkHistory(vrm);
      // ── NO getVehicleSpecs() call here  — UniversalService handles specs ──
      // ── NO getMOTHistory() call here    — UniversalService handles MOT   ──

      console.log(`✅ [HistoryService] History API completed in ${Date.now() - startTime}ms`);

      const stored = await this.storeHistoryResult(vrm, result);

      // Sync basic MOT fields to Car model (uses $locals.skipPreSave — no loop)
      await this.syncMOTDataToCar(vrm, stored);

      return stored.toObject();

    } catch (error) {
      console.error(`❌ [HistoryService] History API failed after ${Date.now() - startTime}ms:`, error.message);

      const isNetworkError = error.code === 'ENOTFOUND' ||
                             error.details?.code === 'ENOTFOUND' ||
                             error.originalError?.code === 'ENOTFOUND';
      if (isNetworkError) {
        const enhanced = new Error(
          `CheckCarDetails History API unreachable (${this.client.baseUrl}). ` +
          `Original error: ${error.message}`
        );
        enhanced.originalError = error;
        enhanced.isNetworkError = true;
        throw enhanced;
      }
      throw error;
    }
  }

  // ─── Sync MOT fields to Car (no pre-save loop) ───────────────────────────

  async syncMOTDataToCar(vrm, vehicleHistory) {
    try {
      const Car = require('../models/Car');
      const car = await Car.findOne({ registrationNumber: vrm.toUpperCase() });

      if (!car) {
        console.log(`⚠️  [HistoryService] No car found for ${vrm} — skipping MOT sync`);
        return;
      }

      let updated = false;

      if (vehicleHistory.motStatus) {
        car.motStatus = vehicleHistory.motStatus;
        updated = true;
      }
      if (vehicleHistory.motExpiryDate) {
        car.motDue    = vehicleHistory.motExpiryDate;
        car.motExpiry = vehicleHistory.motExpiryDate;
        updated = true;
      }

      // Normalize and sync MOT history array
      const rawTests = vehicleHistory.motHistory || [];
      if (rawTests.length > 0) {
        car.motHistory = rawTests.map(test => ({
          testDate:              test.testDate || test.completedDate || test.date,
          expiryDate:            test.expiryDate,
          testResult:            test.testResult || test.result || 'PASSED',
          odometerValue:         test.odometerValue || test.mileage,
          odometerUnit:          (test.odometerUnit || 'MI').toLowerCase(),
          testNumber:            test.testNumber,
          testCertificateNumber: test.testCertificateNumber,
          defects:               test.defects       || [],
          advisoryText:          test.advisoryText  || [],
          testClass:             test.testClass,
          testType:              test.testType,
          completedDate:         test.completedDate || test.testDate,
          testStation:           test.testStation
        })).filter(t => t.testDate);
        updated = true;
        console.log(`   ✅ MOT history: ${car.motHistory.length} tests`);
      }

      if (vehicleHistory.colour && (!car.color || car.color === 'null')) {
        car.color = vehicleHistory.colour;
        updated = true;
      }
      if (vehicleHistory.numberOfPreviousKeepers !== undefined) {
        car.previousOwners = vehicleHistory.numberOfPreviousKeepers;
        updated = true;
      }

      if (updated) {
        // skipPreSave = true prevents pre-save hook from re-calling history API
        car.$locals.skipPreSave = true;
        await car.save();
        console.log(`✅ [HistoryService] MOT data synced to Car for ${vrm}`);
      }

    } catch (error) {
      console.error(`❌ [HistoryService] syncMOTDataToCar failed for ${vrm}:`, error.message);
      // Non-critical — don't rethrow
    }
  }

  // ─── Other methods (used elsewhere, unchanged) ───────────────────────────

  async getVehicleRegistration(vrm) {
    try {
      console.log(`Fetching vehicle registration for ${vrm}`);
      return await this.client.getVehicleRegistration(vrm);
    } catch (error) {
      console.error(`Vehicle registration fetch failed:`, error.message);
      throw error;
    }
  }

  async getVehicleSpecs(vrm) {
    try {
      console.log(`Fetching vehicle specs for ${vrm}`);
      return await this.client.getVehicleSpecs(vrm);
    } catch (error) {
      console.error(`Vehicle specs fetch failed:`, error.message);
      throw error;
    }
  }

  async getMileageHistory(vrm) {
    try {
      console.log(`Fetching mileage history for ${vrm}`);
      return await this.client.getMileageHistory(vrm);
    } catch (error) {
      console.error(`Mileage history fetch failed:`, error.message);
      throw error;
    }
  }

  async getMOTHistory(vrm) {
    try {
      console.log(`Fetching MOT history for ${vrm}`);
      return await this.client.getMOTHistory(vrm);
    } catch (error) {
      console.error(`MOT history fetch failed:`, error.message);
      const isNetworkError = error.code === 'ENOTFOUND' ||
                             error.details?.code === 'ENOTFOUND' ||
                             error.originalError?.code === 'ENOTFOUND';
      if (isNetworkError) {
        const enhanced = new Error(`MOT History API unreachable. Original: ${error.message}`);
        enhanced.originalError = error;
        enhanced.isNetworkError = true;
        throw enhanced;
      }
      throw error;
    }
  }

  async getComprehensiveVehicleData(vrm) {
    try {
      console.log(`Fetching comprehensive vehicle data for ${vrm}`);
      const [registration, specs, mileage, history, mot] = await Promise.allSettled([
        this.getVehicleRegistration(vrm),
        this.getVehicleSpecs(vrm),
        this.getMileageHistory(vrm),
        this.checkVehicleHistory(vrm),
        this.getMOTHistory(vrm)
      ]);
      return {
        vrm: vrm.toUpperCase(),
        registration:  registration.status === 'fulfilled' ? registration.value  : null,
        specifications: specs.status       === 'fulfilled' ? specs.value         : null,
        mileageHistory: mileage.status     === 'fulfilled' ? mileage.value       : null,
        historyCheck:   history.status     === 'fulfilled' ? history.value       : null,
        motHistory:     mot.status         === 'fulfilled' ? mot.value           : null,
        errors: {
          registration:  registration.status  === 'rejected' ? registration.reason.message  : null,
          specifications: specs.status        === 'rejected' ? specs.reason.message         : null,
          mileageHistory: mileage.status      === 'rejected' ? mileage.reason.message       : null,
          historyCheck:   history.status      === 'rejected' ? history.reason.message       : null,
          motHistory:     mot.status          === 'rejected' ? mot.reason.message           : null
        }
      };
    } catch (error) {
      console.error(`Comprehensive fetch failed:`, error.message);
      throw error;
    }
  }
}

module.exports = HistoryService;