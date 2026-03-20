const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  make: {
    type: String,
    required: [true, 'Make is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true
  },
  submodel: {
    type: String,
    trim: true
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
    required: [true, 'Color is required'],
    trim: true
  },
  transmission: {
    type: String,
    enum: ['automatic', 'manual', 'semi-automatic'],
    default: 'manual'
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Petrol Hybrid', 'Diesel Hybrid', 'Plug-in Hybrid', 'Petrol Plug-in Hybrid', 'Diesel Plug-in Hybrid']
  },
  description: {
    type: String,
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
      message: 'Maximum 100 images allowed per bike'
    }
  },
  // Features array
  features: {
    type: [String],
    default: []
  },
  // Location fields
  postcode: {
    type: String,
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
      type: [Number],
      index: '2dsphere'
    }
  },
  condition: {
    type: String,
    enum: ['new', 'used'],
    default: 'used'
  },
  // Bike-specific fields
  engineCC: {
    type: Number,
    min: 0,
    required: [true, 'Engine CC is required']
  },
  bikeType: {
    type: String,
    enum: ['Sport', 'Sports', 'Cruiser', 'Adventure', 'Touring', 'Naked', 'Scooter', 'Off-road', 'Classic', 'Commuter', 'Other'],
    required: [true, 'Bike type is required']
  },
  // DVLA-specific fields
  registrationNumber: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true,
    index: true
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
    businessName: {
      type: String,
      trim: true
    },
    businessLogo: {
      type: String,
      trim: true
    },
    businessWebsite: {
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
  
  // User Association - CRITICAL for security
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Made optional - will be set from req.user or passed explicitly
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
  inquiryCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastInquiryAt: {
    type: Date
  },
  // Running costs data
  runningCosts: {
    fuelEconomy: {
      urban: { type: Number, default: null },
      extraUrban: { type: Number, default: null },
      combined: { type: Number, default: null }
    },
    co2Emissions: { type: Number, default: null },
    insuranceGroup: { type: String, default: null },
    annualTax: { type: Number, default: null },
    // Electric bike specific fields
    electricRange: { type: Number, default: null }, // Range in miles for electric bikes
    chargingTime: { type: Number, default: null }, // Charging time in hours (0-100%)
    batteryCapacity: { type: Number, default: null } // Battery capacity in kWh
  },

  // Electric bike specific fields (individual - for compatibility)
  electricRange: { type: Number, default: null }, // Range in miles for electric bikes
  chargingTime: { type: Number, default: null }, // Charging time in hours (0-100%)
  batteryCapacity: { type: Number, default: null }, // Battery capacity in kWh
  // Charging speeds and capabilities
  homeChargingSpeed: { type: Number, default: null }, // Home charging speed in kW (e.g., 3.3kW)
  publicChargingSpeed: { type: Number, default: null }, // Public charging speed in kW (e.g., 22kW)
  rapidChargingSpeed: { type: Number, default: null }, // Rapid charging speed in kW (e.g., 50kW)
  chargingTime10to80: { type: Number, default: null }, // Charging time from 10% to 80% in minutes
  // Additional electric bike fields
  electricMotorPower: { type: Number, default: null }, // Electric motor power in kW
  electricMotorTorque: { type: Number, default: null }, // Electric motor torque in Nm
  chargingPortType: { type: String, default: null }, // Type of charging port (e.g., "Type 2", "CCS")
  fastChargingCapability: { type: String, default: null }, // Fast charging capability description

  // MOT History - Full array like cars
  motHistory: [{
    testDate: { type: Date },
    expiryDate: { type: Date },
    testResult: { 
      type: String, 
      enum: ['PASS', 'PASSED', 'FAIL', 'FAILED', 'ADVISORY', 'PRS', 'ABA'] // Support both formats
    },
    odometerValue: { type: Number },
    odometerUnit: { 
      type: String, 
      enum: ['mi', 'km'], 
      default: 'mi' 
    },
    motTestNumber: { type: String },
    defects: [{
      text: String,
      type: { 
        type: String, 
        enum: ['FAIL', 'FAILED', 'ADVISORY', 'USER ENTERED', 'MINOR', 'MAJOR', 'DANGEROUS'] // Support all API formats
      },
      dangerous: { type: Boolean, default: false }
    }],
    rfrAndComments: [{
      text: String,
      type: { 
        type: String, 
        enum: ['FAIL', 'FAILED', 'ADVISORY', 'USER ENTERED', 'MINOR', 'MAJOR', 'DANGEROUS'] // Support all API formats
      }
    }],
    testStation: {
      name: String,
      address: String,
      postcode: String,
      phone: String
    }
  }],

  // Vehicle History Check Integration
  historyCheckId: { type: String },
  historyCheckStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'not_requested', 'verified'],
    default: 'not_requested'
  },
  historyCheckDate: { type: Date },
  historyCheckData: {
    writeOffCategory: { type: String },
    writeOffDetails: { 
      category: String,
      date: Date,
      status: String,
      description: String,
      insurerName: String,
      claimNumber: String,
      damageLocations: [String]
    },
    stolen: { type: Boolean, default: false },
    scrapped: { type: Boolean, default: false },
    exported: { type: Boolean, default: false },
    previousKeepers: { type: Number },
    colourChanges: { type: Number },
    plateChanges: { type: Number },
    outstandingFinance: { type: Boolean, default: false }
  },

  // Enhanced Vehicle Data
  variant: {
    type: String,
    trim: true,
    index: true
  },
  modelVariant: {
    type: String,
    trim: true
  },
  engineSize: {
    type: String,
    trim: true
  },
  emissionClass: {
    type: String,
    trim: true
  },
  euroStatus: {
    type: String,
    trim: true
  },

  // Performance Data
  performance: {
    power: { type: String },
    torque: { type: String },
    acceleration: { type: String },
    topSpeed: { type: String }
  },

  // Valuation Data
  valuation: {
    dealerPrice: { type: Number },
    privatePrice: { type: Number },
    partExchangePrice: { type: Number },
    lastUpdated: { type: Date }
  },

  // Field Sources Tracking
  fieldSources: {
    make: { type: String, enum: ['user', 'dvla', 'checkcardetails', 'vehiclespecs'] },
    model: { type: String, enum: ['user', 'dvla', 'checkcardetails', 'vehiclespecs'] },
    variant: { type: String, enum: ['user', 'dvla', 'checkcardetails', 'vehiclespecs'] },
    color: { type: String, enum: ['user', 'dvla', 'checkcardetails', 'vehiclespecs'] },
    year: { type: String, enum: ['user', 'dvla', 'checkcardetails', 'vehiclespecs'] },
    engineSize: { type: String, enum: ['user', 'dvla', 'checkcardetails', 'vehiclespecs'] },
    fuelType: { type: String, enum: ['user', 'dvla', 'checkcardetails', 'vehiclespecs'] },
    transmission: { type: String, enum: ['user', 'dvla', 'checkcardetails', 'vehiclespecs'] }
  },

  // Data Sources Tracking
  dataSources: {
    dvla: { type: Boolean, default: false },
    checkCarDetails: { type: Boolean, default: false },
    vehiclespecs: { type: Boolean, default: false },
    motHistory: { type: Boolean, default: false },
    historyCheck: { type: Boolean, default: false }
  },

  // Auto-generated Display Title
  displayTitle: {
    type: String,
    trim: true
  },
  
  // Video URL
  videoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty
        // Validate YouTube, Vimeo, Dailymotion URL format
        const urlPattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|dailymotion\.com\/video\/)/i;
        return urlPattern.test(v);
      },
      message: 'Please enter a valid YouTube, Vimeo, or Dailymotion URL'
    }
  },
  
  // Advert status
  status: {
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
  
  // Track which fields were manually edited by user
  userEditedFields: {
    type: Map,
    of: Boolean,
    default: {}
  }
}, {
  timestamps: true
});

