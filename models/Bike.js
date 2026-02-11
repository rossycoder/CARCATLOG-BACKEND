const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  make: {
    type: String,
    required: [true, 'Make is required'],
    trim: true,
    index: true
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true,
    index: true
  },
  submodel: {
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
    enum: ['Petrol', 'Electric', 'Hybrid', 'Petrol Hybrid', 'Diesel Hybrid', 'Plug-in Hybrid', 'Petrol Plug-in Hybrid', 'Diesel Plug-in Hybrid']
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
    enum: ['Sport', 'Cruiser', 'Adventure', 'Touring', 'Naked', 'Scooter', 'Off-road', 'Classic', 'Commuter', 'Other'],
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
    required: [true, 'User ID is required'],
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
  // Running costs data
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

  // MOT History - Full array like cars
  motHistory: [{
    testDate: { type: Date },
    expiryDate: { type: Date },
    testResult: { 
      type: String, 
      enum: ['PASS', 'FAIL', 'ADVISORY', 'PRS', 'ABA'] 
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
        enum: ['FAIL', 'ADVISORY', 'USER ENTERED', 'MINOR', 'MAJOR'] 
      },
      dangerous: { type: Boolean, default: false }
    }],
    rfrAndComments: [{
      text: String,
      type: { 
        type: String, 
        enum: ['FAIL', 'ADVISORY', 'USER ENTERED', 'MINOR', 'MAJOR'] 
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
    enum: ['pending', 'completed', 'failed', 'not_requested'],
    default: 'not_requested'
  },
  historyCheckDate: { type: Date },
  historyCheckData: {
    writeOffCategory: { type: String },
    writeOffDetails: { type: String },
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
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate display title
bikeSchema.pre('save', function(next) {
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
