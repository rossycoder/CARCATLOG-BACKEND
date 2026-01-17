require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');

async function testLogoUploadFlow() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find all dealers and check their logo field
    const dealers = await TradeDealer.find({}).select('businessName email logo createdAt');
    
    console.log(`📊 Found ${dealers.length} trade dealers:\n`);
    
    dealers.forEach((dealer, index) => {
      console.log(`${index + 1}. ${dealer.businessName}`);
      console.log(`   Email: ${dealer.email}`);
      console.log(`   Logo: ${dealer.logo || 'null'}`);
      console.log(`   Created: ${dealer.createdAt}`);
      console.log('');
    });

    // Check if any dealers have logos
    const dealersWithLogos = dealers.filter(d => d.logo);
    const dealersWithoutLogos = dealers.filter(d => !d.logo);
    
    console.log(`\n📈 Summary:`);
    console.log(`   Dealers with logos: ${dealersWithLogos.length}`);
    console.log(`   Dealers without logos: ${dealersWithoutLogos.length}`);
    
    if (dealersWithLogos.length > 0) {
      console.log(`\n✅ Logo upload is working for some dealers`);
      console.log(`   Example logo URL: ${dealersWithLogos[0].logo}`);
    } else {
      console.log(`\n❌ No dealers have logos uploaded`);
      console.log(`   This suggests the logo upload flow has an issue`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testLogoUploadFlow();
