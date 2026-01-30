/**
 * Enhanced Vehicle Service
 * Calls CheckCarDetails and Valuation APIs in parallel and merges results
 */

const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const ValuationAPIClientClass = require('../clients/ValuationAPIClient');
const dataMerger = require('../utils/dataMerger');
const VehicleHistory = require('../models/VehicleHistory');

// Initialize ValuationAPIClient with credentials
const ValuationAPIClient = new ValuationAPIClientClass(
  process.env.CHECKCARD_API_KEY,
  process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk',
  process.env.API_ENVIRONMENT !== 'production'
);

class EnhancedVehicleService {
  constructor() {
    this.cacheTTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  }

  /**
   * Get enhanced vehicle data from CheckCarDetails and Valuation APIs
   * @param {string} registration - Vehicle registration number
   * @param {boolean} useCache - Whether to check cache first (default: true)
   * @param {number} mileage - Optional mileage for valuation (default: estimated from MOT)
   * @returns {Promise<Object>} Merged vehicle data with source tracking
   */
  async getEnhancedVehicleData(registration, useCache = true, mileage = null) {
    console.log(`Enhanced vehicle lookup for: ${registration}`);
    
    // Check cache first if enabled
    if (useCache) {
      const cachedData = await this.checkCache(registration);
      if (cachedData) {
        console.log(`Cache hit for ${registration}`);
        return cachedData;
      }
    }

    // Call CheckCarDetails first to get vehicle data and mileage if not provided
    const [checkCarResult] = await Promise.allSettled([
      this.callCheckCarDetailsAPI(registration)
    ]);

    // Extract data from results
    const checkCarData = checkCarResult.status === 'fulfilled' ? checkCarResult.value : null;

    // Estimate mileage if not provided (use CheckCarDetails or default)
    const estimatedMileage = mileage || checkCarData?.mileage || 50000;

    // Now call valuation API with mileage
    const valuationResult = await Promise.allSettled([
      this.callValuationAPI(registration, estimatedMileage)
    ]);

    const valuationData = valuationResult[0].status === 'fulfilled' ? valuationResult[0].value : null;

    // Log API call results
    this.logAPIResults(registration, checkCarResult, valuationResult[0]);

    // Merge data using Data Merger
    const mergedData = dataMerger.merge(checkCarData, valuationData);

    // Add registration number to merged data
    mergedData.registration = registration;

    // Cache the merged data and get the saved history document
    const savedHistory = await this.cacheData(registration, mergedData);
    
    // Add the history document ID to merged data so it can be linked to the car
    if (savedHistory && savedHistory._id) {
      mergedData.historyCheckId = savedHistory._id;
      console.log(`✅ History document ID added to merged data: ${savedHistory._id}`);
    }

    return mergedData;
  }

