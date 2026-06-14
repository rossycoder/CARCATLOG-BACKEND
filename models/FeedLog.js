const mongoose = require('mongoose');

const FeedLogSchema = new mongoose.Schema({
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeDealer',
    required: true,
    index: true
  },
  feedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DealerFeed'
  },
  syncTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    required: true,
    index: true
  },
  vehiclesFound: {
    type: Number,
    default: 0
  },
  vehiclesImported: {
    type: Number,
    default: 0
  },
  vehiclesUpdated: {
    type: Number,
    default: 0
  },
  vehiclesArchived: {
    type: Number,
    default: 0
  },
  imagesImported: {
    type: Number,
    default: 0
  },
  feedErrors: [{
    stockId: String,
    error: String
  }],
  durationMs: {
    type: Number
  }
}, { 
  timestamps: true,
  suppressReservedKeysWarning: true
});

module.exports = mongoose.model('FeedLog', FeedLogSchema);
