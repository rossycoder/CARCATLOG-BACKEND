const twilio = require('twilio');
const PhoneNumberPool = require('../models/PhoneNumberPool');
const CallSession = require('../models/CallSession');
const Car = require('../models/Car');

const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * POST /api/calls/create-session
 * Buyer requests a proxy number to call seller
 */
exports.createSession = async (req, res) => {
  try {
    const { listingId } = req.body;
    const buyerUserId = req.user?.id || null;

    if (!listingId) {
      return res.status(400).json({ success: false, message: 'listingId is required' });
    }

    // Get listing with seller phone — select it explicitly since it may be hidden
    const listing = await Car.findById(listingId)
      .select('+sellerContact.phone sellerContact userId dealerId')
      .lean();

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const sellerRealNumber = listing.sellerContact?.phone;
    if (!sellerRealNumber) {
      return res.status(400).json({ success: false, message: 'Seller has no phone number on file' });
    }

    const sellerUserId = listing.userId || listing.dealerId;

    // Check if buyer already has an active session for this listing (reuse it)
    if (buyerUserId) {
      const existing = await CallSession.findOne({
        listingId,
        buyerUserId,
        status: 'active',
        expiresAt: { $gt: new Date() }
      });

      if (existing) {
        const remainingMs = existing.expiresAt - Date.now();
        return res.json({
          success: true,
          proxyNumber: existing.proxyNumber,
          expiresIn: Math.floor(remainingMs / 1000),
          sessionId: existing._id
        });
      }
    }

    // Get an available proxy number from pool
    const poolEntry = await PhoneNumberPool.findOneAndUpdate(
      { status: 'available' },
      { $set: { status: 'in_use' } },
      { new: true }
    );

    if (!poolEntry) {
      return res.status(503).json({
        success: false,
        message: 'All proxy numbers are currently in use. Please try again in a few minutes.'
      });
    }

    // Create session
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const session = await CallSession.create({
      listingId,
      sellerUserId,
      sellerRealNumber, // stored encrypted-at-rest by MongoDB, never returned to frontend
      buyerUserId,
      proxyNumber: poolEntry.proxyNumber,
      expiresAt
    });

    res.json({
      success: true,
      proxyNumber: poolEntry.proxyNumber,
      expiresIn: SESSION_DURATION_MS / 1000, // seconds
      sessionId: session._id
    });

  } catch (error) {
    console.error('❌ Create call session error:', error);
    res.status(500).json({ success: false, message: 'Error creating call session' });
  }
};

/**
 * POST /api/calls/webhook/voice
 * Twilio calls this when buyer dials the proxy number
 * MUST be publicly accessible (no auth middleware)
 */
exports.voiceWebhook = async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  try {
    const calledNumber = req.body.To; // The proxy number that was dialled
    const callerNumber = req.body.From;

    // Find active session for this proxy number
    const session = await CallSession.findOne({
      proxyNumber: calledNumber,
      status: 'active',
      expiresAt: { $gt: new Date() }
    }).select('+sellerRealNumber');

    if (!session) {
      twiml.say({ voice: 'alice', language: 'en-GB' },
        'Sorry, this call session has expired. Please visit the listing to get a new number.');
      return res.type('text/xml').send(twiml.toString());
    }

    // Update call stats
    await CallSession.findByIdAndUpdate(session._id, {
      $inc: { callCount: 1 },
      $set: { lastCalledAt: new Date(), buyerPhone: callerNumber }
    });

    // Optional whisper: announce to seller this is a CarCatalog call
    const dial = twiml.dial({
      callerId: calledNumber, // Show proxy number to seller, not buyer's real number
      timeout: 30,
      record: process.env.TWILIO_RECORD_CALLS === 'true' ? 'record-from-answer' : 'do-not-record'
    });

    dial.number({
      url: `${process.env.BACKEND_URL || ''}/api/calls/webhook/whisper`
    }, session.sellerRealNumber);

    res.type('text/xml').send(twiml.toString());

  } catch (error) {
    console.error('❌ Voice webhook error:', error);
    twiml.say({ voice: 'alice', language: 'en-GB' }, 'Sorry, an error occurred. Please try again.');
    res.type('text/xml').send(twiml.toString());
  }
};

/**
 * POST /api/calls/webhook/whisper
 * Plays a message to the seller before connecting
 */
exports.whisperWebhook = async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  twiml.say({ voice: 'alice', language: 'en-GB' },
    'You have an incoming call from a CarCatalog buyer.');
  res.type('text/xml').send(twiml.toString());
};

/**
 * GET /api/calls/session/:listingId
 * Check if buyer has an active session for a listing
 */
exports.getSession = async (req, res) => {
  try {
    const { listingId } = req.params;
    const buyerUserId = req.user?.id;

    const session = await CallSession.findOne({
      listingId,
      buyerUserId,
      status: 'active',
      expiresAt: { $gt: new Date() }
    }).select('-sellerRealNumber');

    if (!session) {
      return res.json({ success: true, session: null });
    }

    res.json({
      success: true,
      session: {
        proxyNumber: session.proxyNumber,
        expiresIn: Math.floor((session.expiresAt - Date.now()) / 1000)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching session' });
  }
};

/**
 * GET /api/calls/pool/status (admin only)
 */
exports.poolStatus = async (req, res) => {
  try {
    const [available, inUse, total] = await Promise.all([
      PhoneNumberPool.countDocuments({ status: 'available' }),
      PhoneNumberPool.countDocuments({ status: 'in_use' }),
      PhoneNumberPool.countDocuments()
    ]);

    const numbers = await PhoneNumberPool.find().lean();

    res.json({ success: true, available, inUse, total, numbers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching pool status' });
  }
};

/**
 * POST /api/calls/pool/add (admin only)
 * Manually add a number to the pool
 */
exports.addToPool = async (req, res) => {
  try {
    const { proxyNumber, twilioSid } = req.body;
    if (!proxyNumber) {
      return res.status(400).json({ success: false, message: 'proxyNumber is required' });
    }

    const entry = await PhoneNumberPool.create({
      proxyNumber,
      twilioSid: twilioSid || null,
      status: 'available'
    });

    res.json({ success: true, entry });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Number already in pool' });
    }
    res.status(500).json({ success: false, message: 'Error adding number' });
  }
};
