const mongoose = require('mongoose');

const vanSchema = new mongoose.Schema({
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
    enum: ['automatic', 'manual'],
    default: 'manual'
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid']
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
        return images.length <= 10;
      },
      message: 'Maximum 10 images allowed per van'
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

module.exports = mongoose.model('Van', vanSchema);
