/**
 * Email Service
 * Handles sending emails for various events using Brevo HTTP API / SendGrid / Gmail
 */

const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    this.emailService = process.env.EMAIL_SERVICE || 'gmail';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@carcatalog.com';

    // Configure Gmail/Google Workspace with Nodemailer
    if (this.emailService === 'gmail' && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: { rejectUnauthorized: false }
      });
      this.enabled = true;
    }
    // Configure Brevo via HTTP API (works on Render — no SMTP port restrictions)
    else if (this.emailService === 'brevo' && process.env.BREVO_API_KEY) {
      this.brevoApiKey = process.env.BREVO_API_KEY;
      this.enabled = true;
    }
    // Configure SendGrid
    else if (this.emailService === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.enabled = true;
    } else {
      this.enabled = false;
    }
  }

  /**
   * Send email using configured service
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} text - Plain text content
   * @param {string} html - HTML content
   * @returns {Promise<boolean>}
   */
  async sendEmail(to, subject, text, html) {
    try {
      if (!this.enabled) {
        console.log('Warning: Email service not configured, skipping email send');
        return true;
      }

      // Use Brevo HTTP API
      if (this.emailService === 'brevo') {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.brevoApiKey
          },
          body: JSON.stringify({
            sender: { email: this.fromEmail },
            to: [{ email: to }],
            subject,
            textContent: text,
            htmlContent: html
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(`Brevo API error: ${JSON.stringify(err)}`);
        }

        console.log(`Email sent via Brevo to: ${to}`);
        return true;
      }

      // Use SendGrid
      else if (this.emailService === 'sendgrid') {
        const msg = { to, from: this.fromEmail, subject, text, html };
        await sgMail.send(msg);
        console.log(`Email sent via SendGrid to: ${to}`);
        return true;
      }

      // Use Gmail with Nodemailer
      else if (this.emailService === 'gmail') {
        const mailOptions = { from: this.fromEmail, to, subject, text, html };
        await this.transporter.sendMail(mailOptions);
        console.log(`Email sent via Gmail to: ${to}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending email:', error);
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
      if (!this.enabled) return true;

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
    const logoUrl = process.env.LOGO_URL || '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .email-wrapper { background: #f5f5f5; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .logo-header { background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 30px 40px; text-align: center; }
          .logo { max-width: 180px; height: auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { font-size: 24px; margin-bottom: 8px; }
          .header p { font-size: 15px; opacity: 0.9; }
          .content { background: white; padding: 30px 40px; }
          .content p { margin-bottom: 15px; color: #555; font-size: 15px; }
          .content ul { margin: 10px 0 15px 20px; }
          .content li { margin-bottom: 8px; color: #555; font-size: 14px; }
          .detail-box { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .detail-box h3 { margin-bottom: 15px; color: #333; font-size: 16px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #555; font-size: 14px; }
          .value { color: #333; font-size: 14px; }
          .button-container { text-align: center; margin: 25px 0; }
          .button { display: inline-block; background: #667eea; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }
          .footer { background: #f8f9fa; text-align: center; padding: 25px 40px; border-top: 1px solid #e0e0e0; }
          .footer p { color: #888; font-size: 12px; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="logo-header">
              ${logoUrl ? `<img src="${logoUrl.includes('res.cloudinary.com') ? logoUrl.replace('/upload/','/upload/e_make_transparent,w_220,f_png/') : logoUrl}" alt="CarCatalog" style="max-width:220px;height:auto;display:block;margin:0 auto;" />` : `<div style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Car<span style=""color:#ffd700;"">Cat</span>ALog</div><div style=""color:rgba(255,255,255,0.8);font-size:12px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;"">List it &middot; Sell it &middot; Buy it</div>`}
            </div>
            <div class="header">
              <h1>Payment Confirmed!</h1>
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
                </div>` : ''}
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
              <div class="button-container">
                <a href="${process.env.FRONTEND_URL}/find-your-car" class="button">Create Your Ad Now</a>
              </div>
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
              <p>Best regards,<br><strong>The CarCatalog Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
            </div>
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
      if (!this.enabled) return true;

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
      if (!this.enabled) return true;

      const expiryDate = new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

      const subject = 'Your CarCatalog Subscription Renews in 7 Days';
      const logoUrl = process.env.LOGO_URL || '';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .email-wrapper { background: #f5f5f5; padding: 40px 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .logo-header { background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 30px 40px; text-align: center; }
            .logo { max-width: 180px; height: auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { font-size: 24px; margin-bottom: 8px; }
            .content { background: white; padding: 30px 40px; }
            .content p { margin-bottom: 15px; color: #555; font-size: 15px; }
            .content ul { margin: 10px 0 15px 20px; }
            .content li { margin-bottom: 8px; color: #555; font-size: 14px; }
            .info-box { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .info-box h3 { margin-bottom: 12px; color: #333; font-size: 16px; }
            .info-box p { margin-bottom: 8px; color: #555; font-size: 14px; }
            .info-box p:last-child { margin-bottom: 0; }
            .button-container { text-align: center; margin: 25px 0; }
            .button { display: inline-block; background: #667eea; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 40px; border-top: 1px solid #e0e0e0; }
            .footer p { color: #888; font-size: 12px; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <div class="logo-header">
                ${logoUrl ? `<img src="${logoUrl.includes('res.cloudinary.com') ? logoUrl.replace('/upload/','/upload/e_make_transparent,w_220,f_png/') : logoUrl}" alt="CarCatalog" style="max-width:220px;height:auto;display:block;margin:0 auto;" />` : `<div style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Car<span style=""color:#ffd700;"">Cat</span>ALog</div><div style=""color:rgba(255,255,255,0.8);font-size:12px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;"">List it &middot; Sell it &middot; Buy it</div>`}
              </div>
              <div class="header">
                <h1>Subscription Renewal Reminder</h1>
              </div>
              <div class="content">
                <p>Hi ${dealer.businessName},</p>
                <p>This is a friendly reminder that your <strong>${subscription.planId.name}</strong> subscription will automatically renew on <strong>${expiryDate}</strong>.</p>
                <div class="info-box">
                  <h3>Subscription Details</h3>
                  <p><strong>Plan:</strong> ${subscription.planId.name}</p>
                  <p><strong>Monthly Price:</strong> &pound;${(subscription.planId.price / 100).toFixed(2)} + VAT</p>
                  <p><strong>Listing Limit:</strong> ${subscription.listingsLimit === null ? 'Unlimited' : subscription.listingsLimit + ' cars'}</p>
                  <p><strong>Current Usage:</strong> ${subscription.listingsUsed} / ${subscription.listingsLimit === null ? 'Unlimited' : subscription.listingsLimit} listings</p>
                  <p><strong>Renewal Date:</strong> ${expiryDate}</p>
                </div>
                <p><strong>What happens next?</strong></p>
                <ul>
                  <li>Your subscription will automatically renew on ${expiryDate}</li>
                  <li>Your payment method on file will be charged</li>
                  <li>You'll continue to enjoy uninterrupted service</li>
                </ul>
                <p>If you wish to cancel or change your subscription, please visit your dashboard before the renewal date.</p>
                <div class="button-container">
                  <a href="${process.env.FRONTEND_URL}/trade/subscription" class="button">Manage Subscription</a>
                </div>
                <p>Thank you for being a valued CarCatalog dealer!</p>
                <p>Best regards,<br><strong>The CarCatalog Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated reminder. Please do not reply to this message.</p>
                <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
              </div>
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
- Current Usage: ${subscription.listingsUsed} / ${subscription.listingsLimit === null ? 'Unlimited' : subscription.listingsLimit} listings
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
      if (!this.enabled) return true;

      const nextRenewalDate = new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

      const subject = 'Your CarCatalog Subscription Has Been Renewed';
      const logoUrl = process.env.LOGO_URL || '';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .email-wrapper { background: #f5f5f5; padding: 40px 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .logo-header { background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 30px 40px; text-align: center; }
            .logo { max-width: 180px; height: auto; }
            .header { background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { font-size: 24px; margin-bottom: 8px; }
            .header p { font-size: 15px; opacity: 0.9; }
            .content { background: white; padding: 30px 40px; }
            .content p { margin-bottom: 15px; color: #555; font-size: 15px; }
            .content ul { margin: 10px 0 15px 20px; }
            .content li { margin-bottom: 8px; color: #555; font-size: 14px; }
            .info-box { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4caf50; }
            .info-box h3 { margin-bottom: 12px; color: #333; font-size: 16px; }
            .info-box p { margin-bottom: 8px; color: #555; font-size: 14px; }
            .info-box p:last-child { margin-bottom: 0; }
            .button-container { text-align: center; margin: 25px 0; }
            .button { display: inline-block; background: #4caf50; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 40px; border-top: 1px solid #e0e0e0; }
            .footer p { color: #888; font-size: 12px; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <div class="logo-header">
                ${logoUrl ? `<img src="${logoUrl.includes('res.cloudinary.com') ? logoUrl.replace('/upload/','/upload/e_make_transparent,w_220,f_png/') : logoUrl}" alt="CarCatalog" style="max-width:220px;height:auto;display:block;margin:0 auto;" />` : `<div style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Car<span style=""color:#ffd700;"">Cat</span>ALog</div><div style=""color:rgba(255,255,255,0.8);font-size:12px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;"">List it &middot; Sell it &middot; Buy it</div>`}
              </div>
              <div class="header">
                <h1>Subscription Renewed!</h1>
                <p>Your subscription has been successfully renewed</p>
              </div>
              <div class="content">
                <p>Hi ${dealer.businessName},</p>
                <p>Great news! Your <strong>${subscription.planId.name}</strong> subscription has been successfully renewed.</p>
                <div class="info-box">
                  <h3>Subscription Details</h3>
                  <p><strong>Plan:</strong> ${subscription.planId.name}</p>
                  <p><strong>Monthly Price:</strong> &pound;${(subscription.planId.price / 100).toFixed(2)} + VAT</p>
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
                <div class="button-container">
                  <a href="${process.env.FRONTEND_URL}/trade/dashboard" class="button">Go to Dashboard</a>
                </div>
                <p>Thank you for continuing with CarCatalog!</p>
                <p>Best regards,<br><strong>The CarCatalog Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated confirmation. Please do not reply to this message.</p>
                <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
              </div>
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
      if (!this.enabled) return true;

      const subject = 'Subscription Payment Failed - Action Required';
      const logoUrl = process.env.LOGO_URL || '';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .email-wrapper { background: #f5f5f5; padding: 40px 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .logo-header { background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 30px 40px; text-align: center; }
            .logo { max-width: 180px; height: auto; }
            .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { font-size: 24px; margin-bottom: 8px; }
            .header p { font-size: 15px; opacity: 0.9; }
            .content { background: white; padding: 30px 40px; }
            .content p { margin-bottom: 15px; color: #555; font-size: 15px; }
            .content ul { margin: 10px 0 15px 20px; }
            .content li { margin-bottom: 8px; color: #555; font-size: 14px; }
            .warning-box { background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107; }
            .warning-box h3 { margin-bottom: 12px; color: #856404; font-size: 16px; }
            .warning-box p { margin-bottom: 8px; color: #856404; font-size: 14px; }
            .warning-box p:last-child { margin-bottom: 0; }
            .button-container { text-align: center; margin: 25px 0; }
            .button { display: inline-block; background: #f44336; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 40px; border-top: 1px solid #e0e0e0; }
            .footer p { color: #888; font-size: 12px; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <div class="logo-header">
                ${logoUrl ? `<img src="${logoUrl.includes('res.cloudinary.com') ? logoUrl.replace('/upload/','/upload/e_make_transparent,w_220,f_png/') : logoUrl}" alt="CarCatalog" style="max-width:220px;height:auto;display:block;margin:0 auto;" />` : `<div style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Car<span style=""color:#ffd700;"">Cat</span>ALog</div><div style=""color:rgba(255,255,255,0.8);font-size:12px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;"">List it &middot; Sell it &middot; Buy it</div>`}
              </div>
              <div class="header">
                <h1>Payment Failed</h1>
                <p>We couldn't process your subscription payment</p>
              </div>
              <div class="content">
                <p>Hi ${dealer.businessName},</p>
                <p>We attempted to charge your payment method for your <strong>${subscription.planId.name}</strong> subscription, but the payment failed.</p>
                <div class="warning-box">
                  <h3>Action Required</h3>
                  <p>Please update your payment method within the next 7 days to avoid service interruption.</p>
                  <p><strong>What happens if payment is not updated?</strong></p>
                  <ul style="margin: 8px 0 0 20px;">
                    <li style="color: #856404; margin-bottom: 5px;">Your listings may be deactivated</li>
                    <li style="color: #856404; margin-bottom: 5px;">You'll lose access to premium features</li>
                    <li style="color: #856404;">Your subscription will be cancelled</li>
                  </ul>
                </div>
                <p><strong>Common reasons for payment failure:</strong></p>
                <ul>
                  <li>Insufficient funds</li>
                  <li>Expired card</li>
                  <li>Card declined by bank</li>
                  <li>Incorrect billing information</li>
                </ul>
                <div class="button-container">
                  <a href="${process.env.FRONTEND_URL}/trade/subscription" class="button">Update Payment Method</a>
                </div>
                <p>If you need assistance, please contact our support team.</p>
                <p>Best regards,<br><strong>The CarCatalog Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated notification. Please do not reply to this message.</p>
                <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
Hi ${dealer.businessName},

We attempted to charge your payment method for your ${subscription.planId.name} subscription, but the payment failed.

Action Required

Please update your payment method within the next 7 days to avoid service interruption.

What happens if payment is not updated?
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
      if (!this.enabled) return true;

      const subject = 'Your CarCatalog Subscription Has Expired';
      const logoUrl = process.env.LOGO_URL || '';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .email-wrapper { background: #f5f5f5; padding: 40px 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .logo-header { background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 30px 40px; text-align: center; }
            .logo { max-width: 180px; height: auto; }
            .header { background: linear-gradient(135deg, #757575 0%, #424242 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { font-size: 24px; margin-bottom: 8px; }
            .content { background: white; padding: 30px 40px; }
            .content p { margin-bottom: 15px; color: #555; font-size: 15px; }
            .info-box { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #757575; }
            .info-box h3 { margin-bottom: 12px; color: #333; font-size: 16px; }
            .info-box ul { margin: 8px 0 0 20px; }
            .info-box li { margin-bottom: 8px; color: #555; font-size: 14px; }
            .button-container { text-align: center; margin: 25px 0; }
            .button { display: inline-block; background: #667eea; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 40px; border-top: 1px solid #e0e0e0; }
            .footer p { color: #888; font-size: 12px; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <div class="logo-header">
                ${logoUrl ? `<img src="${logoUrl.includes('res.cloudinary.com') ? logoUrl.replace('/upload/','/upload/e_make_transparent,w_220,f_png/') : logoUrl}" alt="CarCatalog" style="max-width:220px;height:auto;display:block;margin:0 auto;" />` : `<div style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Car<span style=""color:#ffd700;"">Cat</span>ALog</div><div style=""color:rgba(255,255,255,0.8);font-size:12px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;"">List it &middot; Sell it &middot; Buy it</div>`}
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
                <div class="button-container">
                  <a href="${process.env.FRONTEND_URL}/trade/subscription" class="button">Reactivate Subscription</a>
                </div>
                <p>We'd love to have you back! If you have any questions, please contact our support team.</p>
                <p>Best regards,<br><strong>The CarCatalog Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated notification. Please do not reply to this message.</p>
                <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
              </div>
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

  /**
   * Send car listing success email
   * @param {Object} user - User object
   * @param {Object} carDetails - Car listing details
   * @returns {Promise<boolean>}
   */
  async sendCarListingSuccess(user, carDetails) {
    try {
      if (!this.enabled) return true;

      const { carListingSuccessEmail } = require('../utils/emailTemplates');
      const emailContent = carListingSuccessEmail(user.name, user.email, carDetails);

      return await this.sendEmail(user.email, emailContent.subject, emailContent.text, emailContent.html);
    } catch (error) {
      console.error('Error sending car listing success email:', error);
      return false;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

// Export both the class and helper function
module.exports = EmailService;
module.exports.sendEmail = (to, subject, text, html) => emailService.sendEmail(to, subject, text, html);
