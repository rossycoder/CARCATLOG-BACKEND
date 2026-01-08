const mongoose = require('mongoose');

const tradeSubscriptionSchema = new mongoose.Schema({
  // Dealer
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeDealer',
    required: true,
    index: true
  },
  
  // Plan
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  
  // Stripe
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  stripeCustomerId: {
    type: String,
    required: true,
    index: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'past_due', 'cancelled', 'expired', 'trialing'],
    default: 'active',
    index: true
  },
  
  // Billing
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date
  },
  
  // Usage
  listingsUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  listingsLimit: {
    type: Number,
    default: null // null for unlimited
  },
  
  // Trial
  trialStart: {
    type: Date
  },
  trialEnd: {
    type: Date
  },
  
  // Metadata
  metadata: {
    type: Map,
    of: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiredAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
tradeSubscriptionSchema.index({ dealerId: 1, status: 1 });
tradeSubscriptionSchema.index({ stripeSubscriptionId: 1 });
tradeSubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

// Virtual for days remaining
tradeSubscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.currentPeriodEnd) return 0;
  const now = new Date();
  const diff = this.currentPeriodEnd - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for is active
tradeSubscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' || this.status === 'trialing';
});

// Virtual for listings available
tradeSubscriptionSchema.virtual('listingsAvailable').get(function() {
  if (this.listingsLimit === null) return Infinity;
  return Math.max(0, this.listingsLimit - this.listingsUsed);
});

// Virtual for usage percentage
tradeSubscriptionSchema.virtual('usagePercentage').get(function() {
  if (this.listingsLimit === null) return 0;
  if (this.listingsLimit === 0) return 100;
  return Math.round((this.listingsUsed / this.listingsLimit) * 100);
});

// Method to check if can add listing
tradeSubscriptionSchema.methods.canAddListing = function() {
  if (this.status !== 'active' && this.status !== 'trialing') {
    return { allowed: false, reason: 'Subscription is not active' };
  }
  
  if (this.listingsLimit === null) {
    return { allowed: true };
  }
  
  if (this.listingsUsed >= this.listingsLimit) {
    return { allowed: false, reason: 'Listing limit reached' };
  }
  
  return { allowed: true };
};

// Method to increment listing count
tradeSubscriptionSchema.methods.incrementListingCount = async function() {
  this.listingsUsed += 1;
  await this.save();
};

// Method to decrement listing count
tradeSubscriptionSchema.methods.decrementListingCount = async function() {
  if (this.listingsUsed > 0) {
    this.listingsUsed -= 1;
    await this.save();
  }
};

// Method to update usage from database
tradeSubscriptionSchema.methods.syncUsage = async function() {
  const Car = mongoose.model('Car');
  const count = await Car.countDocuments({
    dealerId: this.dealerId,
    advertStatus: 'active'
  });
  
  this.listingsUsed = count;
  await this.save();
};

// Static method to find active subscription for dealer
tradeSubscriptionSchema.statics.findActiveForDealer = function(dealerId) {
  return this.findOne({
    dealerId,
    status: { $in: ['active', 'trialing'] }
  }).populate('planId');
};

// Static method to find expiring subscriptions
tradeSubscriptionSchema.statics.findExpiringSoon = function(days = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.find({
    status: 'active',
    currentPeriodEnd: {
      $gte: now,
      $lte: futureDate
    },
    cancelAtPeriodEnd: false
  }).populate('dealerId planId');
};

module.exports = mongoose.model('TradeSubscription', tradeSubscriptionSchema);
