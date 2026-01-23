const mongoose = require('mongoose');
const vehicleDataNormalizer = require('../utils/vehicleDataNormalizer');

const carSchema = new mongoose.Schema({
  make: {
    type: String,
    required: function() {
      // Make is required unless it's from CheckCarDetails API (will be fetched)
      return this.dataSource !== 'DVLA' || this.dataSources?.checkCarDetails === true;
    },
    trim: true,
    index: true
  },
  model: {
    type: String,
    required: function() {
      // Model is required unless it's from CheckCarDetails API (will be fetched)
      return this.dataSource !== 'DVLA' || this.dataSources?.checkCarDetails === true;
    },
    trim: true,
    index: true
  },
  submodel: {
    type: String,
    trim: true,
    index: true
  },
  variant: {
    type: String,
    trim: true,
    index: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1900, 'Year must be 1900 or later'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  price: {
    type: Number,
    required: function() {
      return this.dataSource !== 'DVLA';
    },
    min: [0, 'Price must be positive']
  },
  mileage: {
    type: Number,
    required: [true, 'Mileage is required'],
    min: [0, 'Mileage must be positive']
  },
  color: {
    type: String,
    required: function() {
      // Color is required for manual entries, but can be fetched from API
      return this.dataSource === 'manual' && !this.dataSources?.checkCarDetails;
    },
    trim: true
  },
  transmission: {
    type: String,
    required: function() {
      // Transmission is required for manual entries, but can be fetched from API
      return this.dataSource === 'manual' && !this.dataSources?.checkCarDetails;
    },
    enum: ['automatic', 'manual']
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid']
  },
  description: {
    type: String,
    required: function() {
      return this.dataSource !== 'DVLA';
    },
    trim: true
  },
  images: {
    type: [{
      type: String,
      trim: true
    }],
    validate: {
      validator: function(images) {
        return images.length <= 100;
      },
      message: 'Maximum 100 images allowed per vehicle'
    }
  },
  postcode: {
    type: String,
    required: function() {
      return this.dataSource !== 'DVLA';
    },
    trim: true,
    uppercase: true
  },
  locationName: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  condition: {
    type: String,
    enum: ['new', 'used'],
    default: 'used'
  },
  vehicleType: {
    type: String,
    enum: ['car', 'bike', 'van'],
    default: 'car',
    index: true
  },
  // Bike-specific fields
  engineCC: {
    type: Number,
    min: 0
  },
  bikeType: {
    type: String,
    enum: ['Sport', 'Cruiser', 'Adventure', 'Touring', 'Naked', 'Scooter', 'Off-road', 'Classic', 'Other'],
    trim: true
  },
  bodyType: {
    type: String,
    trim: true
  },
  doors: {
    type: Number,
    min: 2,
    max: 5
  },
  seats: {
    type: Number,
    min: 2,
    max: 9
  },
  engineSize: {
    type: Number,
    min: 0
  },
  // DVLA-specific fields
  registrationNumber: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true,
    index: true
  },
  displayTitle: {
    type: String,
    trim: true
  },
  dataSource: {
    type: String,
    enum: ['DVLA', 'manual'],
    default: 'manual'
  },
  co2Emissions: {
    type: Number,
    min: 0
  },
  taxStatus: {
    type: String,
    trim: true
  },
  motStatus: {
    type: String,
    trim: true
  },
  dvlaLastUpdated: {
    type: Date
  },
  // History check fields
  historyCheckStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'not_required'],
    default: 'pending'
  },
  historyCheckDate: {
    type: Date
  },
  historyCheckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleHistory'
  },
  // Seller contact details
  sellerContact: {
    type: {
      type: String,
      enum: ['private', 'trade'],
      default: 'private'
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    allowEmailContact: {
      type: Boolean,
      default: false
    },
    postcode: {
      type: String,
      trim: true,
      uppercase: true
    },
    // Trade seller specific fields
    businessName: {
      type: String,
      trim: true
    },
    tradingName: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    logo: {
      type: String,
      trim: true
    },
    rating: {
      type: Number,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    stats: {
      carsInStock: {
        type: Number,
        default: 0
      },
      yearsInBusiness: {
        type: Number,
        default: 0
      }
    }
  },
  // Advertising package details
  advertisingPackage: {
    packageId: {
      type: String,
      enum: ['bronze', 'silver', 'gold']
    },
    packageName: String,
    duration: String,
    price: Number,
    purchaseDate: Date,
    expiryDate: Date,
    stripeSessionId: String,
    stripePaymentIntentId: String
  },
  // Trade Dealer Fields
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeDealer',
    index: true
  },
  isDealerListing: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  uniqueViewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastViewedAt: {
    type: Date
  },
  
  // Vehicle features
  features: {
    type: [String],
    default: []
  },
  
  // Enhanced running costs data (from CheckCarDetails API)
  runningCosts: {
    fuelEconomy: {
      urban: { type: Number, default: null },
      extraUrban: { type: Number, default: null },
      combined: { type: Number, default: null }
    },
    co2Emissions: { type: Number, default: null },
    insuranceGroup: { type: String, default: null },
    annualTax: { type: Number, default: null }
  },
  
  // Performance data (from CheckCarDetails API)
  performance: {
    power: { type: Number, default: null }, // bhp
    torque: { type: Number, default: null }, // Nm
    acceleration: { type: Number, default: null }, // 0-60 seconds
    topSpeed: { type: Number, default: null } // mph
  },
  
  // Valuation/pricing data (from CheckCarDetails API)
  valuation: {
    dealerPrice: { type: Number, default: null }, // GBP
    privatePrice: { type: Number, default: null }, // GBP
    partExchangePrice: { type: Number, default: null }, // GBP
    valuationDate: { type: Date, default: null }
  },
  
  // Data source tracking
  dataSources: {
    dvla: { type: Boolean, default: false },
    checkCarDetails: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // Field source tracking (for display purposes)
  fieldSources: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Video URL
  videoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty
        // Validate YouTube URL format
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(v);
      },
      message: 'Please provide a valid YouTube URL'
    }
  },
  
  // Advert status
  advertStatus: {
    type: String,
    enum: ['draft', 'incomplete', 'pending_payment', 'active', 'sold', 'expired', 'removed'],
    default: 'draft'
  },
  advertId: {
    type: String,
    unique: true,
    sparse: true
  },
  publishedAt: {
    type: Date
  },
  soldAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
