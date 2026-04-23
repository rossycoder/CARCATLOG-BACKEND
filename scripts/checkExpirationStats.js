/**
 * Check Expiration Statistics
 * Run this script to see how many cars are active, expiring soon, overdue, etc.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');
const Bike = require('../models/Bike');
const Van = require('../models/Van');

async function checkExpirationStats() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    console.log('📊 EXPIRATION STATISTICS');
    console.log('='.repeat(80));
    console.log(`Current Date: ${now.toLocaleString()}`);
    console.log(`30 Days From Now: ${thirtyDaysFromNow.toLocaleDateString()}`);
    console.log('='.repeat(80));
    console.log();

    // ========== CARS ==========
    console.log('🚗 CARS:');
    console.log('-'.repeat(80));

    const totalCars = await Car.countDocuments();
    const activeCars = await Car.countDocuments({ advertStatus: 'active' });
    const expiredCars = await Car.countDocuments({ advertStatus: 'expired' });
    const soldCars = await Car.countDocuments({ advertStatus: 'sold' });
    const pendingCars = await Car.countDocuments({ advertStatus: 'pending_payment' });
    const draftCars = await Car.countDocuments({ advertStatus: 'draft' });

    console.log(`Total Cars: ${totalCars}`);
    console.log(`  ├─ Active: ${activeCars}`);
    console.log(`  ├─ Expired: ${expiredCars}`);
    console.log(`  ├─ Sold: ${soldCars}`);
    console.log(`  ├─ Pending Payment: ${pendingCars}`);
    console.log(`  └─ Draft: ${draftCars}`);
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

    console.log(`Active Cars Breakdown:`);
    console.log(`  ├─ Private Sellers: ${activePrivateCars}`);
    console.log(`  └─ Trade Dealers: ${activeTradeCars}`);
    console.log();

    // Expiring soon (within 30 days)
    const expiringSoonCars = await Car.countDocuments({
      advertStatus: 'active',
      'advertisingPackage.expiryDate': {
        $gte: now,
        $lte: thirtyDaysFromNow
      }
    });

    console.log(`Expiring Soon (within 30 days): ${expiringSoonCars}`);

    // Already overdue
    const overdueCars = await Car.countDocuments({
      advertStatus: 'active',
      'advertisingPackage.expiryDate': { $lt: now }
    });

    console.log(`Overdue (should be deleted): ${overdueCars}`);

    // Recent sign-ups (last 7 days)
    const recentCars = await Car.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    console.log(`Recent Sign-Ups (last 7 days): ${recentCars}`);
    console.log();

    // Show some overdue cars
    if (overdueCars > 0) {
      console.log('⚠️  OVERDUE CARS (Should be deleted):');
      const overdueCarsDetails = await Car.find({
        advertStatus: 'active',
        'advertisingPackage.expiryDate': { $lt: now }
      })
      .select('advertId make model registrationNumber advertisingPackage.expiryDate sellerContact.type sellerContact.email')
      .limit(10)
      .lean();

      overdueCarsDetails.forEach((car, index) => {
        const daysOverdue = Math.floor((now - new Date(car.advertisingPackage.expiryDate)) / (1000 * 60 * 60 * 24));
        console.log(`  ${index + 1}. ${car.make} ${car.model} (${car.registrationNumber})`);
        console.log(`     Expired: ${new Date(car.advertisingPackage.expiryDate).toLocaleDateString()} (${daysOverdue} days ago)`);
        console.log(`     Type: ${car.sellerContact?.type || 'unknown'}`);
        console.log(`     Email: ${car.sellerContact?.email || 'N/A'}`);
        console.log();
      });
    }

    // Show expiring soon cars
    if (expiringSoonCars > 0) {
      console.log('⏰ EXPIRING SOON (within 30 days):');
      const expiringSoonDetails = await Car.find({
        advertStatus: 'active',
        'advertisingPackage.expiryDate': {
          $gte: now,
          $lte: thirtyDaysFromNow
        }
      })
      .select('advertId make model registrationNumber advertisingPackage.expiryDate sellerContact.type sellerContact.email')
      .limit(10)
      .lean();

      expiringSoonDetails.forEach((car, index) => {
        const daysUntilExpiry = Math.ceil((new Date(car.advertisingPackage.expiryDate) - now) / (1000 * 60 * 60 * 24));
        console.log(`  ${index + 1}. ${car.make} ${car.model} (${car.registrationNumber})`);
        console.log(`     Expires: ${new Date(car.advertisingPackage.expiryDate).toLocaleDateString()} (in ${daysUntilExpiry} days)`);
        console.log(`     Type: ${car.sellerContact?.type || 'unknown'}`);
        console.log(`     Email: ${car.sellerContact?.email || 'N/A'}`);
        console.log();
      });
    }

    // ========== BIKES ==========
    console.log('🏍️  BIKES:');
    console.log('-'.repeat(80));

    const totalBikes = await Bike.countDocuments();
    const activeBikes = await Bike.countDocuments({ advertStatus: 'active' });
    const expiredBikes = await Bike.countDocuments({ advertStatus: 'expired' });

    console.log(`Total Bikes: ${totalBikes}`);
    console.log(`  ├─ Active: ${activeBikes}`);
    console.log(`  └─ Expired: ${expiredBikes}`);
    console.log();

    // ========== VANS ==========
    console.log('🚐 VANS:');
    console.log('-'.repeat(80));

    const totalVans = await Van.countDocuments();
    const activeVans = await Van.countDocuments({ advertStatus: 'active' });
    const expiredVans = await Van.countDocuments({ advertStatus: 'expired' });

    console.log(`Total Vans: ${totalVans}`);
    console.log(`  ├─ Active: ${activeVans}`);
    console.log(`  └─ Expired: ${expiredVans}`);
    console.log();

    // ========== SUMMARY ==========
    console.log('📈 OVERALL SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total Vehicles: ${totalCars + totalBikes + totalVans}`);
    console.log(`Total Active: ${activeCars + activeBikes + activeVans}`);
    console.log(`Total Expiring Soon: ${expiringSoonCars}`);
    console.log(`Total Overdue: ${overdueCars}`);
    console.log(`Total Recent Sign-Ups: ${recentCars}`);
    console.log('='.repeat(80));
    console.log();

    // ========== RECOMMENDATIONS ==========
    if (overdueCars > 0) {
      console.log('💡 RECOMMENDATIONS:');
      console.log(`   ⚠️  You have ${overdueCars} overdue cars that should be deleted`);
      console.log(`   ⚠️  Run expiration service to clean them up:`);
      console.log(`      node -e "require('./services/expirationService').expireListings().then(console.log)"`);
      console.log();
    }

    if (expiringSoonCars > 0) {
      console.log(`   ℹ️  ${expiringSoonCars} cars will expire within 30 days`);
      console.log(`   ℹ️  Warning emails will be sent 3 days before expiry`);
      console.log();
    }

    console.log('✅ Statistics check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
checkExpirationStats();
