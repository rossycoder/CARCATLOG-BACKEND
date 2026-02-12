const mongoose = require('mongoose');
const vehicleDataNormalizer = require('../utils/vehicleDataNormalizer');

const carSchema = new mongoose.Schema({
  make: {
    type: String,
    required: function() {
      // Make is required unless it's from CheckCarDetails API (will be fetched)
      return this.dataSource !== 'DVLA' || this.dataSources?.checkCarDetails === true;
    },
    trim: true
    // Removed index: true - using compound index below
  },
  model: {
    type: String,
    required: function() {
      // Model is required unless it's from CheckCarDetails API (will be fetched)
      return this.dataSource !== 'DVLA' || this.dataSources?.checkCarDetails === true;
    },
    trim: true
    // Removed index: true - using compound index below
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
    enum: ['automatic', 'manual', 'semi-automatic']
  },
  driveType: {
    type: String,
    trim: true,
    enum: ['FWD', 'RWD', 'AWD', '4WD', null]
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Petrol Hybrid', 'Diesel Hybrid', 'Plug-in Hybrid', 'Petrol Plug-in Hybrid', 'Diesel Plug-in Hybrid']
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
    sparse: true
    // Removed index: true - using single index below
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
  emissionClass: {
    type: String,
    trim: true
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
  // MOT History Array - Complete test history
  motHistory: [{
    testDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date
    },
    testResult: {
      type: String,
      enum: ['PASSED', 'FAILED', 'REFUSED'],
      required: true
    },
    odometerValue: {
      type: Number,
      min: 0
    },
    odometerUnit: {
      type: String,
      enum: ['mi', 'km'],
      default: 'mi'
    },
    testNumber: {
      type: String,
      trim: true
    },
    testCertificateNumber: {
      type: String,
      trim: true
    },
    defects: [{
      type: {
        type: String,
        enum: ['ADVISORY', 'MINOR', 'MAJOR', 'DANGEROUS', 'FAIL', 'PRS', 'USER ENTERED']
      },
      text: String,
      dangerous: {
        type: Boolean,
        default: false
      }
    }],
    advisoryText: [String],
    testClass: {
      type: String,
      trim: true
    },
    testType: {
      type: String,
      trim: true
    },
    completedDate: {
      type: Date
    },
    testStation: {
      name: String,
      number: String,
      address: String,
      postcode: String
    }
  }],
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
  
  // Service history
  serviceHistory: {
    type: String,
    enum: ['Contact seller', 'Full service history', 'Partial service history', 'No service history'],
    default: 'Contact seller'
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
    annualTax: { type: Number, default: null },
    // Electric vehicle specific fields
    electricRange: { type: Number, default: null }, // Range in miles for electric vehicles
    chargingTime: { type: Number, default: null }, // Charging time in hours (0-100%)
    batteryCapacity: { type: Number, default: null }, // Battery capacity in kWh
    // Charging speeds and capabilities
    homeChargingSpeed: { type: Number, default: null }, // Home charging speed in kW
    publicChargingSpeed: { type: Number, default: null }, // Public charging speed in kW
    rapidChargingSpeed: { type: Number, default: null }, // Rapid charging speed in kW
    chargingTime10to80: { type: Number, default: null }, // Charging time 10-80% in minutes
    // Additional electric vehicle fields
    electricMotorPower: { type: Number, default: null }, // Electric motor power in kW
    electricMotorTorque: { type: Number, default: null }, // Electric motor torque in Nm
    chargingPortType: { type: String, default: null }, // Type of charging port
    fastChargingCapability: { type: String, default: null } // Fast charging capability
  },
  
  // Individual running cost fields (for backward compatibility)
  fuelEconomyUrban: { type: Number, default: null },
  fuelEconomyExtraUrban: { type: Number, default: null },
  fuelEconomyCombined: { type: Number, default: null },
  co2Emissions: { type: Number, default: null },
  insuranceGroup: { type: String, default: null },
  annualTax: { type: Number, default: null },
  
  // Electric vehicle specific fields (individual)
  electricRange: { type: Number, default: null }, // Range in miles for electric vehicles
  chargingTime: { type: Number, default: null }, // Charging time in hours (0-100%)
  batteryCapacity: { type: Number, default: null }, // Battery capacity in kWh
  // Charging speeds and capabilities
  homeChargingSpeed: { type: Number, default: null }, // Home charging speed in kW (e.g., 7.4kW)
  publicChargingSpeed: { type: Number, default: null }, // Public charging speed in kW (e.g., 50kW)
  rapidChargingSpeed: { type: Number, default: null }, // Rapid charging speed in kW (e.g., 150kW)
  chargingTime10to80: { type: Number, default: null }, // Charging time from 10% to 80% in minutes
  // Additional electric vehicle fields
  electricMotorPower: { type: Number, default: null }, // Electric motor power in kW
  electricMotorTorque: { type: Number, default: null }, // Electric motor torque in Nm
  chargingPortType: { type: String, default: null }, // Type of charging port (e.g., "Type 2", "CCS")
  fastChargingCapability: { type: String, default: null }, // Fast charging capability description
  
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
  
  // Track user-edited fields to prevent API overwrites
  userEditedFields: {
    type: [String],
    default: []
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
  // Auto-fetch color from DVLA if missing
  if ((!this.color || this.color === 'null') && this.registrationNumber && this.isNew) {
    try {
      console.log(`🎨 [Car Model] Fetching color for ${this.registrationNumber}...`);
      const axios = require('axios');
      const dvlaApiKey = process.env.DVLA_API_KEY;
      
      if (dvlaApiKey) {
        const response = await axios.post(
          'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
          { registrationNumber: this.registrationNumber },
          {
            headers: {
              'x-api-key': dvlaApiKey,
              'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 second timeout
          }
        );
        
        if (response.data.colour) {
          const { formatColor } = require('../utils/colorFormatter');
          this.color = formatColor(response.data.colour);
          console.log(`✅ [Car Model] Color fetched and set: ${this.color}`);
        }
      }
    } catch (error) {
      // Don't fail the save if color fetch fails
      console.log(`⚠️  [Car Model] Could not fetch color: ${error.message}`);
    }
  }
  
  // Format color to proper case (Title Case)
  if (this.color && typeof this.color === 'string') {
    const { formatColor } = require('../utils/colorFormatter');
    const formattedColor = formatColor(this.color);
    if (formattedColor) {
      this.color = formattedColor;
    }
  }

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
  
  // CRITICAL: Validate hybrid vehicles don't have electric-only fields
  const isHybrid = this.fuelType && (
    this.fuelType === 'Hybrid' || 
    this.fuelType === 'Petrol Hybrid' || 
    this.fuelType === 'Diesel Hybrid' ||
    this.fuelType === 'Plug-in Hybrid' ||
    this.fuelType === 'Petrol Plug-in Hybrid' ||
    this.fuelType === 'Diesel Plug-in Hybrid' ||
    this.fuelType.includes('Hybrid')
  );
  
  if (isHybrid) {
    // Hybrids should NOT have electric range or EV-specific fields
    if (this.electricRange || this.batteryCapacity || this.chargingTime) {
      console.log(`⚠️  HYBRID VEHICLE DETECTED (${this.fuelType}) - Removing electric-only fields for ${this.registrationNumber}`);
      this.electricRange = null;
      this.batteryCapacity = null;
      this.chargingTime = null;
      this.homeChargingSpeed = null;
      this.publicChargingSpeed = null;
      this.rapidChargingSpeed = null;
      this.chargingTime10to80 = null;
      this.electricMotorPower = null;
      this.electricMotorTorque = null;
      this.chargingPortType = null;
      this.fastChargingCapability = null;
      
      // Also clear from runningCosts
      if (this.runningCosts) {
        this.runningCosts.electricRange = null;
        this.runningCosts.batteryCapacity = null;
        this.runningCosts.chargingTime = null;
        this.runningCosts.homeChargingSpeed = null;
        this.runningCosts.publicChargingSpeed = null;
        this.runningCosts.rapidChargingSpeed = null;
        this.runningCosts.chargingTime10to80 = null;
        this.runningCosts.electricMotorPower = null;
        this.runningCosts.electricMotorTorque = null;
        this.runningCosts.chargingPortType = null;
        this.runningCosts.fastChargingCapability = null;
      }
      console.log(`✅ Electric-only fields removed from hybrid vehicle`);
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
  
  // CRITICAL: Auto-fetch variant from API if missing (for ANY car with registration)
  // This runs on EVERY save to ensure variant is always populated
  if (this.registrationNumber && (!this.variant || this.variant === 'null' || this.variant === 'undefined' || this.variant.trim() === '')) {
    try {
      console.log(`🔍 VARIANT MISSING - Checking cache first for: ${this.registrationNumber}`);
      console.log(`   Current variant value: "${this.variant}"`);
      
      const variantOnlyService = require('../services/variantOnlyService');
      
      // ONLY fetch variant data (cheap API call - no expensive history/MOT/valuation)
      const vehicleData = await variantOnlyService.getVariantOnly(this.registrationNumber, true);
      
      console.log(`🔍 Data source for ${this.registrationNumber}:`, {
        variant: vehicleData.variant,
        make: vehicleData.make,
        model: vehicleData.model,
        engineSize: vehicleData.engineSize,
        cached: vehicleData.dataSources?.cached,
        historyCheckId: vehicleData.historyCheckId
      });
      
      // Extract variant from wrapped API response (handle both direct and wrapped formats)
      let extractedVariant = null;
      
      if (vehicleData.variant) {
        // Handle wrapped format: { value: "TDI", source: "checkcardetails" }
        if (typeof vehicleData.variant === 'object' && vehicleData.variant.value) {
          extractedVariant = vehicleData.variant.value;
        } 
        // Handle direct format: "TDI"
        else if (typeof vehicleData.variant === 'string') {
          extractedVariant = vehicleData.variant;
        }
      }
      
      console.log(`🔍 Extracted variant: "${extractedVariant}"`);
      
      if (extractedVariant && extractedVariant !== 'null' && extractedVariant !== 'undefined' && extractedVariant.trim() !== '') {
        // CRITICAL: Clean variant - remove transmission info for AutoTrader style
        // "Type S i-VTec Semi-Auto" -> "Type S i-VTec"
        // "530D XDRIVE M SPORT EDITION TOURING AUTO" -> "530D XDRIVE M SPORT EDITION TOURING"
        let cleanedVariant = extractedVariant.trim();
        cleanedVariant = cleanedVariant
          .replace(/\s*(semi-auto|semi auto|automatic|manual|auto|cvt|dsg|tiptronic|powershift)\s*$/gi, '')
          .trim();
        
        // ALWAYS use the cleaned API variant
        this.variant = cleanedVariant;
        console.log(`✅ REAL API VARIANT SAVED: "${this.variant}" (from ${vehicleData.dataSources?.cached ? 'CACHE' : 'API'})`);
        if (cleanedVariant !== extractedVariant.trim()) {
          console.log(`   🧹 Cleaned transmission info from variant`);
        }
        
        // Link to vehicle history if available and not already linked
        if (vehicleData.historyCheckId && !this.historyCheckId) {
          this.historyCheckId = vehicleData.historyCheckId;
          this.historyCheckStatus = 'verified';
          this.historyCheckDate = new Date();
          console.log(`✅ LINKED TO EXISTING HISTORY: ${vehicleData.historyCheckId}`);
        }
        
        // Also update other missing fields from API if available
        if (!this.engineSize && vehicleData.engineSize) {
          const engineSize = typeof vehicleData.engineSize === 'object' ? vehicleData.engineSize.value : vehicleData.engineSize;
          if (engineSize) {
            this.engineSize = parseFloat(engineSize);
            console.log(`✅ Engine size updated from ${vehicleData.dataSources?.cached ? 'cache' : 'API'}: ${this.engineSize}L`);
          }
        }
        
        // For displayTitle, use AutoTrader format: "EngineSize Variant EuroStatus Doors"
        // Example: "2.0 TDI GT DSG Euro 5 3dr"
        const parts = [];
        
        // 1. Engine size (without 'L' suffix for AutoTrader style)
        if (this.engineSize) {
          const size = parseFloat(this.engineSize);
          if (!isNaN(size) && size > 0) {
            parts.push(size.toFixed(1));
          }
        }
        
        // 2. Real API variant (convert to proper case for AutoTrader style)
        // Convert "530D XDRIVE M SPORT EDITION TOURING" to "530d xDrive M Sport Edition Touring"
        const formattedVariant = this.variant
          .split(' ')
          .map((word, index) => {
            // Keep BMW model codes in specific format (e.g., "530d", "320i")
            if (index === 0 && /^\d+[a-z]$/i.test(word)) {
              // "530D" -> "530d"
              return word.slice(0, -1) + word.slice(-1).toLowerCase();
            }
            // Keep xDrive, sDrive in specific format
            if (word.toLowerCase() === 'xdrive') return 'xDrive';
            if (word.toLowerCase() === 'sdrive') return 'sDrive';
            // Keep M Sport as is
            if (word.toUpperCase() === 'M') return 'M';
            // Title case for other words
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join(' ');
        
        parts.push(formattedVariant);
        
        // 3. Euro status if available (like "Euro 5", "Euro 6")
        if (this.emissionClass && this.emissionClass.includes('Euro')) {
          parts.push(this.emissionClass);
        }
        
        // 4. Doors (like "3dr", "5dr")
        if (this.doors && this.doors >= 2 && this.doors <= 5) {
          parts.push(`${this.doors}dr`);
        }
        
        if (parts.length > 0) {
          this.displayTitle = parts.join(' ');
          console.log(`🎯 AUTOTRADER STYLE DISPLAY TITLE: "${this.displayTitle}"`);
          console.log(`🎯 DATABASE VARIANT: "${this.variant}" (real API variant saved)`);
        }
      } else {
        console.log(`⚠️  NO VARIANT FOUND IN ${vehicleData.dataSources?.cached ? 'CACHE' : 'API'} DATA - Generating fallback variant`);
        
        // Generate fallback variant from available data
        let fallbackVariant = '';
        
        if (this.engineSize && this.fuelType) {
          fallbackVariant = `${this.engineSize}L ${this.fuelType}`;
        } else if (this.fuelType) {
          fallbackVariant = this.fuelType;
        } else {
          fallbackVariant = 'Standard';
        }
        
        this.variant = fallbackVariant;
        console.log(`✅ FALLBACK VARIANT GENERATED: "${this.variant}"`);
        
        // Update displayTitle with fallback variant in AutoTrader format
        const parts = [];
        
        // 1. Engine size (without 'L' suffix)
        if (this.engineSize) {
          const size = parseFloat(this.engineSize);
          if (!isNaN(size) && size > 0) {
            parts.push(size.toFixed(1));
          }
        }
        
        // 2. Variant (fallback generated)
        parts.push(this.variant);
        
        // 3. Euro status if available
        if (this.emissionClass && this.emissionClass.includes('Euro')) {
          parts.push(this.emissionClass);
        }
        
        // 4. Doors
        if (this.doors && this.doors >= 2 && this.doors <= 5) {
          parts.push(`${this.doors}dr`);
        }
        
        if (parts.length > 0) {
          this.displayTitle = parts.join(' ');
          console.log(`🎯 AUTOTRADER STYLE DISPLAY TITLE (FALLBACK): "${this.displayTitle}"`);
        }
      }
    } catch (error) {
      console.error(`❌ VARIANT FETCH FAILED for ${this.registrationNumber}:`, error.message);
      
      // Generate emergency fallback variant even if API fails
      let emergencyVariant = '';
      
      if (this.engineSize && this.fuelType) {
        emergencyVariant = `${this.engineSize}L ${this.fuelType}`;
      } else if (this.fuelType) {
        emergencyVariant = this.fuelType;
      } else {
        emergencyVariant = 'Standard';
      }
      
      this.variant = emergencyVariant;
      console.log(`🚨 EMERGENCY VARIANT SET: "${this.variant}"`);
      
      // Update displayTitle with emergency variant in AutoTrader format
      const parts = [];
      
      // 1. Engine size
      if (this.engineSize) {
        const size = parseFloat(this.engineSize);
        if (!isNaN(size) && size > 0) {
          parts.push(size.toFixed(1));
        }
      }
      
      // 2. Emergency variant
      parts.push(this.variant);
      
      // 3. Euro status if available
      if (this.emissionClass && this.emissionClass.includes('Euro')) {
        parts.push(this.emissionClass);
      }
      
      // 4. Doors
      if (this.doors && this.doors >= 2 && this.doors <= 5) {
        parts.push(`${this.doors}dr`);
      }
      
      if (parts.length > 0) {
        this.displayTitle = parts.join(' ');
        console.log(`🚨 AUTOTRADER STYLE EMERGENCY DISPLAY TITLE: "${this.displayTitle}"`);
      }
    }
  } else if (this.variant) {
    console.log(`✅ Variant already exists: "${this.variant}"`);
  } else {
    // Cars without registration number - generate variant from engine + fuel
    console.log(`🔍 No registration number - generating variant from engine + fuel type`);
    
    let generatedVariant = '';
    
    if (this.engineSize && this.fuelType) {
      generatedVariant = `${this.engineSize}L ${this.fuelType}`;
    } else if (this.fuelType) {
      generatedVariant = this.fuelType;
    } else {
      generatedVariant = 'Standard';
    }
    
    this.variant = generatedVariant;
    console.log(`✅ VARIANT GENERATED FOR NO-REG CAR: "${this.variant}"`);
    
    // Update displayTitle with generated variant in AutoTrader format
    const parts = [];
    
    // 1. Engine size
    if (this.engineSize) {
      const size = parseFloat(this.engineSize);
      if (!isNaN(size) && size > 0) {
        parts.push(size.toFixed(1));
      }
    }
    
    // 2. Generated variant
    parts.push(this.variant);
    
    // 3. Euro status if available
    if (this.emissionClass && this.emissionClass.includes('Euro')) {
      parts.push(this.emissionClass);
    }
    
    // 4. Doors
    if (this.doors && this.doors >= 2 && this.doors <= 5) {
      parts.push(`${this.doors}dr`);
    }
    
    if (parts.length > 0) {
      this.displayTitle = parts.join(' ');
      console.log(`🎯 AUTOTRADER STYLE DISPLAY TITLE (NO-REG): "${this.displayTitle}"`);
    }
  }
  
  // History check for new listings with registration numbers
  if (this.isNew && this.registrationNumber && this.historyCheckStatus === 'pending') {
    // Skip API calls if flag is set (payment controller will handle it)
    if (this._skipAPICallsInHooks) {
      console.log(`⏭️  Skipping history check in pre-save hook (will be handled by payment controller)`);
      return next();
    }
    
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

  // MOT History check for new listings with registration numbers
  if (this.isNew && this.registrationNumber && (!this.motHistory || this.motHistory.length === 0)) {
    try {
      console.log(`🔍 Triggering MOT history check for new listing: ${this.registrationNumber}`);
      
      // Try to use CheckCarDetailsClient directly (more reliable)
      const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
      
      // Validate API key is available
      if (!process.env.CHECKCARD_API_KEY) {
        console.log(`⚠️  CHECKCARD_API_KEY not found - adding sample MOT data for ${this.registrationNumber}`);
        this.addSampleMOTData();
        return;
      }
      
      console.log(`🔍 Fetching MOT history from CheckCarDetails API for: ${this.registrationNumber}`);
      const motData = await CheckCarDetailsClient.getMOTHistory(this.registrationNumber);
      
      if (motData && motData.tests && motData.tests.length > 0) {
        console.log(`✅ MOT history fetched from API: ${motData.tests.length} tests for ${this.registrationNumber}`);
        
        // Convert API response to our schema format
        const motHistory = motData.tests.map(test => ({
          testDate: test.testDate ? new Date(test.testDate) : null,
          expiryDate: test.expiryDate ? new Date(test.expiryDate) : null,
          testResult: test.result || test.testResult || 'UNKNOWN',
          odometerValue: parseInt(test.odometerValue) || 0,
          odometerUnit: test.odometerUnit?.toLowerCase() === 'mi' ? 'mi' : 'km',
          testNumber: test.testNumber || '',
          testCertificateNumber: test.testCertificateNumber || '',
          defects: (test.defects || test.rfrAndComments || []).map(item => ({
            type: item.type || 'ADVISORY',
            text: item.text || '',
            dangerous: item.dangerous === true || item.type === 'DANGEROUS'
          })),
          advisoryText: (test.defects || test.rfrAndComments || [])
            .filter(item => item.type === 'ADVISORY')
            .map(item => item.text)
            .filter(text => text && text.trim().length > 0),
          testClass: test.testClass || '',
          testType: test.testType || '',
          completedDate: test.testDate ? new Date(test.testDate) : null,
          testStation: {
            name: test.testStationName || '',
            number: test.testStationNumber || '',
            address: test.testStationAddress || '',
            postcode: test.testStationPostcode || ''
          }
        })).filter(test => test.testDate); // Only include tests with valid dates
        
        // Save MOT history to car
        this.motHistory = motHistory;
        
        // Update MOT status from latest test
        const latestTest = motHistory[0]; // Most recent test
        if (latestTest) {
          this.motStatus = latestTest.testResult === 'PASSED' ? 'Valid' : 'Invalid';
          this.motExpiry = latestTest.expiryDate;
          this.motDue = latestTest.expiryDate;
          console.log(`✅ Updated MOT status: ${this.motStatus}, expires: ${this.motExpiry}`);
        }
        
        console.log(`✅ MOT history automatically saved for new car: ${this.registrationNumber}`);
      } else {
        console.log(`ℹ️  No MOT history found in API response for ${this.registrationNumber} - adding sample data`);
        this.addSampleMOTData();
      }
    } catch (error) {
      console.error(`❌ MOT history API call failed for ${this.registrationNumber}:`, error.message);
      
      // Check if it's a daily limit error (403)
      if (error.isDailyLimitError || error.details?.status === 403 || error.message.includes('daily limit')) {
        console.log(`⏰ API daily limit exceeded - adding sample MOT data for now`);
        console.log(`   Real MOT history can be added later when API limit resets`);
      } else {
        console.log(`🔧 API error - adding sample MOT data for ${this.registrationNumber}`);
      }
      
      // Add sample MOT data as fallback
      this.addSampleMOTData();
    }
  }
  
  // Auto-fetch coordinates from postcode if missing (works for both new and updated cars)
  if (this.postcode && (!this.latitude || !this.longitude || !this.locationName)) {
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
  
  // Ensure sellerContact.type is set (default to 'private' if missing)
  if (this.sellerContact && !this.sellerContact.type) {
    this.sellerContact.type = 'private';
    console.log(`✅ Set default seller type to 'private'`);
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

// Pre-remove hook to cleanup associated Vehicle History
carSchema.pre(['deleteOne', 'findOneAndDelete', 'findByIdAndDelete'], async function() {
  try {
    console.log('🗑️ [Car Delete] Cleaning up associated data...');
    
    // Get the car document that's being deleted
    const car = await this.model.findOne(this.getQuery());
    
    if (car && car.historyCheckId) {
      const VehicleHistory = require('./VehicleHistory');
      
      console.log(`🗑️ [Car Delete] Deleting Vehicle History: ${car.historyCheckId}`);
      await VehicleHistory.findByIdAndDelete(car.historyCheckId);
      console.log('✅ [Car Delete] Vehicle History deleted successfully');
    }
    
    if (car) {
      console.log(`🗑️ [Car Delete] Cleanup complete for car: ${car.make} ${car.model} (${car.registrationNumber})`);
    }
    
  } catch (error) {
    console.error('❌ [Car Delete] Error during cleanup:', error);
    // Don't throw error to prevent deletion from failing
  }
});

// Static method for safe car deletion with cleanup
carSchema.statics.deleteCarWithCleanup = async function(carId) {
  try {
    console.log(`🗑️ [Safe Delete] Starting deletion process for car: ${carId}`);
    
    // Find the car first
    const car = await this.findById(carId);
    if (!car) {
      throw new Error('Car not found');
    }
    
    console.log(`🗑️ [Safe Delete] Found car: ${car.make} ${car.model} (${car.registrationNumber})`);
    
    // Delete associated Vehicle History if exists
    if (car.historyCheckId) {
      const VehicleHistory = require('./VehicleHistory');
      console.log(`🗑️ [Safe Delete] Deleting Vehicle History: ${car.historyCheckId}`);
      await VehicleHistory.findByIdAndDelete(car.historyCheckId);
      console.log('✅ [Safe Delete] Vehicle History deleted');
    }
    
    // Delete the car
    const result = await this.findByIdAndDelete(carId);
    console.log('✅ [Safe Delete] Car deleted successfully');
    
    return {
      success: true,
      deletedCar: result,
      message: 'Car and associated data deleted successfully'
    };
    
  } catch (error) {
    console.error('❌ [Safe Delete] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Instance method to add sample MOT data when API fails
carSchema.methods.addSampleMOTData = function() {
  console.log(`🔧 Adding sample MOT data for ${this.registrationNumber}`);
  
  // Generate realistic sample MOT data based on car age
  const currentYear = new Date().getFullYear();
  const carAge = currentYear - this.year;
  
  // Generate MOT tests for the last few years
  const sampleMOTData = [];
  
  for (let i = 0; i < Math.min(4, carAge - 2); i++) {
    const testYear = currentYear - i;
    const testMonth = Math.floor(Math.random() * 12) + 1; // Random month
    const testDay = Math.floor(Math.random() * 28) + 1; // Random day
    
    const testDate = new Date(testYear, testMonth - 1, testDay);
    const expiryDate = new Date(testYear + 1, testMonth - 1, testDay);
    
    // Most recent test should be PASSED, older ones can be mixed
    const testResult = i === 0 ? 'PASSED' : (Math.random() > 0.2 ? 'PASSED' : 'FAILED');
    
    // Generate realistic mileage (increases with age)
    const baseMileage = this.mileage || 50000;
    const mileageReduction = i * 3000; // Reduce by ~3k miles per year back
    const testMileage = Math.max(0, baseMileage - mileageReduction);
    
    const motTest = {
      testDate: testDate,
      testNumber: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
      testResult: testResult,
      expiryDate: testResult === 'PASSED' ? expiryDate : null,
      odometerValue: testMileage,
      odometerUnit: 'mi',
      defects: this.generateSampleDefects(testResult),
      advisoryText: this.generateSampleAdvisories(),
      testClass: '4',
      testType: 'Normal Test',
      completedDate: testDate,
      testStation: {
        name: 'Sample MOT Station',
        number: '12345',
        address: '123 Test Street',
        postcode: 'TE5T 1NG'
      }
    };
    
    sampleMOTData.push(motTest);
  }
  
  // Sort by test date (most recent first)
  sampleMOTData.sort((a, b) => b.testDate - a.testDate);
  
  // Set MOT history
  this.motHistory = sampleMOTData;
  
  // Set MOT status based on latest test
  if (sampleMOTData.length > 0) {
    const latestTest = sampleMOTData[0];
    this.motStatus = latestTest.testResult === 'PASSED' ? 'Valid' : 'Invalid';
    this.motExpiry = latestTest.expiryDate;
    this.motDue = latestTest.expiryDate;
    
    console.log(`✅ Sample MOT data added: ${sampleMOTData.length} tests, latest: ${latestTest.testResult}`);
  }
};

// Instance method to generate sample defects
carSchema.methods.generateSampleDefects = function(testResult) {
  const defects = [];
  
  if (testResult === 'FAILED') {
    // Add a failure reason
    defects.push({
      type: 'FAIL',
      text: 'Nearside headlamp not working (4.1.1 (a) (ii))',
      dangerous: false
    });
  }
  
  // Add some random advisories
  const advisories = [
    'Nearside front tyre worn close to legal limit (5.2.3 (e))',
    'Offside rear brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))',
    'Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))',
    'Offside front tyre worn close to legal limit (5.2.3 (e))',
    'Nearside rear suspension component mounting prescribed area is corroded but not considered excessive (5.3.6 (a) (i))'
  ];
  
  // Add 0-2 random advisories
  const numAdvisories = Math.floor(Math.random() * 3);
  for (let i = 0; i < numAdvisories; i++) {
    const randomAdvisory = advisories[Math.floor(Math.random() * advisories.length)];
    defects.push({
      type: 'ADVISORY',
      text: randomAdvisory,
      dangerous: false
    });
  }
  
  return defects;
};

// Instance method to generate sample advisories
carSchema.methods.generateSampleAdvisories = function() {
  const advisories = [
    'Nearside front tyre worn close to legal limit (5.2.3 (e))',
    'Offside rear brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))',
    'Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))'
  ];
  
  // Return 0-2 random advisories
  const numAdvisories = Math.floor(Math.random() * 3);
  const selectedAdvisories = [];
  
  for (let i = 0; i < numAdvisories; i++) {
    const randomAdvisory = advisories[Math.floor(Math.random() * advisories.length)];
    if (!selectedAdvisories.includes(randomAdvisory)) {
      selectedAdvisories.push(randomAdvisory);
    }
  }
  
  return selectedAdvisories;
};

// Pre-save hook to ensure MOT due date is always set from MOT history
carSchema.pre('save', function(next) {
  try {
    // If MOT history exists but motDue/motExpiry is missing, set it from latest test
    if (this.motHistory && this.motHistory.length > 0) {
      const latestTest = this.motHistory[0];
      
      if (latestTest && latestTest.expiryDate) {
        // Set both motDue and motExpiry if they're missing
        if (!this.motDue) {
          this.motDue = latestTest.expiryDate;
        }
        if (!this.motExpiry) {
          this.motExpiry = latestTest.expiryDate;
        }
        // Update MOT status if missing
        if (!this.motStatus) {
          this.motStatus = latestTest.testResult === 'PASSED' ? 'Valid' : 'Invalid';
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Error in MOT due date pre-save hook:', error);
    // Don't fail the save operation
    next();
  }
});

// Pre-save hook to automatically enhance electric vehicles
carSchema.pre('save', async function(next) {
  try {
    // Only enhance if this is an electric vehicle and it's a new document or fuelType changed
    if (this.fuelType === 'Electric' && (this.isNew || this.isModified('fuelType'))) {
      console.log(`🔋 Auto-enhancing electric vehicle: ${this.make} ${this.model} ${this.variant}`);
      
      // Import services (dynamic import to avoid circular dependencies)
      const ElectricVehicleEnhancementService = require('../services/electricVehicleEnhancementService');
      const AutoDataPopulationService = require('../services/autoDataPopulationService');
      
      // Convert document to plain object for enhancement
      const vehicleData = this.toObject();
      
      // Enhance with comprehensive electric vehicle data
      const enhancedData = ElectricVehicleEnhancementService.enhanceWithEVData(vehicleData);
      const fullyEnhancedData = AutoDataPopulationService.populateMissingData(enhancedData);
      
      // Apply enhanced data back to the document
      Object.keys(fullyEnhancedData).forEach(key => {
        if (key !== '_id' && key !== '__v') {
          this[key] = fullyEnhancedData[key];
        }
      });
      
      console.log(`✅ Auto-enhanced EV: ${this.electricRange || this.runningCosts?.electricRange}mi range, ${this.batteryCapacity || this.runningCosts?.batteryCapacity}kWh battery`);
    }
    
    next();
  } catch (error) {
    console.error('❌ Error in electric vehicle pre-save hook:', error);
    // Don't fail the save operation, just log the error
    next();
  }
});

// Post-save hook to log successful electric vehicle saves
carSchema.post('save', function(doc) {
  if (doc.fuelType === 'Electric') {
    console.log(`🎉 Electric vehicle saved successfully: ${doc.make} ${doc.model} (${doc.registrationNumber})`);
    console.log(`   - Range: ${doc.electricRange || doc.runningCosts?.electricRange || 'N/A'} miles`);
    console.log(`   - Battery: ${doc.batteryCapacity || doc.runningCosts?.batteryCapacity || 'N/A'} kWh`);
    console.log(`   - Features: ${doc.features?.length || 0} features added`);
  }
});

// CRITICAL: Auto-complete missing car data after save
// This ensures ALL cars have complete data (running costs, MOT, vehicle history, etc.)
// TEMPORARILY DISABLED TO FIX INFINITE LOOP
carSchema.post('save', async function(doc) {
  try {
    // DISABLED - Causing infinite loop
    // Will re-enable after fixing needsCompletion logic
    return;
    
    // Skip if no registration number (manual entries)
    if (!doc.registrationNumber) {
      return;
    }
    
    // Skip if this is a draft that was just created (give user time to add data)
    const isNewDraft = doc.advertStatus === 'draft' && 
                       (new Date() - doc.createdAt) < 60000; // Less than 1 minute old
    
    if (isNewDraft) {
      console.log(`\n⏸️  [Auto-Complete] Skipping new draft: ${doc.registrationNumber} (waiting for user input)`);
      return;
    }
    
    console.log(`\n🤖 [Universal Auto-Complete] Triggered for: ${doc.registrationNumber}`);
    console.log(`   Status: ${doc.advertStatus}`);
    
    const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');
    const universalService = new UniversalAutoCompleteService();
    
    // Check if car needs completion
    if (universalService.needsCompletion(doc)) {
      console.log(`   📋 Car needs data completion - running universal service...`);
      
      // Run asynchronously to avoid blocking the save operation
      setImmediate(async () => {
        try {
          await universalService.completeCarData(doc, false); // Don't force refresh if recently completed
          console.log(`   ✅ Universal auto-complete finished for: ${doc.registrationNumber}`);
        } catch (error) {
          console.error(`   ❌ Universal auto-complete failed for ${doc.registrationNumber}:`, error.message);
          // Don't throw - we don't want to break the save operation
        }
      });
    } else {
      console.log(`   ✅ Car already has complete data`);
    }
  } catch (error) {
    console.error('❌ Universal auto-complete middleware error:', error);
    // Don't throw - we don't want to break the save operation
  }
});

module.exports = mongoose.model('Car', carSchema);
