const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const TradeSubscription = require('../models/TradeSubscription');
const TradeDealer = require('../models/TradeDealer');

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

async function activateTradeSubscription() {
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
    
    // Find the dealer
    const dealer = await TradeDealer.findOne().sort({ createdAt: -1 });
    
    if (!dealer) {
      console.log('❌ No dealer found. Please create a dealer account first.');
      return;
    }
    
    console.log(`\n👤 Found dealer: ${dealer.businessName} (${dealer.email})`);
    
    // Map duration to days
    const durationMap = {
      '3 weeks': 21,
      '4 weeks': 28,
      '6 weeks': 42
    };
    
    const durationDays = durationMap[purchase.duration] || 28;
    
    // Extract listing limit from package name
    let listingsLimit = 10;
    if (purchase.packageName.includes('BRONZE')) listingsLimit = 5;
    if (purchase.packageName.includes('SILVER')) listingsLimit = 10;
    if (purchase.packageName.includes('GOLD')) listingsLimit = 20;
    
    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);
    
    // Check if subscription already exists
    let subscription = await TradeSubscription.findOne({ 
      dealerId: dealer._id, 
      status: 'active' 
    });
    
    if (subscription) {
      console.log(`\n⚠️  Dealer already has an active subscription`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Listings: ${subscription.listingsUsed}/${subscription.listingsLimit}`);
      console.log(`\n   Cancelling old subscription and creating new one...`);
      
      subscription.status = 'cancelled';
      await subscription.save();
    }
    
    // Create new subscription with required fields
    subscription = new TradeSubscription({
      dealerId: dealer._id,
      planId: new mongoose.Types.ObjectId(), // Temporary plan ID
      status: 'active',
      listingsLimit: listingsLimit,
      listingsUsed: 0,
      stripeSubscriptionId: purchase.stripeSessionId,
      stripeCustomerId: 'cus_temp_' + dealer._id, // Temporary customer ID
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      metadata: {
        packageName: purchase.packageName,
        packageDuration: purchase.duration,
        purchaseId: purchase._id.toString()
      }
    });
    
    await subscription.save();
    console.log(`\n✅ Trade subscription activated!`);
    console.log(`   ID: ${subscription._id}`);
    console.log(`   Package: ${purchase.packageName}`);
    console.log(`   Listings Limit: ${subscription.listingsLimit}`);
    console.log(`   Start Date: ${startDate.toLocaleDateString()}`);
    console.log(`   End Date: ${endDate.toLocaleDateString()}`);
    console.log(`   Days: ${durationDays}`);
    
    // Mark purchase as completed
    purchase.paymentStatus = 'completed';
    purchase.packageStatus = 'active';
    await purchase.save();
    console.log(`\n✅ Purchase marked as completed`);
    
    console.log(`\n🎉 Success! Dealer can now add up to ${subscription.listingsLimit} vehicles.`);
    console.log(`\n💡 Refresh the frontend to see the updated subscription status.`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the script
activateTradeSubscription();
