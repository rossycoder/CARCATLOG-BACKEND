const mongoose = require('mongoose');

const advertisingPackagePurchaseSchema = new mongoose.Schema({
  // Stripe Information
  stripeSessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  stripePaymentIntentId: {
    type: String,
    index: true
  },
  customSessionId: {
    type: String,
    required: true,
    index: true
  },

  // Package Details
  packageId: {
    type: String,
    required: true,
    enum: ['bronze', 'silver', 'gold']
  },
  packageName: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },

  // Pricing
  amount: {
    type: Number,
    required: true // Amount in pence
  },
  currency: {
    type: String,
    default: 'gbp'
  },

  // Seller Information
  sellerType: {
    type: String,
    required: true,
    enum: ['private', 'trade']
  },
  vehicleValue: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['car', 'bike'],
    default: 'car'
  },

  // Vehicle Details (Optional)
  registration: {
    type: String,
    uppercase: true,
    trim: true
  },
  mileage: {
    type: String
  },

  // Customer Information
  customerEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  customerName: {
    type: String,
    trim: true
  },

  // Payment Status
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  },

  // Package Status
  packageStatus: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  activatedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },

  // Metadata
  metadata: {
    type: Map,
    of: String
  },

  // Refund Information
  refundId: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  refundReason: {
    type: String
  },

  // Timestamps
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

// Indexes for efficient queries
advertisingPackagePurchaseSchema.index({ customerEmail: 1, createdAt: -1 });
advertisingPackagePurchaseSchema.index({ registration: 1 });
advertisingPackagePurchaseSchema.index({ paymentStatus: 1, packageStatus: 1 });
advertisingPackagePurchaseSchema.index({ createdAt: -1 });

// Virtual for formatted amount
advertisingPackagePurchaseSchema.virtual('amountFormatted').get(function() {
  return `£${(this.amount / 100).toFixed(2)}`;
});

// Method to activate package
advertisingPackagePurchaseSchema.methods.activatePackage = function() {
  this.packageStatus = 'active';
  this.activatedAt = new Date();
  
  // Calculate expiry date based on duration
  if (this.duration.includes('week')) {
    const weeks = parseInt(this.duration);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (weeks * 7));
    this.expiresAt = expiryDate;
  } else if (this.duration.toLowerCase().includes('until sold')) {
    // No expiry for "until sold" packages
    this.expiresAt = null;
  }
  
  return this.save();
};

// Method to mark as paid
advertisingPackagePurchaseSchema.methods.markAsPaid = function(paymentIntentId) {
  this.paymentStatus = 'paid';
  this.paidAt = new Date();
  this.stripePaymentIntentId = paymentIntentId;
  return this.save();
};

// Static method to find by session ID
advertisingPackagePurchaseSchema.statics.findBySessionId = function(sessionId) {
  return this.findOne({ 
    $or: [
      { stripeSessionId: sessionId },
      { customSessionId: sessionId }
    ]
  });
};

// Static method to get active packages for email
advertisingPackagePurchaseSchema.statics.getActivePackagesByEmail = function(email) {
  return this.find({
    customerEmail: email,
    packageStatus: 'active',
    paymentStatus: 'paid'
  }).sort({ createdAt: -1 });
};

const AdvertisingPackagePurchase = mongoose.model('AdvertisingPackagePurchase', advertisingPackagePurchaseSchema);

module.exports = AdvertisingPackagePurchase;
