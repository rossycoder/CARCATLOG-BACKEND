const mongoose = require('mongoose');

const vehicleHistorySchema = new mongoose.Schema({
  vrm: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  checkDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  hasAccidentHistory: {
    type: Boolean,
    required: true,
    default: false,
  },
  accidentDetails: {
    count: {
      type: Number,
      default: 0,
    },
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe', 'unknown'],
      default: 'unknown',
    },
    dates: [{
      type: Date,
    }],
  },
  isStolen: {
    type: Boolean,
    required: true,
    default: false,
  },
  stolenDetails: {
    reportedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'recovered'],
      default: 'active',
    },
  },
  isScrapped: {
    type: Boolean,
    default: false,
  },
  isImported: {
    type: Boolean,
    default: false,
  },
  isExported: {
    type: Boolean,
    default: false,
  },
  isWrittenOff: {
    type: Boolean,
    default: false,
  },
  previousOwners: {
    type: Number,
    default: 0,
  },
  numberOfOwners: {
    type: Number,
    default: 0,
  },
  numberOfKeys: {
    type: Number,
    default: 1,
  },
  keys: {
    type: Number,
    default: 1,
  },
  serviceHistory: {
    type: String,
    default: 'Contact seller',
  },
  motStatus: {
    type: String,
    trim: true,
  },
  motExpiryDate: {
    type: Date,
  },
  hasOutstandingFinance: {
    type: Boolean,
    required: true,
    default: false,
  },
  financeDetails: {
    amount: {
      type: Number,
      default: 0,
    },
    lender: {
      type: String,
      default: 'Unknown',
    },
    type: {
      type: String,
      enum: ['hp', 'pcp', 'lease', 'loan', 'unknown'],
      default: 'unknown',
    },
  },
  checkStatus: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    required: true,
    default: 'success',
  },
  apiProvider: {
    type: String,
    default: 'unknown',
  },
  testMode: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound index for efficient VRM + date queries
vehicleHistorySchema.index({ vrm: 1, checkDate: -1 });

// Method to get the most recent check for a VRM
vehicleHistorySchema.statics.getMostRecent = async function(vrm) {
  return this.findOne({ vrm: vrm.toUpperCase() })
    .sort({ checkDate: -1 })
    .exec();
};

// Method to check if a recent check exists (within last 30 days)
vehicleHistorySchema.statics.hasRecentCheck = async function(vrm, daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const recentCheck = await this.findOne({
    vrm: vrm.toUpperCase(),
    checkDate: { $gte: cutoffDate },
  }).exec();
  
  return recentCheck !== null;
};

const VehicleHistory = mongoose.model('VehicleHistory', vehicleHistorySchema);

module.exports = VehicleHistory;
