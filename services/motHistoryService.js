const HistoryAPIClient = require('../clients/HistoryAPIClient');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

class MOTHistoryService {
  constructor() {
    // Initialize HistoryAPIClient with proper credentials
    const environment = process.env.API_ENVIRONMENT || 'production';
    const isTestMode = environment === 'test';
    
    // Get API credentials
    const apiKey = isTestMode 
      ? process.env.CHECKCARD_API_TEST_KEY 
      : process.env.CHECKCARD_API_KEY;
    
    const baseUrl = process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk';
    
    this.client = new HistoryAPIClient(apiKey, baseUrl, isTestMode);
    
    console.log(`[MOTHistoryService] Initialized with ${isTestMode ? 'TEST' : 'PRODUCTION'} mode`);
  }

  /**
   * Fetch and save complete MOT history for a vehicle
   * @param {string} vrm - Vehicle registration mark
   * @param {boolean} forceRefresh - Force new API call
   * @returns {Promise<Object>} MOT history data
   */
  async fetchAndSaveMOTHistory(vrm, forceRefresh = false) {
    try {
      console.log(`[MOTHistoryService] Fetching MOT history for: ${vrm}`);
      
      // Check if we already have MOT history (unless forcing refresh)
      if (!forceRefresh) {
        const existingCar = await Car.findOne({ 
          registrationNumber: vrm.toUpperCase(),
          'motHistory.0': { $exists: true } // Check if motHistory array has data
        });
        
        if (existingCar && existingCar.motHistory.length > 0) {
          console.log(`[MOTHistoryService] Using cached MOT history for ${vrm}`);
          return {
            success: true,
            data: existingCar.motHistory,
            source: 'cached'
          };
        }
      }

      // Fetch from API
      console.log(`[MOTHistoryService] Calling MOT API for: ${vrm}`);
      const apiResponse = await this.client.getMOTHistory(vrm);
      
      console.log(`[MOTHistoryService] API Response structure:`, {
        hasMotTests: !!apiResponse?.motTests,
        hasMotHistory: !!apiResponse?.motHistory,
        hasTests: !!apiResponse?.tests,
        keys: Object.keys(apiResponse || {}),
        testsCount: apiResponse?.tests?.length || 0
      });
      
      // The HistoryAPIClient returns a parsed structure with 'tests' array
      const motTests = apiResponse?.tests || apiResponse?.motHistory || apiResponse?.motTests;
      
      if (!motTests || !Array.isArray(motTests) || motTests.length === 0) {
        console.log(`[MOTHistoryService] No MOT history found in API response for ${vrm}`);
        return {
          success: true,
          data: [],
          source: 'api',
          count: 0,
          message: 'No MOT history available for this vehicle'
        };
      }

      // Process and format MOT history data
      const motHistory = this.processMOTData(motTests);
      
      // Save to Car document
      await this.saveMOTHistoryToCar(vrm, motHistory);
      
      // Also save to VehicleHistory if exists
      await this.saveMOTHistoryToVehicleHistory(vrm, motHistory);
      
      console.log(`[MOTHistoryService] Saved ${motHistory.length} MOT tests for ${vrm}`);
      
      return {
        success: true,
        data: motHistory,
        source: 'api',
        count: motHistory.length
      };

    } catch (error) {
      console.error(`[MOTHistoryService] Error fetching MOT history for ${vrm}:`, error);
      throw error;
    }
  }

  /**
   * Process raw MOT API data into our schema format
   * @param {Array} motTests - Raw MOT test data from API (already parsed by HistoryAPIClient)
   * @returns {Array} Processed MOT history
   */
  processMOTData(motTests) {
    if (!Array.isArray(motTests)) {
      return [];
    }

    return motTests.map(test => ({
      testDate: test.testDate ? new Date(test.testDate) : null,
      expiryDate: test.expiryDate ? new Date(test.expiryDate) : null,
      testResult: test.result || test.testResult || 'UNKNOWN',
      odometerValue: parseInt(test.odometerValue) || 0,
      odometerUnit: test.odometerUnit?.toLowerCase() === 'mi' ? 'mi' : 'km',
      testNumber: test.testNumber || '',
      testCertificateNumber: test.testCertificateNumber || '',
      defects: this.processDefects(test.defects || test.rfrAndComments || []),
      advisoryText: this.extractAdvisories(test.defects || test.rfrAndComments || test.advisoryNotices || []),
      testClass: test.testClass || '',
      testType: test.testType || '',
      completedDate: test.testDate ? new Date(test.testDate) : null,
      testStation: {
        name: test.testStationName || '',
        number: test.testStationNumber || '',
        address: test.testStationAddress || '',
        postcode: test.testStationPostcode || ''
      }
    })).filter(test => test.testDate); // Only include tests with valid dates
  }

