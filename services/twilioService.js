const twilio = require('twilio');

let client = null;

const getClient = () => {
  if (!client) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
};

/**
 * Buy a new UK phone number and add to pool
 */
const buyUKNumber = async (areaCode = null) => {
  const twilioClient = getClient();
  const PhoneNumberPool = require('../models/PhoneNumberPool');

  const searchParams = { country: 'GB', limit: 1 };
  if (areaCode) searchParams.areaCode = areaCode;

  const available = await twilioClient.availablePhoneNumbers('GB')
    .local.list(searchParams);

  if (!available.length) {
    throw new Error('No UK numbers available to purchase');
  }

  const purchased = await twilioClient.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
    voiceUrl: `${process.env.BACKEND_URL || process.env.FRONTEND_URL?.replace('3000', '5000')}/api/calls/webhook/voice`,
    voiceMethod: 'POST'
  });

  const poolEntry = await PhoneNumberPool.create({
    proxyNumber: purchased.phoneNumber,
    twilioSid: purchased.sid,
    status: 'available'
  });

  return poolEntry;
};

/**
 * Get available number count
 */
const getAvailableCount = async () => {
  const PhoneNumberPool = require('../models/PhoneNumberPool');
  return PhoneNumberPool.countDocuments({ status: 'available' });
};

module.exports = { getClient, buyUKNumber, getAvailableCount };
