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
    console.log(`Enhanced vehicle lookup for: ${registration}, useCache: ${useCache}`);
    
    // Check cache first to prevent duplicate API calls
    const cachedData = await this.checkCache(registration);
    if (cachedData) {
      // CRITICAL FIX: Check if cached data includes valuation
      const hasValuation = cachedData.valuation || 
                          (cachedData.runningCosts && cachedData.runningCosts.annualTax) ||
                          cachedData.dataSources?.valuation;
      
      console.log(`🔍 Cache analysis for ${registration}:`);
      console.log(`   - Has valuation object: ${!!cachedData.valuation}`);
      console.log(`   - Has running costs with tax: ${!!(cachedData.runningCosts && cachedData.runningCosts.annualTax)}`);
      console.log(`   - Data sources valuation flag: ${cachedData.dataSources?.valuation}`);
      console.log(`   - Overall hasValuation: ${hasValuation}`);
      
      if (hasValuation) {
        console.log(`✅ CACHE HIT for ${registration} - Using complete cached data with valuation`);
        return cachedData;
      } else {
        console.log(`⚠️ CACHE HIT for ${registration} but missing valuation data - fetching valuation only`);
        
        // Get valuation data only (vehicle data is already cached)
        const estimatedMileage = mileage || cachedData.mileage || 50000;
        console.log(`🔍 Fetching valuation with mileage: ${estimatedMileage}`);
        
        const valuationResult = await Promise.allSettled([
          this.callValuationAPI(registration, estimatedMileage)
        ]);
        
        const valuationData = valuationResult[0].status === 'fulfilled' ? valuationResult[0].value : null;
        
        if (valuationData) {
          console.log(`✅ Valuation data fetched for cached vehicle: ${registration}`);
          console.log(`💰 Valuation prices:`, valuationData.estimatedValue);
          
          // Merge valuation with cached data
          const mergedData = dataMerger.merge(cachedData, valuationData);
          mergedData.registration = registration;
          
          // CRITICAL FIX: Add runningCosts object for frontend compatibility
          if (!mergedData.runningCosts) {
            mergedData.runningCosts = {
              fuelEconomy: {
                urban: mergedData.fuelEconomy?.urban?.value || mergedData.fuelEconomy?.urban || mergedData.urbanMpg || null,
                extraUrban: mergedData.fuelEconomy?.extraUrban?.value || mergedData.fuelEconomy?.extraUrban || mergedData.extraUrbanMpg || null,
                combined: mergedData.fuelEconomy?.combined?.value || mergedData.fuelEconomy?.combined || mergedData.combinedMpg || null
              },
              annualTax: mergedData.annualTax?.value || mergedData.annualTax || null,
              insuranceGroup: mergedData.insuranceGroup?.value || mergedData.insuranceGroup || null,
              co2Emissions: mergedData.co2Emissions?.value || mergedData.co2Emissions || null
            };
            console.log(`✅ Added runningCosts object to cached merged data:`, mergedData.runningCosts);
          }
          
          // Update cache with valuation data
          await this.cacheData(registration, mergedData);
          
          return mergedData;
        } else {
          console.log(`⚠️ Valuation fetch failed, returning cached data without valuation`);
          
          // CRITICAL FIX: Add runningCosts object to cached data too
          if (!cachedData.runningCosts) {
            cachedData.runningCosts = {
              fuelEconomy: {
                urban: cachedData.fuelEconomy?.urban?.value || cachedData.fuelEconomy?.urban || cachedData.urbanMpg || null,
                extraUrban: cachedData.fuelEconomy?.extraUrban?.value || cachedData.fuelEconomy?.extraUrban || cachedData.extraUrbanMpg || null,
                combined: cachedData.fuelEconomy?.combined?.value || cachedData.fuelEconomy?.combined || cachedData.combinedMpg || null
              },
              annualTax: cachedData.annualTax?.value || cachedData.annualTax || null,
              insuranceGroup: cachedData.insuranceGroup?.value || cachedData.insuranceGroup || null,
              co2Emissions: cachedData.co2Emissions?.value || cachedData.co2Emissions || null
            };
            console.log(`✅ Added runningCosts object to cached data:`, cachedData.runningCosts);
          }
          
          return cachedData;
        }
      }
    }
    
    console.log(`❌ CACHE MISS for ${registration} - Making fresh API calls`);
    
    // If useCache is false and we have cached data, we still return cached data to prevent duplicates
    // Only make fresh API calls if no cache exists at all
    if (!useCache) {
      console.log(`⚠️  useCache=false but we still check cache to prevent duplicate API calls`);
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

    // CRITICAL FIX: Add runningCosts object for frontend compatibility
    // Always ensure runningCosts has unwrapped values for frontend
    mergedData.runningCosts = {
      fuelEconomy: {
        urban: mergedData.runningCosts?.fuelEconomy?.urban?.value || mergedData.fuelEconomy?.urban?.value || mergedData.fuelEconomy?.urban || mergedData.urbanMpg || null,
        extraUrban: mergedData.runningCosts?.fuelEconomy?.extraUrban?.value || mergedData.fuelEconomy?.extraUrban?.value || mergedData.fuelEconomy?.extraUrban || mergedData.extraUrbanMpg || null,
        combined: mergedData.runningCosts?.fuelEconomy?.combined?.value || mergedData.fuelEconomy?.combined?.value || mergedData.fuelEconomy?.combined || mergedData.combinedMpg || null
      },
      annualTax: mergedData.runningCosts?.annualTax?.value || mergedData.annualTax?.value || mergedData.annualTax || null,
      insuranceGroup: mergedData.runningCosts?.insuranceGroup?.value || mergedData.insuranceGroup?.value || mergedData.insuranceGroup || null,
      co2Emissions: mergedData.runningCosts?.co2Emissions?.value || mergedData.co2Emissions?.value || mergedData.co2Emissions || null
    };
    console.log(`✅ Unwrapped runningCosts object:`, JSON.stringify(mergedData.runningCosts, null, 2));

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

      // Check if cache is still valid (within TTL - 30 days)
      const cacheAge = Date.now() - new Date(cached.checkDate).getTime();
      if (cacheAge > this.cacheTTL) {
        console.log(`Cache expired for ${registration} (age: ${Math.round(cacheAge / (24 * 60 * 60 * 1000))} days)`);
        return null;
      }

      // Check if cache has all important fields - if missing, force refresh
      const importantFields = ['bodyType', 'doors', 'seats', 'variant', 'gearbox', 'emissionClass', 'urbanMpg', 'extraUrbanMpg', 'combinedMpg', 'annualTax'];
      const missingFields = importantFields.filter(field => !cached[field]);
      
      if (missingFields.length > 0) {
        console.log(`Cache incomplete for ${registration} - missing fields: ${missingFields.join(', ')}`);
        console.log(`Forcing fresh API call to get complete data including running costs`);
        return null;
      }

      // Reconstruct merged data format from cached VehicleHistory
      const cachedData = {
        registration: cached.vrm,
        make: { value: cached.make, source: 'cached' },
        model: { value: cached.model, source: 'cached' },
        variant: { value: cached.variant, source: 'cached' },
        color: { value: cached.colour, source: 'cached' },
        fuelType: { value: cached.fuelType, source: 'cached' },
        year: { value: cached.yearOfManufacture, source: 'cached' },
        engineSize: { value: cached.engineCapacity, source: 'cached' },
        bodyType: { value: cached.bodyType, source: 'cached' },
        transmission: { value: cached.transmission, source: 'cached' },
        doors: { value: cached.doors, source: 'cached' },
        seats: { value: cached.seats, source: 'cached' },
        gearbox: { value: cached.gearbox, source: 'cached' },
        emissionClass: { value: cached.emissionClass, source: 'cached' },
        
        // History data (direct values, not wrapped)
        numberOfPreviousKeepers: cached.numberOfPreviousKeepers || cached.previousOwners || 0,
        previousOwners: cached.numberOfPreviousKeepers || cached.previousOwners || 0,
        numberOfOwners: cached.numberOfPreviousKeepers || cached.previousOwners || 0,
        v5cCertificateCount: cached.v5cCertificateCount || 0,
        plateChanges: cached.plateChanges || 0,
        colourChanges: cached.colourChanges || 0,
        vicCount: cached.vicCount || 0,
        
        // Safety checks
        isStolen: cached.isStolen || false,
        isWrittenOff: cached.isWrittenOff || false,
        hasAccidentHistory: cached.hasAccidentHistory || false,
        hasOutstandingFinance: cached.hasOutstandingFinance || false,
        
        // Write-off details
        writeOffCategory: cached.writeOffCategory || 'none',
        writeOffDetails: cached.writeOffDetails || {},
        
        // MOT data
        motHistory: cached.motHistory || [],
        motStatus: cached.motStatus,
        motExpiryDate: cached.motExpiryDate,
        
        // Running costs
        runningCosts: {
          fuelEconomy: {
            urban: { value: cached.urbanMpg, source: 'cached' },
            extraUrban: { value: cached.extraUrbanMpg, source: 'cached' },
            combined: { value: cached.combinedMpg, source: 'cached' }
          },
          co2Emissions: { value: cached.co2Emissions, source: 'cached' },
          annualTax: { value: cached.annualTax, source: 'cached' },
          insuranceGroup: { value: cached.insuranceGroup, source: 'cached' }
        },
        
        // CRITICAL FIX: Include valuation data if available in cache
        valuation: cached.valuation ? {
          vrm: cached.vrm,
          mileage: cached.mileage || 50000,
          estimatedValue: cached.valuation.estimatedValue || {
            private: cached.valuation.privatePrice,
            retail: cached.valuation.dealerPrice,
            trade: cached.valuation.partExchangePrice
          },
          confidence: cached.valuation.confidence || 'medium',
          source: 'cached'
        } : null,
        
        // Metadata
        historyCheckId: cached._id,
        checkDate: cached.checkDate,
        apiProvider: cached.apiProvider || 'CheckCarDetails',
        
        // Data sources tracking - CRITICAL: Include valuation source
        dataSources: {
          checkCarDetails: true,
          cached: true,
          valuation: !!cached.valuation // Mark if valuation data is available
        }
      };

      console.log(`✅ Cache hit for ${registration} (age: ${Math.round(cacheAge / (60 * 60 * 1000))} hours) - Using complete cached data`);
      return cachedData;
      
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
        // CRITICAL FIX: Write-off category and details - preserve the extracted category
        writeOffCategory: mergedData.writeOffCategory || mergedData.writeOffDetails?.category || 'none',
        writeOffDetails: mergedData.writeOffDetails || {
          category: mergedData.writeOffCategory || 'none',
          date: null,
          description: null
        },
        // CRITICAL: Store all important fields from merged data
        variant: mergedData.variant?.value || mergedData.variant || mergedData.modelVariant?.value || mergedData.modelVariant || null,
        bodyType: mergedData.bodyType?.value || mergedData.bodyType || null,
        doors: mergedData.doors?.value || mergedData.doors || null,
        seats: mergedData.seats?.value || mergedData.seats || null,
        gearbox: mergedData.gearbox?.value || mergedData.gearbox || null,
        emissionClass: mergedData.emissionClass?.value || mergedData.emissionClass || null,
        
        // CRITICAL: Store running costs data
        urbanMpg: mergedData.runningCosts?.fuelEconomy?.urban?.value || mergedData.fuelEconomy?.urban || null,
        extraUrbanMpg: mergedData.runningCosts?.fuelEconomy?.extraUrban?.value || mergedData.fuelEconomy?.extraUrban || null,
        combinedMpg: mergedData.runningCosts?.fuelEconomy?.combined?.value || mergedData.fuelEconomy?.combined || null,
        annualTax: mergedData.runningCosts?.annualTax?.value || mergedData.annualTax || null,
        insuranceGroup: mergedData.runningCosts?.insuranceGroup?.value || mergedData.insuranceGroup || null,
        
        // CRITICAL FIX: Store valuation data properly
        valuation: mergedData.valuation ? {
          privatePrice: mergedData.valuation.estimatedValue?.private,
          dealerPrice: mergedData.valuation.estimatedValue?.retail,
          partExchangePrice: mergedData.valuation.estimatedValue?.trade,
          confidence: mergedData.valuation.confidence,
          estimatedValue: mergedData.valuation.estimatedValue
        } : null,
        mileage: mergedData.valuation?.mileage || mergedData.mileage || null,
        
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
   * @param {number} mileage - Optional mileage for valuation
   * @returns {Promise<Object>} Vehicle data with status information
   */
  async getVehicleDataWithFallback(registration, mileage = null) {
    try {
      const enhancedData = await this.getEnhancedVehicleData(registration, true, mileage);
      
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
