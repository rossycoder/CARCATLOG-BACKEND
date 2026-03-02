/**
 * API Audit Service
 * 
 * Logs every API call with cost tracking for financial visibility.
 * Provides cost analysis and usage reports.
 */

const APICallLog = require('../models/APICallLog');

class APIAuditService {
  constructor() {
    // API costs (in GBP)
    this.API_COSTS = {
      dvla: 0.00, // Free government API
      vehiclespecs: 0.05,
      mothistory: 0.02,
      valuation: 0.12,
      vehiclehistory: 1.82
    };
  }

  /**
   * Log an API call
   * @param {Object} params - Call parameters
   * @returns {Promise<Object>} Log entry
   */
  async logCall({
    endpoint,
    vrm,
    userId = null,
    dealerId = null,
    success = true,
    errorMessage = null,
    responseTime = null,
    cacheHit = false,
    ipAddress = null,
    userAgent = null
  }) {
    try {
      const cost = cacheHit ? 0 : (this.API_COSTS[endpoint] || 0);
      
      const logEntry = await APICallLog.create({
        endpoint,
        vrm: vrm.toUpperCase().replace(/\s/g, ''),
        cost,
        userId,
        dealerId,
        success,
        errorMessage,
        responseTime,
        cacheHit,
        ipAddress,
        userAgent,
        timestamp: new Date()
      });
      
      if (cacheHit) {
        console.log(`📊 [Audit] Cache hit for ${endpoint} - ${vrm} (£0.00)`);
      } else {
        console.log(`📊 [Audit] API call logged: ${endpoint} - ${vrm} (£${cost.toFixed(2)})`);
      }
      
      return logEntry;
    } catch (error) {
      console.error(`❌ [Audit] Error logging API call:`, error.message);
      // Don't throw - logging failure shouldn't break the app
      return null;
    }
  }

  /**
   * Get cost summary for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Cost summary
   */
  async getCostSummary(startDate, endDate) {
    try {
      return await APICallLog.getCostSummary(startDate, endDate);
    } catch (error) {
      console.error(`❌ [Audit] Error getting cost summary:`, error.message);
      return null;
    }
  }

  /**
   * Get daily costs for the last N days
   * @param {number} days - Number of days
   * @returns {Promise<Array>} Daily costs
   */
  async getDailyCosts(days = 30) {
    try {
      return await APICallLog.getDailyCosts(days);
    } catch (error) {
      console.error(`❌ [Audit] Error getting daily costs:`, error.message);
      return [];
    }
  }

  /**
   * Get costs for a specific user
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} User costs
   */
  async getUserCosts(userId, startDate, endDate) {
    try {
      return await APICallLog.getUserCosts(userId, startDate, endDate);
    } catch (error) {
      console.error(`❌ [Audit] Error getting user costs:`, error.message);
      return [];
    }
  }

  /**
   * Get today's costs
   * @returns {Promise<Object>} Today's cost summary
   */
  async getTodayCosts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await this.getCostSummary(today, tomorrow);
  }

  /**
   * Get this month's costs
   * @returns {Promise<Object>} This month's cost summary
   */
  async getMonthCosts() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    return await this.getCostSummary(startOfMonth, endOfMonth);
  }

  /**
   * Get cache hit rate
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheHitRate(startDate, endDate) {
    try {
      const totalCalls = await APICallLog.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate }
      });
      
      const cacheHits = await APICallLog.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate },
        cacheHit: true
      });
      
      const hitRate = totalCalls > 0 ? (cacheHits / totalCalls) * 100 : 0;
      
      return {
        totalCalls,
        cacheHits,
        cacheMisses: totalCalls - cacheHits,
        hitRate: Math.round(hitRate * 100) / 100
      };
    } catch (error) {
      console.error(`❌ [Audit] Error getting cache hit rate:`, error.message);
      return null;
    }
  }

  /**
   * Alert if costs exceed threshold
   * @param {number} threshold - Cost threshold in GBP
   * @returns {Promise<boolean>} True if threshold exceeded
   */
  async checkCostThreshold(threshold = 100) {
    try {
      const monthCosts = await this.getMonthCosts();
      
      if (monthCosts && monthCosts.summary.totalCost > threshold) {
        console.log(`🚨 [Audit] COST ALERT: Monthly costs (£${monthCosts.summary.totalCost}) exceed threshold (£${threshold})`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ [Audit] Error checking cost threshold:`, error.message);
      return false;
    }
  }

  /**
   * Generate cost report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<string>} Formatted report
   */
  async generateReport(startDate, endDate) {
    try {
      const summary = await this.getCostSummary(startDate, endDate);
      const cacheStats = await this.getCacheHitRate(startDate, endDate);
      
      if (!summary || !cacheStats) {
        return 'Unable to generate report';
      }
      
      let report = `\n📊 API Cost Report\n`;
      report += `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\n\n`;
      report += `💰 Total Cost: £${summary.summary.totalCost.toFixed(2)}\n`;
      report += `📞 Total Calls: ${summary.summary.totalCalls}\n`;
      report += `📦 Cache Hit Rate: ${cacheStats.hitRate}%\n`;
      report += `💾 Cache Hits: ${cacheStats.cacheHits}\n`;
      report += `💸 Cache Misses: ${cacheStats.cacheMisses}\n\n`;
      
      report += `By Endpoint:\n`;
      for (const endpoint of summary.summary.byEndpoint) {
        report += `  ${endpoint._id}: £${endpoint.totalCost.toFixed(2)} (${endpoint.totalCalls} calls)\n`;
      }
      
      return report;
    } catch (error) {
      console.error(`❌ [Audit] Error generating report:`, error.message);
      return 'Error generating report';
    }
  }
}

module.exports = new APIAuditService();
