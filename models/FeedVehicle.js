const mongoose = require('mongoose');

const FeedVehicleSchema = new mongoose.Schema({
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeDealer',
    required: true,
    index: true
  },
  feedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DealerFeed',
    required: true,
    index: true
  },
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  },
  stockId: {
    type: String,
    required: true,
    maxlength: 100
  },
  registration: {
    type: String,
    maxlength: 20,
    index: true
  },
  vin: {
    type: String,
    maxlength: 17,
    index: true
  },
  make: {
    type: String,
    maxlength: 100
  },
  model: {
    type: String,
    maxlength: 100
  },
  derivative: {
    type: String,
    maxlength: 200
  },
  year: {
    type: Number
  },
  mileage: {
    type: Number
  },
  fuelType: {
    type: String,
    maxlength: 50
  },
  transmission: {
    type: String,
    maxlength: 50
  },
  colour: {
    type: String,
    maxlength: 100
  },
  price: {
    type: Number
  },
  description: {
    type: String
  },
  // Enhanced feed import fields
  vehicleData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  hasVehicleData: {
    type: Boolean,
    default: false
  },
  vehicleDataKeys: {
    type: [String],
    default: []
  },
  images: [{
    url: { type: String },
    sourceUrl: { type: String },
    processedUrl: { type: String },
    order: { type: Number, default: 0 },
    downloadStatus: { 
      type: String, 
      enum: ['pending', 'completed', 'failed'], 
      default: 'pending' 
    }
  }],
  imageProcessingInfo: {
    totalProcessed: { type: Number, default: 0 },
    failedImages: { type: Number, default: 0 },
    unsplashUsed: { type: Boolean, default: false }
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed
  },
  lastSeenInFeed: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'archived'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

// Compound index for unique stock ID per dealer
FeedVehicleSchema.index({ dealerId: 1, stockId: 1 }, { unique: true });

module.exports = mongoose.model('FeedVehicle', FeedVehicleSchema);
