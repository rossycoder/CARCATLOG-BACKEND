/**
 * API Rate Limiter Service
 * 
 * Prevents API abuse and excessive costs by limiting calls per endpoint.
 * Uses in-memory storage with sliding window algorithm.
 * 
 * Limits:
 * - 10 calls per minute per endpoint
 * - 100 calls per hour per user
 * - 1000 calls per day globally
 */

class APIRateLimiter {
  constructor() {
    // In-memory storage for rate limiting
    this.endpointCalls = new Map(); // endpoint -> [timestamps]
    this.userCalls = new Map(); // userId -> [timestamps]
    this.globalCalls = []; // [timestamps]
    
    // Limits
    this.ENDPOINT_LIMIT = 10; // calls per minute
    this.ENDPOINT_WINDOW = 60 * 1000; // 1 minute
    
    this.USER_LIMIT = 100; // calls per hour
    this.USER_WINDOW = 60 * 60 * 1000; // 1 hour
    
    this.GLOBAL_LIMIT = 1000; // calls per day
    this.GLOBAL_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
    
    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if API call is allowed
   * @param {string} endpoint - API endpoint name
   * @param {string} userId - User ID (optional)
   * @returns {Object} { allowed: boolean, reason: string, retryAfter: number }
   */
  checkLimit(endpoint, userId = null) {
    const now = Date.now();
    
    // Check endpoint limit
    const endpointKey = endpoint.toLowerCase();
    const endpointCalls = this.endpointCalls.get(endpointKey) || [];
    const recentEndpointCalls = endpointCalls.filter(t => now - t < this.ENDPOINT_WINDOW);
    
    if (recentEndpointCalls.length >= this.ENDPOINT_LIMIT) {
      const oldestCall = Math.min(...recentEndpointCalls);
      const retryAfter = Math.ceil((oldestCall + this.ENDPOINT_WINDOW - now) / 1000);
      
      console.log(`🚫 [Rate Limit] Endpoint limit exceeded for ${endpoint}`);
      console.log(`   ${recentEndpointCalls.length}/${this.ENDPOINT_LIMIT} calls in last minute`);
      console.log(`   Retry after ${retryAfter} seconds`);
      
      return {
        allowed: false,
        reason: `Endpoint rate limit exceeded (${this.ENDPOINT_LIMIT} calls/min)`,
        retryAfter
      };
    }
    
    // Check user limit (if userId provided)
    if (userId) {
      const userCalls = this.userCalls.get(userId) || [];
      const recentUserCalls = userCalls.filter(t => now - t < this.USER_WINDOW);
      
      if (recentUserCalls.length >= this.USER_LIMIT) {
        const oldestCall = Math.min(...recentUserCalls);
        const retryAfter = Math.ceil((oldestCall + this.USER_WINDOW - now) / 1000);
        
        console.log(`🚫 [Rate Limit] User limit exceeded for ${userId}`);
        console.log(`   ${recentUserCalls.length}/${this.USER_LIMIT} calls in last hour`);
        
        return {
          allowed: false,
          reason: `User rate limit exceeded (${this.USER_LIMIT} calls/hour)`,
          retryAfter
        };
      }
    }
    
    // Check global limit
    const recentGlobalCalls = this.globalCalls.filter(t => now - t < this.GLOBAL_WINDOW);
    
    if (recentGlobalCalls.length >= this.GLOBAL_LIMIT) {
      const oldestCall = Math.min(...recentGlobalCalls);
      const retryAfter = Math.ceil((oldestCall + this.GLOBAL_WINDOW - now) / 1000);
      
      console.log(`🚫 [Rate Limit] Global limit exceeded`);
      console.log(`   ${recentGlobalCalls.length}/${this.GLOBAL_LIMIT} calls in last 24 hours`);
      
      return {
        allowed: false,
        reason: `Global rate limit exceeded (${this.GLOBAL_LIMIT} calls/day)`,
        retryAfter
      };
    }
    
    return { allowed: true };
  }

  /**
   * Record an API call
   * @param {string} endpoint - API endpoint name
   * @param {string} userId - User ID (optional)
   */
  recordCall(endpoint, userId = null) {
    const now = Date.now();
    
    // Record endpoint call
    const endpointKey = endpoint.toLowerCase();
    const endpointCalls = this.endpointCalls.get(endpointKey) || [];
    endpointCalls.push(now);
    this.endpointCalls.set(endpointKey, endpointCalls);
    
    // Record user call
    if (userId) {
      const userCalls = this.userCalls.get(userId) || [];
      userCalls.push(now);
      this.userCalls.set(userId, userCalls);
    }
    
    // Record global call
    this.globalCalls.push(now);
    
    console.log(`✅ [Rate Limit] Recorded call to ${endpoint}`);
  }

  /**
   * Cleanup old entries to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    
    // Cleanup endpoint calls
    for (const [endpoint, calls] of this.endpointCalls.entries()) {
      const recentCalls = calls.filter(t => now - t < this.ENDPOINT_WINDOW);
      if (recentCalls.length === 0) {
        this.endpointCalls.delete(endpoint);
      } else {
        this.endpointCalls.set(endpoint, recentCalls);
      }
    }
    
    // Cleanup user calls
    for (const [userId, calls] of this.userCalls.entries()) {
      const recentCalls = calls.filter(t => now - t < this.USER_WINDOW);
      if (recentCalls.length === 0) {
        this.userCalls.delete(userId);
      } else {
        this.userCalls.set(userId, recentCalls);
      }
    }
    
    // Cleanup global calls
    this.globalCalls = this.globalCalls.filter(t => now - t < this.GLOBAL_WINDOW);
    
    console.log(`🧹 [Rate Limit] Cleanup complete`);
    console.log(`   Endpoints tracked: ${this.endpointCalls.size}`);
    console.log(`   Users tracked: ${this.userCalls.size}`);
    console.log(`   Global calls (24h): ${this.globalCalls.length}`);
  }

  /**
   * Get current rate limit stats
   * @returns {Object} Rate limit statistics
   */
  getStats() {
    const now = Date.now();
    
    const endpointStats = {};
    for (const [endpoint, calls] of this.endpointCalls.entries()) {
      const recentCalls = calls.filter(t => now - t < this.ENDPOINT_WINDOW);
      endpointStats[endpoint] = {
        calls: recentCalls.length,
        limit: this.ENDPOINT_LIMIT,
        remaining: Math.max(0, this.ENDPOINT_LIMIT - recentCalls.length)
      };
    }
    
    const recentGlobalCalls = this.globalCalls.filter(t => now - t < this.GLOBAL_WINDOW);
    
    return {
      endpoints: endpointStats,
      global: {
        calls: recentGlobalCalls.length,
        limit: this.GLOBAL_LIMIT,
        remaining: Math.max(0, this.GLOBAL_LIMIT - recentGlobalCalls.length)
      }
    };
  }

  /**
   * Reset all rate limits (for testing only)
   */
  reset() {
    this.endpointCalls.clear();
    this.userCalls.clear();
    this.globalCalls = [];
    console.log(`🔄 [Rate Limit] All limits reset`);
  }
}

module.exports = new APIRateLimiter();