carSchema.index({ make: 1, model: 1 });
carSchema.index({ make: 1, model: 1, submodel: 1 });
carSchema.index({ year: 1 });
carSchema.index({ price: 1 });
carSchema.index({ location: '2dsphere' });
carSchema.index({ condition: 1 });
carSchema.index({ fuelType: 1 });
carSchema.index({ registrationNumber: 1 });
carSchema.index({ historyCheckStatus: 1 });
carSchema.index({ dealerId: 1, advertStatus: 1 });
carSchema.index({ isDealerListing: 1 });
carSchema.index({ vehicleType: 1 });
carSchema.index({ vehicleType: 1, condition: 1 });

// Pre-save hook for validation and normalization
carSchema.pre('save', async function(next) {
  // Check for duplicate active adverts with same registration
  if (this.registrationNumber && this.advertStatus === 'active') {
    const duplicate = await this.constructor.findOne({
      registrationNumber: this.registrationNumber,
      advertStatus: 'active',
      _id: { $ne: this._id }
    });
    
    if (duplicate) {
      const error = new Error(`Active advert already exists for registration ${this.registrationNumber}`);
      error.code = 'DUPLICATE_REGISTRATION';
      return next(error);
    }
  }
  
  // Auto-generate displayTitle if missing (AutoTrader format: "EngineSize Variant BodyStyle")
  if (!this.displayTitle && this.make && this.model) {
    const parts = [];
    
    // Engine size (without 'L' suffix for AutoTrader style)
    if (this.engineSize) {
      const size = parseFloat(this.engineSize);
      if (!isNaN(size) && size > 0) {
        parts.push(size.toFixed(1));
      }
    }
    
    // Variant (should include fuel type + trim like "TDI S" or "320d M Sport")
    if (this.variant && this.variant !== 'null' && this.variant !== 'undefined' && this.variant.trim() !== '') {
      parts.push(this.variant);
    } else if (this.fuelType) {
      // Fallback: use fuel type if no variant
      parts.push(this.fuelType);
    }
    
    // Body style - convert to AutoTrader short form (e.g., "5dr", "Estate")
    if (this.doors && this.doors >= 2 && this.doors <= 5) {
      parts.push(`${this.doors}dr`);
    } else if (this.bodyType) {
      const bodyType = this.bodyType.toLowerCase();
      if (bodyType.includes('estate')) {
        parts.push('Estate');
      } else if (bodyType.includes('saloon') || bodyType.includes('sedan')) {
        parts.push('Saloon');
      } else if (bodyType.includes('coupe')) {
        parts.push('Coupe');
      } else if (bodyType.includes('convertible') || bodyType.includes('cabriolet')) {
        parts.push('Convertible');
      } else if (bodyType.includes('suv')) {
        parts.push('SUV');
      } else if (bodyType.includes('mpv')) {
        parts.push('MPV');
      }
    }
    
    // Generate displayTitle
    if (parts.length > 0) {
      this.displayTitle = parts.join(' ');
      console.log(`🎯 Auto-generated displayTitle: "${this.displayTitle}" for ${this.make} ${this.model}`);
    }
  }
  
  // History check for new listings with registration numbers
  if (this.isNew && this.registrationNumber && this.historyCheckStatus === 'pending') {
    try {
      const HistoryService = require('../services/historyService');
      const historyService = new HistoryService();
      
      console.log(`Triggering history check for new listing: ${this.registrationNumber}`);
      
      // Perform history check
      const historyResult = await historyService.checkVehicleHistory(this.registrationNumber);
      
      // Update listing with history check results
      this.historyCheckStatus = 'verified';
      this.historyCheckDate = new Date();
      this.historyCheckId = historyResult._id;
      
      console.log(`History check completed for ${this.registrationNumber}: ${historyResult.checkStatus}`);
    } catch (error) {
      console.error(`History check failed for ${this.registrationNumber}:`, error.message);
      
      // Mark as failed but allow listing to proceed
      this.historyCheckStatus = 'failed';
      this.historyCheckDate = new Date();
    }
  }
  
  next();
});

module.exports = mongoose.model('Car', carSchema);