  /**
   * Process defects and failures
   * @param {Array} defects - Raw defects data from API
   * @returns {Array} Processed defects
   */
  processDefects(defects) {
    if (!Array.isArray(defects)) {
      return [];
    }

    return defects.map(item => ({
      type: item.type || 'ADVISORY',
      text: item.text || '',
      dangerous: item.dangerous === true || item.type === 'DANGEROUS'
    }));
  }

  /**
   * Extract advisory text from defects
   * @param {Array} defects - Raw defects data from API
   * @returns {Array} Advisory text array
   */
  extractAdvisories(defects) {
    if (!Array.isArray(defects)) {
      return [];
    }

    return defects
      .filter(item => item.type === 'ADVISORY')
      .map(item => item.text)
      .filter(text => text && text.trim().length > 0);
  }

  /**
   * Save MOT history to Car document
   * @param {string} vrm - Vehicle registration mark
   * @param {Array} motHistory - Processed MOT history
   */
  async saveMOTHistoryToCar(vrm, motHistory) {
    try {
      const result = await Car.findOneAndUpdate(
        { registrationNumber: vrm.toUpperCase() },
        { 
          $set: { 
            motHistory: motHistory,
            motHistoryLastUpdated: new Date()
          }
        },
        { new: true }
      );

      if (result) {
        console.log(`[MOTHistoryService] Updated Car document for ${vrm}`);
      } else {
        console.warn(`[MOTHistoryService] Car not found for ${vrm}`);
      }
    } catch (error) {
      console.error(`[MOTHistoryService] Error saving to Car:`, error);
    }
  }

  /**
   * Save MOT history to VehicleHistory document
   * @param {string} vrm - Vehicle registration mark
   * @param {Array} motHistory - Processed MOT history
   */
  async saveMOTHistoryToVehicleHistory(vrm, motHistory) {
    try {
      const result = await VehicleHistory.findOneAndUpdate(
        { vrm: vrm.toUpperCase() },
        { 
          $set: { 
            motHistory: motHistory,
            motHistoryLastUpdated: new Date()
          }
        },
        { new: true }
      );

      if (result) {
        console.log(`[MOTHistoryService] Updated VehicleHistory document for ${vrm}`);
      } else {
        console.log(`[MOTHistoryService] No VehicleHistory document found for ${vrm}`);
      }
    } catch (error) {
      console.error(`[MOTHistoryService] Error saving to VehicleHistory:`, error);
    }
  }

  /**
   * Get MOT history from database (no API call)
   * @param {string} vrm - Vehicle registration mark
   * @returns {Promise<Object>} Cached MOT history
   */
  async getCachedMOTHistory(vrm) {
    try {
      // First try Car document
      const car = await Car.findOne({ 
        registrationNumber: vrm.toUpperCase(),
        'motHistory.0': { $exists: true }
      });

      if (car && car.motHistory.length > 0) {
        return {
          success: true,
          data: car.motHistory,
          source: 'car_document'
        };
      }

      // Fallback to VehicleHistory
      const history = await VehicleHistory.findOne({ 
        vrm: vrm.toUpperCase(),
        'motHistory.0': { $exists: true }
      });

      if (history && history.motHistory.length > 0) {
        return {
          success: true,
          data: history.motHistory,
          source: 'vehicle_history'
        };
      }

      return {
        success: false,
        error: 'No cached MOT history found',
        data: []
      };

    } catch (error) {
      console.error(`[MOTHistoryService] Error getting cached MOT history:`, error);
      throw error;
    }
  }
}

module.exports = MOTHistoryService;