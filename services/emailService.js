/**
 * Email Service
 * Handles sending emails for various events using SendGrid or Gmail
 */

const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    this.emailService = process.env.EMAIL_SERVICE || 'gmail'; // Default to Gmail
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@carcatalog.com';
    
    console.log('📧 Email Service Configuration:');
    console.log('   Service:', this.emailService);
    console.log('   From:', this.fromEmail);
    console.log('   Gmail User:', process.env.EMAIL_USER ? '✓ Set' : '✗ Not set');
    console.log('   Gmail Password:', process.env.EMAIL_PASSWORD ? '✓ Set' : '✗ Not set');
    console.log('   SendGrid Key:', process.env.SENDGRID_API_KEY ? '✓ Set' : '✗ Not set');
    
    // Configure Gmail with Nodemailer (Primary)
    if (this.emailService === 'gmail' && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      this.enabled = true;
      console.log('✅ Email service initialized with Gmail');
    }
    // Configure SendGrid (Fallback)
    else if (this.emailService === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.enabled = true;
      console.log('✅ Email service initialized with SendGrid');
    } else {
      this.enabled = false;
      console.log('⚠️ Email service disabled - no valid configuration found');
      console.log('   Please check your .env file for EMAIL_USER and EMAIL_PASSWORD');
    }
  }

  /**
   * Send email using SendGrid or Gmail
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} text - Plain text content
   * @param {string} html - HTML content
   * @returns {Promise<boolean>}
   */
  async sendEmail(to, subject, text, html) {
    try {
      if (!this.enabled) {
        console.log('📧 Email disabled - Would send to:', to);
        console.log('   Subject:', subject);
        return true;
      }

      // Use SendGrid
      if (this.emailService === 'sendgrid') {
        const msg = {
          to,
          from: this.fromEmail,
          subject,
          text,
          html
        };

        await sgMail.send(msg);
        console.log('✅ Email sent successfully via SendGrid to:', to);
        return true;
      }
      
      // Use Gmail with Nodemailer
      else if (this.emailService === 'gmail') {
        const mailOptions = {
          from: this.fromEmail,
          to,
          subject,
          text,
          html
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully via Gmail:', info.messageId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      if (error.response) {
        console.error('Error details:', error.response.body);
      }
      return false;
    }
  }

  /**
   * Send advertising package purchase confirmation email
   * @param {Object} purchase - Purchase record
   * @returns {Promise<boolean>}
   */
  async sendAdvertisingPackageConfirmation(purchase) {
    try {
      if (!this.enabled) {
        console.log('📧 Email disabled - Would send confirmation to:', purchase.customerEmail);
        console.log('   Package:', purchase.packageName);
        console.log('   Amount:', purchase.amountFormatted);
        return true;
      }

      const subject = `Payment Confirmed - ${purchase.packageName}`;
      const html = this.generateAdvertisingConfirmationHTML(purchase);
      const text = this.generateAdvertisingConfirmationText(purchase);

      return await this.sendEmail(purchase.customerEmail, subject, text, html);
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return false;
    }
  }

  /**
   * Generate HTML email for advertising package confirmation
   * @param {Object} purchase - Purchase record
   * @returns {string}
   */
  generateAdvertisingConfirmationHTML(purchase) {
    const expiryText = purchase.expiresAt 
      ? `Your package will expire on ${new Date(purchase.expiresAt).toLocaleDateString()}`
      : 'Your package is active until your vehicle is sold';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
          .logo-header { background: white; padding: 15px 20px; text-align: left; border-bottom: 2px solid #e0e0e0; }
          .logo { max-width: 120px; height: auto; display: block; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .detail-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .button { display: inline-block; background: #667eea !important; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-header">
            <span style="font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; color: #333; letter-spacing: -0.5px;"><span style="color: #dc3545;">Car</span><span style="color: #0066cc;">Cat</span><span style="color: #ff9800;">alog</span></span>
          </div>
          <div class="header">
            <h1>✅ Payment Confirmed!</h1>
            <p>Your advertising package is now active</p>
          </div>
          
          <div class="content">
            <p>Hi${purchase.customerName ? ' ' + purchase.customerName : ''},</p>
            
            <p>Thank you for your purchase! Your ${purchase.packageName} is now active and ready to use.</p>
            
            <div class="detail-box">
              <h3>Purchase Details</h3>
              <div class="detail-row">
                <span class="label">Package:</span>
                <span class="value">${purchase.packageName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Duration:</span>
                <span class="value">${purchase.duration}</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount Paid:</span>
                <span class="value">${purchase.amountFormatted}</span>
              </div>
              ${purchase.registration ? `
              <div class="detail-row">
                <span class="label">Vehicle:</span>
                <span class="value">${purchase.registration}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="label">Purchase Date:</span>
                <span class="value">${new Date(purchase.paidAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Create your car advertisement with photos and details</li>
              <li>Your listing will go live immediately after submission</li>
              <li>You'll receive email notifications for buyer inquiries</li>
              <li>Track your ad performance in your dashboard</li>
            </ul>
            
            <p>${expiryText}</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/find-your-car" class="button">Create Your Ad Now</a>
            </center>
            
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The CarCatalog Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email for advertising package confirmation
   * @param {Object} purchase - Purchase record
   * @returns {string}
   */
  generateAdvertisingConfirmationText(purchase) {
    const expiryText = purchase.expiresAt 
      ? `Your package will expire on ${new Date(purchase.expiresAt).toLocaleDateString()}`
      : 'Your package is active until your vehicle is sold';

    return `
Payment Confirmed!

Hi${purchase.customerName ? ' ' + purchase.customerName : ''},

Thank you for your purchase! Your ${purchase.packageName} is now active and ready to use.

Purchase Details:
- Package: ${purchase.packageName}
- Duration: ${purchase.duration}
- Amount Paid: ${purchase.amountFormatted}
${purchase.registration ? `- Vehicle: ${purchase.registration}\n` : ''}- Purchase Date: ${new Date(purchase.paidAt).toLocaleDateString()}

What's Next?
- Create your car advertisement with photos and details
- Your listing will go live immediately after submission
- You'll receive email notifications for buyer inquiries
- Track your ad performance in your dashboard

${expiryText}

Create your ad now: ${process.env.FRONTEND_URL}/find-your-car

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The CarCatalog Team

---
This is an automated email. Please do not reply to this message.
© ${new Date().getFullYear()} CarCatalog. All rights reserved.
    `.trim();
  }

  /**
   * Send payment failure notification
   * @param {string} email - Customer email
   * @param {Object} details - Failure details
   * @returns {Promise<boolean>}
   */
  async sendPaymentFailureNotification(email, details) {
    try {
      if (!this.enabled) {
        console.log('📧 Email disabled - Would send failure notification to:', email);
        return true;
      }

      const subject = 'Payment Failed - CarCatalog';
      const text = `Your payment attempt failed. Reason: ${details.reason || 'Unknown'}`;
      const html = `
        <h2>Payment Failed</h2>
        <p>We're sorry, but your payment attempt was unsuccessful.</p>
        <p><strong>Reason:</strong> ${details.reason || 'Unknown'}</p>
        <p>Please try again or contact support if the issue persists.</p>
      `;

      return await this.sendEmail(email, subject, text, html);
    } catch (error) {
      console.error('Error sending failure notification:', error);
      return false;
    }
  }

  /**
   * Send subscription renewal reminder (7 days before expiry)
   * @param {Object} dealer - Dealer object
   * @param {Object} subscription - Subscription object
   * @returns {Promise<boolean>}
   */
  async sendSubscriptionRenewalReminder(dealer, subscription) {
    try {
      if (!this.enabled) {
        console.log('📧 Email disabled - Would send renewal reminder to:', dealer.email);
        return true;
      }

      const expiryDate = new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const subject = '⏰ Your CarCatalog Subscription Renews in 7 Days';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
            .logo-header { background: white; padding: 15px 20px; text-align: left; border-bottom: 2px solid #e0e0e0; }
            .logo { max-width: 120px; height: auto; display: block; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .button { display: inline-block; background: #667eea !important; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo-header">
              <span style="font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; color: #333; letter-spacing: -0.5px;"><span style="color: #dc3545;">Car</span><span style="color: #0066cc;">Cat</span><span style="color: #ff9800;">alog</span></span>
            </div>
            <div class="header">
              <h1>⏰ Subscription Renewal Reminder</h1>
            </div>
            
            <div class="content">
              <p>Hi ${dealer.businessName},</p>
              
              <p>This is a friendly reminder that your <strong>${subscription.planId.name}</strong> subscription will automatically renew on <strong>${expiryDate}</strong>.</p>
              
              <div class="info-box">
                <h3>Subscription Details</h3>
                <p><strong>Plan:</strong> ${subscription.planId.name}</p>
                <p><strong>Monthly Price:</strong> £${(subscription.planId.price / 100).toFixed(2)} + VAT</p>
                <p><strong>Listing Limit:</strong> ${subscription.listingsLimit === null ? 'Unlimited' : subscription.listingsLimit + ' cars'}</p>
                <p><strong>Current Usage:</strong> ${subscription.listingsUsed} / ${subscription.listingsLimit === null ? '∞' : subscription.listingsLimit} listings</p>
                <p><strong>Renewal Date:</strong> ${expiryDate}</p>
              </div>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Your subscription will automatically renew on ${expiryDate}</li>
                <li>Your payment method on file will be charged</li>
                <li>You'll continue to enjoy uninterrupted service</li>
              </ul>
              
              <p>If you wish to cancel or change your subscription, please visit your dashboard before the renewal date.</p>
              
              <center>
                <a href="${process.env.FRONTEND_URL}/trade/subscription" class="button">Manage Subscription</a>
              </center>
              
              <p>Thank you for being a valued CarCatalog dealer!</p>
              
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

      const text = `
Hi ${dealer.businessName},

This is a friendly reminder that your ${subscription.planId.name} subscription will automatically renew on ${expiryDate}.

Subscription Details:
- Plan: ${subscription.planId.name}
- Monthly Price: £${(subscription.planId.price / 100).toFixed(2)} + VAT
- Listing Limit: ${subscription.listingsLimit === null ? 'Unlimited' : subscription.listingsLimit + ' cars'}
- Current Usage: ${subscription.listingsUsed} / ${subscription.listingsLimit === null ? '∞' : subscription.listingsLimit} listings
- Renewal Date: ${expiryDate}

What happens next?
- Your subscription will automatically renew on ${expiryDate}
- Your payment method on file will be charged
- You'll continue to enjoy uninterrupted service

If you wish to cancel or change your subscription, please visit your dashboard before the renewal date.

Manage Subscription: ${process.env.FRONTEND_URL}/trade/subscription

Thank you for being a valued CarCatalog dealer!

Best regards,
The CarCatalog Team
      `.trim();

      return await this.sendEmail(dealer.email, subject, text, html);
    } catch (error) {
      console.error('Error sending renewal reminder:', error);
      return false;
    }
  }

  /**
   * Send subscription renewed successfully email
   * @param {Object} dealer - Dealer object
   * @param {Object} subscription - Subscription object
   * @returns {Promise<boolean>}
   */
  async sendSubscriptionRenewed(dealer, subscription) {
    try {
      if (!this.enabled) {
        console.log('📧 Email disabled - Would send renewal confirmation to:', dealer.email);
        return true;
      }

      const nextRenewalDate = new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const subject = '✅ Your CarCatalog Subscription Has Been Renewed';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
            .logo-header { background: white; padding: 15px 20px; text-align: left; border-bottom: 2px solid #e0e0e0; }
            .logo { max-width: 120px; height: auto; display: block; }
            .header { background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4caf50; }
            .button { display: inline-block; background: #4caf50 !important; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo-header">
              <span style="font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; color: #333; letter-spacing: -0.5px;"><span style="color: #dc3545;">Car</span><span style="color: #0066cc;">Cat</span><span style="color: #ff9800;">alog</span></span>
            </div>
            <div class="header">
              <h1>✅ Subscription Renewed!</h1>
              <p>Your subscription has been successfully renewed</p>
            </div>
            
            <div class="content">
              <p>Hi ${dealer.businessName},</p>
              
              <p>Great news! Your <strong>${subscription.planId.name}</strong> subscription has been successfully renewed.</p>
              
              <div class="info-box">
                <h3>Subscription Details</h3>
                <p><strong>Plan:</strong> ${subscription.planId.name}</p>
                <p><strong>Monthly Price:</strong> £${(subscription.planId.price / 100).toFixed(2)} + VAT</p>
                <p><strong>Listing Limit:</strong> ${subscription.listingsLimit === null ? 'Unlimited' : subscription.listingsLimit + ' cars'}</p>
                <p><strong>Next Renewal:</strong> ${nextRenewalDate}</p>
              </div>
              
              <p><strong>Your benefits continue:</strong></p>
              <ul>
                <li>List up to ${subscription.listingsLimit === null ? 'unlimited' : subscription.listingsLimit} vehicles</li>
                <li>Priority placement in search results</li>
                <li>Advanced analytics and reporting</li>
                <li>Dedicated account support</li>
              </ul>
              
              <center>
                <a href="${process.env.FRONTEND_URL}/trade/dashboard" class="button">Go to Dashboard</a>
              </center>
              
              <p>Thank you for continuing with CarCatalog!</p>
              
              <p>Best regards,<br>The CarCatalog Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated confirmation. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
Hi ${dealer.businessName},

Great news! Your ${subscription.planId.name} subscription has been successfully renewed.

Subscription Details:
- Plan: ${subscription.planId.name}
- Monthly Price: £${(subscription.planId.price / 100).toFixed(2)} + VAT
- Listing Limit: ${subscription.listingsLimit === null ? 'Unlimited' : subscription.listingsLimit + ' cars'}
- Next Renewal: ${nextRenewalDate}

Your benefits continue:
- List up to ${subscription.listingsLimit === null ? 'unlimited' : subscription.listingsLimit} vehicles
- Priority placement in search results
- Advanced analytics and reporting
- Dedicated account support

Go to Dashboard: ${process.env.FRONTEND_URL}/trade/dashboard

Thank you for continuing with CarCatalog!

Best regards,
The CarCatalog Team
      `.trim();

      return await this.sendEmail(dealer.email, subject, text, html);
    } catch (error) {
      console.error('Error sending renewal confirmation:', error);
      return false;
    }
  }

  /**
   * Send subscription payment failed email
   * @param {Object} dealer - Dealer object
   * @param {Object} subscription - Subscription object
   * @returns {Promise<boolean>}
   */
  async sendSubscriptionPaymentFailed(dealer, subscription) {
    try {
      if (!this.enabled) {
        console.log('📧 Email disabled - Would send payment failed to:', dealer.email);
        return true;
      }

      const subject = '⚠️ Subscription Payment Failed - Action Required';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
            .logo-header { background: white; padding: 15px 20px; text-align: left; border-bottom: 2px solid #e0e0e0; }
            .logo { max-width: 120px; height: auto; display: block; }
            .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .warning-box { background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107; }
            .button { display: inline-block; background: #f44336 !important; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo-header">
              <span style="font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; color: #333; letter-spacing: -0.5px;"><span style="color: #dc3545;">Car</span><span style="color: #0066cc;">Cat</span><span style="color: #ff9800;">alog</span></span>
            </div>
            <div class="header">
              <h1>⚠️ Payment Failed</h1>
              <p>We couldn't process your subscription payment</p>
            </div>
            
            <div class="content">
              <p>Hi ${dealer.businessName},</p>
              
              <p>We attempted to charge your payment method for your <strong>${subscription.planId.name}</strong> subscription, but the payment failed.</p>
              
              <div class="warning-box">
                <h3>⚠️ Action Required</h3>
                <p>Please update your payment method within the next 7 days to avoid service interruption.</p>
                <p><strong>What happens if payment isn't updated?</strong></p>
                <ul>
                  <li>Your listings may be deactivated</li>
                  <li>You'll lose access to premium features</li>
                  <li>Your subscription will be cancelled</li>
                </ul>
              </div>
              
              <p><strong>Common reasons for payment failure:</strong></p>
              <ul>
                <li>Insufficient funds</li>
                <li>Expired card</li>
                <li>Card declined by bank</li>
                <li>Incorrect billing information</li>
              </ul>
              
              <center>
                <a href="${process.env.FRONTEND_URL}/trade/subscription" class="button">Update Payment Method</a>
              </center>
              
              <p>If you need assistance, please contact our support team.</p>
              
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

      const text = `
Hi ${dealer.businessName},

We attempted to charge your payment method for your ${subscription.planId.name} subscription, but the payment failed.

⚠️ Action Required

Please update your payment method within the next 7 days to avoid service interruption.

What happens if payment isn't updated?
- Your listings may be deactivated
- You'll lose access to premium features
- Your subscription will be cancelled

Common reasons for payment failure:
- Insufficient funds
- Expired card
- Card declined by bank
- Incorrect billing information

Update Payment Method: ${process.env.FRONTEND_URL}/trade/subscription

If you need assistance, please contact our support team.

Best regards,
The CarCatalog Team
      `.trim();

      return await this.sendEmail(dealer.email, subject, text, html);
    } catch (error) {
      console.error('Error sending payment failed email:', error);
      return false;
    }
  }

  /**
   * Send subscription expired email
   * @param {Object} dealer - Dealer object
   * @param {Object} subscription - Subscription object
   * @returns {Promise<boolean>}
   */
  async sendSubscriptionExpired(dealer, subscription) {
    try {
      if (!this.enabled) {
        console.log('📧 Email disabled - Would send expired notification to:', dealer.email);
        return true;
      }

      const subject = '❌ Your CarCatalog Subscription Has Expired';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
            .logo-header { background: white; padding: 15px 20px; text-align: left; border-bottom: 2px solid #e0e0e0; }
            .logo { max-width: 120px; height: auto; display: block; }
            .header { background: linear-gradient(135deg, #757575 0%, #424242 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #757575; }
            .button { display: inline-block; background: #667eea !important; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo-header">
              <span style="font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; color: #333; letter-spacing: -0.5px;"><span style="color: #dc3545;">Car</span><span style="color: #0066cc;">Cat</span><span style="color: #ff9800;">alog</span></span>
            </div>
            <div class="header">
              <h1>Subscription Expired</h1>
            </div>
            
            <div class="content">
              <p>Hi ${dealer.businessName},</p>
              
              <p>Your <strong>${subscription.planId.name}</strong> subscription has expired.</p>
              
              <div class="info-box">
                <h3>What This Means</h3>
                <ul>
                  <li>Your vehicle listings have been deactivated</li>
                  <li>You no longer have access to premium features</li>
                  <li>Your account is now in inactive status</li>
                </ul>
              </div>
              
              <p><strong>Want to continue selling on CarCatalog?</strong></p>
              <p>Reactivate your subscription to restore your listings and regain access to all premium features.</p>
              
              <center>
                <a href="${process.env.FRONTEND_URL}/trade/subscription" class="button">Reactivate Subscription</a>
              </center>
              
              <p>We'd love to have you back! If you have any questions, please contact our support team.</p>
              
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

      const text = `
Hi ${dealer.businessName},

Your ${subscription.planId.name} subscription has expired.

What This Means:
- Your vehicle listings have been deactivated
- You no longer have access to premium features
- Your account is now in inactive status

Want to continue selling on CarCatalog?

Reactivate your subscription to restore your listings and regain access to all premium features.

Reactivate Subscription: ${process.env.FRONTEND_URL}/trade/subscription

We'd love to have you back! If you have any questions, please contact our support team.

Best regards,
The CarCatalog Team
      `.trim();

      return await this.sendEmail(dealer.email, subject, text, html);
    } catch (error) {
      console.error('Error sending expired notification:', error);
      return false;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

// Export both the class and helper function
module.exports = EmailService;
module.exports.sendEmail = (to, subject, text, html) => emailService.sendEmail(to, subject, text, html);





