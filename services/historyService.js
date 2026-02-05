/**
 * History Service
 * Business logic for vehicle history checks
 */

const HistoryAPIClient = require('../clients/HistoryAPIClient');
const VehicleHistory = require('../models/VehicleHistory');
const { loadAPICredentials, getActiveAPIKey, getActiveBaseUrl } = require('../config/apiCredentials');

class HistoryService {
  constructor() {
    // Load credentials
    const credentials = loadAPICredentials();
    const environment = credentials.environment;
    const isTestMode = environment === 'test';

    // Initialize API client
    const apiKey = getActiveAPIKey(credentials.historyAPI, environment);
    const baseUrl = getActiveBaseUrl(credentials.historyAPI, environment);
    
    this.client = new HistoryAPIClient(apiKey, baseUrl, isTestMode);
    this.isTestMode = isTestMode;
  }

  /**
   * Get cached history check result
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object|null>} Cached history result or null
   */
  async getCachedHistory(vrm) {
    try {
      const cached = await VehicleHistory.getMostRecent(vrm);
      
      // Check if cache is still fresh (within 30 days)
      if (cached) {
        const daysSinceCheck = (Date.now() - cached.checkDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCheck <= 30) {
          console.log(`Using cached history for VRM ${vrm} (${Math.floor(daysSinceCheck)} days old)`);
          return cached;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving cached history:', error);
      return null;
    }
  }

  /**
   * Store history check result in database
   * @param {string} vrm - Vehicle Registration Mark
   * @param {Object} result - History check result
   * @returns {Promise<Object>} Saved history document
   */
  async storeHistoryResult(vrm, result) {
    try {
      // Map API response to VehicleHistory schema
      const historyData = {
        vrm: vrm.toUpperCase(),
        make: result.make,
        model: result.model,
        colour: result.colour,
        fuelType: result.fuelType,
        yearOfManufacture: result.yearOfManufacture,
        firstRegistered: result.firstRegistered,
        engineCapacity: typeof result.engineCapacity === 'object' ? 
                        (result.engineCapacity?.value || null) : 
                        (typeof result.engineCapacity === 'number' ? result.engineCapacity : null),
        bodyType: result.bodyType,
        transmission: result.transmission,
        vin: result.vin,
        engineNumber: result.engineNumber,
        co2Emissions: result.co2Emissions,
        
        // Owner information - map from API response
        // Try multiple possible field names from different API sources
        numberOfPreviousKeepers: result.numberOfPreviousKeepers || 
                                result.previousOwners || 
                                result.numberOfOwners || 
                                result.NumberOfPreviousKeepers ||
                                result.PreviousOwners ||
                                result.NumberOfOwners ||
                                0,
        previousOwners: result.numberOfPreviousKeepers || 
                       result.previousOwners || 
                       result.numberOfOwners || 
                       result.NumberOfPreviousKeepers ||
                       result.PreviousOwners ||
                       result.NumberOfOwners ||
                       0,
        numberOfOwners: result.numberOfPreviousKeepers || 
                       result.previousOwners || 
                       result.numberOfOwners || 
                       result.NumberOfPreviousKeepers ||
                       result.PreviousOwners ||
                       result.NumberOfOwners ||
                       0,
        
        // Plate changes
        plateChanges: result.plateChanges || 0,
        plateChangesList: result.plateChangesList || [],
        
        // Colour changes
        colourChanges: result.colourChanges || 0,
        colourChangesList: result.colourChangesList || [],
        colourChangeDetails: result.colourChangeDetails || {},
        
        // V5C certificates
        v5cCertificateCount: result.v5cCertificateCount || 0,
        v5cCertificateList: result.v5cCertificateList || [],
        
        // Keeper changes
        keeperChangesList: result.keeperChangesList || [],
        
        // VIC
        vicCount: result.vicCount || 0,
        
        // Status flags
        exported: result.exported || result.isExported || false,
        scrapped: result.scrapped || result.isScrapped || false,
        imported: result.imported || result.isImported || false,
        isExported: result.exported || result.isExported || false,
        isScrapped: result.scrapped || result.isScrapped || false,
        isImported: result.imported || result.isImported || false,
        isWrittenOff: result.isWrittenOff || false,
        writeOffCategory: result.writeOffCategory || result.writeOffDetails?.category || 'none',
        writeOffDetails: result.writeOffDetails || {
          category: result.writeOffCategory || 'none',
          date: result.writeOffDate || null,
          description: result.writeOffDescription || null,
        },
        
        // Keys
        numberOfKeys: result.numberOfKeys || result.keys || 1,
        keys: result.numberOfKeys || result.keys || 1,
        
        // Service history
        serviceHistory: result.serviceHistory || 'Contact seller',
        
        // MOT
        motStatus: result.motStatus,
        motExpiryDate: result.motExpiryDate,
        
        // Check metadata
        checkDate: result.checkDate || new Date(),
        hasAccidentHistory: result.hasAccidentHistory || false,
        accidentDetails: result.accidentDetails || { count: 0, severity: 'unknown', dates: [] },
        isStolen: result.isStolen || false,
        stolenDetails: result.stolenDetails || {},
        hasOutstandingFinance: result.hasOutstandingFinance || false,
        financeDetails: result.financeDetails || { amount: 0, lender: 'Unknown', type: 'unknown' },
        checkStatus: result.checkStatus || 'success',
        apiProvider: result.apiProvider || 'checkcardetails',
        testMode: result.testMode || this.isTestMode,
      };

      // IMPORTANT: Delete any existing records for this VRM first to prevent duplicates
      await VehicleHistory.deleteMany({ vrm: vrm.toUpperCase() });
      console.log(`🗑️  Deleted existing history records for ${vrm}`);
      
      // Now create the new record
      const historyDoc = new VehicleHistory(historyData);
      await historyDoc.save();
      
      console.log(`✅ Stored history check for VRM ${vrm}`);
      console.log(`   Owners: ${historyData.numberOfPreviousKeepers}`);
      console.log(`   Colour: ${historyData.colour}`);
      console.log(`   Make/Model: ${historyData.make} ${historyData.model}`);
      
      return historyDoc;
    } catch (error) {
      console.error('❌ Error storing history result:', error.message);
      console.error('   Result data:', JSON.stringify(result, null, 2));
      throw error;
    }
  }

  /**
   * Perform vehicle history check
   * @param {string} vrm - Vehicle Registration Mark
   * @param {boolean} forceRefresh - Force new check even if cached data exists
   * @returns {Promise<Object>} History check result
   */
  async checkVehicleHistory(vrm, forceRefresh = false) {
    const startTime = Date.now();
    
    try {
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cached = await this.getCachedHistory(vrm);
        if (cached) {
          return cached.toObject();
        }
      }

      // Call CheckCardDetails API
      console.log(`Calling CheckCardDetails History API for VRM ${vrm}`);
      console.log(`API Endpoint: ${this.client.baseUrl}/vehicledata/history`);
      
      const result = await this.client.checkHistory(vrm);
      
      const responseTime = Date.now() - startTime;
      console.log(`History API call completed in ${responseTime}ms`);

      // Store result
      const stored = await this.storeHistoryResult(vrm, result);
      
      return stored.toObject();
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`History API call failed after ${responseTime}ms:`, error.message);

      // Provide helpful error message
      const isNetworkError = error.code === 'ENOTFOUND' || 
                             error.details?.code === 'ENOTFOUND' ||
                             error.originalError?.code === 'ENOTFOUND';
      
      if (isNetworkError) {
        const enhancedError = new Error(
          `CheckCardDetails History API is not reachable. ` +
          `Please verify the API endpoint (${this.client.baseUrl}) and your network connection. ` +
          `Original error: ${error.message}`
        );
        enhancedError.originalError = error;
        enhancedError.isNetworkError = true;
        throw enhancedError;
      }

      throw error;
    }
  }

