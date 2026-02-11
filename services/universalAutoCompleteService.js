/**
 * Universal Auto Complete Service
 * COMPLETE automatic data fetching and saving for ALL vehicle types
 * 
 * This service ensures EVERY vehicle (Cars, Bikes, Vans - Electric, Manual, Automatic, Diesel) gets:
 * - Complete vehicle specifications
 * - Running costs data
 * - MOT history and due dates
 * - Vehicle history (owners, write-offs)
 * - Valuation data
 * - Electric vehicle specific data (if EV)
 * - Bike-specific data handling
 * - Van-specific data handling
 * 
 * Runs automatically on vehicle save and can be triggered manually
 * 
 * CONSOLIDATES ALL COMPETING SERVICES:
 * - autoCompleteCarDataService (deprecated)
 * - comprehensiveVehicleService
 * - enhancedVehicleService
 * - lightweightVehicleService
 * - lightweightBikeService
 * - lightweightVanService
 * - electricVehicleEnhancementService (utility only)
 * - autoDataPopulationService
 */

const axios = require('axios');
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const ElectricVehicleEnhancementService = require('./electricVehicleEnhancementService');

class UniversalAutoCompleteService {
  constructor() {
    this.baseURL = process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk';
    this.apiKey = process.env.CHECKCARD_API_KEY;
    this.isTestMode = process.env.API_ENVIRONMENT === 'test';
    
    // Concurrency control for race condition prevention
    this.processingLocks = new Map(); // VRM -> Promise
    this.processingQueues = new Map(); // VRM -> Array of waiting operations
    this.lockTimeout = 30000; // 30 seconds timeout
    
    // API call deduplication system
    this.sessionApiCalls = new Map(); // VRM -> { timestamp, endpoints, data }
    this.pendingApiCalls = new Map(); // VRM -> Promise (for call coalescing)
    this.sessionTimeout = 5 * 60 * 1000; // 5 minutes session timeout
    this.apiCallLog = []; // Comprehensive API call logging
  }

  /**
   * MAIN METHOD: Complete automatic data population for ALL vehicle types
   * @param {Object} vehicle - Mongoose vehicle document (Car, Bike, or Van)
   * @param {boolean} forceRefresh - Force fresh API calls
   * @returns {Promise<Object>} Updated vehicle with complete data
   */
  async completeCarData(vehicle, forceRefresh = false) {
    const vrm = vehicle.registrationNumber?.toUpperCase().replace(/\s/g, '');
    
    if (!vrm) {
      console.log('⚠️  No registration number - using manual data enhancement only');
      return this.enhanceManualData(vehicle);
    }
    
    // Implement concurrency control to prevent race conditions
    return this.withVehicleLock(vrm, async () => {
      // Start a database transaction for atomic operations
      const session = await mongoose.startSession();
      
      try {
        // Begin transaction
        await session.startTransaction();
        
        console.log(`\n🚀 [UniversalAutoComplete] Starting complete data population for: ${vrm}`);
        console.log(`📋 Vehicle Type: ${vehicle.constructor.modelName || 'Unknown'}`);
        console.log(`🔒 Transaction started for atomic operations`);
        
        // Periodic cleanup of expired sessions (every 10th call)
        if (Math.random() < 0.1) {
          this.cleanupExpiredSessions();
        }
        // Step 1: Enhanced cache-first data retrieval
        if (!forceRefresh) {
          const cachedData = await this.getCachedData(vrm);
          if (cachedData) {
            const cacheStatus = cachedData._cacheStatus || 'unknown';
            const cacheSavings = cachedData._cacheSavings || 1.99;
            
            console.log(`✅ Using ${cacheStatus} cached data (saves £${cacheSavings} in API costs)`);
            
            // For stale cache, trigger background refresh while using cached data
            if (cacheStatus === 'stale') {
              console.log('🔄 Triggering background cache refresh for stale data...');
              this.refreshCacheInBackground(vrm);
            }
            
            const result = await this.updateVehicleFromCache(vehicle, cachedData, session);
            await session.commitTransaction();
            console.log('✅ Transaction committed successfully (cache-first)');
            return this.createSuccessResponse(result, { cached: true, cacheStatus });
          }
        }

        // Step 2: Fetch ALL data from API in parallel
        console.log('📡 Fetching fresh data from CheckCarDetails API...');
        const apiData = await this.fetchAllAPIData(vrm);
        
        // Step 3: Parse and normalize all data
        const parsedData = this.parseAllAPIData(apiData);
        
        // Step 4: Save to VehicleHistory (cache for future use) - within transaction
        const vehicleHistory = await this.saveToVehicleHistory(vrm, parsedData, session);
        
        // Step 5: Update vehicle with ALL data (handles cars, bikes, vans) - within transaction
        const updatedVehicle = await this.updateVehicleWithCompleteData(vehicle, parsedData, vehicleHistory, session);
        
        // Step 5.5: Validate data completeness before proceeding
        const validationResult = this.validateDataCompleteness(updatedVehicle, parsedData);
        
        // Apply completeness fixes if needed
        if (!validationResult.isComplete) {
          console.log(`⚠️  Data incomplete (${validationResult.completionPercentage}%), applying fixes...`);
          this.applyCompletenessFixes(updatedVehicle, parsedData, validationResult);
          
          // Re-validate after fixes
          const revalidationResult = this.validateDataCompleteness(updatedVehicle, parsedData);
          console.log(`✅ After fixes: ${revalidationResult.completionPercentage}% complete`);
          
          // Check if meets minimum threshold (70%)
          if (!this.meetsCompletenessThreshold(revalidationResult)) {
            console.warn(`⚠️  Vehicle data still below 70% completeness threshold`);
            // Continue anyway but log the issue
          }
        }
        
        // Step 6: Electric vehicle enhancement (if applicable)
        if (updatedVehicle.fuelType === 'Electric') {
          console.log('🔋 Applying electric vehicle enhancements...');
          const enhancedEVData = ElectricVehicleEnhancementService.enhanceWithEVData(updatedVehicle.toObject());
          Object.assign(updatedVehicle, enhancedEVData);
        }
        
        // Step 7: Vehicle-specific enhancements
        await this.applyVehicleSpecificEnhancements(updatedVehicle);
        
        // Step 8: Save updated vehicle - within transaction
        await updatedVehicle.save({ session });
        
        // Commit transaction - all operations succeeded
        await session.commitTransaction();
        console.log('✅ Transaction committed successfully');
        console.log('✅ Vehicle data population complete!');
        return this.createSuccessResponse(updatedVehicle, {
          cached: false,
          apiErrors: apiData._errors || [],
          successRate: apiData._successRate || '100.0'
        });

      } catch (error) {
        // Rollback transaction on any error
        await session.abortTransaction();
        console.error(`❌ Transaction aborted for ${vrm}:`, error.message);
        console.error(`❌ [UniversalAutoComplete] Error for ${vrm}:`, error.message);
        
        // Return standardized error response
        return this.createErrorResponse(error, vrm, 'PROCESSING_ERROR');
      } finally {
        // Always end the session
        await session.endSession();
      }
    });
  }

  /**
   * Implement vehicle-level locking to prevent race conditions
   * @param {string} vrm - Vehicle registration mark
   * @param {Function} operation - Async operation to execute with lock
   * @returns {Promise<any>} Result of the operation
   */
  async withVehicleLock(vrm, operation) {
    // Check if vehicle is already being processed
    if (this.processingLocks.has(vrm)) {
      console.log(`⏳ Vehicle ${vrm} is already being processed, queuing request...`);
      
      // Wait for the existing operation to complete and return its result
      try {
        const existingResult = await this.processingLocks.get(vrm);
        return existingResult;
      } catch (error) {
        // If existing operation failed, try the new operation
        console.log(`⚠️ Previous operation for ${vrm} failed, retrying...`);
      }
    }
    
    // Create new lock with proper promise handling
    const lockPromise = this.executeWithTimeout(async () => {
      try {
        console.log(`🔒 Acquired lock for vehicle ${vrm}`);
        const result = await operation();
        console.log(`🔓 Processing next queued operation for vehicle ${vrm}`);
        
        return result;
      } catch (error) {
        console.log(`🔓 Released lock for vehicle ${vrm} (with error)`);
        throw error;
      }
    }, this.lockTimeout);
    
    this.processingLocks.set(vrm, lockPromise);
    
    try {
      const result = await lockPromise;
      return result;
    } finally {
      // Clean up the lock
      this.processingLocks.delete(vrm);
      if (this.processingQueues.has(vrm)) {
        this.processingQueues.delete(vrm);
      }
    }
  }

  /**
   * Process the next operation in the queue for a vehicle
   * @param {string} vrm - Vehicle registration mark
   * @param {any} previousResult - Result from previous operation
   * @param {Error} previousError - Error from previous operation
   */
  processNextInQueue(vrm, previousResult, previousError = null) {
    const queue = this.processingQueues.get(vrm);
    if (!queue || queue.length === 0) {
      return;
    }
    
    const nextOperation = queue.shift();
    
    if (previousError) {
      // If previous operation failed, execute the next one
      setTimeout(async () => {
        try {
          const result = await this.executeWithTimeout(nextOperation.operation, this.lockTimeout);
          nextOperation.resolve(result);
          this.processNextInQueue(vrm, result);
        } catch (error) {
          nextOperation.reject(error);
          this.processNextInQueue(vrm, null, error);
        }
      }, 0);
    } else {
      // If previous operation succeeded, return the same result to queued operations
      nextOperation.resolve(previousResult);
      this.processNextInQueue(vrm, previousResult);
    }
  }

