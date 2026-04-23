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
      // Applies to both private sellers AND trade dealers
      const expiredCars = await Car.find({
        advertStatus: 'active',
        'advertisingPackage.expiryDate': { $lte: now }
      });

      console.log(`Found ${expiredCars.length} expired listings to move to draft`);

      const results = {
        movedToDraft: 0,
        notified: 0,
        errors: []
      };

      for (const car of expiredCars) {
        try {
          // Send notification email to seller before moving to draft
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

          // Move to draft instead of deleting - keeps all data including API info
          await Car.findByIdAndUpdate(car._id, {
            advertStatus: 'draft',
            // Keep all other data intact for relisting
          });
          results.movedToDraft++;

          console.log(`Moved to draft: ${car.advertId} - ${car.make} ${car.model} (${car.sellerContact?.type || 'unknown'})`);
        } catch (error) {
          console.error(`Error moving car ${car._id} to draft:`, error);
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

      // Get seller name from sellerContact
      const sellerName = car.sellerContact?.name || car.sellerContact?.businessName || '';
      const greeting = sellerName ? `Hello ${sellerName},` : 'Hello,';

      const subject = `Your ${car.make} ${car.model} listing has expired`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
            .logo-header { background: white; padding: 15px 20px; text-align: left; border-bottom: 2px solid #e0e0e0; }
            .logo { max-width: 120px; height: auto; display: block; }
            .header { background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .vehicle-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6f42c1; }
            .vehicle-box h3 { margin-top: 0; color: #333; }
            .vehicle-box p { margin: 8px 0; color: #555; }
            .button { display: inline-block; background: #6f42c1 !important; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
            .highlight-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo-header">
              <span style="font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; color: #333; letter-spacing: -0.5px;"><span style="color: #dc3545;">Car</span><span style="color: #0066cc;">Cat</span><span style="color: #ff9800;">alog</span></span>
            </div>
            <div class="header">
              <h1 style="margin: 0;">📋 Your Listing Has Been Saved as Draft</h1>
              <p style="margin: 10px 0 0 0;">Your vehicle is no longer live but remains in your account</p>
            </div>
            
            <div class="content">
              <p>${greeting}</p>
              
              <p>Your vehicle listing has expired and has been moved to your drafts:</p>
              
              <div class="vehicle-box">
                <h3>${car.year} ${car.make} ${car.model}</h3>
                <p><strong>Registration:</strong> ${car.registrationNumber || 'N/A'}</p>
                <p><strong>Price:</strong> £${car.price?.toLocaleString() || '0'}</p>
                <p><strong>Package:</strong> ${car.advertisingPackage?.packageName || 'N/A'}</p>
                <p><strong>Expired on:</strong> ${new Date(car.advertisingPackage?.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              
              <div class="highlight-box">
                <p style="margin: 0;"><strong>✅ Good News!</strong> Your listing data has been saved as a draft in your account. All your vehicle details, photos, and information are safely stored.</p>
              </div>
              
              <p><strong>What This Means:</strong></p>
              <ul>
                <li>Your listing is no longer visible to buyers on the website</li>
                <li>All your vehicle data remains saved in your account as a draft</li>
                <li>You can relist anytime by choosing a new advertising package</li>
                <li>Or you can delete the draft if you no longer need it</li>
              </ul>
              
              <p><strong>Ready to Relist?</strong></p>
              <p>Simply log in to your account, go to "My Listings", and click the "Relist" button on your vehicle. All your data is backed up and ready to go live again!</p>
              
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-listings" class="button">
                  View My Listings
                </a>
              </center>
              
              <p style="color: #666; font-size: 0.9rem; margin-top: 30px;">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
              </p>
              
              <p>Best regards,<br>The CarCatalog Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated notification. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Generate plain text version for email clients that don't support HTML
      const text = `Your ${car.make} ${car.model} listing has been saved as draft

${greeting}

Your vehicle listing has expired and has been moved to your drafts:

${car.year} ${car.make} ${car.model}
Registration: ${car.registrationNumber || 'N/A'}
Price: £${car.price?.toLocaleString() || '0'}
Package: ${car.advertisingPackage?.packageName || 'N/A'}
Expired on: ${new Date(car.advertisingPackage?.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}

GOOD NEWS! Your listing data has been saved as a draft in your account. All your vehicle details, photos, and information are safely stored.

What This Means:
- Your listing is no longer visible to buyers on the website
- All your vehicle data remains saved in your account as a draft
- You can relist anytime by choosing a new advertising package
- Or you can delete the draft if you no longer need it

Ready to Relist?
Simply log in to your account, go to "My Listings", and click the "Relist" button on your vehicle. All your data is backed up and ready to go live again!

Visit: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-listings

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The CarCatalog Team`;

      await sendEmail(email, subject, text, html);
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

      // Get seller name from sellerContact
      const sellerName = car.sellerContact?.name || car.sellerContact?.businessName || '';
      const greeting = sellerName ? `Hello ${sellerName},` : 'Hello,';

      const expiryDate = new Date(car.advertisingPackage?.expiryDate);
      const subject = `⏰ Your listing expires in ${daysBeforeExpiry} days`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
            .logo-header { background: white; padding: 15px 20px; text-align: left; border-bottom: 2px solid #e0e0e0; }
            .logo { max-width: 120px; height: auto; display: block; }
            .header { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .warning-box { background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ed8936; }
            .warning-box h3 { margin-top: 0; color: #856404; }
            .warning-box p { margin: 8px 0; color: #856404; }
            .button { display: inline-block; background: #007bff !important; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo-header">
              <span style="font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; color: #333; letter-spacing: -0.5px;"><span style="color: #dc3545;">Car</span><span style="color: #0066cc;">Cat</span><span style="color: #ff9800;">alog</span></span>
            </div>
            <div class="header">
              <h1 style="margin: 0;">⏰ Your Listing is Expiring Soon</h1>
              <p style="margin: 10px 0 0 0;">Action may be required</p>
            </div>
            
            <div class="content">
              <p>${greeting}</p>
              
              <p>Your vehicle listing will expire in <strong>${daysBeforeExpiry} days</strong>:</p>
              
              <div class="warning-box">
                <h3>${car.year} ${car.make} ${car.model}</h3>
                <p><strong>Registration:</strong> ${car.registrationNumber || 'N/A'}</p>
                <p><strong>Price:</strong> £${car.price?.toLocaleString() || '0'}</p>
                <p><strong>Expires on:</strong> ${expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Your listing will remain active until ${expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</li>
                <li>After that date, it will be automatically removed from our website</li>
                <li>You can create a new listing anytime with a new advertising package</li>
              </ul>
              
              <p><strong>Want to keep your listing active?</strong></p>
              <p>You can purchase a new advertising package before the expiry date to keep your vehicle visible to buyers.</p>
              
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-listings" class="button">
                  View My Listings
                </a>
              </center>
              
              <p style="color: #666; font-size: 0.9rem; margin-top: 30px;">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
              </p>
              
              <p>Best regards,<br>The CarCatalog Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated reminder. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Generate plain text version
      const text = `Your listing expires in ${daysBeforeExpiry} days

${greeting}

Your vehicle listing will expire in ${daysBeforeExpiry} days:

${car.year} ${car.make} ${car.model}
Registration: ${car.registrationNumber || 'N/A'}
Price: £${car.price?.toLocaleString() || '0'}
Expires on: ${expiryDate.toLocaleDateString()}

After expiration, your listing will be automatically removed from our website.

What happens next?
- Your listing will remain active until ${expiryDate.toLocaleDateString()}
- After that date, it will be automatically removed
- You can create a new listing anytime

View My Listings: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-listings

If you have any questions, please contact our support team.`;

      await sendEmail(email, subject, text, html);
      console.log(`Expiration warning sent to ${email} for car ${car.advertId}`);
    } catch (error) {
      console.error('Error sending expiration warning:', error);
      throw error;
    }
  }
}

module.exports = new ExpirationService();
