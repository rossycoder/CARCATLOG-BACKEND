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
  estimatedValue: {
    type: Number,
    min: [0, 'Estimated value must be positive']
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
  motDue: {
    type: Date
  },
  motExpiry: {
    type: Date
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
  
  // Private Seller Fields
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  
  // Individual running cost fields (for backward compatibility)
  fuelEconomyUrban: { type: Number, default: null },
  fuelEconomyExtraUrban: { type: Number, default: null },
  fuelEconomyCombined: { type: Number, default: null },
  co2Emissions: { type: Number, default: null },
  insuranceGroup: { type: String, default: null },
  annualTax: { type: Number, default: null },
  
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
    default: 'active' // Changed from 'draft' to 'active' - all new cars are active by default
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
  // Prevent saving incomplete cars - they should be draft or active
  if (this.advertStatus === 'incomplete') {
    console.log(`⚠️  Preventing save of incomplete car: ${this.registrationNumber}`);
    const error = new Error('Cannot save cars with "incomplete" status. Use "draft" or "active" instead.');
    error.code = 'INVALID_STATUS';
    return next(error);
  }

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
      
      console.log(`🔍 Triggering history check for new listing: ${this.registrationNumber}`);
      
      // Perform history check
      const historyResult = await historyService.checkVehicleHistory(this.registrationNumber);
      
      // Update listing with history check results
      this.historyCheckStatus = 'verified';
      this.historyCheckDate = new Date();
      this.historyCheckId = historyResult._id;
      
      console.log(`✅ History check completed for ${this.registrationNumber}: ${historyResult.checkStatus}`);
    } catch (error) {
      console.error(`❌ History check failed for ${this.registrationNumber}:`, error.message);
      
      // Check if it's a daily limit error (403)
      if (error.isDailyLimitError || error.details?.status === 403 || error.message.includes('daily limit')) {
        console.log(`⏰ API daily limit exceeded - skipping history check for now`);
        console.log(`   History can be added later when API limit resets`);
        this.historyCheckStatus = 'pending'; // Keep as pending so it can be retried later
      } else {
        // Mark as failed for other errors
        this.historyCheckStatus = 'failed';
      }
      this.historyCheckDate = new Date();
    }
  }
  
  // Auto-fetch coordinates from postcode if missing
  if (this.isNew && this.postcode && (!this.latitude || !this.longitude)) {
    try {
      const postcodeService = require('../services/postcodeService');
      console.log(`📍 Fetching coordinates for postcode: ${this.postcode}`);
      
      const postcodeData = await postcodeService.lookupPostcode(this.postcode);
      
      this.latitude = postcodeData.latitude;
      this.longitude = postcodeData.longitude;
      this.locationName = postcodeData.locationName; // Set location name
      this.location = {
        type: 'Point',
        coordinates: [postcodeData.longitude, postcodeData.latitude]
      };
      
      // Also set city in sellerContact if not already set
      if (!this.sellerContact) {
        this.sellerContact = {};
      }
      if (!this.sellerContact.city) {
        this.sellerContact.city = postcodeData.locationName;
      }
      
      console.log(`✅ Coordinates and location set: ${this.latitude}, ${this.longitude} - ${this.locationName}`);
    } catch (error) {
      console.error(`⚠️  Could not fetch coordinates for postcode ${this.postcode}:`, error.message);
      // Continue without coordinates
    }
  }
  
  // Auto-fetch valuation and set PRIVATE sale price if missing or incorrect
  if (this.isNew && this.registrationNumber && this.mileage) {
    // Check if valuation is missing or price is not set correctly
    const needsValuation = !this.valuation?.privatePrice || 
                          !this.price || 
                          this.price === 0 ||
                          (this.valuation?.privatePrice && this.price !== this.valuation.privatePrice);
    
    if (needsValuation) {
      try {
        const ValuationService = require('../services/valuationService');
        const valuationService = new ValuationService();
        
        console.log(`💰 Fetching valuation for: ${this.registrationNumber} (${this.mileage} miles)`);
        
        const valuation = await valuationService.getValuation(this.registrationNumber, this.mileage);
        
        // Store all valuation data
        this.valuation = {
          privatePrice: valuation.estimatedValue.private,
          dealerPrice: valuation.estimatedValue.retail,
          partExchangePrice: valuation.estimatedValue.trade,
          confidence: valuation.confidence,
          valuationDate: new Date()
        };
        
        // Set price to PRIVATE sale price (for private sellers)
        this.price = valuation.estimatedValue.private;
        this.estimatedValue = valuation.estimatedValue.private;
        
        console.log(`✅ Valuation fetched and price set to £${this.price} (Private Sale)`);
        console.log(`   Private: £${valuation.estimatedValue.private}, Retail: £${valuation.estimatedValue.retail}, Trade: £${valuation.estimatedValue.trade}`);
      } catch (error) {
        console.error(`⚠️  Could not fetch valuation for ${this.registrationNumber}:`, error.message);
        // Continue without valuation - use existing price or default
        if (!this.price || this.price === 0) {
          console.warn(`⚠️  No price set and valuation failed - car may have incorrect price`);
        }
      }
    } else {
      console.log(`ℹ️  Valuation already exists for ${this.registrationNumber}: £${this.valuation.privatePrice}`);
    }
  }
  
  // Auto-set userId from seller contact email if missing
  // Check on EVERY save (not just new cars) to ensure userId is always set
  if (!this.userId && this.sellerContact?.email) {
    try {
      const User = require('./User');
      console.log(`👤 Looking up user for email: ${this.sellerContact.email}`);
      
      const user = await User.findOne({ email: this.sellerContact.email });
      
      if (user) {
        this.userId = user._id;
        console.log(`✅ User ID set: ${this.userId} (from email: ${this.sellerContact.email})`);
      } else {
        console.log(`⚠️  No user found for email: ${this.sellerContact.email}`);
        console.log(`⚠️  Car will be saved WITHOUT userId - it won't appear in My Listings!`);
      }
    } catch (error) {
      console.error(`⚠️  Could not set userId:`, error.message);
      // Continue without userId
    }
  } else if (!this.userId) {
    console.warn(`⚠️  WARNING: Car being saved without userId and no email provided!`);
    console.warn(`⚠️  This car will NOT appear in My Listings page!`);
    console.warn(`⚠️  Car ID: ${this._id}, Registration: ${this.registrationNumber}`);
  }
  
  // Auto-set publishedAt date for active cars
  if (this.isNew && this.advertStatus === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
    console.log(`✅ Published date set: ${this.publishedAt}`);
  }
  
  next();
});

module.exports = mongoose.model('Car', carSchema);