  /**
   * Call CheckCarDetails API with error handling
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object|null>} CheckCarDetails data or null if failed
   */
  async callCheckCarDetailsAPI(registration) {
    try {
      console.log(`Calling CheckCarDetails API for ${registration}`);
      
      // Fetch vehicle data, history, AND MOT history
      const [vehicleData, historyData, motData] = await Promise.allSettled([
        CheckCarDetailsClient.getVehicleData(registration),
        CheckCarDetailsClient.getVehicleHistory(registration),
        CheckCarDetailsClient.getMOTHistory(registration)
      ]);
      
      const vehicle = vehicleData.status === 'fulfilled' ? vehicleData.value : null;
      const history = historyData.status === 'fulfilled' ? historyData.value : null;
      const mot = motData.status === 'fulfilled' ? motData.value : null;
      
      // Merge vehicle data with history data
      const mergedData = { ...vehicle };
      
      if (history) {
        // Extract history data from API response
        const vehicleHistory = history.VehicleHistory || {};
        
        // Add owner/keeper information
        mergedData.numberOfPreviousKeepers = vehicleHistory.NumberOfPreviousKeepers || 0;
        mergedData.previousOwners = vehicleHistory.NumberOfPreviousKeepers || 0;
        mergedData.numberOfOwners = vehicleHistory.NumberOfPreviousKeepers || 0;
        mergedData.v5cCertificateCount = vehicleHistory.V5CCertificateCount || 0;
        mergedData.plateChanges = vehicleHistory.PlateChangeCount || 0;
        mergedData.colourChanges = vehicleHistory.ColourChangeCount || 0;
        mergedData.vicCount = vehicleHistory.VicCount || 0;
        
        // Add safety checks
        mergedData.isStolen = Boolean(vehicleHistory.stolenRecord);
        mergedData.isWrittenOff = Boolean(vehicleHistory.writeOffRecord);
        mergedData.hasAccidentHistory = Boolean(vehicleHistory.writeOffRecord);
        mergedData.hasOutstandingFinance = Boolean(vehicleHistory.financeRecord);
        
        // Enhanced write-off category extraction
        if (vehicleHistory.writeOffRecord) {
          console.log(`⚠️ Write-off detected for ${registration}`);
          
          // Try to extract write-off data from multiple possible locations
          const writeoffData = vehicleHistory.writeoff || 
                              vehicleHistory.writeOffData || 
                              vehicleHistory.WriteOff ||
                              vehicleHistory.writeOff;
          
          if (writeoffData) {
            const writeoffItem = Array.isArray(writeoffData) ? writeoffData[0] : writeoffData;
            
            console.log(`Write-off data found:`, writeoffItem);
            
            // Extract category from multiple possible fields
            let category = writeoffItem.category || 
                          writeoffItem.Category || 
                          writeoffItem.insuranceCategory ||
                          writeoffItem.InsuranceCategory ||
                          writeoffItem.damageCategory;
            
            // If no direct category, try to extract from status/description
            if (!category && writeoffItem.status) {
              const status = writeoffItem.status.toUpperCase();
              if (status.includes('CAT A') || status.includes('CATEGORY A')) category = 'A';
              else if (status.includes('CAT B') || status.includes('CATEGORY B')) category = 'B';
              else if (status.includes('CAT C') || status.includes('CATEGORY C')) category = 'C';
              else if (status.includes('CAT D') || status.includes('CATEGORY D')) category = 'D';
              else if (status.includes('CAT S') || status.includes('CATEGORY S')) category = 'S';
              else if (status.includes('CAT N') || status.includes('CATEGORY N')) category = 'N';
            }
            
            if (category) {
              // Clean up category format
              mergedData.writeOffCategory = category.toUpperCase().replace('CATEGORY', '').replace('CAT', '').trim();
              console.log(`✅ Write-off category extracted: ${mergedData.writeOffCategory}`);
            } else {
              console.log(`⚠️ Write-off category not found in data`);
            }
            
            // Store full write-off details for debugging and display
            mergedData.writeOffDetails = {
              date: writeoffItem.date || writeoffItem.Date || writeoffItem.reportedDate,
              category: category,
              status: writeoffItem.status || writeoffItem.Status,
              description: writeoffItem.description || writeoffItem.Description,
              miic: writeoffItem.miic || writeoffItem.MIIC
            };
            
            console.log(`Write-off details stored:`, mergedData.writeOffDetails);
          } else {
            console.log(`⚠️ Write-off record exists but no detailed data found`);
          }
        }
        
        console.log(`✅ History data merged: ${mergedData.numberOfPreviousKeepers} owners`);
      }
      
      // Add MOT history if available
      if (mot) {
        console.log(`✅ MOT data received for ${registration}`);
        
        // Extract MOT history from API response - handle actual API structure
        const motHistory = mot.motHistory || mot.MotHistory || mot.MOTHistory || [];
        
        if (Array.isArray(motHistory) && motHistory.length > 0) {
          // Format MOT history for frontend - map actual API fields
          mergedData.motHistory = motHistory.map(record => ({
            date: record.completedDate || record.testDate || record.TestDate || record.date,
            mileage: parseInt(record.odometerValue) || record.mileage || record.OdometerValue,
            result: record.testResult || record.result || record.TestResult,
            expiry: record.expiryDate || record.expiry || record.ExpiryDate,
            testNumber: record.motTestNumber || record.testNumber,
            advisories: record.defects?.filter(d => d.type === 'ADVISORY').map(d => d.text) || [],
            failures: record.defects?.filter(d => d.type === 'PRS' || d.type === 'FAIL').map(d => d.text) || []
          }));
          
          console.log(`✅ MOT history formatted: ${mergedData.motHistory.length} records`);
          
          // Extract mileage history from MOT records
          mergedData.mileageHistory = motHistory
            .filter(record => record.odometerValue || record.OdometerValue)
            .map(record => ({
              date: new Date(record.completedDate || record.testDate || record.TestDate).toLocaleDateString('en-GB'),
              year: new Date(record.completedDate || record.testDate || record.TestDate).getFullYear(),
              mileage: parseInt(record.odometerValue) || parseInt(record.OdometerValue),
              source: 'MOT'
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          
          console.log(`✅ Mileage history extracted: ${mergedData.mileageHistory.length} records`);
          
          // Add MOT status from API
          if (mot.mot) {
            mergedData.motStatus = mot.mot.motStatus;
            mergedData.motDueDate = mot.mot.motDueDate;
            mergedData.motExpiry = mot.mot.motDueDate;
          }
        } else {
          console.log(`⚠️ No MOT history records found`);
          mergedData.motHistory = [];
          mergedData.mileageHistory = [];
        }
      } else {
        console.log(`⚠️ No MOT data available for ${registration}`);
        mergedData.motHistory = [];
        mergedData.mileageHistory = [];
      }
      
      console.log(`✅ CheckCarDetails API success for ${registration}`);
      console.log(`   Owners: ${mergedData.numberOfPreviousKeepers}, Write-off: ${mergedData.isWrittenOff}, Category: ${mergedData.writeOffCategory}`);
      return mergedData;
    } catch (error) {
      console.error(`CheckCarDetails API error for ${registration}:`, error.message);
      console.error(`CheckCarDetails error details:`, error);
      return null;
    }
  }

  /**
   * Call Valuation API with error handling
   * @param {string} registration - Vehicle registration number
   * @param {number} mileage - Vehicle mileage (default: 50000 if not provided)
   * @returns {Promise<Object|null>} Valuation data or null if failed
   */
  async callValuationAPI(registration, mileage = 50000) {
    try {
      console.log(`Calling Valuation API for ${registration} with mileage ${mileage}`);
      const data = await ValuationAPIClient.getValuation(registration, mileage);
      return data;
    } catch (error) {
      console.error(`Valuation API error for ${registration}:`, error.message);
      return null;
    }
  }

  /**
   * Check cache for existing vehicle data
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object|null>} Cached data or null
   */
  async checkCache(registration) {
    try {
      const cached = await VehicleHistory.findOne({
        vrm: registration.toUpperCase().replace(/\s/g, '')
      });

      if (!cached) {
        return null;
      }

      // Check if cache is still valid (within TTL)
      const cacheAge = Date.now() - new Date(cached.checkDate).getTime();
      if (cacheAge > this.cacheTTL) {
        console.log(`Cache expired for ${registration} (age: ${Math.round(cacheAge / (24 * 60 * 60 * 1000))} days)`);
        return null;
      }

      // Reconstruct merged data format from cached fields
      // Note: We don't cache the full merged data structure, just basic fields
      // So we return null to force a fresh API call for complete data
      console.log(`Cache found for ${registration} but returning null to get fresh complete data`);
      return null;
    } catch (error) {
      console.error(`Cache check error for ${registration}:`, error.message);
      return null;
    }
  }

  /**
   * Cache merged vehicle data
   * @param {string} registration - Vehicle registration number
   * @param {Object} mergedData - Merged vehicle data
   * @returns {Promise<Object>} Saved VehicleHistory document
   */
  async cacheData(registration, mergedData) {
    try {
      const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
      
      // Extract basic fields from merged data for schema compatibility
      const cacheData = {
        vrm: cleanedReg, // Use 'vrm' not 'registration' to match schema
        make: mergedData.make?.value || mergedData.make || null,
        model: mergedData.model?.value || mergedData.model || null,
        colour: mergedData.color?.value || mergedData.color || null,
        fuelType: mergedData.fuelType?.value || mergedData.fuelType || null,
        yearOfManufacture: mergedData.year?.value || mergedData.year || null,
        engineCapacity: mergedData.engineSize?.value || mergedData.engineSize || null,
        transmission: mergedData.transmission?.value || mergedData.transmission || null,
        co2Emissions: mergedData.runningCosts?.co2Emissions?.value || mergedData.co2Emissions || null,
        gearbox: mergedData.gearbox?.value || mergedData.gearbox || null,
        emissionClass: mergedData.emissionClass?.value || mergedData.emissionClass || null,
        // CRITICAL: Extract owner/keeper information from merged data
        // The data comes directly from checkCarData (not wrapped in value/source)
        numberOfPreviousKeepers: mergedData.numberOfPreviousKeepers || mergedData.previousOwners?.value || mergedData.previousOwners || 0,
        previousOwners: mergedData.numberOfPreviousKeepers || mergedData.previousOwners?.value || mergedData.previousOwners || 0,
        numberOfOwners: mergedData.numberOfPreviousKeepers || mergedData.previousOwners?.value || mergedData.previousOwners || 0,
        v5cCertificateCount: mergedData.v5cCertificateCount || 0,
        plateChanges: mergedData.plateChanges || 0,
        colourChanges: mergedData.colourChanges || 0,
        vicCount: mergedData.vicCount || 0,
        // History flags
        hasAccidentHistory: mergedData.hasAccidentHistory || false,
        isStolen: mergedData.isStolen || false,
        isWrittenOff: mergedData.isWrittenOff || false,
        isScrapped: mergedData.isScrapped || false,
        isImported: mergedData.isImported || false,
        isExported: mergedData.isExported || false,
        hasOutstandingFinance: mergedData.hasOutstandingFinance || false,
        // Write-off category and details
        writeOffCategory: mergedData.writeOffCategory || mergedData.writeOffDetails?.category || 'none',
        writeOffDetails: mergedData.writeOffDetails || {
          category: mergedData.writeOffCategory || 'none',
          date: null,
          description: null
        },
        numberOfKeys: mergedData.numberOfKeys || 1,
        keys: mergedData.numberOfKeys || 1,
        serviceHistory: mergedData.serviceHistory || 'Contact seller',
        checkDate: new Date(),
        checkStatus: 'success',
        apiProvider: 'enhanced-vehicle-service',
        testMode: process.env.API_ENVIRONMENT !== 'production'
      };
      
      // IMPORTANT: Delete any existing records for this VRM first to prevent duplicates
      // This ensures only ONE history record exists per VRM
      await VehicleHistory.deleteMany({ vrm: cleanedReg });
      console.log(`🗑️  Deleted existing history records for ${cleanedReg}`);
      
      // Now create the new record
      const savedHistory = new VehicleHistory(cacheData);
      await savedHistory.save();

      console.log(`✅ Cached enhanced data for ${registration} with ID: ${savedHistory._id}`);
      console.log(`   Owners: ${cacheData.numberOfPreviousKeepers}, Write-off: ${cacheData.isWrittenOff}, Category: ${cacheData.writeOffCategory}`);
      
      return savedHistory;
    } catch (error) {
      console.error(`❌ Cache storage error for ${registration}:`, error.message);
      // Don't throw - caching failure shouldn't break the request
      return null;
    }
  }

  /**
   * Log API call results for monitoring
   * @param {string} registration - Vehicle registration number
   * @param {Object} checkCarResult - CheckCarDetails Promise.allSettled result
   * @param {Object} valuationResult - Valuation Promise.allSettled result
   */
  logAPIResults(registration, checkCarResult, valuationResult) {
    const checkCarStatus = checkCarResult.status === 'fulfilled' ? '✅ Success' : '❌ Failed';
    const valuationStatus = valuationResult.status === 'fulfilled' ? '✅ Success' : '❌ Failed';

    console.log(`API Results for ${registration}:`);
    console.log(`  CheckCarDetails: ${checkCarStatus}`);
    console.log(`  Valuation: ${valuationStatus}`);

    if (checkCarResult.status === 'rejected') {
      console.log(`  CheckCarDetails Error: ${checkCarResult.reason}`);
    }
    if (valuationResult.status === 'rejected') {
      console.log(`  Valuation Error: ${valuationResult.reason}`);
    }
  }

  /**
   * Get vehicle data with fallback handling
   * Returns data even if one API fails
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object>} Vehicle data with status information
   */
  async getVehicleDataWithFallback(registration) {
    try {
      const enhancedData = await this.getEnhancedVehicleData(registration);
      
      return {
        success: true,
        data: enhancedData,
        warnings: this.generateWarnings(enhancedData)
      };
    } catch (error) {
      console.error(`Enhanced vehicle lookup failed for ${registration}:`, error);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Generate warnings based on data sources
   * @param {Object} enhancedData - Enhanced vehicle data
   * @returns {Array<string>} Array of warning messages
   */
  generateWarnings(enhancedData) {
    const warnings = [];

    const sources = enhancedData.dataSources || {};

    if (!sources.checkCarDetails && !sources.valuation) {
      warnings.push('No data available from any API');
    } else {
      if (!sources.checkCarDetails) {
        warnings.push('CheckCarDetails data unavailable');
      }
      if (!sources.valuation) {
        warnings.push('Valuation data unavailable');
      }
    }

    return warnings;
  }

  /**
   * Clear cache for a specific registration
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<boolean>} True if cache was cleared
   */
  async clearCache(registration) {
    try {
      const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
      const result = await VehicleHistory.deleteOne({ vrm: cleanedReg });
      return result.deletedCount > 0;
    } catch (error) {
      console.error(`Cache clear error for ${registration}:`, error.message);
      return false;
    }
  }
}

module.exports = new EnhancedVehicleService();
