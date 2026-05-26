const mongoose = require('mongoose');

const phoneNumberPoolSchema = new mongoose.Schema({
  proxyNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  twilioSid: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'in_use'],
    default: 'available'
  }
}, { timestamps: true });

phoneNumberPoolSchema.index({ status: 1 });

module.exports = mongoose.model('PhoneNumberPool', phoneNumberPoolSchema);