// Pre-save middleware to normalize bike data and generate display title
bikeSchema.pre('save', async function(next) {
  console.log(`🔧 [Bike Pre-Save Hook] Starting for ${this.make} ${this.model} (${this.registrationNumber})`);
  
  // CRITICAL: Normalize make names (exactly like cars)
  // Honda, HONDA, honda → Honda
  // Yamaha, YAMAHA, yamaha → Yamaha
  if (this.make) {
    const makeUpper = this.make.toUpperCase().trim();
    
    // Common bike makes normalization
    const makeNormalization = {
      'HONDA': 'Honda',
      'YAMAHA': 'Yamaha',
      'KAWASAKI': 'Kawasaki',
      'SUZUKI': 'Suzuki',
      'BMW': 'BMW',
      'DUCATI': 'Ducati',
      'TRIUMPH': 'Triumph',
      'HARLEY-DAVIDSON': 'Harley-Davidson',
      'HARLEY DAVIDSON': 'Harley-Davidson',
      'KTM': 'KTM',
      'APRILIA': 'Aprilia',
      'MV AGUSTA': 'MV Agusta',
      'ROYAL ENFIELD': 'Royal Enfield',
      'INDIAN': 'Indian',
      'BENELLI': 'Benelli',
      'HUSQVARNA': 'Husqvarna',
      'PIAGGIO': 'Piaggio',
      'VESPA': 'Vespa',
      'SYM': 'SYM',
      'KYMCO': 'Kymco'
    };
    
    if (makeNormalization[makeUpper]) {
      const oldMake = this.make;
      this.make = makeNormalization[makeUpper];
      if (oldMake !== this.make) {
        console.log(`✅ [Bike Make] Normalized: "${oldMake}" → "${this.make}"`);
      }
    }
  }
  
  // CRITICAL: Normalize fuel type (exactly like cars)
  // PETROL, petrol, Petrol → Petrol
  // ELECTRIC, electric, Electric → Electric
  if (this.fuelType) {
    const fuelUpper = this.fuelType.toUpperCase().trim();
    
    const fuelNormalization = {
      'PETROL': 'Petrol',
      'DIESEL': 'Diesel',
      'ELECTRIC': 'Electric',
      'HYBRID': 'Hybrid',
      'PETROL HYBRID': 'Petrol Hybrid',
      'DIESEL HYBRID': 'Diesel Hybrid',
      'PLUG-IN HYBRID': 'Plug-in Hybrid',
      'PETROL PLUG-IN HYBRID': 'Petrol Plug-in Hybrid',
      'DIESEL PLUG-IN HYBRID': 'Diesel Plug-in Hybrid'
    };
    
    if (fuelNormalization[fuelUpper]) {
      const oldFuel = this.fuelType;
      this.fuelType = fuelNormalization[fuelUpper];
      if (oldFuel !== this.fuelType) {
        console.log(`✅ [Bike Fuel] Normalized: "${oldFuel}" → "${this.fuelType}"`);
      }
    }
  }
  
  // CRITICAL: Auto-fetch coordinates from postcode if missing
  // This ensures ALL bikes can be found in postcode searches (exactly like cars)
  if (this.postcode && this.isNew) {
    const needsCoordinates = !this.latitude || !this.longitude;
    const needsLocationName = !this.locationName;
    
    if (needsCoordinates || needsLocationName) {
      try {
        console.log(`📍 [Bike Model] Fetching coordinates for postcode: ${this.postcode}`);
        const postcodeService = require('../services/postcodeService');
        const postcodeData = await postcodeService.lookupPostcode(this.postcode);
        
        if (postcodeData) {
          // Set coordinates in multiple formats for compatibility
          this.latitude = postcodeData.latitude;
          this.longitude = postcodeData.longitude;
          
          // Set GeoJSON location for geospatial queries
          this.location = {
            type: 'Point',
            coordinates: [postcodeData.longitude, postcodeData.latitude]
          };
          
          // Set location name
          this.locationName = postcodeData.locationName;
          
          console.log(`✅ [Bike Model] Coordinates set: ${postcodeData.latitude}, ${postcodeData.longitude}`);
          console.log(`✅ [Bike Model] Location name set: ${postcodeData.locationName}`);
        } else {
          console.log(`⚠️  [Bike Model] Could not fetch coordinates for postcode: ${this.postcode}`);
        }
      } catch (error) {
        console.error(`❌ [Bike Model] Error fetching coordinates:`, error.message);
      }
    }
  }
  
  // Generate display title
  if (this.make && this.model) {
    let title = `${this.make} ${this.model}`;
    if (this.variant) {
      title += ` ${this.variant}`;
    }
    if (this.year) {
      title += ` (${this.year})`;
    }
    if (this.engineCC) {
      title += ` ${this.engineCC}cc`;
    }
    this.displayTitle = title;
  }
  
  next();
});

