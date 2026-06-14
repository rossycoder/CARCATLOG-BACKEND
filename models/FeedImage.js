const mongoose = require('mongoose');

const FeedImageSchema = new mongoose.Schema({
  feedVehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedVehicle',
    required: true,
    index: true
  },
  sourceUrl: {
    type: String,
    required: true,
    maxlength: 500
  },
  localPath: {
    type: String,
    maxlength: 500
  },
  imageOrder: {
    type: Number,
    default: 0
  },
  downloadStatus: {
    type: String,
    enum: ['pending', 'downloaded', 'failed'],
    default: 'pending',
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FeedImage', FeedImageSchema);
