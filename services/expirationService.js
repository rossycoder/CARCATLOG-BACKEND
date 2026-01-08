const Car = require('../models/Car');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const { sendEmail } = require('./emailService');

class ExpirationService {
  /**
   * Check and expire listings that have passed their expiry date
   * Only expires PRIVATE seller listings, not trade sellers
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

      console.log(`Found ${expiredCars.length} expired listings to process`);

      const results = {
        expired: 0,
        notified: 0,
        errors: []
      };

      for (const car of expiredCars) {
        try {
          // Update car status to expired
          car.advertStatus = 'expired';
          await car.save();
          results.expired++;

          // Send notification email to seller
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

          console.log(`Expired listing: ${car.advertId} - ${car.make} ${car.model}`);
        } catch (error) {
          console.error(`Error expiring car ${car._id}:`, error);
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
   * Clean up old expired listings (optional - for data retention)
   * Only cleans up PRIVATE seller listings
   */
  async cleanupOldExpiredListings(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Car.deleteMany({
        advertStatus: 'expired',
        'advertisingPackage.expiryDate': { $lte: cutoffDate },
        'sellerContact.type': 'private' // Only private sellers
      });

      console.log(`Cleaned up ${result.deletedCount} old expired listings`);
      return result;
    } catch (error) {
      console.error('Error in cleanupOldExpiredListings:', error);
      throw error;
    }
  }

  /**
   * Send expiration notification email
   */
  async sendExpirationNotification(car) {
    const subject = `Your ${car.make} ${car.model} listing has expired`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a73e8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .car-details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #1a73e8; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Listing Expired</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your vehicle listing has expired and is no longer visible to buyers.</p>
            
            <div class="car-details">
              <h3>${car.year} ${car.make} ${car.model}</h3>
              <p><strong>Registration:</strong> ${car.registrationNumber || 'N/A'}</p>
              <p><strong>Package:</strong> ${car.advertisingPackage?.packageName || 'N/A'}</p>
              <p><strong>Expired on:</strong> ${car.advertisingPackage?.expiryDate?.toLocaleDateString() || 'N/A'}</p>
            </div>

            <p>Would you like to relist your vehicle?</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/advertising-prices" class="button">
              Choose a New Package
            </a>

            <p>If your vehicle has been sold, congratulations! You can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Your Car Website. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(car.sellerContact.email, subject, html);
  }

  /**
   * Send expiration warning email
   */
  async sendExpirationWarning(car, daysRemaining) {
    const subject = `Your listing expires in ${daysRemaining} days`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ff9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .car-details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .warning { background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #1a73e8; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Listing Expiring Soon</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            
            <div class="warning">
              <strong>Your listing will expire in ${daysRemaining} days!</strong>
            </div>

            <div class="car-details">
              <h3>${car.year} ${car.make} ${car.model}</h3>
              <p><strong>Registration:</strong> ${car.registrationNumber || 'N/A'}</p>
              <p><strong>Package:</strong> ${car.advertisingPackage?.packageName || 'N/A'}</p>
              <p><strong>Expires on:</strong> ${car.advertisingPackage?.expiryDate?.toLocaleDateString() || 'N/A'}</p>
            </div>

            <p>To keep your listing active, you can:</p>
            <ul>
              <li>Purchase a new advertising package before expiry</li>
              <li>Mark your vehicle as sold if it's no longer available</li>
            </ul>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/advertising-prices" class="button">
              Renew Package
            </a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Your Car Website. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(car.sellerContact.email, subject, html);
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
      expiredListings: await Car.countDocuments({ advertStatus: 'expired' }),
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
