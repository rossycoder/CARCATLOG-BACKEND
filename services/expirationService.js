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
        $or: [
          { 'sellerContact.type': 'private' },
          { 'sellerContact.type': { $exists: false } },
          { 'sellerContact.type': null }
        ]
      });

      console.log(`Found ${expiredCars.length} expired private seller listings to delete`);

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

          console.log(`Deleted expired listing: ${car.advertId} - ${car.make} ${car.model} (${car.sellerContact?.type || 'unknown'})`);
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
        $or: [
          { 'sellerContact.type': 'private' },
          { 'sellerContact.type': { $exists: false } },
          { 'sellerContact.type': null }
        ]
      });

      console.log(`Found ${expiringCars.length} private seller listings expiring in ${daysBeforeExpiry} days`);

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

  /**
   * Send expiration notification email to seller
   */
  async sendExpirationNotification(car) {
    try {
      const email = car.sellerContact?.email;
      if (!email) return;

      const subject = `Your ${car.make} ${car.model} listing has expired`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Your Listing Has Expired</h2>
          
          <p>Hello,</p>
          
          <p>Your vehicle listing has expired and has been removed from our website:</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${car.year} ${car.make} ${car.model}</h3>
            <p style="margin: 5px 0;"><strong>Registration:</strong> ${car.registrationNumber || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Price:</strong> £${car.price?.toLocaleString() || '0'}</p>
            <p style="margin: 5px 0;"><strong>Package:</strong> ${car.advertisingPackage?.packageName || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Expired on:</strong> ${new Date(car.advertisingPackage?.expiryDate).toLocaleDateString()}</p>
          </div>
          
          <p>Your listing has been automatically removed from our website as the advertising package has expired.</p>
          
          <p><strong>Want to list your vehicle again?</strong></p>
          <p>You can create a new listing anytime by visiting our website.</p>
          
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/sell-your-car" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              List Your Vehicle Again
            </a>
          </div>
          
          <p style="color: #666; font-size: 0.9rem; margin-top: 30px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `;

      await sendEmail(email, subject, html);
      console.log(`Expiration notification sent to ${email} for car ${car.advertId}`);
    } catch (error) {
      console.error('Error sending expiration notification:', error);
      throw error;
    }
  }

  /**
   * Send expiration warning email
   */
  async sendExpirationWarning(car, daysBeforeExpiry) {
    try {
      const email = car.sellerContact?.email;
      if (!email) return;

      const expiryDate = new Date(car.advertisingPackage?.expiryDate);
      const subject = `Your listing expires in ${daysBeforeExpiry} days`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ed8936;">Your Listing is Expiring Soon</h2>
          
          <p>Hello,</p>
          
          <p>Your vehicle listing will expire in <strong>${daysBeforeExpiry} days</strong>:</p>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ed8936;">
            <h3 style="margin-top: 0;">${car.year} ${car.make} ${car.model}</h3>
            <p style="margin: 5px 0;"><strong>Registration:</strong> ${car.registrationNumber || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Price:</strong> £${car.price?.toLocaleString() || '0'}</p>
            <p style="margin: 5px 0;"><strong>Expires on:</strong> ${expiryDate.toLocaleDateString()}</p>
          </div>
          
          <p>After expiration, your listing will be automatically removed from our website.</p>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Your listing will remain active until ${expiryDate.toLocaleDateString()}</li>
            <li>After that date, it will be automatically removed</li>
            <li>You can create a new listing anytime</li>
          </ul>
          
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-listings" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View My Listings
            </a>
          </div>
          
          <p style="color: #666; font-size: 0.9rem; margin-top: 30px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `;

      await sendEmail(email, subject, html);
      console.log(`Expiration warning sent to ${email} for car ${car.advertId}`);
    } catch (error) {
      console.error('Error sending expiration warning:', error);
      throw error;
    }
  }
}

module.exports = new ExpirationService();
