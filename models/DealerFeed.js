const mongoose = require('mongoose');

const DealerFeedSchema = new mongoose.Schema({
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeDealer',
    required: true,
    index: true
  },
  feedUrl: {
    type: String,
    required: true,
    maxlength: 500
  },
  feedType: {
    type: String,
    enum: ['xml', 'csv', 'json', 'auto'],
    default: 'auto'
  },
  provider: {
    type: String,
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'active',
    index: true
  },
  lastSync: {
    type: Date
  },
  syncIntervalMinutes: {
    type: Number,
    default: 15
  },
  autoImportEnabled: {
    type: Boolean,
    default: false
  },
  removeSoldVehicles: {
    type: Boolean,
    default: true
  },
  importImages: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for finding feeds to sync
DealerFeedSchema.index({ dealerId: 1, status: 1 });
DealerFeedSchema.index({ autoImportEnabled: 1, status: 1 });

module.exports = mongoose.model('DealerFeed', DealerFeedSchema);
