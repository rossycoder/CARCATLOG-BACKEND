/**
 * List all trade dealers from database
 */

const mongoose = require('mongoose');

async function listAllDealers() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/motormate';
    console.log(`Connecting to: ${dbUri}\n`);
    
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database: ${dbName}\n`);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections (${collections.length}):`);
    collections.forEach(c => console.log(`   - ${c.name}`));

    // Check tradedealers collection directly
    console.log(`\n🔍 Checking 'tradedealers' collection...`);
    const tradeDealersCollection = mongoose.connection.db.collection('tradedealers');
    const count = await tradeDealersCollection.countDocuments();
    console.log(`   Total documents: ${count}`);

    if (count > 0) {
      console.log(`\n📋 Trade Dealers:`);
      const dealers = await tradeDealersCollection.find({}).toArray();
      dealers.forEach((d, i) => {
        console.log(`\n${i + 1}. ${d.businessName || 'Unknown'}`);
        console.log(`   ID: ${d._id}`);
        console.log(`   Email: ${d.email}`);
        console.log(`   Status: ${d.status}`);
        console.log(`   Subscription ID: ${d.currentSubscriptionId || 'None'}`);
      });

      // Check subscriptions
      console.log(`\n\n🔍 Checking 'tradesubscriptions' collection...`);
      const subsCollection = mongoose.connection.db.collection('tradesubscriptions');
      const subsCount = await subsCollection.countDocuments();
      console.log(`   Total subscriptions: ${subsCount}`);

      if (subsCount > 0) {
        const subs = await subsCollection.find({}).toArray();
        console.log(`\n📦 Subscriptions:`);
        subs.forEach((s, i) => {
          console.log(`\n${i + 1}. Subscription ID: ${s._id}`);
          console.log(`   Dealer ID: ${s.dealerId}`);
          console.log(`   Status: ${s.status}`);
          console.log(`   Stripe Sub ID: ${s.stripeSubscriptionId}`);
          console.log(`   Period End: ${s.currentPeriodEnd}`);
          console.log(`   Listings Used: ${s.listingsUsed}`);
        });
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Done\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listAllDealers();
