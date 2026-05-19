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
    
    // Calculate cutoff time (24 hours ago)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);
    
    
    // Find and delete pending payment CARS
    const pendingCars = await Car.find({
      $or: [
        { advertStatus: 'pending_payment' },
        { advertStatus: 'draft', 'advertisingPackage.stripeSessionId': { $exists: true } }
      ],
      createdAt: { $lt: cutoffTime }
    });
    
    
    let deletedCarsCount = 0;
    for (const car of pendingCars) {
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
    
    
    let deletedBikesCount = 0;
    for (const bike of pendingBikes) {
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
    
    
    let deletedVansCount = 0;
    for (const van of pendingVans) {
      await Van.deleteOne({ _id: van._id });
      deletedVansCount++;
    }
    
    // Summary
    const totalDeleted = deletedCarsCount + deletedBikesCount + deletedVansCount;
    
    
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
    
    // Calculate cutoff time (7 days ago - give more time for orphaned cars)
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - 7);
    
    
    // Find cars without userId that are old
    const orphanedCars = await Car.find({
      userId: { $exists: false },
      advertStatus: { $ne: 'active' }, // Don't delete active cars
      createdAt: { $lt: cutoffTime }
    });
    
    
    let deletedCount = 0;
    for (const car of orphanedCars) {
      await Car.deleteOne({ _id: car._id });
      deletedCount++;
    }
    
    
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
  
  try {
    // Task 1: Cleanup pending payment vehicles
    const pendingResult = await cleanupPendingPaymentCars();
    
    // Task 2: Cleanup orphaned cars (optional - uncomment if needed)
    // const orphanedResult = await cleanupOrphanedCars();
    
    
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
