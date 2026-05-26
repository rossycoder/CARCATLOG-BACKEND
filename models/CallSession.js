const mongoose = require('mongoose');

const callSessionSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Car'
  },
  sellerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  sellerRealNumber: {
    type: String,
    required: true,
    select: false // Never expose in queries unless explicitly requested
  },
  buyerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  buyerPhone: {
    type: String,
    default: null
  },
  proxyNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'completed'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  callCount: {
    type: Number,
    default: 0
  },
  lastCalledAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

callSessionSchema.index({ proxyNumber: 1, status: 1 });
callSessionSchema.index({ expiresAt: 1, status: 1 });
callSessionSchema.index({ listingId: 1, buyerUserId: 1 });

module.exports = mongoose.model('CallSession', callSessionSchema);
