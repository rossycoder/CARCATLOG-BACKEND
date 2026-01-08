const mongoose = require('mongoose');

const listingViewSchema = new mongoose.Schema({
  // Listing
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true,
    index: true
  },
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeDealer',
    required: true,
    index: true
  },
  
  // View Details
  viewedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  // User Info (if available)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String,
    index: true
  },
  
  // Technical
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  referrer: {
    type: String
  },
  
  // Location (if available)
  country: {
    type: String
  },
  city: {
    type: String
  },
  
  // Device Info
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown'
  },
  browser: {
    type: String
  },
  os: {
    type: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Compound indexes for analytics queries
listingViewSchema.index({ carId: 1, viewedAt: -1 });
listingViewSchema.index({ dealerId: 1, viewedAt: -1 });
listingViewSchema.index({ carId: 1, sessionId: 1 });
listingViewSchema.index({ viewedAt: -1 });

// TTL index to automatically delete old views after 90 days
listingViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method to track a view
listingViewSchema.statics.trackView = async function(data) {
  const view = new this(data);
  await view.save();
  
  // Update car view count
  const Car = mongoose.model('Car');
  await Car.findByIdAndUpdate(data.carId, {
    $inc: { viewCount: 1 },
    lastViewedAt: new Date()
  });
  
  return view;
};

// Static method to get views for a listing
listingViewSchema.statics.getViewsForListing = function(carId, startDate, endDate) {
  const query = { carId };
  
  if (startDate || endDate) {
    query.viewedAt = {};
    if (startDate) query.viewedAt.$gte = startDate;
    if (endDate) query.viewedAt.$lte = endDate;
  }
  
  return this.find(query).sort({ viewedAt: -1 });
};

// Static method to get unique views for a listing
listingViewSchema.statics.getUniqueViewsForListing = async function(carId, startDate, endDate) {
  const match = { carId };
  
  if (startDate || endDate) {
    match.viewedAt = {};
    if (startDate) match.viewedAt.$gte = startDate;
    if (endDate) match.viewedAt.$lte = endDate;
  }
  
  const result = await this.aggregate([
    { $match: match },
    { $group: { _id: '$sessionId' } },
    { $count: 'uniqueViews' }
  ]);
  
  return result.length > 0 ? result[0].uniqueViews : 0;
};

// Static method to get view trends
listingViewSchema.statics.getViewTrends = async function(carId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        carId: new mongoose.Types.ObjectId(carId),
        viewedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$viewedAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to get dealer analytics
listingViewSchema.statics.getDealerAnalytics = async function(dealerId, startDate, endDate) {
  const match = { dealerId };
  
  if (startDate || endDate) {
    match.viewedAt = {};
    if (startDate) match.viewedAt.$gte = startDate;
    if (endDate) match.viewedAt.$lte = endDate;
  }
  
  const [totalViews, uniqueViews, viewsByListing, viewsByDay] = await Promise.all([
    // Total views
    this.countDocuments(match),
    
    // Unique views
    this.aggregate([
      { $match: match },
      { $group: { _id: '$sessionId' } },
      { $count: 'count' }
    ]),
    
    // Views by listing
    this.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$carId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    
    // Views by day
    this.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$viewedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);
  
  return {
    totalViews,
    uniqueViews: uniqueViews.length > 0 ? uniqueViews[0].count : 0,
    viewsByListing,
    viewsByDay
  };
};

module.exports = mongoose.model('ListingView', listingViewSchema);
