const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  // Plan Details
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'gbp',
    uppercase: true
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  
  // Limits
  listingLimit: {
    type: Number,
    default: null // null means unlimited
  },
  
  // Features
  features: [{
    type: String,
    trim: true
  }],
  
  // Stripe Integration
  stripePriceId: {
    type: String,
    required: [true, 'Stripe price ID is required'],
    unique: true
  },
  stripeProductId: {
    type: String,
    required: [true, 'Stripe product ID is required']
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  
  // Display
  displayOrder: {
    type: Number,
    default: 0
  },
  badge: {
    type: String,
    trim: true // e.g., "Most Popular", "Best Value"
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

// Indexes
// Note: slug already has unique: true which creates an index automatically
subscriptionPlanSchema.index({ isActive: 1, displayOrder: 1 });

// Virtual for formatted price
subscriptionPlanSchema.virtual('priceFormatted').get(function() {
  return `£${(this.price / 100).toFixed(2)}`;
});

// Virtual for listing limit display
subscriptionPlanSchema.virtual('listingLimitDisplay').get(function() {
  return this.listingLimit === null ? 'Unlimited' : this.listingLimit.toString();
});

// Static method to get active plans
subscriptionPlanSchema.statics.getActivePlans = function() {
  return this.find({ isActive: true }).sort({ displayOrder: 1 });
};

// Static method to get plan by slug
subscriptionPlanSchema.statics.getBySlug = function(slug) {
  return this.findOne({ slug, isActive: true });
};

// Pre-save hook to generate slug
subscriptionPlanSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