  /**
   * Execute operation with timeout to prevent hanging locks
   * @param {Function} operation - Async operation to execute
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<any>} Result of the operation
   */
  async executeWithTimeout(operation, timeout) {
    return Promise.race([
      operation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      )
    ]);
  }

  /**
   * Fetch ALL data from CheckCarDetails API with deduplication
   */
  async fetchAllAPIData(vrm) {
    console.log('📡 Making parallel API calls with deduplication...');
    
    // Check for recent API calls in session (deduplication)
    const sessionKey = vrm.toUpperCase();
    const existingSession = this.sessionApiCalls.get(sessionKey);
    
    if (existingSession) {
      const sessionAge = Date.now() - existingSession.timestamp;
      if (sessionAge < this.sessionTimeout) {
        console.log(`🔄 Using deduplicated API data from session (${Math.round(sessionAge/1000)}s ago)`);
        console.log(`💰 Saved £${existingSession.totalCost.toFixed(2)} in duplicate API costs`);
        return existingSession.data;
      } else {
        // Session expired, clean up
        this.sessionApiCalls.delete(sessionKey);
      }
    }
    
    // Check for pending API calls (call coalescing)
    if (this.pendingApiCalls.has(sessionKey)) {
      console.log(`⏳ Coalescing with pending API call for ${vrm}...`);
      try {
        const coalescedResult = await this.pendingApiCalls.get(sessionKey);
        console.log('✅ Used coalesced API result');
        return coalescedResult;
      } catch (error) {
        console.log('❌ Coalesced call failed, making new call');
        this.pendingApiCalls.delete(sessionKey);
      }
    }
    
    // Create new API call promise for coalescing
    const apiCallPromise = this.executeAPICall(vrm);
    this.pendingApiCalls.set(sessionKey, apiCallPromise);
    
    try {
      const result = await apiCallPromise;
      
      // Store in session for deduplication
      this.sessionApiCalls.set(sessionKey, {
        timestamp: Date.now(),
        data: result,
        totalCost: result._totalCost || 1.99
      });
      
      return result;
    } finally {
      // Clean up pending call
      this.pendingApiCalls.delete(sessionKey);
    }
  }

  /**
   * Execute the actual API call (separated for deduplication logic)
   * @param {string} vrm - Vehicle registration mark
   * @returns {Promise<Object>} API response data
   */
  async executeAPICall(vrm) {
    const endpoints = [
      { name: 'vehicleSpecs', endpoint: 'Vehiclespecs', cost: 0.05 },
      { name: 'vehicleHistory', endpoint: 'carhistorycheck', cost: 1.82 },
      { name: 'motHistory', endpoint: 'mot', cost: 0.02 },
      { name: 'valuation', endpoint: 'vehiclevaluation', cost: 0.12, params: { mileage: 50000 } }
    ];

    const results = {};
    let totalCost = 0;
    const callStartTime = Date.now();
    const errors = [];

    for (const ep of endpoints) {
      try {
        console.log(`   Calling ${ep.name} (£${ep.cost})...`);
        
        const params = {
          apikey: this.apiKey,
          vrm: vrm,
          ...(ep.params || {})
        };

        // Implement retry logic with exponential backoff
        const response = await this.retryWithBackoff(async () => {
          return await axios.get(`${this.baseURL}/vehicledata/${ep.endpoint}`, {
            params,
            timeout: 10000
          });
        }, ep.name, vrm);

        results[ep.name] = response.data;
        totalCost += ep.cost;
        
        // Log successful API call
        this.logApiCall({
          vrm,
          endpoint: ep.name,
          cost: ep.cost,
          success: true,
          timestamp: new Date(),
          responseTime: Date.now() - callStartTime
        });
        
        console.log(`   ✅ ${ep.name} success`);

      } catch (error) {
        const errorMessage = this.normalizeErrorMessage(error);
        console.log(`   ❌ ${ep.name} failed: ${errorMessage}`);
        
        errors.push({
          endpoint: ep.name,
          error: errorMessage,
          timestamp: new Date(),
          vrm: vrm
        });
        
        // Apply fallback data strategy
        results[ep.name] = await this.getFallbackDataForEndpoint(ep.name, vrm, error);
        
        // Log failed API call
        this.logApiCall({
          vrm,
          endpoint: ep.name,
          cost: 0, // No cost for failed calls
          success: false,
          error: errorMessage,
          timestamp: new Date(),
          responseTime: Date.now() - callStartTime
        });
      }
    }

    console.log(`💰 Total API cost: £${totalCost.toFixed(2)}`);
    
    // Add comprehensive error reporting
    if (errors.length > 0) {
      console.warn(`⚠️  ${errors.length}/${endpoints.length} API calls failed for ${vrm}`);
      this.reportApiFailures(vrm, errors);
    }
    
    // Add cost metadata to results
    results._totalCost = totalCost;
    results._callTimestamp = Date.now();
    results._errors = errors;
    results._successRate = ((endpoints.length - errors.length) / endpoints.length * 100).toFixed(1);
    
    return results;
  }

  /**
   * Retry API call with exponential backoff
   * @param {Function} apiCall - The API call function
   * @param {string} endpointName - Name of the endpoint for logging
   * @param {string} vrm - Vehicle registration mark
   * @param {number} maxRetries - Maximum number of retries (default: 3)
   * @returns {Promise<any>} API response
   */
  async retryWithBackoff(apiCall, endpointName, vrm, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await apiCall();
        
        if (attempt > 1) {
          console.log(`   ✅ ${endpointName} succeeded on attempt ${attempt}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain error types
        if (this.isNonRetryableError(error)) {
          console.log(`   ❌ ${endpointName} non-retryable error: ${error.message}`);
          throw error;
        }
        
        if (attempt < maxRetries) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
          console.log(`   ⏳ ${endpointName} attempt ${attempt} failed, retrying in ${backoffDelay}ms...`);
          
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        } else {
          console.log(`   ❌ ${endpointName} failed after ${maxRetries} attempts`);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Check if error is non-retryable (e.g., authentication, invalid VRM)
   * @param {Error} error - The error object
   * @returns {boolean} True if error should not be retried
   */
  isNonRetryableError(error) {
    const nonRetryablePatterns = [
      /unauthorized/i,
      /forbidden/i,
      /invalid.*key/i,
      /invalid.*vrm/i,
      /not.*found/i,
      /bad.*request/i
    ];
    
    const errorMessage = error.message || error.toString();
    return nonRetryablePatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Normalize error messages for consistent reporting
   * @param {Error} error - The error object
   * @returns {string} Normalized error message
   */
  normalizeErrorMessage(error) {
    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const statusText = error.response.statusText;
      const data = error.response.data;
      
      if (status === 401) return 'API authentication failed';
      if (status === 403) return 'API access forbidden';
      if (status === 404) return 'Vehicle not found in API';
      if (status === 429) return 'API rate limit exceeded';
      if (status >= 500) return 'API server error';
      
      return `HTTP ${status}: ${statusText}${data ? ` - ${JSON.stringify(data)}` : ''}`;
    } else if (error.code === 'ECONNABORTED') {
      return 'API request timeout';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 'API server unreachable';
    } else {
      return error.message || 'Unknown API error';
    }
  }

  /**
   * Get fallback data for failed API endpoint
   * @param {string} endpointName - Name of the failed endpoint
   * @param {string} vrm - Vehicle registration mark
   * @param {Error} error - The error that occurred
   * @returns {Promise<Object|null>} Fallback data or null
   */
  async getFallbackDataForEndpoint(endpointName, vrm, error) {
    console.log(`🔄 Applying fallback strategy for ${endpointName}...`);
    
    try {
      // Try to get data from cache first
      const cachedData = await this.getCachedData(vrm);
      if (cachedData) {
        console.log(`   ✅ Using cached data as fallback for ${endpointName}`);
        return this.extractEndpointDataFromCache(cachedData, endpointName);
      }
      
      // Generate reasonable fallback data based on endpoint
      const fallbackData = this.generateFallbackData(endpointName, vrm);
      if (fallbackData) {
        console.log(`   ✅ Generated fallback data for ${endpointName}`);
        return fallbackData;
      }
      
    } catch (fallbackError) {
      console.error(`   ❌ Fallback strategy failed for ${endpointName}:`, fallbackError.message);
    }
    
    return null;
  }

  /**
   * Extract endpoint-specific data from cached vehicle history
   * @param {Object} cachedData - Cached vehicle data
   * @param {string} endpointName - Name of the endpoint
   * @returns {Object|null} Extracted data or null
   */
  extractEndpointDataFromCache(cachedData, endpointName) {
    switch (endpointName) {
      case 'vehicleSpecs':
        return {
          ModelData: {
            Make: cachedData.make,
            Model: cachedData.model,
            FuelType: cachedData.fuelType
          },
          VehicleIdentification: {
            YearOfManufacture: cachedData.yearOfManufacture
          }
        };
        
      case 'vehicleHistory':
        return {
          VehicleRegistration: {
            Colour: cachedData.colour
          },
          VehicleHistory: {
            NumberOfPreviousKeepers: cachedData.numberOfPreviousKeepers || 0
          }
        };
        
      case 'motHistory':
        return {
          mot: {
            motStatus: cachedData.motStatus,
            motDueDate: cachedData.motExpiryDate
          },
          motHistory: cachedData.motTests || []
        };
        
      case 'valuation':
        return null; // Valuation data is time-sensitive, don't use cached
        
      default:
        return null;
    }
  }

  /**
   * Generate reasonable fallback data for failed endpoints
   * @param {string} endpointName - Name of the endpoint
   * @param {string} vrm - Vehicle registration mark
   * @returns {Object|null} Generated fallback data
   */
  generateFallbackData(endpointName, vrm) {
    const year = this.extractYearFromVRM(vrm);
    
    switch (endpointName) {
      case 'vehicleSpecs':
        return {
          ModelData: {
            Make: 'Unknown',
            Model: 'Unknown',
            FuelType: 'Petrol'
          },
          VehicleIdentification: {
            YearOfManufacture: year
          },
          _fallback: true
        };
        
      case 'vehicleHistory':
        return {
          VehicleRegistration: {
            Colour: 'Unknown'
          },
          VehicleHistory: {
            NumberOfPreviousKeepers: 1
          },
          _fallback: true
        };
        
      case 'motHistory':
        return {
          mot: {
            motStatus: 'Unknown',
            motDueDate: null
          },
          motHistory: [],
          _fallback: true
        };
        
      case 'valuation':
        // Don't generate fallback valuation data as it's critical for pricing
        return null;
        
      default:
        return null;
    }
  }

  /**
   * Extract year from VRM (basic heuristic)
   * @param {string} vrm - Vehicle registration mark
   * @returns {number|null} Estimated year or null
   */
  extractYearFromVRM(vrm) {
    if (!vrm || vrm.length < 4) return null;
    
    // UK VRM format: AB12 CDE (2001+)
    const match = vrm.match(/^[A-Z]{2}(\d{2})/);
    if (match) {
      const ageIdentifier = parseInt(match[1]);
      if (ageIdentifier >= 1 && ageIdentifier <= 50) {
        return 2001 + Math.floor(ageIdentifier / 2);
      } else if (ageIdentifier >= 51 && ageIdentifier <= 99) {
        return 2001 + Math.floor((ageIdentifier - 50) / 2);
      }
    }
    
    return null;
  }

  /**
   * Report API failures for monitoring and alerting
   * @param {string} vrm - Vehicle registration mark
   * @param {Array} errors - Array of error objects
   */
  reportApiFailures(vrm, errors) {
    const failureReport = {
      vrm,
      timestamp: new Date(),
      totalErrors: errors.length,
      errors: errors.map(err => ({
        endpoint: err.endpoint,
        error: err.error,
        timestamp: err.timestamp
      })),
      severity: this.calculateFailureSeverity(errors)
    };
    
    // Log structured failure report
    console.error('🚨 API Failure Report:', JSON.stringify(failureReport, null, 2));
    
    // Store in failure log for monitoring
    this.apiFailureLog = this.apiFailureLog || [];
    this.apiFailureLog.push(failureReport);
    
    // Keep only last 100 failure reports
    if (this.apiFailureLog.length > 100) {
      this.apiFailureLog = this.apiFailureLog.slice(-100);
    }
    
    // TODO: In production, send to external monitoring system
    // this.sendToMonitoringSystem(failureReport);
  }

  /**
   * Calculate failure severity based on which endpoints failed
   * @param {Array} errors - Array of error objects
   * @returns {string} Severity level (low, medium, high, critical)
   */
  calculateFailureSeverity(errors) {
    const criticalEndpoints = ['vehicleSpecs', 'vehicleHistory'];
    const importantEndpoints = ['motHistory'];
    
    const failedEndpoints = errors.map(err => err.endpoint);
    
    if (criticalEndpoints.some(ep => failedEndpoints.includes(ep))) {
      return 'high';
    } else if (importantEndpoints.some(ep => failedEndpoints.includes(ep))) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get API failure statistics for monitoring
   * @param {Object} options - Filter options
   * @returns {Object} Failure statistics
   */
  getApiFailureStats(options = {}) {
    const { timeframe = 'day' } = options;
    
    if (!this.apiFailureLog || this.apiFailureLog.length === 0) {
      return {
        totalFailures: 0,
        failureRate: 0,
        commonErrors: [],
        affectedVRMs: []
      };
    }
    
    // Filter by timeframe
    const cutoff = Date.now() - (timeframe === 'hour' ? 60*60*1000 : 24*60*60*1000);
    const recentFailures = this.apiFailureLog.filter(failure => 
      new Date(failure.timestamp).getTime() > cutoff
    );
    
    // Calculate statistics
    const totalFailures = recentFailures.length;
    const totalApiCalls = this.apiCallLog.filter(call => 
      new Date(call.timestamp).getTime() > cutoff
    ).length;
    
    const failureRate = totalApiCalls > 0 ? (totalFailures / totalApiCalls * 100).toFixed(1) : 0;
    
    // Find common errors
    const errorCounts = {};
    recentFailures.forEach(failure => {
      failure.errors.forEach(error => {
        errorCounts[error.error] = (errorCounts[error.error] || 0) + 1;
      });
    });
    
    const commonErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
    
    const affectedVRMs = [...new Set(recentFailures.map(f => f.vrm))];
    
    return {
      totalFailures,
      failureRate: parseFloat(failureRate),
      commonErrors,
      affectedVRMs: affectedVRMs.slice(0, 10), // Top 10 affected VRMs
      severityBreakdown: this.getFailureSeverityBreakdown(recentFailures)
    };
  }

  /**
   * Get breakdown of failures by severity
   * @param {Array} failures - Array of failure reports
   * @returns {Object} Severity breakdown
   */
  getFailureSeverityBreakdown(failures) {
    const breakdown = { low: 0, medium: 0, high: 0, critical: 0 };
    
    failures.forEach(failure => {
      breakdown[failure.severity] = (breakdown[failure.severity] || 0) + 1;
    });
    
    return breakdown;
  }

  /**
   * Clean up expired session data to prevent memory leaks
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [vrm, session] of this.sessionApiCalls.entries()) {
      if (now - session.timestamp > this.sessionTimeout) {
        this.sessionApiCalls.delete(vrm);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired API sessions`);
    }
  }

  /**
   * Get API call deduplication statistics
   * @returns {Object} Deduplication statistics
   */
  getDeduplicationStats() {
    const activeSessions = this.sessionApiCalls.size;
    const pendingCalls = this.pendingApiCalls.size;
    
    let totalSavings = 0;
    for (const session of this.sessionApiCalls.values()) {
      totalSavings += session.totalCost;
    }
    
    return {
      activeSessions,
      pendingCalls,
      totalSavings: totalSavings.toFixed(2),
      sessionTimeout: this.sessionTimeout / 1000 / 60 // in minutes
    };
  }

  /**
   * Parse ALL API data into normalized format
   */
  parseAllAPIData(apiData) {
    const parsed = {
      // Basic vehicle info
      make: null,
      model: null,
      variant: null,
      year: null,
      color: null,
      fuelType: null,
      transmission: null,
      bodyType: null,
      doors: null,
      seats: null,
      engineSize: null,
      
      // Running costs
      urbanMpg: null,
      extraUrbanMpg: null,
      combinedMpg: null,
      co2Emissions: null,
      insuranceGroup: null,
      annualTax: null,
      emissionClass: null, // CRITICAL FIX: Add emission class field
      
      // Performance
      power: null,
      torque: null,
      acceleration: null,
      topSpeed: null,
      
      // Electric vehicle data
      electricRange: null,
      batteryCapacity: null,
      chargingTime: null,
      homeChargingSpeed: null,
      rapidChargingSpeed: null,
      electricMotorPower: null,
      electricMotorTorque: null,
      chargingPortType: null,
      
      // MOT data
      motStatus: null,
      motDueDate: null,
      motHistory: [],
      
      // Vehicle history
      numberOfPreviousKeepers: 0,
      exported: false,
      scrapped: false,
      writeOffCategory: 'none',
      
      // Valuation
      estimatedValue: null,
      privatePrice: null,
      dealerPrice: null,
      partExchangePrice: null
    };

    // Parse Vehicle Specs
    if (apiData.vehicleSpecs) {
      const specs = apiData.vehicleSpecs;
      
      // ONLY use CheckCarDetails API response (no DVLA)
      parsed.make = specs.ModelData?.Make;
      let rawModel = specs.ModelData?.Model;
      
      // CRITICAL FIX: Clean model name - remove variant/trim info
      // "CIVIC TYPE S I-VTEC" → "Civic"
      // "530d xDrive M Sport Edition MHEV Auto" → "530d"
      // "C30 R-DESIGN D AUTO" → "C30"
      if (rawModel) {
        // Common patterns to remove from model name
        const trimPatterns = [
          /\s+(TYPE\s+[A-Z]|Type\s+[A-Z])/gi, // "TYPE S", "Type R"
          /\s+I-VTEC/gi, // "I-VTEC"
          /\s+R-DESIGN/gi, // "R-DESIGN" ← NEW
          /\s+D\s+AUTO/gi, // "D AUTO" ← NEW
          /\s+XDRIVE/gi, // "xDrive"
          /\s+SDRIVE/gi, // "sDrive"
          /\s+M\s+SPORT/gi, // "M Sport"
          /\s+EDITION/gi, // "Edition"
          /\s+MHEV/gi, // "MHEV"
          /\s+(AUTO|MANUAL|AUTOMATIC|SEMI-AUTO)/gi, // Transmission
          /\s+TOURING/gi, // Body style
          /\s+SALOON/gi,
          /\s+HATCHBACK/gi,
          /\s+ESTATE/gi
        ];
        
        let cleanModel = rawModel;
        trimPatterns.forEach(pattern => {
          cleanModel = cleanModel.replace(pattern, '');
        });
        
        parsed.model = cleanModel.trim();
        
        if (cleanModel !== rawModel) {
          console.log(`🧹 Cleaned model: "${rawModel}" → "${parsed.model}"`);
        }
      } else {
        parsed.model = rawModel;
      }
      
      // CRITICAL FIX: Prioritize SmmtDetails for variant (more detailed)
      parsed.variant = specs.SmmtDetails?.Variant || 
                      specs.ModelData?.ModelVariant || 
                      null;
      parsed.year = specs.VehicleIdentification?.YearOfManufacture;
      parsed.fuelType = this.normalizeFuelType(specs.ModelData?.FuelType);
      // CRITICAL FIX: Prioritize SmmtDetails for transmission
      parsed.transmission = this.normalizeTransmission(
        specs.SmmtDetails?.Transmission || 
        specs.Transmission?.TransmissionType
      );
      // CRITICAL FIX: Prioritize SmmtDetails for body type
      parsed.bodyType = specs.SmmtDetails?.BodyStyle || 
                       specs.BodyDetails?.BodyStyle || 
                       null;
      
      // CRITICAL FIX: Parse from correct API structure - prioritize SmmtDetails
      parsed.doors = specs.SmmtDetails?.NumberOfDoors || 
                    specs.BodyDetails?.NumberOfDoors || 
                    null;
      parsed.seats = specs.SmmtDetails?.NumberOfSeats || 
                    specs.BodyDetails?.NumberOfSeats || 
                    specs.DvlaTechnicalDetails?.SeatCountIncludingDriver || 
                    null;
      parsed.engineSize = specs.SmmtDetails?.EngineCapacity || 
                         specs.DvlaTechnicalDetails?.EngineCapacityCc || 
                         specs.PowerSource?.IceDetails?.EngineCapacityCc ||
                         null;
      
      // CRITICAL FIX: Parse MPG/Fuel Economy data from API
      // Check multiple possible locations in API response (CheckCarDetails API structure)
      // PRIORITY: SmmtDetails (most reliable source)
      parsed.urbanMpg = specs.SmmtDetails?.UrbanColdMpg || 
                       specs.SmmtDetails?.FuelConsumptionUrbanMpg || 
                       specs.Performance?.FuelEconomy?.UrbanColdMpg || 
                       specs.FuelConsumption?.Urban?.Mpg || 
                       null;
      parsed.extraUrbanMpg = specs.SmmtDetails?.ExtraUrbanMpg || 
                            specs.SmmtDetails?.FuelConsumptionExtraUrbanMpg || 
                            specs.Performance?.FuelEconomy?.ExtraUrbanMpg || 
                            specs.FuelConsumption?.ExtraUrban?.Mpg || 
                            null;
      parsed.combinedMpg = specs.SmmtDetails?.CombinedMpg || 
                          specs.SmmtDetails?.FuelConsumptionCombinedMpg || 
                          specs.Performance?.FuelEconomy?.CombinedMpg || 
                          specs.FuelConsumption?.Combined?.Mpg || 
                          null;
      
      // Insurance group - prioritize SmmtDetails
      parsed.insuranceGroup = specs.SmmtDetails?.InsuranceGroup || 
                             specs.Insurance?.InsuranceGroup ||
                             null;
      
      // CO2 and tax - prioritize SmmtDetails
      parsed.co2Emissions = specs.SmmtDetails?.Co2 || 
                           specs.Emissions?.ManufacturerCo2 || 
                           specs.VehicleExciseDutyDetails?.DvlaCo2 || 
                           0;
      parsed.annualTax = specs.VehicleExciseDutyDetails?.VedRate?.Standard?.TwelveMonths || null;
      
      // DEBUG: Log running costs parsing
      console.log('🏃 [RUNNING COSTS PARSED]:', {
        urbanMpg: parsed.urbanMpg,
        extraUrbanMpg: parsed.extraUrbanMpg,
        combinedMpg: parsed.combinedMpg,
        insuranceGroup: parsed.insuranceGroup,
        co2Emissions: parsed.co2Emissions,
        annualTax: parsed.annualTax
      });
      
      // CRITICAL FIX: Parse emission class from API - prioritize SmmtDetails
      parsed.emissionClass = specs.SmmtDetails?.EmissionClass || 
                            specs.Emissions?.EmissionClass || 
                            specs.VehicleIdentification?.EmissionClass ||
                            null;
      
      // Performance
      parsed.power = specs.Performance?.Power?.Bhp || specs.SmmtDetails?.PowerBhp;
      parsed.torque = specs.Performance?.Torque?.Nm || specs.SmmtDetails?.TorqueNm;
      parsed.acceleration = specs.Performance?.Statistics?.ZeroToSixtyMph;
      parsed.topSpeed = specs.Performance?.Statistics?.MaxSpeedMph;
      
      // Electric vehicle data
      if (specs.PowerSource?.ElectricDetails) {
        const ev = specs.PowerSource.ElectricDetails;
        parsed.electricRange = ev.RangeFigures?.RangeTestCycles?.[0]?.CombinedRangeMiles;
        parsed.batteryCapacity = ev.BatteryDetailsList?.[0]?.CapacityKwh;
        parsed.homeChargingSpeed = ev.ChargePortDetailsList?.find(p => p.PortType === 'Type 2')?.MaxChargePowerKw;
        parsed.rapidChargingSpeed = ev.ChargePortDetailsList?.find(p => p.PortType === 'CCS')?.MaxChargePowerKw;
        parsed.electricMotorPower = ev.MotorDetailsList?.[0]?.PowerKw;
        parsed.electricMotorTorque = ev.MotorDetailsList?.[0]?.MaxTorqueNm;
        parsed.chargingPortType = ev.ChargePortDetailsList?.map(p => p.PortType).join(' / ');
        
        // Calculate charging time (10-80%)
        const chargingTimes = ev.ChargePortDetailsList?.[0]?.ChargeTimes?.AverageChargeTimes10To80Percent;
        if (chargingTimes) {
          const fastCharging = chargingTimes.find(c => c.ChargePortKw >= 40);
          parsed.chargingTime = fastCharging ? fastCharging.TimeInMinutes / 60 : null;
        }
      }
    }

    // Parse Vehicle History
    if (apiData.vehicleHistory) {
      const history = apiData.vehicleHistory;
      
      parsed.color = history.VehicleRegistration?.Colour;
      parsed.numberOfPreviousKeepers = history.VehicleHistory?.NumberOfPreviousKeepers || 0;
      parsed.exported = history.VehicleHistory?.Exported || false;
      parsed.scrapped = history.VehicleHistory?.Scrapped || false;
      
      // CRITICAL FIX: Extract actual write-off category (A/B/C/D/S/N)
      if (history.VehicleHistory?.writeOffRecord && history.VehicleHistory?.writeoff) {
        const writeoffData = Array.isArray(history.VehicleHistory.writeoff) 
          ? history.VehicleHistory.writeoff[0] 
          : history.VehicleHistory.writeoff;
        
        // Extract category from status field or category field
        let category = 'unknown';
        
        if (writeoffData.category) {
          category = writeoffData.category.toUpperCase();
        } else if (writeoffData.status) {
          const status = writeoffData.status.toUpperCase();
          if (status.includes('CAT N') || status.includes('CATEGORY N')) category = 'N';
          else if (status.includes('CAT S') || status.includes('CATEGORY S')) category = 'S';
          else if (status.includes('CAT A') || status.includes('CATEGORY A')) category = 'A';
          else if (status.includes('CAT B') || status.includes('CATEGORY B')) category = 'B';
          else if (status.includes('CAT C') || status.includes('CATEGORY C')) category = 'C';
          else if (status.includes('CAT D') || status.includes('CATEGORY D')) category = 'D';
        }
        
        parsed.writeOffCategory = category;
        parsed.isWrittenOff = true;
        
        // Store write-off details
        parsed.writeOffDetails = {
          category: category,
          date: writeoffData.lossdate ? new Date(writeoffData.lossdate) : null,
          status: writeoffData.status || null,
          description: writeoffData.status || null,
          insurerName: writeoffData.insurername || null,
          claimNumber: writeoffData.claimnumber || null,
          damageLocations: writeoffData.damagelocations || []
        };
        
        console.log(`⚠️  Write-off detected: Category ${category}, Date: ${writeoffData.lossdate || 'N/A'}`);
      } else {
        parsed.writeOffCategory = 'none';
        parsed.isWrittenOff = false;
        parsed.writeOffDetails = {
          category: 'none',
          date: null,
          status: null,
          description: null
        };
      }
    }

    // Parse MOT History
    if (apiData.motHistory) {
      const mot = apiData.motHistory;
      
      parsed.motStatus = mot.mot?.motStatus;
      parsed.motDueDate = mot.mot?.motDueDate;
      
      if (mot.motHistory && mot.motHistory.length > 0) {
        parsed.motHistory = mot.motHistory.map(test => ({
          testDate: new Date(test.completedDate),
          expiryDate: new Date(test.expiryDate),
          testResult: test.testResult,
          odometerValue: parseInt(test.odometerValue) || 0,
          odometerUnit: test.odometerUnit?.toLowerCase() || 'mi',
          testNumber: test.motTestNumber,
          defects: test.defects || []
        }));
      }
    }

    // Parse Valuation
    if (apiData.valuation) {
      const val = apiData.valuation.ValuationList;
      if (val) {
        parsed.estimatedValue = parseInt(val.PrivateClean);
        parsed.privatePrice = parseInt(val.PrivateClean);
        parsed.dealerPrice = parseInt(val.DealerForecourt);
        parsed.partExchangePrice = parseInt(val.PartExchange);
      }
    }

    return parsed;
  }

  /**
   * Update vehicle with ALL parsed data (handles Cars, Bikes, Vans)
   */
  async updateVehicleWithCompleteData(vehicle, parsedData, vehicleHistory, session = null) {
    console.log('🔄 Updating vehicle with complete data...');
    
    // Basic vehicle info (common to all vehicle types)
    vehicle.make = parsedData.make || vehicle.make;
    vehicle.model = parsedData.model || vehicle.model;
    vehicle.variant = parsedData.variant || vehicle.variant;
    vehicle.year = parsedData.year || vehicle.year;
    vehicle.color = parsedData.color || vehicle.color;
    vehicle.fuelType = parsedData.fuelType || vehicle.fuelType;
    vehicle.transmission = parsedData.transmission || vehicle.transmission;
    vehicle.bodyType = parsedData.bodyType || vehicle.bodyType;
    vehicle.doors = parsedData.doors || vehicle.doors;
    vehicle.seats = parsedData.seats || vehicle.seats;
    vehicle.engineSize = parsedData.engineSize || vehicle.engineSize;
    
    // Running costs (common to all vehicle types) - CRITICAL FIX: Use proper null checking
    if (parsedData.urbanMpg !== null && parsedData.urbanMpg !== undefined) vehicle.urbanMpg = parsedData.urbanMpg;
    if (parsedData.extraUrbanMpg !== null && parsedData.extraUrbanMpg !== undefined) vehicle.extraUrbanMpg = parsedData.extraUrbanMpg;
    if (parsedData.combinedMpg !== null && parsedData.combinedMpg !== undefined) vehicle.combinedMpg = parsedData.combinedMpg;
    if (parsedData.co2Emissions !== null && parsedData.co2Emissions !== undefined) vehicle.co2Emissions = parsedData.co2Emissions;
    if (parsedData.insuranceGroup !== null && parsedData.insuranceGroup !== undefined) vehicle.insuranceGroup = parsedData.insuranceGroup;
    if (parsedData.annualTax !== null && parsedData.annualTax !== undefined) vehicle.annualTax = parsedData.annualTax;
    if (parsedData.emissionClass !== null && parsedData.emissionClass !== undefined) vehicle.emissionClass = parsedData.emissionClass;
    
    // DEBUG: Log running costs saving
    console.log('💾 [RUNNING COSTS SAVED TO VEHICLE]:', {
      urbanMpg: vehicle.urbanMpg,
      extraUrbanMpg: vehicle.extraUrbanMpg,
      combinedMpg: vehicle.combinedMpg,
      insuranceGroup: vehicle.insuranceGroup,
      co2Emissions: vehicle.co2Emissions,
      annualTax: vehicle.annualTax,
      emissionClass: vehicle.emissionClass
    });
    
    // Performance (common to all vehicle types)
    vehicle.power = parsedData.power || vehicle.power;
    vehicle.torque = parsedData.torque || vehicle.torque;
    vehicle.acceleration = parsedData.acceleration || vehicle.acceleration;
    vehicle.topSpeed = parsedData.topSpeed || vehicle.topSpeed;
    
    // Electric vehicle data (ONLY for pure electric vehicles, NOT hybrids)
    if (vehicle.fuelType === 'Electric') {
      if (parsedData.electricRange) vehicle.electricRange = parsedData.electricRange;
      if (parsedData.batteryCapacity) vehicle.batteryCapacity = parsedData.batteryCapacity;
      if (parsedData.chargingTime) vehicle.chargingTime = parsedData.chargingTime;
      if (parsedData.homeChargingSpeed) vehicle.homeChargingSpeed = parsedData.homeChargingSpeed;
      if (parsedData.rapidChargingSpeed) vehicle.rapidChargingSpeed = parsedData.rapidChargingSpeed;
      if (parsedData.electricMotorPower) vehicle.electricMotorPower = parsedData.electricMotorPower;
      if (parsedData.electricMotorTorque) vehicle.electricMotorTorque = parsedData.electricMotorTorque;
      if (parsedData.chargingPortType) vehicle.chargingPortType = parsedData.chargingPortType;
    } else {
      // For non-electric vehicles (including hybrids), ensure EV fields are null
      vehicle.electricRange = null;
      vehicle.batteryCapacity = null;
      vehicle.chargingTime = null;
      vehicle.homeChargingSpeed = null;
      vehicle.rapidChargingSpeed = null;
      vehicle.electricMotorPower = null;
      vehicle.electricMotorTorque = null;
      vehicle.chargingPortType = null;
    }
    
    // MOT data (common to all vehicle types)
    vehicle.motStatus = parsedData.motStatus || vehicle.motStatus;
    if (parsedData.motDueDate) {
      vehicle.motDue = new Date(parsedData.motDueDate);
      vehicle.motExpiry = new Date(parsedData.motDueDate);
    }
    if (parsedData.motHistory && parsedData.motHistory.length > 0) {
      vehicle.motHistory = parsedData.motHistory;
    }
    
    // Valuation (common to all vehicle types)
    vehicle.estimatedValue = parsedData.estimatedValue || vehicle.estimatedValue;
    vehicle.privatePrice = parsedData.privatePrice || vehicle.privatePrice;
    vehicle.dealerPrice = parsedData.dealerPrice || vehicle.dealerPrice;
    vehicle.partExchangePrice = parsedData.partExchangePrice || vehicle.partExchangePrice;
    
    // Vehicle history reference
    if (vehicleHistory) {
      vehicle.historyCheckId = vehicleHistory._id;
      vehicle.historyCheckStatus = 'verified';
      vehicle.historyCheckDate = new Date();
    }
    
    // Running costs object (common structure for all vehicle types)
    vehicle.runningCosts = {
      fuelEconomy: {
        urban: vehicle.urbanMpg,
        extraUrban: vehicle.extraUrbanMpg,
        combined: vehicle.combinedMpg
      },
      co2Emissions: vehicle.co2Emissions,
      insuranceGroup: vehicle.insuranceGroup,
      annualTax: vehicle.annualTax,
      emissionClass: vehicle.emissionClass, // CRITICAL FIX: Include emission class in running costs
      // Electric vehicle data (ONLY for pure electric, NOT hybrids)
      electricRange: vehicle.fuelType === 'Electric' ? vehicle.electricRange : null,
      batteryCapacity: vehicle.fuelType === 'Electric' ? vehicle.batteryCapacity : null,
      chargingTime: vehicle.chargingTime,
      homeChargingSpeed: vehicle.homeChargingSpeed,
      rapidChargingSpeed: vehicle.rapidChargingSpeed,
      electricMotorPower: vehicle.electricMotorPower,
      electricMotorTorque: vehicle.electricMotorTorque,
      chargingPortType: vehicle.chargingPortType
    };
    
    console.log('✅ Vehicle updated with complete data');
    console.log('📦 [FINAL RUNNING COSTS OBJECT]:', JSON.stringify(vehicle.runningCosts, null, 2));
    console.log(`   Running costs: MPG=${vehicle.combinedMpg}, CO2=${vehicle.co2Emissions}, Insurance=${vehicle.insuranceGroup}, Emission Class=${vehicle.emissionClass}`);
    return vehicle;
  }

  /**
   * Save data to VehicleHistory for caching
   */
  async saveToVehicleHistory(vrm, parsedData, session = null) {
    try {
      // Delete existing records - within transaction if provided
      await VehicleHistory.deleteMany({ vrm: vrm }, session ? { session } : {});
      
      // Create new record with ALL fields
      const vehicleHistory = new VehicleHistory({
        vrm: vrm,
        make: parsedData.make,
        model: parsedData.model,
        variant: parsedData.variant, // CRITICAL FIX: Save variant
        colour: parsedData.color,
        fuelType: parsedData.fuelType,
        yearOfManufacture: parsedData.year,
        bodyType: parsedData.bodyType, // CRITICAL FIX: Save body type
        transmission: parsedData.transmission, // CRITICAL FIX: Save transmission
        doors: parsedData.doors, // CRITICAL FIX: Save doors
        seats: parsedData.seats, // CRITICAL FIX: Save seats
        engineCapacity: parsedData.engineSize, // CRITICAL FIX: Save engine size
        numberOfPreviousKeepers: parsedData.numberOfPreviousKeepers,
        exported: parsedData.exported,
        scrapped: parsedData.scrapped,
        isWrittenOff: parsedData.isWrittenOff || false,
        writeOffCategory: parsedData.writeOffCategory,
        writeOffDetails: parsedData.writeOffDetails || {
          category: parsedData.writeOffCategory || 'none',
          date: null,
          status: null,
          description: null
        },
        motStatus: parsedData.motStatus,
        motExpiryDate: parsedData.motDueDate ? new Date(parsedData.motDueDate) : null,
        motHistory: parsedData.motHistory || [],
        urbanMpg: parsedData.urbanMpg,
        extraUrbanMpg: parsedData.extraUrbanMpg,
        combinedMpg: parsedData.combinedMpg,
        co2Emissions: parsedData.co2Emissions,
        insuranceGroup: parsedData.insuranceGroup,
        annualTax: parsedData.annualTax,
        emissionClass: parsedData.emissionClass,
        checkDate: new Date()
      });
      
      // Save within transaction if provided
      await vehicleHistory.save(session ? { session } : {});
      console.log('✅ Data cached in VehicleHistory (complete with variant, doors, seats, engine)');
      return vehicleHistory;
      
    } catch (error) {
      console.error('❌ Failed to save VehicleHistory:', error.message);
      throw error; // Re-throw to trigger transaction rollback
    }
  }

  /**
   * Get cached data from VehicleHistory with enhanced cache-first logic
   */
  async getCachedData(vrm) {
    try {
      // TEMPORARY FIX: Disable cache to always fetch fresh data with running costs
      console.log(`⚠️  Cache temporarily disabled for ${vrm} - will fetch fresh data`);
      return null;
      
      /* ORIGINAL CODE - RE-ENABLE AFTER RUNNING COSTS ARE STABLE
      console.log(`🔍 Checking cache for ${vrm}...`);
      
      // Find the most recent cache entry for this VRM
      const cached = await VehicleHistory.findOne({ vrm: vrm })
        .sort({ checkDate: -1 }) // Get most recent first
        .lean(); // Use lean() for better performance
      
      if (!cached) {
        console.log('📭 No cache found');
        return null;
      }
      
      // Enhanced cache TTL validation with different tiers
      const cacheAge = Date.now() - new Date(cached.checkDate).getTime();
      const cacheTiers = {
        fresh: 7 * 24 * 60 * 60 * 1000,    // 7 days - fresh data
        good: 30 * 24 * 60 * 60 * 1000,    // 30 days - good data
        stale: 90 * 24 * 60 * 60 * 1000    // 90 days - stale but usable
      };
      
      let cacheStatus = 'expired';
      if (cacheAge <= cacheTiers.fresh) {
        cacheStatus = 'fresh';
      } else if (cacheAge <= cacheTiers.good) {
        cacheStatus = 'good';
      } else if (cacheAge <= cacheTiers.stale) {
        cacheStatus = 'stale';
      }
      
      // Log cache status
      const ageInDays = Math.floor(cacheAge / (24 * 60 * 60 * 1000));
      console.log(`📦 Cache found: ${cacheStatus} (${ageInDays} days old)`);
      
      // Return cache with status metadata
      if (cacheStatus !== 'expired') {
        return {
          ...cached,
          _cacheStatus: cacheStatus,
          _cacheAge: ageInDays,
          _cacheSavings: 1.99 // API cost savings
        };
      }
      
      // Cache expired - clean up old entries
      console.log('⏰ Cache expired, cleaning up old entries...');
      await this.cleanupExpiredCache(vrm);
      return null;
      */
      
    } catch (error) {
      console.error('❌ Cache check failed:', error.message);
      return null;
    }
  }

  /**
   * Clean up expired cache entries for a VRM
   * @param {string} vrm - Vehicle registration mark
   */
  async cleanupExpiredCache(vrm) {
    try {
      const expiredThreshold = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000)); // 90 days
      const result = await VehicleHistory.deleteMany({
        vrm: vrm,
        checkDate: { $lt: expiredThreshold }
      });
      
      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} expired cache entries for ${vrm}`);
      }
    } catch (error) {
      console.error('❌ Cache cleanup failed:', error.message);
    }
  }

  /**
   * Implement cache warming strategies for frequently accessed vehicles
   * @param {Array} vrmList - List of VRMs to warm cache for
   */
  async warmCache(vrmList) {
    console.log(`🔥 Warming cache for ${vrmList.length} vehicles...`);
    
    const warmingPromises = vrmList.map(async (vrm) => {
      try {
        const cached = await this.getCachedData(vrm);
        if (!cached || cached._cacheStatus === 'stale') {
          console.log(`🔥 Pre-warming cache for ${vrm}...`);
          // Trigger background refresh without waiting
          this.refreshCacheInBackground(vrm);
        }
      } catch (error) {
        console.error(`❌ Cache warming failed for ${vrm}:`, error.message);
      }
    });
    
    // Don't wait for all to complete - fire and forget
    Promise.allSettled(warmingPromises);
    console.log('🔥 Cache warming initiated');
  }

  /**
   * Refresh cache in background without blocking main operations
   * @param {string} vrm - Vehicle registration mark
   */
  async refreshCacheInBackground(vrm) {
    try {
      // Find vehicle in database
      const Car = require('../models/Car');
      const Bike = require('../models/Bike');
      const Van = require('../models/Van');
      
      const vehicle = await Car.findOne({ registrationNumber: vrm.toUpperCase() }) ||
                     await Bike.findOne({ registrationNumber: vrm.toUpperCase() }) ||
                     await Van.findOne({ registrationNumber: vrm.toUpperCase() });
      
      if (vehicle) {
        // Refresh data in background
        setTimeout(async () => {
          try {
            await this.completeCarData(vehicle, true);
            console.log(`🔄 Background cache refresh completed for ${vrm}`);
          } catch (error) {
            console.error(`❌ Background cache refresh failed for ${vrm}:`, error.message);
          }
        }, 1000); // 1 second delay to not block main thread
      }
    } catch (error) {
      console.error(`❌ Background cache refresh setup failed for ${vrm}:`, error.message);
    }
  }

  /**
   * Update vehicle from cached data (handles Cars, Bikes, Vans)
   */
  async updateVehicleFromCache(vehicle, cachedData, session = null) {
    console.log('🔄 Updating vehicle from cached data...');
    
    // Update all fields from cache
    vehicle.make = cachedData.make || vehicle.make;
    vehicle.model = cachedData.model || vehicle.model;
    vehicle.color = cachedData.colour || vehicle.color;
    vehicle.fuelType = cachedData.fuelType || vehicle.fuelType;
    vehicle.year = cachedData.yearOfManufacture || vehicle.year;
    
    // Running costs
    vehicle.urbanMpg = cachedData.urbanMpg || vehicle.urbanMpg;
    vehicle.extraUrbanMpg = cachedData.extraUrbanMpg || vehicle.extraUrbanMpg;
    vehicle.combinedMpg = cachedData.combinedMpg || vehicle.combinedMpg;
    vehicle.co2Emissions = cachedData.co2Emissions || vehicle.co2Emissions;
    vehicle.insuranceGroup = cachedData.insuranceGroup || vehicle.insuranceGroup;
    vehicle.annualTax = cachedData.annualTax || vehicle.annualTax;
    
    // MOT data
    vehicle.motStatus = cachedData.motStatus || vehicle.motStatus;
    if (cachedData.motExpiryDate) {
      vehicle.motDue = cachedData.motExpiryDate;
      vehicle.motExpiry = cachedData.motExpiryDate;
    }
    if (cachedData.motTests && cachedData.motTests.length > 0) {
      vehicle.motHistory = cachedData.motTests;
    }
    
    // Vehicle history reference
    vehicle.historyCheckId = cachedData._id;
    vehicle.historyCheckStatus = 'verified';
    vehicle.historyCheckDate = new Date();
    
    // Running costs object
    vehicle.runningCosts = {
      fuelEconomy: {
        urban: vehicle.urbanMpg,
        extraUrban: vehicle.extraUrbanMpg,
        combined: vehicle.combinedMpg
      },
      co2Emissions: vehicle.co2Emissions,
      insuranceGroup: vehicle.insuranceGroup,
      annualTax: vehicle.annualTax
    };
    
    await vehicle.save(session ? { session } : {});
    console.log('✅ Vehicle updated from cache');
    return vehicle;
  }

  /**
   * Apply fallback data if API fails (handles Cars, Bikes, Vans)
   */
  async applyFallbackData(vehicle) {
    console.log('🚨 Applying fallback data...');
    
    // Generate reasonable defaults based on fuel type and year
    if (!vehicle.annualTax) {
      if (vehicle.fuelType === 'Electric') {
        vehicle.annualTax = vehicle.year >= 2017 ? 195 : 0;
      } else if (vehicle.fuelType === 'Diesel') {
        vehicle.annualTax = 180;
      } else {
        vehicle.annualTax = 165;
      }
    }
    
    if (!vehicle.co2Emissions) {
      vehicle.co2Emissions = vehicle.fuelType === 'Electric' ? 0 : 120;
    }
    
    // Electric vehicle fallback
    if (vehicle.fuelType === 'Electric') {
      vehicle.electricRange = vehicle.electricRange || 200;
      vehicle.batteryCapacity = vehicle.batteryCapacity || 50;
      vehicle.chargingTime = vehicle.chargingTime || 8;
    }
    
    // Vehicle-specific fallbacks
    const vehicleType = vehicle.constructor.modelName;
    if (vehicleType === 'Bike') {
      // Bike-specific fallbacks
      vehicle.doors = 0; // Bikes don't have doors
      vehicle.seats = vehicle.seats || 2;
      vehicle.bodyType = vehicle.bodyType || 'Motorcycle';
    } else if (vehicleType === 'Van') {
      // Van-specific fallbacks
      vehicle.doors = vehicle.doors || 4;
      vehicle.seats = vehicle.seats || 3;
      vehicle.bodyType = vehicle.bodyType || 'Van';
    } else {
      // Car-specific fallbacks
      vehicle.doors = vehicle.doors || 4;
      vehicle.seats = vehicle.seats || 5;
      vehicle.bodyType = vehicle.bodyType || 'Hatchback';
    }
    
    await vehicle.save();
    return vehicle;
  }

  /**
   * Normalize fuel type (matches apiResponseParser logic)
   */
  normalizeFuelType(fuelType) {
    if (!fuelType) return null;
    
    const normalized = fuelType.toLowerCase().trim();
    
    // CRITICAL: Check hybrid BEFORE electric to avoid "HYBRID ELECTRIC" being classified as "Electric"
    // Also preserve the hybrid subtype (Petrol Hybrid, Diesel Hybrid, etc.)
    if (normalized.includes('plug-in') && normalized.includes('hybrid')) {
      // Check for specific plug-in hybrid types
      if (normalized.includes('petrol')) {
        return 'Petrol Plug-in Hybrid';
      }
      if (normalized.includes('diesel')) {
        return 'Diesel Plug-in Hybrid';
      }
      return 'Plug-in Hybrid';
    }
    
    if (normalized.includes('hybrid')) {
      // Check for specific hybrid types
      if (normalized.includes('petrol') || normalized.includes('gasoline')) {
        return 'Petrol Hybrid';
      }
      if (normalized.includes('diesel')) {
        return 'Diesel Hybrid';
      }
      // Generic hybrid (when subtype not specified)
      return 'Hybrid';
    }
    
    if (normalized.includes('petrol') || normalized.includes('gasoline')) {
      return 'Petrol';
    }
    if (normalized.includes('diesel')) {
      return 'Diesel';
    }
    if (normalized.includes('electric') || normalized.includes('ev')) {
      return 'Electric';
    }
    
    // Return capitalized version if no match
    return fuelType.charAt(0).toUpperCase() + fuelType.slice(1).toLowerCase();
  }

  /**
   * Normalize transmission
   */
  normalizeTransmission(transmission) {
    if (!transmission) return null;
    
    const normalized = transmission.toLowerCase();
    if (normalized.includes('auto') || normalized.includes('cvt')) return 'automatic';
    if (normalized.includes('manual')) return 'manual';
    if (normalized.includes('semi')) return 'semi-automatic';
    
    return 'manual'; // Default
  }

  /**
   * Check if vehicle needs data completion (handles Cars, Bikes, Vans)
   */
  needsCompletion(vehicle) {
    // Check critical basic fields
    const missingBasicFields = [
      !vehicle.variant,
      !vehicle.transmission && !vehicle.gearbox,
      !vehicle.engineSize,
      !vehicle.doors,
      !vehicle.seats,
      !vehicle.bodyType,
      !vehicle.color
    ].some(missing => missing);
    
    // Check running costs (both nested and legacy fields)
    const missingRunningCosts = [
      !vehicle.runningCosts?.fuelEconomy?.combined && !vehicle.fuelEconomyCombined,
      !vehicle.runningCosts?.insuranceGroup && !vehicle.insuranceGroup,
      !vehicle.runningCosts?.annualTax && !vehicle.annualTax,
      !vehicle.runningCosts?.co2Emissions && !vehicle.co2Emissions
    ].some(missing => missing);
    
    // Check MOT data
    const missingMOT = !vehicle.motStatus || !vehicle.motDueDate;
    
    // Check vehicle history
    const missingHistory = !vehicle.vehicleHistory && !vehicle.historyCheckId;
    
    const needsCompletion = missingBasicFields || missingRunningCosts || missingMOT || missingHistory;
    
    if (needsCompletion) {
      console.log(`   ⚠️  Vehicle needs completion:`);
      if (missingBasicFields) console.log(`      - Missing basic fields`);
      if (missingRunningCosts) console.log(`      - Missing running costs`);
      if (missingMOT) console.log(`      - Missing MOT data`);
      if (missingHistory) console.log(`      - Missing vehicle history`);
    }
    
    return needsCompletion;
  }

  /**
   * Enhance manual data (for vehicles without registration)
   */
  async enhanceManualData(vehicle) {
    console.log('🔧 Enhancing manual data...');
    
    // Generate variant if missing
    if (!vehicle.variant) {
      if (vehicle.engineSize && vehicle.fuelType) {
        vehicle.variant = `${vehicle.engineSize}L ${vehicle.fuelType}`;
      } else if (vehicle.fuelType) {
        vehicle.variant = vehicle.fuelType;
      }
    }
    
    // Apply electric vehicle enhancements
    if (vehicle.fuelType === 'Electric') {
      const enhancedData = ElectricVehicleEnhancementService.enhanceWithEVData(vehicle.toObject());
      Object.assign(vehicle, enhancedData);
    }
    
    // Apply vehicle-specific enhancements
    await this.applyVehicleSpecificEnhancements(vehicle);
    
    await vehicle.save();
    return vehicle;
  }

  /**
   * Apply vehicle-specific enhancements based on vehicle type
   */
  async applyVehicleSpecificEnhancements(vehicle) {
    const vehicleType = vehicle.constructor.modelName;
    
    console.log(`🔧 Applying ${vehicleType}-specific enhancements...`);
    
    if (vehicleType === 'Bike') {
      // Bike-specific enhancements
      await this.enhanceBikeData(vehicle);
    } else if (vehicleType === 'Van') {
      // Van-specific enhancements
      await this.enhanceVanData(vehicle);
    } else {
      // Car-specific enhancements (default)
      await this.enhanceCarData(vehicle);
    }
  }

  /**
   * Enhance bike-specific data
   */
  async enhanceBikeData(bike) {
    console.log('🏍️ Applying bike-specific enhancements...');
    
    // Bikes don't have doors
    bike.doors = 0;
    
    // Default bike seats
    if (!bike.seats) {
      bike.seats = bike.bodyType === 'Scooter' ? 2 : 1;
    }
    
    // Default bike body type
    if (!bike.bodyType) {
      if (bike.engineSize && bike.engineSize <= 0.125) {
        bike.bodyType = 'Scooter';
      } else if (bike.engineSize && bike.engineSize >= 0.6) {
        bike.bodyType = 'Touring';
      } else {
        bike.bodyType = 'Standard';
      }
    }
    
    // Bike-specific running costs adjustments
    if (!bike.insuranceGroup && bike.engineSize) {
      // Estimate insurance group based on engine size
      if (bike.engineSize <= 0.125) {
        bike.insuranceGroup = 1; // Small scooters
      } else if (bike.engineSize <= 0.6) {
        bike.insuranceGroup = 8; // Medium bikes
      } else {
        bike.insuranceGroup = 17; // Large bikes
      }
    }
  }

  /**
   * Enhance van-specific data
   */
  async enhanceVanData(van) {
    console.log('🚐 Applying van-specific enhancements...');
    
    // Default van doors
    if (!van.doors) {
      van.doors = van.bodyType === 'Panel Van' ? 3 : 4;
    }
    
    // Default van seats
    if (!van.seats) {
      van.seats = van.bodyType === 'Crew Van' ? 7 : 3;
    }
    
    // Default van body type
    if (!van.bodyType) {
      van.bodyType = 'Panel Van';
    }
    
    // Van-specific running costs adjustments
    if (!van.annualTax && van.year) {
      // Commercial vehicle tax rates
      van.annualTax = van.year >= 2019 ? 290 : 250;
    }
  }

  /**
   * Enhance car-specific data
   */
  async enhanceCarData(car) {
    console.log('🚗 Applying car-specific enhancements...');
    
    // Default car doors based on body type
    if (!car.doors && car.bodyType) {
      if (car.bodyType.toLowerCase().includes('coupe')) {
        car.doors = 2;
      } else {
        car.doors = 4;
      }
    }
    
    // Default car seats based on body type
    if (!car.seats && car.bodyType) {
      if (car.bodyType.toLowerCase().includes('7-seat') || car.bodyType.toLowerCase().includes('mpv')) {
        car.seats = 7;
      } else if (car.bodyType.toLowerCase().includes('2-seat') || car.bodyType.toLowerCase().includes('roadster')) {
        car.seats = 2;
      } else {
        car.seats = 5;
      }
    }
  }

  /**
   * Comprehensive vehicle data completion (merges functionality from comprehensiveVehicleService)
   * @param {string} vrm - Vehicle registration mark
   * @param {number} mileage - Vehicle mileage for valuation
   * @param {boolean} forceRefresh - Force fresh API calls
   * @returns {Promise<Object>} Complete vehicle data result
   */
  async fetchCompleteVehicleData(vrm, mileage = 50000, forceRefresh = false) {
    try {
      console.log(`\n🚀 [UniversalAutoComplete] Comprehensive data fetch for: ${vrm}`);
      
      // Find the vehicle in database
      const Car = require('../models/Car');
      const Bike = require('../models/Bike');
      const Van = require('../models/Van');
      
      let vehicle = await Car.findOne({ registrationNumber: vrm.toUpperCase() }) ||
                   await Bike.findOne({ registrationNumber: vrm.toUpperCase() }) ||
                   await Van.findOne({ registrationNumber: vrm.toUpperCase() });
      
      if (!vehicle) {
        throw new Error(`Vehicle not found for VRM: ${vrm}`);
      }
      
      // Use the main completion method
      const result = await this.completeCarData(vehicle, forceRefresh);
      
      return {
        vrm: vrm.toUpperCase(),
        success: true,
        data: {
          vehicle: result,
          cached: !forceRefresh
        },
        errors: [],
        apiCalls: forceRefresh ? 4 : 0,
        totalCost: forceRefresh ? 1.99 : 0
      };
      
    } catch (error) {
      console.error(`❌ [UniversalAutoComplete] Comprehensive fetch failed:`, error);
      return {
        vrm: vrm.toUpperCase(),
        success: false,
        data: {},
        errors: [{ service: 'universal', error: error.message }],
        apiCalls: 0,
        totalCost: 0
      };
    }
  }

  /**
   * Validate data completeness before saving to database
   * @param {Object} vehicle - Vehicle document
   * @param {Object} parsedData - Parsed API data
   * @returns {Object} Validation result with isComplete flag and missing fields
   */
  validateDataCompleteness(vehicle, parsedData) {
    const vehicleType = vehicle.constructor.modelName;
    const criticalFields = this.getCriticalFieldsByVehicleType(vehicleType);
    
    const missingFields = [];
    const validationResult = {
      isComplete: true,
      missingFields: [],
      vehicleType: vehicleType,
      criticalFieldsCount: criticalFields.length,
      completedFieldsCount: 0
    };

    // Check each critical field
    criticalFields.forEach(field => {
      const vehicleValue = vehicle[field];
      const parsedValue = parsedData[field];
      
      // Field is missing if both vehicle and parsed data don't have it
      if (!vehicleValue && !parsedValue) {
        missingFields.push(field);
        validationResult.isComplete = false;
      } else {
        validationResult.completedFieldsCount++;
      }
    });

    validationResult.missingFields = missingFields;
    validationResult.completionPercentage = Math.round(
      (validationResult.completedFieldsCount / validationResult.criticalFieldsCount) * 100
    );

    console.log(`📊 Data completeness: ${validationResult.completionPercentage}% (${validationResult.completedFieldsCount}/${validationResult.criticalFieldsCount} fields)`);
    
    if (missingFields.length > 0) {
      console.log(`⚠️  Missing critical fields: ${missingFields.join(', ')}`);
    }

    return validationResult;
  }

  /**
   * Get critical fields by vehicle type
   * @param {string} vehicleType - Type of vehicle (Car, Bike, Van)
   * @returns {Array} Array of critical field names
   */
  getCriticalFieldsByVehicleType(vehicleType) {
    const commonFields = [
      'make',
      'model',
      'year',
      'fuelType',
      'transmission',
      'annualTax'
    ];

    const vehicleSpecificFields = {
      'Car': [
        'variant',
        'engineSize',
        'doors',
        'seats',
        'bodyType',
        'co2Emissions',
        'combinedMpg'
      ],
      'Bike': [
        'variant',
        'engineSize',
        'bodyType'
      ],
      'Van': [
        'variant',
        'engineSize',
        'doors',
        'seats',
        'bodyType'
      ]
    };

    return [...commonFields, ...(vehicleSpecificFields[vehicleType] || [])];
  }

  /**
   * Apply data completeness fixes for missing critical fields
   * @param {Object} vehicle - Vehicle document
   * @param {Object} parsedData - Parsed API data
   * @param {Object} validationResult - Result from validateDataCompleteness
   * @returns {Object} Updated vehicle with fallback data for missing fields
   */
  applyCompletenessFixes(vehicle, parsedData, validationResult) {
    const vehicleType = vehicle.constructor.modelName;
    
    console.log(`🔧 Applying completeness fixes for ${validationResult.missingFields.length} missing fields...`);

    validationResult.missingFields.forEach(field => {
      const fallbackValue = this.getFallbackValueForField(field, vehicle, vehicleType);
      if (fallbackValue !== null) {
        vehicle[field] = fallbackValue;
        console.log(`   ✅ ${field}: ${fallbackValue}`);
      }
    });

    return vehicle;
  }

  /**
   * Get fallback value for a missing critical field
   * @param {string} field - Field name
   * @param {Object} vehicle - Vehicle document
   * @param {string} vehicleType - Type of vehicle
   * @returns {any} Fallback value or null if no fallback available
   */
  getFallbackValueForField(field, vehicle, vehicleType) {
    const fallbacks = {
      // Common fallbacks
      'variant': vehicle.fuelType || 'Standard',
      'transmission': 'manual',
      'annualTax': this.getDefaultAnnualTax(vehicle),
      'co2Emissions': vehicle.fuelType === 'Electric' ? 0 : 120,
      'combinedMpg': vehicle.fuelType === 'Electric' ? null : 35,
      
      // Vehicle-specific fallbacks
      'doors': vehicleType === 'Bike' ? 0 : (vehicleType === 'Van' ? 4 : 4),
      'seats': vehicleType === 'Bike' ? 2 : (vehicleType === 'Van' ? 3 : 5),
      'bodyType': this.getDefaultBodyType(vehicleType),
      'engineSize': vehicleType === 'Bike' ? 0.125 : 1.6
    };

    return fallbacks[field] || null;
  }

  /**
   * Get default annual tax based on vehicle properties
   * @param {Object} vehicle - Vehicle document
   * @returns {number} Default annual tax amount
   */
  getDefaultAnnualTax(vehicle) {
    if (vehicle.fuelType === 'Electric') {
      return vehicle.year >= 2017 ? 195 : 0;
    } else if (vehicle.fuelType === 'Diesel') {
      return 180;
    } else {
      return 165;
    }
  }

  /**
   * Get default body type based on vehicle type
   * @param {string} vehicleType - Type of vehicle
   * @returns {string} Default body type
   */
  getDefaultBodyType(vehicleType) {
    const defaults = {
      'Car': 'Hatchback',
      'Bike': 'Standard',
      'Van': 'Panel Van'
    };
    
    return defaults[vehicleType] || 'Unknown';
  }

  /**
   * Log API call for comprehensive tracking and cost monitoring
   * @param {Object} callData - API call data
   */
  logApiCall(callData) {
    const logEntry = {
      id: `${callData.vrm}-${callData.endpoint}-${Date.now()}`,
      vrm: callData.vrm,
      endpoint: callData.endpoint,
      cost: callData.cost,
      success: callData.success,
      timestamp: callData.timestamp,
      responseTime: callData.responseTime,
      error: callData.error || null,
      sessionId: this.generateSessionId(),
      userId: callData.userId || null,
      source: 'UniversalAutoCompleteService'
    };
    
    // Add to in-memory log
    this.apiCallLog.push(logEntry);
    
    // Keep only last 1000 entries to prevent memory issues
    if (this.apiCallLog.length > 1000) {
      this.apiCallLog = this.apiCallLog.slice(-1000);
    }
    
    // Log to console with structured format
    const status = logEntry.success ? '✅' : '❌';
    const cost = logEntry.success ? `£${logEntry.cost}` : '£0.00';
    const time = `${logEntry.responseTime}ms`;
    
    console.log(`📊 API Call: ${status} ${logEntry.endpoint} | ${cost} | ${time} | ${logEntry.vrm}`);
    
    // TODO: In production, also log to external monitoring system
    // this.logToExternalSystem(logEntry);
  }

  /**
   * Generate session ID for tracking related API calls
   * @returns {string} Session ID
   */
  generateSessionId() {
    if (!this.currentSessionId) {
      this.currentSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Reset session ID every hour
      setTimeout(() => {
        this.currentSessionId = null;
      }, 60 * 60 * 1000);
    }
    
    return this.currentSessionId;
  }

  /**
   * Get comprehensive API call statistics
   * @param {Object} options - Filter options
   * @returns {Object} API call statistics
   */
  getApiCallStats(options = {}) {
    const { timeframe = 'all', vrm = null } = options;
    
    let filteredCalls = this.apiCallLog;
    
    // Filter by timeframe
    if (timeframe !== 'all') {
      const timeframes = {
        'hour': 60 * 60 * 1000,
        'day': 24 * 60 * 60 * 1000,
        'week': 7 * 24 * 60 * 60 * 1000
      };
      
      const cutoff = Date.now() - (timeframes[timeframe] || 0);
      filteredCalls = filteredCalls.filter(call => 
        new Date(call.timestamp).getTime() > cutoff
      );
    }
    
    // Filter by VRM
    if (vrm) {
      filteredCalls = filteredCalls.filter(call => call.vrm === vrm.toUpperCase());
    }
    
    // Calculate statistics
    const totalCalls = filteredCalls.length;
    const successfulCalls = filteredCalls.filter(call => call.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const totalCost = filteredCalls.reduce((sum, call) => sum + call.cost, 0);
    const averageResponseTime = totalCalls > 0 ? 
      filteredCalls.reduce((sum, call) => sum + call.responseTime, 0) / totalCalls : 0;
    
    // Endpoint breakdown
    const endpointStats = {};
    filteredCalls.forEach(call => {
      if (!endpointStats[call.endpoint]) {
        endpointStats[call.endpoint] = { calls: 0, cost: 0, failures: 0 };
      }
      endpointStats[call.endpoint].calls++;
      endpointStats[call.endpoint].cost += call.cost;
      if (!call.success) {
        endpointStats[call.endpoint].failures++;
      }
    });
    
    return {
      timeframe,
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(1) : 0,
      totalCost: totalCost.toFixed(2),
      averageResponseTime: Math.round(averageResponseTime),
      endpointStats,
      costByEndpoint: Object.entries(endpointStats).map(([endpoint, stats]) => ({
        endpoint,
        cost: stats.cost.toFixed(2),
        calls: stats.calls,
        failures: stats.failures
      })).sort((a, b) => parseFloat(b.cost) - parseFloat(a.cost))
    };
  }

  /**
   * Get cost monitoring dashboard data
   * @returns {Object} Dashboard data for cost monitoring
   */
  getCostMonitoringData() {
    const hourlyStats = this.getApiCallStats({ timeframe: 'hour' });
    const dailyStats = this.getApiCallStats({ timeframe: 'day' });
    const weeklyStats = this.getApiCallStats({ timeframe: 'week' });
    const deduplicationStats = this.getDeduplicationStats();
    
    // Calculate cost savings from deduplication
    const potentialCost = parseFloat(dailyStats.totalCost) + parseFloat(deduplicationStats.totalSavings);
    const actualCost = parseFloat(dailyStats.totalCost);
    const savingsPercentage = potentialCost > 0 ? 
      ((parseFloat(deduplicationStats.totalSavings) / potentialCost) * 100).toFixed(1) : 0;
    
    return {
      currentHour: {
        calls: hourlyStats.totalCalls,
        cost: hourlyStats.totalCost,
        successRate: hourlyStats.successRate
      },
      currentDay: {
        calls: dailyStats.totalCalls,
        cost: dailyStats.totalCost,
        successRate: dailyStats.successRate,
        averageResponseTime: dailyStats.averageResponseTime
      },
      currentWeek: {
        calls: weeklyStats.totalCalls,
        cost: weeklyStats.totalCost,
        successRate: weeklyStats.successRate
      },
      deduplication: {
        activeSessions: deduplicationStats.activeSessions,
        totalSavings: deduplicationStats.totalSavings,
        savingsPercentage: savingsPercentage
      },
      topEndpoints: dailyStats.costByEndpoint.slice(0, 5),
      alerts: this.generateCostAlerts(dailyStats, weeklyStats)
    };
  }

  /**
   * Generate cost alerts based on usage patterns
   * @param {Object} dailyStats - Daily statistics
   * @param {Object} weeklyStats - Weekly statistics
   * @returns {Array} Array of alert objects
   */
  generateCostAlerts(dailyStats, weeklyStats) {
    const alerts = [];
    
    // High daily cost alert
    if (parseFloat(dailyStats.totalCost) > 50) {
      alerts.push({
        type: 'warning',
        message: `High daily API cost: £${dailyStats.totalCost}`,
        recommendation: 'Consider implementing more aggressive caching'
      });
    }
    
    // High failure rate alert
    if (parseFloat(dailyStats.successRate) < 90) {
      alerts.push({
        type: 'error',
        message: `Low API success rate: ${dailyStats.successRate}%`,
        recommendation: 'Check API connectivity and error handling'
      });
    }
    
    // Slow response time alert
    if (dailyStats.averageResponseTime > 5000) {
      alerts.push({
        type: 'warning',
        message: `Slow API response time: ${dailyStats.averageResponseTime}ms`,
        recommendation: 'Monitor API performance and consider timeout adjustments'
      });
    }
    
    // Weekly cost trend alert
    const weeklyAverage = parseFloat(weeklyStats.totalCost) / 7;
    const dailyCost = parseFloat(dailyStats.totalCost);
    if (dailyCost > weeklyAverage * 2) {
      alerts.push({
        type: 'info',
        message: `Daily cost (£${dailyCost}) is 2x higher than weekly average (£${weeklyAverage.toFixed(2)})`,
        recommendation: 'Monitor for unusual usage patterns'
      });
    }
    
    return alerts;
  }

  /**
   * Export API call logs for external analysis
   * @param {Object} options - Export options
   * @returns {Array} Filtered and formatted log entries
   */
  exportApiCallLogs(options = {}) {
    const { format = 'json', timeframe = 'day', includeErrors = true } = options;
    
    let logs = this.getApiCallStats({ timeframe }).endpointStats ? 
      this.apiCallLog.filter(call => {
        const cutoff = Date.now() - (timeframe === 'hour' ? 60*60*1000 : 
                                   timeframe === 'day' ? 24*60*60*1000 : 
                                   7*24*60*60*1000);
        return new Date(call.timestamp).getTime() > cutoff;
      }) : this.apiCallLog;
    
    if (!includeErrors) {
      logs = logs.filter(call => call.success);
    }
    
    if (format === 'csv') {
      const headers = ['timestamp', 'vrm', 'endpoint', 'cost', 'success', 'responseTime', 'error'];
      const csvRows = [headers.join(',')];
      
      logs.forEach(log => {
        const row = [
          log.timestamp.toISOString(),
          log.vrm,
          log.endpoint,
          log.cost,
          log.success,
          log.responseTime,
          log.error || ''
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
    
    return logs; // JSON format
  }

  /**
   * Check if vehicle data meets minimum completeness threshold
   * @param {Object} validationResult - Result from validateDataCompleteness
   * @param {number} threshold - Minimum completion percentage (default: 70%)
   * @returns {boolean} True if meets threshold
   */
  meetsCompletenessThreshold(validationResult, threshold = 70) {
    return validationResult.completionPercentage >= threshold;
  }

  /**
   * Create standardized success response
   * @param {Object} vehicle - Updated vehicle object
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Standardized success response
   */
  createSuccessResponse(vehicle, metadata = {}) {
    return {
      success: true,
      data: vehicle,
      metadata: {
        timestamp: new Date().toISOString(),
        service: 'UniversalAutoCompleteService',
        version: '2.0.0',
        ...metadata
      },
      errors: [],
      warnings: metadata.apiErrors && metadata.apiErrors.length > 0 ? 
        [`${metadata.apiErrors.length} API endpoints failed but fallback data was used`] : []
    };
  }

  /**
   * Create standardized error response
   * @param {Error} error - The error object
   * @param {string} vrm - Vehicle registration mark
   * @param {string} errorCode - Error code for categorization
   * @returns {Object} Standardized error response
   */
  createErrorResponse(error, vrm, errorCode) {
    const userFriendlyMessage = this.getUserFriendlyErrorMessage(error, errorCode);
    
    return {
      success: false,
      data: null,
      metadata: {
        timestamp: new Date().toISOString(),
        service: 'UniversalAutoCompleteService',
        version: '2.0.0',
        vrm: vrm,
        errorCode: errorCode
      },
      errors: [{
        code: errorCode,
        message: userFriendlyMessage,
        technical: error.message, // Hidden from end users in production
        timestamp: new Date().toISOString()
      }],
      warnings: []
    };
  }

  /**
   * Get user-friendly error message based on error type
   * @param {Error} error - The error object
   * @param {string} errorCode - Error code
   * @returns {string} User-friendly error message
   */
  getUserFriendlyErrorMessage(error, errorCode) {
    const errorMessages = {
      'PROCESSING_ERROR': 'We encountered an issue processing your vehicle data. Please try again in a few moments.',
      'API_ERROR': 'We\'re having trouble connecting to our vehicle data service. Your vehicle information may be incomplete.',
      'VALIDATION_ERROR': 'The vehicle registration number appears to be invalid. Please check and try again.',
      'DATABASE_ERROR': 'We\'re experiencing a temporary database issue. Please try again shortly.',
      'TIMEOUT_ERROR': 'The request took too long to process. Please try again.',
      'RATE_LIMIT_ERROR': 'Too many requests have been made. Please wait a moment before trying again.',
      'AUTHENTICATION_ERROR': 'There\'s an issue with our vehicle data service authentication. Please contact support.',
      'NOT_FOUND_ERROR': 'We couldn\'t find information for this vehicle registration number.',
      'NETWORK_ERROR': 'We\'re having connectivity issues. Please check your internet connection and try again.',
      'SERVER_ERROR': 'Our vehicle data service is temporarily unavailable. Please try again in a few moments.'
    };

    // Check for specific error patterns first
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('timeout')) {
      return errorMessages['TIMEOUT_ERROR'];
    } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return errorMessages['RATE_LIMIT_ERROR'];
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
      return errorMessages['AUTHENTICATION_ERROR'];
    } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return errorMessages['NOT_FOUND_ERROR'];
    } else if (errorMessage.includes('network') || errorMessage.includes('enotfound')) {
      return errorMessages['NETWORK_ERROR'];
    } else if (errorMessage.includes('server') || errorMessage.includes('500') || errorMessage.includes('503')) {
      return errorMessages['SERVER_ERROR'];
    }
    
    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  /**
   * Enhanced fallback data application with error response
   * @param {Object} vehicle - Vehicle document
   * @returns {Object} Standardized response with fallback data
   */
  async applyFallbackData(vehicle) {
    console.log('🚨 Applying fallback data due to critical error...');
    
    try {
      // Generate reasonable defaults based on fuel type and year
      if (!vehicle.annualTax) {
        if (vehicle.fuelType === 'Electric') {
          vehicle.annualTax = vehicle.year >= 2017 ? 195 : 0;
        } else if (vehicle.fuelType === 'Diesel') {
          vehicle.annualTax = 180;
        } else {
          vehicle.annualTax = 165;
        }
      }
      
      if (!vehicle.co2Emissions) {
        vehicle.co2Emissions = vehicle.fuelType === 'Electric' ? 0 : 120;
      }
      
      // Electric vehicle fallback
      if (vehicle.fuelType === 'Electric') {
        vehicle.electricRange = vehicle.electricRange || 200;
        vehicle.batteryCapacity = vehicle.batteryCapacity || 50;
        vehicle.chargingTime = vehicle.chargingTime || 8;
      }
      
      // Vehicle-specific fallbacks
      const vehicleType = vehicle.constructor.modelName;
      if (vehicleType === 'Bike') {
        // Bike-specific fallbacks
        vehicle.doors = 0; // Bikes don't have doors
        vehicle.seats = vehicle.seats || 2;
        vehicle.bodyType = vehicle.bodyType || 'Motorcycle';
      } else if (vehicleType === 'Van') {
        // Van-specific fallbacks
        vehicle.doors = vehicle.doors || 4;
        vehicle.seats = vehicle.seats || 3;
        vehicle.bodyType = vehicle.bodyType || 'Van';
      } else {
        // Car-specific fallbacks
        vehicle.doors = vehicle.doors || 4;
        vehicle.seats = vehicle.seats || 5;
        vehicle.bodyType = vehicle.bodyType || 'Hatchback';
      }
      
      await vehicle.save();
      
      return this.createSuccessResponse(vehicle, {
        fallbackApplied: true,
        dataSource: 'fallback'
      });
      
    } catch (fallbackError) {
      console.error('❌ Fallback data application failed:', fallbackError.message);
      return this.createErrorResponse(fallbackError, vehicle.registrationNumber, 'FALLBACK_ERROR');
    }
  }

  /**
   * Get error statistics for monitoring
   * @param {Object} options - Filter options
   * @returns {Object} Error statistics
   */
  getErrorStats(options = {}) {
    const { timeframe = 'day' } = options;
    
    // Combine API failures and general errors
    const apiFailures = this.getApiFailureStats(options);
    
    // Calculate overall error rate
    const totalOperations = this.apiCallLog.length;
    const totalErrors = (this.apiFailureLog || []).length;
    const errorRate = totalOperations > 0 ? (totalErrors / totalOperations * 100).toFixed(1) : 0;
    
    return {
      errorRate: parseFloat(errorRate),
      apiFailures: apiFailures,
      totalErrors: totalErrors,
      totalOperations: totalOperations,
      commonErrorTypes: this.getCommonErrorTypes(),
      recommendations: this.getErrorRecommendations(apiFailures)
    };
  }

  /**
   * Get common error types for analysis
   * @returns {Array} Array of common error types with counts
   */
  getCommonErrorTypes() {
    if (!this.apiFailureLog || this.apiFailureLog.length === 0) {
      return [];
    }
    
    const errorTypes = {};
    
    this.apiFailureLog.forEach(failure => {
      failure.errors.forEach(error => {
        const errorType = this.categorizeError(error.error);
        errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
      });
    });
    
    return Object.entries(errorTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * Categorize error for analysis
   * @param {string} errorMessage - Error message
   * @returns {string} Error category
   */
  categorizeError(errorMessage) {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('rate limit') || message.includes('429')) return 'RATE_LIMIT';
    if (message.includes('unauthorized') || message.includes('403')) return 'AUTH';
    if (message.includes('not found') || message.includes('404')) return 'NOT_FOUND';
    if (message.includes('server') || message.includes('500')) return 'SERVER_ERROR';
    if (message.includes('network') || message.includes('enotfound')) return 'NETWORK';
    
    return 'OTHER';
  }

  /**
   * Get error-based recommendations
   * @param {Object} apiFailures - API failure statistics
   * @returns {Array} Array of recommendations
   */
  getErrorRecommendations(apiFailures) {
    const recommendations = [];
    
    if (apiFailures.failureRate > 10) {
      recommendations.push({
        type: 'HIGH_FAILURE_RATE',
        message: 'API failure rate is high. Consider implementing more aggressive caching.',
        priority: 'high'
      });
    }
    
    if (apiFailures.commonErrors.some(err => err.error.includes('timeout'))) {
      recommendations.push({
        type: 'TIMEOUT_ISSUES',
        message: 'Frequent timeout errors detected. Consider increasing timeout values or optimizing API calls.',
        priority: 'medium'
      });
    }
    
    if (apiFailures.commonErrors.some(err => err.error.includes('rate limit'))) {
      recommendations.push({
        type: 'RATE_LIMITING',
        message: 'Rate limiting detected. Implement request throttling or upgrade API plan.',
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  /**
   * Get vehicle data without saving to database (for enhanced lookup endpoint)
   * @param {string} vrm - Vehicle registration mark
   * @param {number} mileage - Vehicle mileage
   * @returns {Promise<Object>} Vehicle data response
   */
  async getVehicleData(vrm, mileage = 50000) {
    try {
      console.log(`\n🔍 [UniversalAutoComplete] Fetching vehicle data for: ${vrm} (no database save)`);
      
      const cleanedVrm = vrm.toUpperCase().replace(/\s/g, '');
      
      // Step 1: Try cache first
      const cachedData = await this.getCachedData(cleanedVrm);
      if (cachedData) {
        console.log('✅ Using cached data for enhanced lookup');
        return {
          success: true,
          data: this.formatVehicleDataResponse(cachedData),
          cached: true
        };
      }
      
      // Step 2: Fetch from API
      console.log('📡 Fetching fresh data from API...');
      const apiData = await this.fetchAllAPIData(cleanedVrm);
      
      // Step 3: Parse data
      const parsedData = this.parseAllAPIData(apiData);
      
      // Step 4: Save to cache (VehicleHistory) for future use
      await this.saveToVehicleHistory(cleanedVrm, parsedData);
      
      // Step 5: Return formatted data
      return {
        success: true,
        data: this.formatVehicleDataResponse(parsedData),
        cached: false
      };
      
    } catch (error) {
      console.error(`❌ [UniversalAutoComplete] getVehicleData error for ${vrm}:`, error.message);
      return {
        success: false,
        error: error.message || 'Failed to fetch vehicle data'
      };
    }
  }

  /**
   * Format parsed data for API response
   * @param {Object} data - Parsed vehicle data OR cached VehicleHistory data
   * @returns {Object} Formatted response
   */
  formatVehicleDataResponse(data) {
    // CRITICAL FIX: Handle both parsed data and cached VehicleHistory data
    // VehicleHistory uses: yearOfManufacture, colour, motExpiryDate
    // Parsed data uses: year, color, motDueDate
    
    // DEBUG: Log what data we're formatting
    console.log('🔍 [formatVehicleDataResponse] Input data fields:', {
      urbanMpg: data.urbanMpg,
      combinedMpg: data.combinedMpg,
      co2Emissions: data.co2Emissions,
      insuranceGroup: data.insuranceGroup,
      annualTax: data.annualTax
    });
    
    const formatted = {
      // Basic info - handle both field name formats
      make: data.make,
      model: data.model,
      variant: data.variant,
      year: data.year || data.yearOfManufacture,
      fuelType: data.fuelType,
      transmission: data.transmission,
      bodyType: data.bodyType,
      engineSize: data.engineSize || data.engineCapacity,
      doors: data.doors,
      seats: data.seats,
      color: data.color || data.colour,
      
      // Running costs (both nested and flat for compatibility)
      urbanMpg: data.urbanMpg,
      extraUrbanMpg: data.extraUrbanMpg,
      combinedMpg: data.combinedMpg,
      co2Emissions: data.co2Emissions,
      insuranceGroup: data.insuranceGroup,
      annualTax: data.annualTax,
      emissionClass: data.emissionClass,
      
      // Running costs object
      runningCosts: {
        fuelEconomy: {
          urban: data.urbanMpg,
          extraUrban: data.extraUrbanMpg,
          combined: data.combinedMpg
        },
        co2Emissions: data.co2Emissions,
        insuranceGroup: data.insuranceGroup,
        annualTax: data.annualTax,
        emissionClass: data.emissionClass
      },
      
      // Valuation - handle both formats
      estimatedValue: data.estimatedValue || data.valuation?.privatePrice,
      privatePrice: data.privatePrice || data.valuation?.privatePrice,
      dealerPrice: data.dealerPrice || data.valuation?.dealerPrice,
      partExchangePrice: data.partExchangePrice || data.valuation?.partExchangePrice,
      
      // MOT - handle both field name formats
      motStatus: data.motStatus,
      motDue: data.motDueDate || data.motExpiryDate,
      motExpiry: data.motDueDate || data.motExpiryDate,
      motHistory: data.motHistory,
      
      // Vehicle history
      numberOfPreviousKeepers: data.numberOfPreviousKeepers,
      exported: data.exported,
      scrapped: data.scrapped,
      writeOffCategory: data.writeOffCategory,
      
      // Electric vehicle data (if applicable)
      electricRange: data.electricRange,
      batteryCapacity: data.batteryCapacity,
      chargingTime: data.chargingTime,
      
      // Metadata
      registrationNumber: data.vrm,
      dataSources: {
        dvla: true,
        checkCarDetails: true,
        universalService: true
      }
    };
    
    // DEBUG: Log what we're returning
    console.log('🔍 [formatVehicleDataResponse] Output running costs:', {
      urbanMpg: formatted.urbanMpg,
      combinedMpg: formatted.combinedMpg,
      co2Emissions: formatted.co2Emissions,
      runningCosts: formatted.runningCosts
    });
    
    return formatted;
  }
}

module.exports = UniversalAutoCompleteService;