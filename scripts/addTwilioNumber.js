require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const PhoneNumberPool = require('../models/PhoneNumberPool');

async function addTwilioNumber() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const number = '+442033769455';

    const existing = await PhoneNumberPool.findOne({ proxyNumber: number });
    if (existing) {
      console.log('⚠️  Number already exists in pool:', number);
      console.log('   Status:', existing.status);
      return;
    }

    const poolEntry = await PhoneNumberPool.create({
      proxyNumber: number,
      status: 'available',
      provider: 'twilio'
    });

    console.log('✅ Number added to pool:', poolEntry.proxyNumber);
    console.log('   Status:', poolEntry.status);

    const count = await PhoneNumberPool.countDocuments({ status: 'available' });
    console.log('📞 Total available numbers in pool:', count);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Done');
  }
}

addTwilioNumber();
