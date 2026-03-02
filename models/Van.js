const mongoose = require('mongoose');

const vanSchema = new mongoose.Schema({
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
    enum: ['Automatic', 'Manual', 'automatic', 'manual'],
    default: 'Manual'
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
      message: 'Maximum 100 images allowed per van'
    }
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
  // Van-specific fields
  vanType: {
    type: String,
    enum: ['Panel Van', 'Crew Van', 'Dropside', 'Tipper', 'Luton', 'Minibus', 'Pickup', 'Chassis Cab', 'Other'],
    required: [true, 'Van type is required']
  },
  payloadCapacity: {
    type: Number,
    min: 0
  },
  loadLength: {
    type: Number,
    min: 0
  },
  loadWidth: {
    type: Number,
    min: 0
  },
  loadHeight: {
    type: Number,
    min: 0
  },
  wheelbase: {
    type: String,
    enum: ['Short', 'Medium', 'Long', 'Extra Long']
  },
  roofHeight: {
    type: String,
    enum: ['Low', 'Medium', 'High']
  },
  // DVLA-specific fields
  registrationNumber: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true
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
    ref: 'TradeDealer'
  },
  isDealerListing: {
    type: Boolean,
    default: false
  },
  
  // Private Seller Fields
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  
  // Enhanced running costs data
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
  
  // MOT fields
  motDue: {
    type: Date
  },
  motExpiry: {
    type: Date
  },
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
      enum: ['PASSED', 'FAILED', 'REFUSED', 'PASS', 'FAIL'],
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
    motTestNumber: {
      type: String,
      trim: true
    },
    defects: [{
      type: {
        type: String,
        enum: ['ADVISORY', 'MINOR', 'MAJOR', 'DANGEROUS', 'FAIL', 'FAILED', 'PRS', 'USER ENTERED']
      },
      text: String,
      dangerous: {
        type: Boolean,
        default: false
      }
    }],
    advisoryText: [String],
    rfrAndComments: [{
      text: String,
      type: { 
        type: String, 
        enum: ['FAIL', 'FAILED', 'ADVISORY', 'USER ENTERED', 'MINOR', 'MAJOR', 'DANGEROUS']
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
  historyCheckId: { 
    type: String 
  },
  historyCheckStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'not_requested', 'verified', 'not_required'],
    default: 'not_requested'
  },
  historyCheckDate: { 
    type: Date 
  },
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
    isWrittenOff: { type: Boolean, default: false },
    colourChanges: { type: Number },
    plateChanges: { type: Number },
    outstandingFinance: { type: Boolean, default: false }
  },
  
  // Enhanced Vehicle Data
  variant: {
    type: String,
    trim: true
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
        // Validate YouTube URL format
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(v);
      },
      message: 'Please provide a valid YouTube URL'
    }
  },
  
  // VAT Status (for trade dealers)
  vatStatus: {
    type: String,
    enum: ['no_vat', 'plus_vat', 'including_vat'],
    default: 'no_vat'
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

// Pre-save middleware to normalize van data and generate display title
vanSchema.pre('save', async function(next) {
  console.log(`🔧 [Van Pre-Save Hook] Starting for ${this.make} ${this.model} (${this.registrationNumber})`);
  
  // CRITICAL: Normalize make names
  if (this.make) {
    const makeUpper = this.make.toUpperCase().trim();
    
    // Common van makes normalization
    const makeNormalization = {
      'FORD': 'Ford',
      'MERCEDES-BENZ': 'Mercedes-Benz',
      'MERCEDES BENZ': 'Mercedes-Benz',
      'MERCEDES': 'Mercedes-Benz',
      'VOLKSWAGEN': 'Volkswagen',
      'VW': 'Volkswagen',
      'RENAULT': 'Renault',
      'PEUGEOT': 'Peugeot',
      'CITROEN': 'Citroen',
      'CITROËN': 'Citroen',
      'VAUXHALL': 'Vauxhall',
      'FIAT': 'Fiat',
      'NISSAN': 'Nissan',
      'TOYOTA': 'Toyota',
      'IVECO': 'Iveco',
      'MAN': 'MAN',
      'DAF': 'DAF',
      'MITSUBISHI': 'Mitsubishi'
    };
    
    if (makeNormalization[makeUpper]) {
      const oldMake = this.make;
      this.make = makeNormalization[makeUpper];
      if (oldMake !== this.make) {
        console.log(`✅ [Van Make] Normalized: "${oldMake}" → "${this.make}"`);
      }
    }
  }
  
  // CRITICAL: Normalize fuel type
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
        console.log(`✅ [Van Fuel] Normalized: "${oldFuel}" → "${this.fuelType}"`);
      }
    }
  }
  
  // CRITICAL: Auto-fetch coordinates from postcode if missing
  if (this.postcode && this.isNew) {
    const needsCoordinates = !this.latitude || !this.longitude;
    const needsLocationName = !this.locationName;
    
    if (needsCoordinates || needsLocationName) {
      try {
        console.log(`📍 [Van Model] Fetching coordinates for postcode: ${this.postcode}`);
        const postcodeService = require('../services/postcodeService');
        const postcodeData = await postcodeService.lookupPostcode(this.postcode);
        
        if (postcodeData) {
          this.latitude = postcodeData.latitude;
          this.longitude = postcodeData.longitude;
          
          this.location = {
            type: 'Point',
            coordinates: [postcodeData.longitude, postcodeData.latitude]
          };
          
          this.locationName = postcodeData.locationName;
          
          console.log(`✅ [Van Model] Coordinates set: ${postcodeData.latitude}, ${postcodeData.longitude}`);
          console.log(`✅ [Van Model] Location name set: ${postcodeData.locationName}`);
        } else {
          console.log(`⚠️  [Van Model] Could not fetch coordinates for postcode: ${this.postcode}`);
        }
      } catch (error) {
        console.error(`❌ [Van Model] Error fetching coordinates:`, error.message);
      }
    }
  }
  
  // Generate display title
  if (this.make && this.model) {
    let title = `${this.make} ${this.model}`;
    if (this.submodel) {
      title += ` ${this.submodel}`;
    }
    if (this.year) {
      title += ` (${this.year})`;
    }
    if (this.vanType) {
      title += ` ${this.vanType}`;
    }
    this.displayTitle = title;
  }
  
  next();
});

// Indexes for faster queries
vanSchema.index({ make: 1, model: 1 });
vanSchema.index({ make: 1, model: 1, submodel: 1 });
vanSchema.index({ year: 1 });
vanSchema.index({ price: 1 });
vanSchema.index({ location: '2dsphere' });
vanSchema.index({ condition: 1 });
vanSchema.index({ fuelType: 1 });
vanSchema.index({ vanType: 1 });
vanSchema.index({ payloadCapacity: 1 });
vanSchema.index({ status: 1 });
vanSchema.index({ dealerId: 1, status: 1 });
vanSchema.index({ registrationNumber: 1 });
vanSchema.index({ historyCheckStatus: 1 });
vanSchema.index({ 'motHistory.expiryDate': 1 });
vanSchema.index({ userId: 1 });

module.exports = mongoose.model('Van', vanSchema);
