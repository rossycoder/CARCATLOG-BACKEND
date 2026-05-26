require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');

async function verifyTradeDealerEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'rossy4586879@gmail.com';

    const dealer = await TradeDealer.findOne({ email: email.toLowerCase() });

    if (!dealer) {
      console.log('❌ Trade dealer not found with email:', email);
      return;
    }

    console.log('Found dealer:', dealer.businessName, '|', dealer.email);
    console.log('Current emailVerified:', dealer.emailVerified);
    console.log('Current status:', dealer.status);

    dealer.emailVerified = true;
    dealer.status = 'active';
    dealer.emailVerificationToken = undefined;
    dealer.emailVerificationExpires = undefined;
    await dealer.save();

    console.log('✅ Email verified and status set to active for:', email);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

verifyTradeDealerEmail();
