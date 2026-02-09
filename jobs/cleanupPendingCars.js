/**
 * Cleanup Pending Cars Cron Job
 * Automatically deletes cars that were created but payment was never completed
 * Runs daily to keep database clean
 */

const Car = require('../models/Car');
const Bike = require('../models/Bike');
const Van = require('../models/Van');

/**
 * Delete cars that are in 'pending_payment' status for more than 24 hours
 * These are cars created during checkout but payment was never completed
 */
async function cleanupPendingPaymentCars() {
  try {
    console.log('\n🧹 [Cleanup Job] Starting cleanup of pending payment cars...');
    
    // Calculate cutoff time (24 hours ago)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);
    
    console.log(`⏰ Cutoff time: ${cutoffTime.toISOString()}`);
    console.log(`   (Deleting cars created before this time with pending payment)`);
    
    // Find and delete pending payment CARS
    const pendingCars = await Car.find({
      $or: [
        { advertStatus: 'pending_payment' },
        { advertStatus: 'draft', 'advertisingPackage.stripeSessionId': { $exists: true } }
      ],
      createdAt: { $lt: cutoffTime }
    });
    
    console.log(`\n📋 Found ${pendingCars.length} pending payment cars to delete`);
    
    let deletedCarsCount = 0;
    for (const car of pendingCars) {
      console.log(`   🗑️  Deleting car: ${car.make} ${car.model} (${car.registrationNumber || 'No reg'}) - Created: ${car.createdAt.toISOString()}`);
      await Car.deleteOne({ _id: car._id });
      deletedCarsCount++;
    }
    
    // Find and delete pending payment BIKES
    const pendingBikes = await Bike.find({
      $or: [
        { status: 'pending_payment' },
        { status: 'draft', 'advertisingPackage.stripeSessionId': { $exists: true } }
      ],
      createdAt: { $lt: cutoffTime }
    });
    
    console.log(`\n📋 Found ${pendingBikes.length} pending payment bikes to delete`);
    
    let deletedBikesCount = 0;
    for (const bike of pendingBikes) {
      console.log(`   🗑️  Deleting bike: ${bike.make} ${bike.model} (${bike.registrationNumber || 'No reg'}) - Created: ${bike.createdAt.toISOString()}`);
      await Bike.deleteOne({ _id: bike._id });
      deletedBikesCount++;
    }
    
    // Find and delete pending payment VANS
    const pendingVans = await Van.find({
      $or: [
        { status: 'pending_payment' },
        { status: 'draft', 'advertisingPackage.stripeSessionId': { $exists: true } }
      ],
      createdAt: { $lt: cutoffTime }
    });
    
    console.log(`\n📋 Found ${pendingVans.length} pending payment vans to delete`);
    
    let deletedVansCount = 0;
    for (const van of pendingVans) {
      console.log(`   🗑️  Deleting van: ${van.make} ${van.model} (${van.registrationNumber || 'No reg'}) - Created: ${van.createdAt.toISOString()}`);
      await Van.deleteOne({ _id: van._id });
      deletedVansCount++;
    }
    
    // Summary
    const totalDeleted = deletedCarsCount + deletedBikesCount + deletedVansCount;
    
    console.log(`\n✅ [Cleanup Job] Completed successfully!`);
    console.log(`   📊 Summary:`);
    console.log(`      - Cars deleted: ${deletedCarsCount}`);
    console.log(`      - Bikes deleted: ${deletedBikesCount}`);
    console.log(`      - Vans deleted: ${deletedVansCount}`);
    console.log(`      - Total deleted: ${totalDeleted}`);
    console.log(`      - Cutoff time: ${cutoffTime.toISOString()}`);
    
    return {
      success: true,
      deletedCars: deletedCarsCount,
      deletedBikes: deletedBikesCount,
      deletedVans: deletedVansCount,
      totalDeleted: totalDeleted,
      cutoffTime: cutoffTime
    };
    
  } catch (error) {
    console.error('❌ [Cleanup Job] Error during cleanup:', error);
    console.error(error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete cars without userId (orphaned cars)
 * These are cars that somehow got created without proper user association
 */
async function cleanupOrphanedCars() {
  try {
    console.log('\n🧹 [Cleanup Job] Starting cleanup of orphaned cars (no userId)...');
    
    // Calculate cutoff time (7 days ago - give more time for orphaned cars)
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - 7);
    
    console.log(`⏰ Cutoff time: ${cutoffTime.toISOString()}`);
    
    // Find cars without userId that are old
    const orphanedCars = await Car.find({
      userId: { $exists: false },
      advertStatus: { $ne: 'active' }, // Don't delete active cars
      createdAt: { $lt: cutoffTime }
    });
    
    console.log(`\n📋 Found ${orphanedCars.length} orphaned cars to delete`);
    
    let deletedCount = 0;
    for (const car of orphanedCars) {
      console.log(`   🗑️  Deleting orphaned car: ${car.make} ${car.model} - Status: ${car.advertStatus}`);
      await Car.deleteOne({ _id: car._id });
      deletedCount++;
    }
    
    console.log(`\n✅ [Cleanup Job] Orphaned cars cleanup completed!`);
    console.log(`   📊 Deleted ${deletedCount} orphaned cars`);
    
    return {
      success: true,
      deletedCount: deletedCount
    };
    
  } catch (error) {
    console.error('❌ [Cleanup Job] Error during orphaned cars cleanup:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main cleanup function - runs all cleanup tasks
 */
async function runDailyCleanup() {
  console.log('\n' + '='.repeat(60));
  console.log('🕐 [Daily Cleanup Job] Starting at:', new Date().toISOString());
  console.log('='.repeat(60));
  
  try {
    // Task 1: Cleanup pending payment vehicles
    const pendingResult = await cleanupPendingPaymentCars();
    
    // Task 2: Cleanup orphaned cars (optional - uncomment if needed)
    // const orphanedResult = await cleanupOrphanedCars();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ [Daily Cleanup Job] All tasks completed!');
    console.log('='.repeat(60) + '\n');
    
    return {
      success: true,
      timestamp: new Date(),
      results: {
        pendingPayment: pendingResult,
        // orphaned: orphanedResult
      }
    };
    
  } catch (error) {
    console.error('❌ [Daily Cleanup Job] Fatal error:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
}

module.exports = {
  cleanupPendingPaymentCars,
  cleanupOrphanedCars,
  runDailyCleanup
};
