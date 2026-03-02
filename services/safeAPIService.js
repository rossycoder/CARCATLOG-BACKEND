/**
 * Safe API Service
 * 
 * Wrapper service that combines caching, rate limiting, and audit logging.
 * Use this service for ALL external API calls to ensure cost control.
 * 
 * Usage:
 *   const safeAPI = require('../services/safeAPIService');
 *   const data = await safeAPI.call('vehiclespecs', vrm, userId, async () => {
 *     return await expensiveAPICall(vrm);
 *   });
 */

const apiCache = require('./apiCacheService');
const rateLimiter = require('./apiRateLimiter');
const auditService = require('./apiAuditService');
const vehicleAPILimit = require('./vehicleAPILimitService');

class SafeAPIService {
  /**
   * Make a safe API call with caching, rate limiting, and audit logging
   * 
   * @param {string} endpoint - API endpoint name (vehiclespecs, mothistory, valuation, vehiclehistory)
   * @param {string} vrm - Vehicle registration mark
   * @param {string} userId - User ID (optional)
   * @param {Function} apiCallFn - Async function that makes the actual API call
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response data
   */
  async call(endpoint, vrm, userId, apiCallFn, options = {}) {
    const startTime = Date.now();
    const cleanVrm = vrm.toUpperCase().replace(/\s/g, '');
    
    try {
      // Step 1: Check vehicle API limit (most important - prevents duplicate calls)
      console.log(`🔍 [Safe API] Checking vehicle API limit for ${endpoint} - ${cleanVrm}`);
      const limitCheck = await vehicleAPILimit.checkVehicleAPILimit(cleanVrm, endpoint);
      
      if (!limitCheck.allowed && limitCheck.existingData) {
        const responseTime = Date.now() - startTime;
        
        // Log cache hit
        await auditService.logCall({
          endpoint,
          vrm: cleanVrm,
          userId,
          success: true,
          responseTime,
          cacheHit: true
        });
        
        console.log(`✅ [Safe API] Using existing data for ${endpoint} - ${cleanVrm} (${responseTime}ms)`);
        console.log(`   💰 Saved API call cost! Source: ${limitCheck.source}`);
        console.log(`   Reason: ${limitCheck.reason}`);
        
        return {
          success: true,
          data: limitCheck.existingData,
          cached: true,
          source: limitCheck.source,
          responseTime
        };
      }
      
      if (!limitCheck.allowed && !limitCheck.existingData) {
        console.log(`🚫 [Safe API] API call blocked for ${endpoint} - ${cleanVrm}`);
        console.log(`   Reason: ${limitCheck.reason}`);
        
        throw new Error(`VEHICLE_API_LIMIT: ${limitCheck.reason}`);
      }
      
      console.log(`✅ [Safe API] Vehicle API limit check passed for ${endpoint} - ${cleanVrm}`);
      
      // Step 2: Check rate limit
      const rateCheck = rateLimiter.checkLimit(endpoint, userId);
      if (!rateCheck.allowed) {
        console.log(`🚫 [Safe API] Rate limit exceeded for ${endpoint}`);
        
        // Log rate limit hit
        await auditService.logCall({
          endpoint,
          vrm: cleanVrm,
          userId,
          success: false,
          errorMessage: rateCheck.reason,
          responseTime: Date.now() - startTime,
          cacheHit: false
        });
        
        throw new Error(`RATE_LIMIT_EXCEEDED: ${rateCheck.reason}`);
      }
      
      // Step 3: Make API call
      console.log(`📞 [Safe API] Making API call to ${endpoint} for ${cleanVrm}...`);
      const data = await apiCallFn();
      const responseTime = Date.now() - startTime;
      
      // Step 4: Cache the result
      if (!options.skipCache) {
        await apiCache.cacheVehicleData(cleanVrm, data);
        console.log(`💾 [Safe API] Cached result for ${cleanVrm} (valid for 30 days)`);
      }
      
      // Step 5: Record rate limit
      rateLimiter.recordCall(endpoint, userId);
      
      // Step 6: Log the call
      await auditService.logCall({
        endpoint,
        vrm: cleanVrm,
        userId,
        success: true,
        responseTime,
        cacheHit: false
      });
      
      console.log(`✅ [Safe API] API call successful for ${endpoint} - ${cleanVrm} (${responseTime}ms)`);
      
      return {
        success: true,
        data,
        cached: false,
        responseTime
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log failed call
      await auditService.logCall({
        endpoint,
        vrm: cleanVrm,
        userId,
        success: false,
        errorMessage: error.message,
        responseTime,
        cacheHit: false
      });
      
      console.error(`❌ [Safe API] API call failed for ${endpoint} - ${cleanVrm}:`, error.message);
      
      throw error;
    }
  }

  /**
   * Make multiple API calls in parallel with safety checks
   * 
   * @param {Array} calls - Array of call configurations
   * @returns {Promise<Array>} Array of results
   */
  async callMultiple(calls) {
    const promises = calls.map(call => 
      this.call(call.endpoint, call.vrm, call.userId, call.apiCallFn, call.options)
        .catch(error => ({
          success: false,
          error: error.message,
          endpoint: call.endpoint
        }))
    );
    
    return await Promise.all(promises);
  }

  /**
   * Get current API usage stats
   * @returns {Object} Usage statistics
   */
  async getUsageStats() {
    const cacheStats = await apiCache.getCacheStats();
    const rateLimitStats = rateLimiter.getStats();
    const todayCosts = await auditService.getTodayCosts();
    const monthCosts = await auditService.getMonthCosts();
    
    return {
      cache: cacheStats,
      rateLimit: rateLimitStats,
      costs: {
        today: todayCosts?.summary?.totalCost || 0,
        month: monthCosts?.summary?.totalCost || 0
      }
    };
  }

  /**
   * Check if it's safe to make an API call
   * @param {string} endpoint - API endpoint
   * @param {string} vrm - Vehicle registration
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Safety check result
   */
  async checkSafety(endpoint, vrm, userId) {
    const cleanVrm = vrm.toUpperCase().replace(/\s/g, '');
    
    // Check vehicle API limit
    const limitCheck = await vehicleAPILimit.checkVehicleAPILimit(cleanVrm, endpoint);
    
    // Check rate limit
    const rateCheck = rateLimiter.checkLimit(endpoint, userId);
    
    // Check monthly costs
    const monthCosts = await auditService.getMonthCosts();
    const monthlyCost = monthCosts?.summary?.totalCost || 0;
    const costThreshold = 100; // £100/month threshold
    const approachingLimit = monthlyCost > costThreshold * 0.8;
    
    return {
      safe: limitCheck.allowed && rateCheck.allowed,
      vehicleLimitOk: limitCheck.allowed,
      vehicleLimitReason: limitCheck.reason,
      hasExistingData: !!limitCheck.existingData,
      rateLimitOk: rateCheck.allowed,
      rateLimitReason: rateCheck.reason,
      monthlyCost,
      approachingLimit,
      recommendation: !limitCheck.allowed && limitCheck.existingData
        ? 'Use existing data (free)'
        : !limitCheck.allowed
          ? `Vehicle API limit: ${limitCheck.reason}`
          : rateCheck.allowed 
            ? 'API call allowed'
            : `Rate limit exceeded: ${rateCheck.reason}`
    };
  }

  /**
   * Get vehicle API summary
   * @param {string} vrm - Vehicle registration
   * @returns {Promise<Object>} Vehicle API summary
   */
  async getVehicleSummary(vrm) {
    return await vehicleAPILimit.getVehicleAPISummary(vrm);
  }

  /**
   * Generate vehicle API report
   * @param {string} vrm - Vehicle registration
   * @returns {Promise<string>} Formatted report
   */
  async generateVehicleReport(vrm) {
    return await vehicleAPILimit.generateVehicleReport(vrm);
  }
}

module.exports = new SafeAPIService();
