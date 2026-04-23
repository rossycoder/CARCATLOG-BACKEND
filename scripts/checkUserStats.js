/**
 * Check User and Trade Dealer Statistics
 * Shows breakdown of all users in the system
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const TradeDealer = require('../models/TradeDealer');
const Car = require('../models/Car');

async function checkUserStats() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    console.log('👥 USER STATISTICS');
    console.log('='.repeat(80));

    // ========== REGULAR USERS ==========
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ 
      $or: [
        { isAdmin: true },
        { role: 'admin' }
      ]
    });
    const regularUsers = totalUsers - adminUsers;

    console.log('📊 REGULAR USERS (Normal Users):');
    console.log('-'.repeat(80));
    console.log(`Total Users: ${totalUsers}`);
    console.log(`  ├─ Regular Users: ${regularUsers}`);
    console.log(`  └─ Admin Users: ${adminUsers}`);
    console.log();

    // Show some regular users
    if (regularUsers > 0) {
      console.log('Sample Regular Users:');
      const sampleUsers = await User.find({ 
        isAdmin: { $ne: true },
        role: { $ne: 'admin' }
      })
      .select('name email createdAt')
      .limit(10)
      .lean();

      sampleUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name || 'N/A'} (${user.email})`);
        console.log(`     Joined: ${new Date(user.createdAt).toLocaleDateString()}`);
      });
      console.log();
    }

    // ========== TRADE DEALERS ==========
    const totalDealers = await TradeDealer.countDocuments();
    const verifiedDealers = await TradeDealer.countDocuments({ isVerified: true });
    const unverifiedDealers = totalDealers - verifiedDealers;
    const activeDealers = await TradeDealer.countDocuments({ 
      isVerified: true,
      'subscription.status': 'active'
    });

    console.log('🏢 TRADE DEALERS:');
    console.log('-'.repeat(80));
    console.log(`Total Trade Dealers: ${totalDealers}`);
    console.log(`  ├─ Verified: ${verifiedDealers}`);
    console.log(`  ├─ Unverified: ${unverifiedDealers}`);
    console.log(`  └─ Active Subscription: ${activeDealers}`);
    console.log();

    // Show all trade dealers
    if (totalDealers > 0) {
      console.log('All Trade Dealers:');
      const dealers = await TradeDealer.find()
        .select('businessName email isVerified subscription.status subscription.plan createdAt')
        .lean();

      dealers.forEach((dealer, index) => {
        console.log(`  ${index + 1}. ${dealer.businessName || 'N/A'}`);
        console.log(`     Email: ${dealer.email}`);
        console.log(`     Verified: ${dealer.isVerified ? '✅' : '❌'}`);
        console.log(`     Subscription: ${dealer.subscription?.status || 'none'} (${dealer.subscription?.plan || 'N/A'})`);
        console.log(`     Joined: ${new Date(dealer.createdAt).toLocaleDateString()}`);
        console.log();
      });
    }

    // ========== CARS BY SELLER TYPE ==========
    console.log('🚗 CARS BY SELLER TYPE:');
    console.log('-'.repeat(80));

    const totalCars = await Car.countDocuments();
    const privateCars = await Car.countDocuments({ 
      'sellerContact.type': 'private'
    });
    const tradeCars = await Car.countDocuments({ 
      'sellerContact.type': 'trade'
    });
    const unknownTypeCars = await Car.countDocuments({
      $or: [
        { 'sellerContact.type': { $exists: false } },
        { 'sellerContact.type': null },
        { 'sellerContact.type': { $nin: ['private', 'trade'] } }
      ]
    });

    console.log(`Total Cars: ${totalCars}`);
    console.log(`  ├─ Private Sellers: ${privateCars}`);
    console.log(`  ├─ Trade Dealers: ${tradeCars}`);
    console.log(`  └─ Unknown Type: ${unknownTypeCars}`);
    console.log();

    // Active cars breakdown
    const activePrivateCars = await Car.countDocuments({ 
      advertStatus: 'active',
      'sellerContact.type': 'private'
    });
    const activeTradeCars = await Car.countDocuments({ 
      advertStatus: 'active',
      'sellerContact.type': 'trade'
    });

    console.log('Active Cars:');
    console.log(`  ├─ Private Sellers: ${activePrivateCars}`);
    console.log(`  └─ Trade Dealers: ${activeTradeCars}`);
    console.log();

    // ========== UNIQUE SELLERS ==========
    console.log('📧 UNIQUE SELLERS (by email):');
    console.log('-'.repeat(80));

    // Get unique private seller emails
    const privateSellerEmails = await Car.distinct('sellerContact.email', {
      'sellerContact.type': 'private'
    });
    const uniquePrivateSellers = privateSellerEmails.filter(email => email).length;

    // Get unique trade dealer emails
    const tradeSellerEmails = await Car.distinct('sellerContact.email', {
      'sellerContact.type': 'trade'
    });
    const uniqueTradeSellers = tradeSellerEmails.filter(email => email).length;

    console.log(`Unique Private Sellers: ${uniquePrivateSellers}`);
    console.log(`Unique Trade Sellers: ${uniqueTradeSellers}`);
    console.log();

    // ========== SUMMARY ==========
    console.log('📈 OVERALL SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total Regular Users: ${regularUsers}`);
    console.log(`Total Admin Users: ${adminUsers}`);
    console.log(`Total Trade Dealers: ${totalDealers}`);
    console.log(`  ├─ Verified: ${verifiedDealers}`);
    console.log(`  └─ Active Subscription: ${activeDealers}`);
    console.log();
    console.log(`Total Cars: ${totalCars}`);
    console.log(`  ├─ Private Seller Cars: ${privateCars} (${activePrivateCars} active)`);
    console.log(`  └─ Trade Dealer Cars: ${tradeCars} (${activeTradeCars} active)`);
    console.log('='.repeat(80));
    console.log();

    console.log('✅ Statistics check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
checkUserStats();