  /**
   * Get vehicle registration details
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object>} Vehicle registration data
   */
  async getVehicleRegistration(vrm) {
    const startTime = Date.now();
    
    try {
      console.log(`Fetching vehicle registration for VRM ${vrm}`);
      const result = await this.client.getVehicleRegistration(vrm);
      
      const responseTime = Date.now() - startTime;
      console.log(`Vehicle registration API call completed in ${responseTime}ms`);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`Vehicle registration API call failed after ${responseTime}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Get vehicle specifications
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object>} Vehicle specifications
   */
  async getVehicleSpecs(vrm) {
    const startTime = Date.now();
    
    try {
      console.log(`Fetching vehicle specs for VRM ${vrm}`);
      const result = await this.client.getVehicleSpecs(vrm);
      
      const responseTime = Date.now() - startTime;
      console.log(`Vehicle specs API call completed in ${responseTime}ms`);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`Vehicle specs API call failed after ${responseTime}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Get vehicle mileage history
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object>} Mileage history
   */
  async getMileageHistory(vrm) {
    const startTime = Date.now();
    
    try {
      console.log(`Fetching mileage history for VRM ${vrm}`);
      const result = await this.client.getMileageHistory(vrm);
      
      const responseTime = Date.now() - startTime;
      console.log(`Mileage history API call completed in ${responseTime}ms`);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`Mileage history API call failed after ${responseTime}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive vehicle data (all data points)
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object>} Comprehensive vehicle data
   */
  async getComprehensiveVehicleData(vrm) {
    const startTime = Date.now();
    
    try {
      console.log(`Fetching comprehensive vehicle data for VRM ${vrm}`);
      
      // Fetch all data points in parallel
      const [registration, specs, mileage, history, mot] = await Promise.allSettled([
        this.getVehicleRegistration(vrm),
        this.getVehicleSpecs(vrm),
        this.getMileageHistory(vrm),
        this.checkVehicleHistory(vrm),
        this.getMOTHistory(vrm),
      ]);

      const responseTime = Date.now() - startTime;
      console.log(`Comprehensive vehicle data fetch completed in ${responseTime}ms`);

      // Combine results
      return {
        vrm: vrm.toUpperCase(),
        registration: registration.status === 'fulfilled' ? registration.value : null,
        specifications: specs.status === 'fulfilled' ? specs.value : null,
        mileageHistory: mileage.status === 'fulfilled' ? mileage.value : null,
        historyCheck: history.status === 'fulfilled' ? history.value : null,
        motHistory: mot.status === 'fulfilled' ? mot.value : null,
        errors: {
          registration: registration.status === 'rejected' ? registration.reason.message : null,
          specifications: specs.status === 'rejected' ? specs.reason.message : null,
          mileageHistory: mileage.status === 'rejected' ? mileage.reason.message : null,
          historyCheck: history.status === 'rejected' ? history.reason.message : null,
          motHistory: mot.status === 'rejected' ? mot.reason.message : null,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`Comprehensive vehicle data fetch failed after ${responseTime}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Get MOT history for a vehicle
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object>} MOT history data
   */
  async getMOTHistory(vrm) {
    const startTime = Date.now();
    
    try {
      console.log(`Fetching MOT history for VRM ${vrm}`);
      
      // Call the MOT history API (using CheckCardDetails or DVSA MOT API)
      const result = await this.client.getMOTHistory(vrm);
      
      const responseTime = Date.now() - startTime;
      console.log(`MOT History API call completed in ${responseTime}ms`);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`MOT History API call failed after ${responseTime}ms:`, error.message);

      // Provide helpful error message
      const isNetworkError = error.code === 'ENOTFOUND' || 
                             error.details?.code === 'ENOTFOUND' ||
                             error.originalError?.code === 'ENOTFOUND';
      
      if (isNetworkError) {
        const enhancedError = new Error(
          `MOT History API is not reachable. ` +
          `Please verify the API endpoint and your network connection. ` +
          `Original error: ${error.message}`
        );
        enhancedError.originalError = error;
        enhancedError.isNetworkError = true;
        throw enhancedError;
      }

      throw error;
    }
  }
}

module.exports = HistoryService;
