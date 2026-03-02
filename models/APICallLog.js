/**
 * API Call Log Model
 * 
 * Tracks every paid API call for auditing and cost analysis.
 * Provides visibility into API usage patterns and costs.
 */

const mongoose = require('mongoose');

const apiCallLogSchema = new mongoose.Schema({
  // API Details
  endpoint: {
    type: String,
    required: true,
    enum: ['dvla', 'vehiclespecs', 'mothistory', 'valuation', 'vehiclehistory'],
    index: true
  },
  
  // Vehicle Details
  vrm: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  
  // Cost Tracking
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Request Details
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeDealer',
    index: true
  },
  
  // Response Details
  success: {
    type: Boolean,
    required: true,
    default: true
  },
  
  errorMessage: {
    type: String
  },
  
  responseTime: {
    type: Number, // milliseconds
    min: 0
  },
  
  // Cache Status
  cacheHit: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  ipAddress: {
    type: String
  },
  
  userAgent: {
    type: String
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
apiCallLogSchema.index({ timestamp: -1 });
apiCallLogSchema.index({ endpoint: 1, timestamp: -1 });
apiCallLogSchema.index({ userId: 1, timestamp: -1 });
apiCallLogSchema.index({ vrm: 1, timestamp: -1 });
apiCallLogSchema.index({ success: 1, timestamp: -1 });

// Static method to get cost summary
apiCallLogSchema.statics.getCostSummary = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$endpoint',
        totalCost: { $sum: '$cost' },
        totalCalls: { $sum: 1 },
        successfulCalls: {
          $sum: { $cond: ['$success', 1, 0] }
        },
        failedCalls: {
          $sum: { $cond: ['$success', 0, 1] }
        },
        cacheHits: {
          $sum: { $cond: ['$cacheHit', 1, 0] }
        },
        avgResponseTime: { $avg: '$responseTime' }
      }
    },
    {
      $sort: { totalCost: -1 }
    }
  ];
  
  const results = await this.aggregate(pipeline);
  
  const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);
  const totalCalls = results.reduce((sum, r) => sum + r.totalCalls, 0);
  
  return {
    period: {
      start: startDate,
      end: endDate
    },
    summary: {
      totalCost: Math.round(totalCost * 100) / 100,
      totalCalls,
      byEndpoint: results
    }
  };
};

// Static method to get daily costs
apiCallLogSchema.statics.getDailyCosts = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const pipeline = [
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
        },
        totalCost: { $sum: '$cost' },
        totalCalls: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method to get user costs
apiCallLogSchema.statics.getUserCosts = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$endpoint',
        totalCost: { $sum: '$cost' },
        totalCalls: { $sum: 1 }
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('APICallLog', apiCallLogSchema);
