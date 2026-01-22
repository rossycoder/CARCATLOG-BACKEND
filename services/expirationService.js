const Car = require('../models/Car');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const { sendEmail } = require('./emailService');

class ExpirationService {
  /**
   * Check and delete listings that have passed their expiry date
   * Only deletes PRIVATE seller listings, not trade sellers
   */
  async expireListings() {
    try {
      const now = new Date();
      
      // Find all active cars with expiry dates that have passed
      // Only expire private sellers, not trade sellers
      const expiredCars = await Car.find({
        advertStatus: 'active',
        'advertisingPackage.expiryDate': { $lte: now },
        'sellerContact.type': 'private' // Only private sellers
      });

      console.log(`Found ${expiredCars.length} expired listings to delete`);

      const results = {
        deleted: 0,
        notified: 0,
        errors: []
      };

      for (const car of expiredCars) {
        try {
          // Send notification email to seller before deletion
          if (car.sellerContact?.email) {
            await this.sendExpirationNotification(car);
            results.notified++;
          }

          // Update corresponding purchase record
          if (car.advertisingPackage?.stripeSessionId) {
            await AdvertisingPackagePurchase.findOneAndUpdate(
              { stripeSessionId: car.advertisingPackage.stripeSessionId },
              { packageStatus: 'expired' }
            );
          }

          // Delete the car listing from database
          await Car.findByIdAndDelete(car._id);
          results.deleted++;

          console.log(`Deleted expired listing: ${car.advertId} - ${car.make} ${car.model}`);
        } catch (error) {
          console.error(`Error deleting car ${car._id}:`, error);
          results.errors.push({
            carId: car._id,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in expireListings:', error);
      throw error;
    }
  }

  /**
   * Send expiration warning emails (e.g., 3 days before expiry)
   * Only sends warnings to PRIVATE sellers, not trade sellers
   */
  async sendExpirationWarnings(daysBeforeExpiry = 3) {
    try {
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + daysBeforeExpiry);
      
      const endOfWarningDay = new Date(warningDate);
      endOfWarningDay.setHours(23, 59, 59, 999);

      // Find cars expiring within the warning period
      // Only warn private sellers, not trade sellers
      const expiringCars = await Car.find({
        advertStatus: 'active',
        'advertisingPackage.expiryDate': {
          $gte: warningDate,
          $lte: endOfWarningDay
        },
        'sellerContact.type': 'private' // Only private sellers
      });

      console.log(`Found ${expiringCars.length} listings expiring in ${daysBeforeExpiry} days`);

      const results = {
        warned: 0,
        errors: []
      };

      for (const car of expiringCars) {
        try {
          if (car.sellerContact?.email) {
            await this.sendExpirationWarning(car, daysBeforeExpiry);
            results.warned++;
          }
        } catch (error) {
          console.error(`Error sending warning for car ${car._id}:`, error);
          results.errors.push({
            carId: car._id,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in sendExpirationWarnings:', error);
      throw error;
    }
  }

  /**
   * Get expiration statistics
   */
  async getExpirationStats() {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const stats = {
      activeListings: await Car.countDocuments({ advertStatus: 'active' }),
      activePrivateListings: await Car.countDocuments({ 
        advertStatus: 'active',
        'sellerContact.type': 'private'
      }),
      activeTradeListings: await Car.countDocuments({ 
        advertStatus: 'active',
        'sellerContact.type': 'trade'
      }),
      expiringIn3Days: await Car.countDocuments({
        advertStatus: 'active',
        'sellerContact.type': 'private', // Only count private sellers
        'advertisingPackage.expiryDate': {
          $gte: now,
          $lte: threeDaysFromNow
        }
      }),
      goldPackages: await Car.countDocuments({
        advertStatus: 'active',
        'advertisingPackage.packageId': 'gold',
        'advertisingPackage.expiryDate': null
      })
    };

    return stats;
  }
}

module.exports = new ExpirationService();
