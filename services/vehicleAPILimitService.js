/**
 * Vehicle API Limit Service
 * 
 * Ensures each vehicle only gets 4 API calls (one per endpoint):
 * 1. MOT History
 * 2. Valuation
 * 3. CheckCarDetails (History)
 * 4. Vehicle Specs
 * 
 * Prevents duplicate API calls for the same vehicle.
 */

const apiCache = require('./apiCacheService');
const APICallLog = require('../models/APICallLog');

class VehicleAPILimitService {
  constructor() {
    // Maximum API calls per vehicle per endpoint
    this.MAX_CALLS_PER_ENDPOINT = 1;
    
    // Allowed endpoints
    this.ALLOWED_ENDPOINTS = [
      'mothistory',
      'valuation', 
      'vehiclehistory',
      'vehiclespecs'
    ];
  }

  /**
   * Check if API call is allowed for this vehicle
   * @param {string} vrm - Vehicle registration mark
   * @param {string} endpoint - API endpoint name
   * @returns {Promise<Object>} { allowed: boolean, reason: string, existingData: Object }
   */
  async checkVehicleAPILimit(vrm, endpoint) {
    const cleanVrm = vrm.toUpperCase().replace(/\s/g, '');
    
    // Validate endpoint
    if (!this.ALLOWED_ENDPOINTS.includes(endpoint)) {
      return {
        allowed: false,
        reason: `Invalid endpoint: ${endpoint}. Allowed: ${this.ALLOWED_ENDPOINTS.join(', ')}`,
        existingData: null
      };
    }

    try {
      // Step 1: Check cache first (most important)
      console.log(`🔍 [Vehicle API Limit] Checking cache for ${endpoint} - ${cleanVrm}`);
      const cached = await apiCache.getCachedVehicleData(cleanVrm);
      
      if (cached) {
        console.log(`✅ [Vehicle API Limit] Cache HIT - Using cached data for ${cleanVrm}`);
        console.log(`   💰 API call NOT needed - data already available`);
        
        return {
          allowed: false, // Don't allow new API call
          reason: 'Data already cached',
          existingData: cached,
          source: 'cache'
        };
      }

      // Step 2: Check API call history
      console.log(`📊 [Vehicle API Limit] Checking API call history for ${endpoint} - ${cleanVrm}`);
      
      const existingCalls = await APICallLog.find({
        vrm: cleanVrm,
        endpoint: endpoint,
        success: true
      }).sort({ timestamp: -1 }).limit(1);

      if (existingCalls.length > 0) {
        const lastCall = existingCalls[0];
        const daysSinceCall = (Date.now() - lastCall.timestamp) / (1000 * 60 * 60 * 24);
        
        console.log(`⚠️  [Vehicle API Limit] API already called for ${endpoint} - ${cleanVrm}`);
        console.log(`   Last call: ${lastCall.timestamp.toISOString()}`);
        console.log(`   Days ago: ${Math.floor(daysSinceCall)}`);
        
        // Allow refresh after 30 days
        if (daysSinceCall < 30) {
          return {
            allowed: false,
            reason: `API already called for this vehicle (${Math.floor(daysSinceCall)} days ago)`,
            existingData: null,
            lastCall: lastCall.timestamp,
            source: 'api_log'
          };
        } else {
          console.log(`   ✅ Data is old (>30 days), allowing refresh`);
        }
      }

      // Step 3: Allow API call
      console.log(`✅ [Vehicle API Limit] API call ALLOWED for ${endpoint} - ${cleanVrm}`);
      
      return {
        allowed: true,
        reason: 'No existing data found',
        existingData: null
      };

    } catch (error) {
      console.error(`❌ [Vehicle API Limit] Error checking limit:`, error.message);
      
      // On error, allow the call (fail open)
      return {
        allowed: true,
        reason: 'Error checking limit - allowing call',
        existingData: null
      };
    }
  }

