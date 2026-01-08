const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const TradeSubscription = require('../models/TradeSubscription');
const TradeDealer = require('../models/TradeDealer');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function processTradeSubscription() {
  try {
    console.log('\n🔍 Looking for pending trade package purchases...\n');
    
    // Find the pending trade purchase
    const purchase = await AdvertisingPackagePurchase.findOne({
      sellerType: 'trade',
      paymentStatus: 'pending'
    }).sort({ createdAt: -1 });
    
    if (!purchase) {
      console.log('❌ No pending trade purchases found');
      return;
    }
    
    console.log('📦 Found pending purchase:');
    console.log(`   ID: ${purchase._id}`);
    console.log(`   Package: ${purchase.packageName}`);
    console.log(`   Amount: £${(purchase.amount / 100).toFixed(2)}`);
    console.log(`   Duration: ${purchase.duration}`);
    console.log(`   Session ID: ${purchase.stripeSessionId}`);
    console.log(`   Created: ${purchase.createdAt}`);
    
    // Find or create subscription plan
    let plan = await SubscriptionPlan.findOne({ name: purchase.packageName });
    
    if (!plan) {
      console.log(`\n📝 Creating subscription plan: ${purchase.packageName}`);
      
      // Map duration to days
      const durationMap = {
        '3 weeks': 21,
        '4 weeks': 28,
        '6 weeks': 42
      };
      
      const durationDays = durationMap[purchase.duration] || 28;
      
      // Extract listing limit from package name (default to 10)
      let listingsLimit = 10;
      if (purchase.packageName.includes('BRONZE')) listingsLimit = 5;
      if (purchase.packageName.includes('SILVER')) listingsLimit = 10;
      if (purchase.packageName.includes('GOLD')) listingsLimit = 20;
      
      plan = new SubscriptionPlan({
        name: purchase.packageName,
        displayName: purchase.packageName,
        price: purchase.amount,
        currency: 'gbp',
        billingPeriod: 'one-time',
        listingsLimit: listingsLimit,
        durationDays: durationDays,
        features: [
          'Up to 100 photos per listing',
          'Photos in search results',
          'Free basic HPI check',
          `Active for ${purchase.duration}`
        ],
        isActive: true
      });
      
      await plan.save();
      console.log(`✅ Plan created: ${plan._id}`);
    }
    
    // Find the dealer (you'll need to know which dealer made this purchase)
    // For now, let's find the most recent dealer
    const dealer = await TradeDealer.findOne().sort({ createdAt: -1 });
    
    if (!dealer) {
      console.log('❌ No dealer found. Please create a dealer account first.');
      return;
    }
    
    console.log(`\n👤 Found dealer: ${dealer.businessName} (${dealer.email})`);
    
    // Check if subscription already exists
    let subscription = await TradeSubscription.findOne({ dealer: dealer._id, status: 'active' });
    
    if (subscription) {
      console.log(`\n⚠️  Dealer already has an active subscription`);
      console.log(`   Plan: ${subscription.plan}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Listings: ${subscription.listingsUsed}/${subscription.listingsLimit}`);
      
      const update = await new Promise((resolve) => {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        readline.question('\nDo you want to replace it? (yes/no): ', (answer) => {
          readline.close();
          resolve(answer.toLowerCase() === 'yes');
        });
      });
      
      if (!update) {
        console.log('❌ Cancelled');
        return;
      }
      
      // Cancel existing subscription
      subscription.status = 'cancelled';
      await subscription.save();
      console.log('✅ Previous subscription cancelled');
    }
    
    // Create new subscription
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (plan.durationDays || 28));
    
    subscription = new TradeSubscription({
      dealer: dealer._id,
      plan: plan._id,
      status: 'active',
      startDate: startDate,
      endDate: endDate,
      listingsLimit: plan.listingsLimit,
      listingsUsed: 0,
      stripeSubscriptionId: purchase.stripeSessionId,
      stripeCustomerId: null,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate
    });
    
    await subscription.save();
    console.log(`\n✅ Trade subscription created!`);
    console.log(`   ID: ${subscription._id}`);
    console.log(`   Plan: ${plan.name}`);
    console.log(`   Listings Limit: ${subscription.listingsLimit}`);
    console.log(`   Start Date: ${subscription.startDate.toLocaleDateString()}`);
    console.log(`   End Date: ${subscription.endDate.toLocaleDateString()}`);
    
    // Mark purchase as completed
    purchase.paymentStatus = 'completed';
    purchase.packageStatus = 'active';
    await purchase.save();
    console.log(`\n✅ Purchase marked as completed`);
    
    console.log(`\n🎉 Success! Dealer can now add up to ${subscription.listingsLimit} vehicles.`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the script
processTradeSubscription();
