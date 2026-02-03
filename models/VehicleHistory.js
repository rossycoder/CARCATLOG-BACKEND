const mongoose = require('mongoose');

const vehicleHistorySchema = new mongoose.Schema({
  vrm: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  make: {
    type: String,
    trim: true,
  },
  model: {
    type: String,
    trim: true,
  },
  colour: {
    type: String,
    trim: true,
  },
  fuelType: {
    type: String,
    trim: true,
  },
  yearOfManufacture: {
    type: Number,
  },
  firstRegistered: {
    type: Date,
  },
  engineCapacity: {
    type: Number,
  },
  bodyType: {
    type: String,
    trim: true,
  },
  transmission: {
    type: String,
    trim: true,
  },
  vin: {
    type: String,
    trim: true,
  },
  engineNumber: {
    type: String,
    trim: true,
  },
  co2Emissions: {
    type: Number,
  },
  // Running Costs Data
  urbanMpg: {
    type: Number,
  },
  extraUrbanMpg: {
    type: Number,
  },
  combinedMpg: {
    type: Number,
  },
  annualTax: {
    type: Number,
  },
  insuranceGroup: {
    type: String,
  },
  // Additional vehicle specs
  doors: {
    type: Number,
  },
  seats: {
    type: Number,
  },
  variant: {
    type: String,
    trim: true,
  },
  gearbox: {
    type: Number,
  },
  emissionClass: {
    type: String,
    trim: true,
  },
  numberOfPreviousKeepers: {
    type: Number,
    default: 0,
  },
  plateChanges: {
    type: Number,
    default: 0,
  },
  plateChangesList: [{
    date: Date,
    previousVrm: String,
    newVrm: String
  }],
  colourChanges: {
    type: Number,
    default: 0,
  },
  colourChangesList: [{
    date: Date,
    previousColour: String,
    newColour: String
  }],
  colourChangeDetails: {
    currentColour: String,
    originalColour: String,
    numberOfPreviousColours: Number,
    lastColour: String,
    dateOfLastColourChange: Date
  },
  v5cCertificateCount: {
    type: Number,
    default: 0,
  },
  v5cCertificateList: [{
    certificateDate: Date
  }],
  keeperChangesList: [{
    dateOfTransaction: Date,
    numberOfPreviousKeepers: Number,
    dateOfLastKeeperChange: Date
  }],
  vicCount: {
    type: Number,
    default: 0,
  },
  exported: {
    type: Boolean,
    default: false,
  },
  scrapped: {
    type: Boolean,
    default: false,
  },
  imported: {
    type: Boolean,
    default: false,
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
      enum: ['A', 'B', 'C', 'D', 'S', 'N', 'minor', 'moderate', 'severe', 'unknown'],
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
  writeOffCategory: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'S', 'N', 'none', 'unknown'],
    default: 'none',
  },
  writeOffDetails: {
    category: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'S', 'N', 'none', 'unknown'],
      default: 'none',
    },
    date: {
      type: Date,
    },
    description: {
      type: String,
    },
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
  // Complete MOT History from API
  motHistory: [{
    testDate: Date,
    expiryDate: Date,
    testResult: {
      type: String,
      enum: ['PASSED', 'FAILED', 'REFUSED']
    },
    odometerValue: Number,
    odometerUnit: {
      type: String,
      default: 'mi'
    },
    testNumber: String,
    testCertificateNumber: String,
    defects: [{
      type: {
        type: String,
        enum: ['ADVISORY', 'MINOR', 'MAJOR', 'DANGEROUS', 'FAIL', 'PRS', 'USER ENTERED']
      },
      text: String,
      dangerous: Boolean
    }],
    advisoryText: [String],
    testClass: String,
    testType: String,
    completedDate: Date,
    testStation: {
      name: String,
      number: String,
      address: String,
      postcode: String
    }
  }],
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
  // CRITICAL FIX: Add valuation data storage
  valuation: {
    privatePrice: {
      type: Number,
    },
    dealerPrice: {
      type: Number,
    },
    partExchangePrice: {
      type: Number,
    },
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    estimatedValue: {
      private: Number,
      retail: Number,
      trade: Number,
    },
  },
  mileage: {
    type: Number,
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
