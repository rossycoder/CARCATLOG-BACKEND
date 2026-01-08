const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tradeDealerSchema = new mongoose.Schema({
  // Business Information
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    index: true
  },
  tradingName: {
    type: String,
    trim: true
  },
  businessAddress: {
    street: String,
    city: String,
    postcode: {
      type: String,
      uppercase: true,
      trim: true
    },
    country: {
      type: String,
      default: 'United Kingdom'
    }
  },
  
  // Contact Information
  contactPerson: {
    type: String,
    required: [true, 'Contact person name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  
  // Business Details
  businessRegistrationNumber: {
    type: String,
    trim: true
  },
  vatNumber: {
    type: String,
    trim: true
  },
  
  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    default: 'trade_dealer',
    enum: ['trade_dealer', 'trade_admin']
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'cancelled'],
    default: 'pending'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  
  // Password Reset
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  // Subscription
  currentSubscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeSubscription'
  },
  
  // Branding
  logo: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  website: {
    type: String,
    trim: true
  },
  
  // Statistics
  stats: {
    totalListings: {
      type: Number,
      default: 0
    },
    activeListings: {
      type: Number,
      default: 0
    },
    soldListings: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    }
  },
  
  // Timestamps
  lastLoginAt: {
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

// Indexes
tradeDealerSchema.index({ email: 1 });
tradeDealerSchema.index({ status: 1 });
tradeDealerSchema.index({ businessName: 1 });

// Hash password before saving
tradeDealerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
tradeDealerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate email verification token
tradeDealerSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return token;
};

// Method to generate password reset token
tradeDealerSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return token;
};

// Virtual for full address
tradeDealerSchema.virtual('fullAddress').get(function() {
  if (!this.businessAddress) return '';
  
  const parts = [
    this.businessAddress.street,
    this.businessAddress.city,
    this.businessAddress.postcode,
    this.businessAddress.country
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Method to update stats
tradeDealerSchema.methods.updateStats = async function() {
  const Car = mongoose.model('Car');
  
  const stats = await Car.aggregate([
    { $match: { dealerId: this._id } },
    {
      $group: {
        _id: null,
        totalListings: { $sum: 1 },
        activeListings: {
          $sum: { $cond: [{ $eq: ['$advertStatus', 'active'] }, 1, 0] }
        },
        soldListings: {
          $sum: { $cond: [{ $eq: ['$advertStatus', 'sold'] }, 1, 0] }
        },
        totalViews: { $sum: '$viewCount' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.stats = {
      totalListings: stats[0].totalListings || 0,
      activeListings: stats[0].activeListings || 0,
      soldListings: stats[0].soldListings || 0,
      totalViews: stats[0].totalViews || 0
    };
  }
  
  await this.save();
};

module.exports = mongoose.model('TradeDealer', tradeDealerSchema);