// Indexes for faster queries
bikeSchema.index({ make: 1, model: 1 });
bikeSchema.index({ make: 1, model: 1, submodel: 1 });
bikeSchema.index({ year: 1 });
bikeSchema.index({ price: 1 });
bikeSchema.index({ location: '2dsphere' });
bikeSchema.index({ condition: 1 });
bikeSchema.index({ fuelType: 1 });
bikeSchema.index({ bikeType: 1 });
bikeSchema.index({ engineCC: 1 });
bikeSchema.index({ status: 1 });
bikeSchema.index({ dealerId: 1, status: 1 });
bikeSchema.index({ registrationNumber: 1 });
bikeSchema.index({ historyCheckStatus: 1 });
bikeSchema.index({ 'motHistory.expiryDate': 1 });

module.exports = mongoose.model('Bike', bikeSchema);


// Pre-save hook to automatically enhance electric bikes AND plug-in hybrid bikes
bikeSchema.pre('save', async function(next) {
  try {
    // Check if this is an electric bike OR plug-in hybrid bike
    const isElectricOrPluginHybrid = this.fuelType === 'Electric' || 
                                      this.fuelType === 'Plug-in Hybrid' ||
                                      this.fuelType === 'Petrol Plug-in Hybrid' ||
                                      this.fuelType === 'Diesel Plug-in Hybrid' ||
                                      this.fuelType === 'Hybrid'; // Include regular hybrids for bikes
    
    // Only enhance if it's electric/hybrid and it's a new document or fuelType changed
    if (isElectricOrPluginHybrid && (this.isNew || this.isModified('fuelType'))) {
      console.log(`🔋 [Bike] Auto-enhancing electric/hybrid bike: ${this.make} ${this.model} ${this.variant}`);
      console.log(`   Fuel Type: ${this.fuelType}`);
      
      // Import services (dynamic import to avoid circular dependencies)
      const ElectricVehicleEnhancementService = require('../services/electricVehicleEnhancementService');
      const AutoDataPopulationService = require('../services/autoDataPopulationService');
      
      // Convert document to plain object for enhancement
      const bikeData = this.toObject();
      
      // Enhance with comprehensive electric vehicle data
      const enhancedData = ElectricVehicleEnhancementService.enhanceWithEVData(bikeData);
      const fullyEnhancedData = AutoDataPopulationService.populateMissingData(enhancedData);
      
      // Apply enhanced data back to the document
      Object.keys(fullyEnhancedData).forEach(key => {
        if (key !== '_id' && key !== '__v') {
          this[key] = fullyEnhancedData[key];
        }
      });
      
      console.log(`✅ [Bike] Auto-enhanced EV/Hybrid: ${this.electricRange || this.runningCosts?.electricRange}mi range, ${this.batteryCapacity || this.runningCosts?.batteryCapacity}kWh battery`);
    }
    
    // CRITICAL: For plug-in hybrids, DON'T remove electric data
    // Only remove electric data for pure petrol (NOT hybrids or electric)
    const isPureNonElectric = this.fuelType === 'Petrol';
    
    if (isPureNonElectric && (this.batteryCapacity || this.electricRange)) {
      console.log(`⚠️  [Bike] Removing electric data from pure ${this.fuelType} bike`);
      this.batteryCapacity = null;
      this.electricRange = null;
      this.homeChargingSpeed = null;
      this.rapidChargingSpeed = null;
      this.chargingPortType = null;
      this.electricMotorPower = null;
      this.electricMotorTorque = null;
    }
    
    next();
  } catch (error) {
    console.error('❌ [Bike] Error in electric vehicle pre-save hook:', error);
    // Don't fail the save operation, just log the error
    next();
  }
});