  /**
   * Get API call summary for a vehicle
   * @param {string} vrm - Vehicle registration mark
   * @returns {Promise<Object>} API call summary
   */
  async getVehicleAPISummary(vrm) {
    const cleanVrm = vrm.toUpperCase().replace(/\s/g, '');
    
    try {
      // Check cache
      const cached = await apiCache.getCachedVehicleData(cleanVrm);
      
      // Check API call history
      const apiCalls = await APICallLog.find({
        vrm: cleanVrm,
        success: true
      }).sort({ timestamp: -1 });

      // Group by endpoint
      const callsByEndpoint = {};
      for (const endpoint of this.ALLOWED_ENDPOINTS) {
        const calls = apiCalls.filter(c => c.endpoint === endpoint);
        callsByEndpoint[endpoint] = {
          called: calls.length > 0,
          lastCall: calls.length > 0 ? calls[0].timestamp : null,
          totalCalls: calls.length,
          totalCost: calls.reduce((sum, c) => sum + c.cost, 0)
        };
      }

      const totalCalls = apiCalls.length;
      const totalCost = apiCalls.reduce((sum, c) => sum + c.cost, 0);

      return {
        vrm: cleanVrm,
        hasCachedData: !!cached,
        totalAPICalls: totalCalls,
        totalCost: Math.round(totalCost * 100) / 100,
        callsByEndpoint,
        recommendation: cached 
          ? 'Use cached data - no API calls needed'
          : `${4 - totalCalls} API calls remaining`
      };

    } catch (error) {
      console.error(`❌ [Vehicle API Limit] Error getting summary:`, error.message);
      return null;
    }
  }

  /**
   * Get all vehicles with API call counts
   * @param {number} limit - Maximum number of vehicles to return
   * @returns {Promise<Array>} Vehicle API statistics
   */
  async getAllVehicleAPIStats(limit = 100) {
    try {
      const pipeline = [
        {
          $group: {
            _id: '$vrm',
            totalCalls: { $sum: 1 },
            totalCost: { $sum: '$cost' },
            endpoints: { $addToSet: '$endpoint' },
            lastCall: { $max: '$timestamp' }
          }
        },
        {
          $sort: { totalCalls: -1 }
        },
        {
          $limit: limit
        }
      ];

      const results = await APICallLog.aggregate(pipeline);

      return results.map(r => ({
        vrm: r._id,
        totalCalls: r.totalCalls,
        totalCost: Math.round(r.totalCost * 100) / 100,
        endpointsCalled: r.endpoints,
        lastCall: r.lastCall,
        status: r.totalCalls > 4 ? '⚠️ Over limit' : '✅ Within limit'
      }));

    } catch (error) {
      console.error(`❌ [Vehicle API Limit] Error getting stats:`, error.message);
      return [];
    }
  }

  /**
   * Find vehicles with excessive API calls
   * @param {number} threshold - Call threshold (default: 4)
   * @returns {Promise<Array>} Vehicles over threshold
   */
  async findExcessiveAPICalls(threshold = 4) {
    try {
      const pipeline = [
        {
          $group: {
            _id: '$vrm',
            totalCalls: { $sum: 1 },
            totalCost: { $sum: '$cost' },
            endpoints: { $push: '$endpoint' }
          }
        },
        {
          $match: {
            totalCalls: { $gt: threshold }
          }
        },
        {
          $sort: { totalCalls: -1 }
        }
      ];

      const results = await APICallLog.aggregate(pipeline);

      if (results.length > 0) {
        console.log(`🚨 [Vehicle API Limit] Found ${results.length} vehicles with excessive API calls`);
        results.forEach(r => {
          console.log(`   ${r._id}: ${r.totalCalls} calls (£${r.totalCost.toFixed(2)})`);
        });
      }

      return results;

    } catch (error) {
      console.error(`❌ [Vehicle API Limit] Error finding excessive calls:`, error.message);
      return [];
    }
  }

  /**
   * Generate vehicle API report
   * @param {string} vrm - Vehicle registration mark
   * @returns {Promise<string>} Formatted report
   */
  async generateVehicleReport(vrm) {
    const summary = await this.getVehicleAPISummary(vrm);
    
    if (!summary) {
      return `Unable to generate report for ${vrm}`;
    }

    let report = `\n📊 Vehicle API Report: ${summary.vrm}\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    report += `💾 Cached Data: ${summary.hasCachedData ? '✅ Yes' : '❌ No'}\n`;
    report += `📞 Total API Calls: ${summary.totalAPICalls}\n`;
    report += `💰 Total Cost: £${summary.totalCost.toFixed(2)}\n\n`;
    
    report += `API Calls by Endpoint:\n`;
    for (const [endpoint, data] of Object.entries(summary.callsByEndpoint)) {
      const status = data.called ? '✅' : '⭕';
      const lastCall = data.lastCall ? new Date(data.lastCall).toLocaleDateString() : 'Never';
      report += `  ${status} ${endpoint}: ${data.totalCalls} calls (£${data.totalCost.toFixed(2)}) - Last: ${lastCall}\n`;
    }
    
    report += `\n💡 ${summary.recommendation}\n`;
    
    return report;
  }
}

module.exports = new VehicleAPILimitService();
