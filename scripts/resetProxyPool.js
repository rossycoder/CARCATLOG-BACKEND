require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const PhoneNumberPool = require('../models/PhoneNumberPool');
const CallSession = require('../models/CallSession');

async function resetProxyPool() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Expire any active sessions that are past their expiry
    const expiredResult = await CallSession.updateMany(
      { status: 'active', expiresAt: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );
    console.log(`📋 Marked ${expiredResult.modifiedCount} session(s) as expired`);

    // Reset ALL pool numbers to available
    const resetResult = await PhoneNumberPool.updateMany(
      { status: 'in_use' },
      { $set: { status: 'available' } }
    );
    console.log(`🔄 Reset ${resetResult.modifiedCount} proxy number(s) to available`);

    const available = await PhoneNumberPool.countDocuments({ status: 'available' });
    console.log(`📞 Total available numbers now: ${available}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Done');
  }
}

resetProxyPool();
