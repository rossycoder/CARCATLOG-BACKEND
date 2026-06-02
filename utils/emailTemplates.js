/**
 * Helper to render logo block in emails
 * Uses image if LOGO_URL is set, otherwise falls back to styled text logo
 * Applies Cloudinary transformation to remove white background if it's a Cloudinary URL
 */
const renderLogoHeader = (logoUrl) => {
  if (logoUrl) {
    // For Cloudinary URLs: add e_make_transparent to remove white background,
    // convert to PNG, and set width. This makes the logo look great on any background.
    let displayUrl = logoUrl;
    if (logoUrl.includes('res.cloudinary.com')) {
      // Insert transformation: remove white bg, convert to png, width 220
      displayUrl = logoUrl.replace('/upload/', '/upload/e_make_transparent,w_220,f_png/');
    }
    return `<img src="${displayUrl}" alt="CarCatalog" style="max-width:220px;height:auto;display:block;margin:0 auto;" />`;
  }
  // Text fallback
  return `
    <div style="display:inline-block;text-align:center;">
      <div style="color:#ffffff;font-size:30px;font-weight:800;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;line-height:1;">
        Car<span style="color:#ffd700;">Cat</span>ALog
      </div>
      <div style="color:rgba(255,255,255,0.75);font-size:11px;margin-top:5px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">
        List it &nbsp;&middot;&nbsp; Sell it &nbsp;&middot;&nbsp; Buy it
      </div>
    </div>`;
};

/**
 * Welcome email template
 */
const welcomeEmail = (name, email) => {
  const logoUrl = process.env.LOGO_URL || '';
  return {
    subject: 'Welcome to CarCatalog!',
    html: `
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
          .header { background: white; padding: 30px 40px 20px; text-align: center; }
          .header h1 { color: #0066cc; font-size: 26px; margin-bottom: 8px; }
          .header p { color: #666; font-size: 15px; }
          .content { padding: 20px 40px 40px; background: white; }
          .content p { margin-bottom: 15px; color: #555; font-size: 15px; }
          .content ul { margin: 10px 0 20px 20px; }
          .content li { margin-bottom: 8px; color: #555; font-size: 15px; }
          .button-container { text-align: center; margin: 30px 0; }
          .button { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }
          .divider { height: 1px; background: #e0e0e0; margin: 25px 0; }
          .footer { background: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e0e0e0; }
          .footer p { color: #666; font-size: 13px; margin-bottom: 6px; }
          .footer a { color: #0066cc; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="logo-header">
              ${renderLogoHeader(logoUrl)}
            </div>
            <div class="header">
              <h1>Welcome to CarCatalog!</h1>
              <p>We're glad to have you on board</p>
            </div>
            <div class="content">
              <p><strong>Hi ${name || 'there'},</strong></p>
              <p>Thank you for creating an account with CarCatalog. Your account has been successfully created with the email: <strong>${email}</strong></p>
              <p>You can now:</p>
              <ul>
                <li>Browse thousands of cars</li>
                <li>Save your favourite listings</li>
                <li>Get instant alerts for new cars</li>
                <li>Sell your car easily</li>
              </ul>
              <div class="button-container">
                <a href="${process.env.FRONTEND_URL}" class="button">Start Browsing Cars</a>
              </div>
              <p>If you have any questions, feel free to contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
              <p>This email was sent to <strong>${email}</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to CarCatalog!\n\nHi ${name || 'there'},\n\nThank you for creating an account. Your account has been successfully created with the email: ${email}\n\nVisit ${process.env.FRONTEND_URL} to start browsing cars.\n\n© ${new Date().getFullYear()} CarCatalog. All rights reserved.`
  };
};

/**
 * Login notification email
 */
const loginNotificationEmail = (name, email, ipAddress, userAgent) => {
  const logoUrl = process.env.LOGO_URL || '';
  const date = new Date().toLocaleString('en-GB', { 
    dateStyle: 'full', 
    timeStyle: 'short' 
  });

  return {
    subject: 'New Sign-in to Your CarCatalog Account',
    html: `
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
          .header { background: white; padding: 30px 40px 20px; text-align: center; }
          .header h1 { color: #0066cc; font-size: 26px; margin-bottom: 8px; }
          .content { padding: 20px 40px 40px; background: white; }
          .content p { margin-bottom: 15px; color: #555; font-size: 15px; }
          .info-box { background: #f8f9fa; border-left: 4px solid #0066cc; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .info-box p { margin-bottom: 8px; color: #555; font-size: 14px; }
          .info-box p:last-child { margin-bottom: 0; }
          .divider { height: 1px; background: #e0e0e0; margin: 25px 0; }
          .footer { background: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e0e0e0; }
          .footer p { color: #666; font-size: 13px; margin-bottom: 6px; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="logo-header">
              ${renderLogoHeader(logoUrl)}
            </div>
            <div class="header">
              <h1>New Sign-in Detected</h1>
            </div>
            <div class="content">
              <p><strong>Hi ${name || 'there'},</strong></p>
              <p>We detected a new sign-in to your CarCatalog account.</p>
              <div class="info-box">
                <p><strong>Date &amp; Time:</strong> ${date}</p>
                <p><strong>Email:</strong> ${email}</p>
                ${ipAddress ? `<p><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
                ${userAgent ? `<p><strong>Device:</strong> ${userAgent}</p>` : ''}
              </div>
              <p>If this was you, you can safely ignore this email.</p>
              <p>If you didn't sign in, please secure your account immediately by changing your password.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `New Sign-in Detected\n\nHi ${name || 'there'},\n\nWe detected a new sign-in to your CarCatalog account on ${date}.\n\nIf this wasn't you, please secure your account immediately.\n\n© ${new Date().getFullYear()} CarCatalog. All rights reserved.`
  };
};

/**
 * Password reset email - Professional AutoTrader-style template
 */
const passwordResetEmail = (name, email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const logoUrl = process.env.LOGO_URL || '';

  return {
    subject: '🔐 Reset Your CarCatalog Password',
    html: `
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
          .header { background: white; padding: 40px 40px 20px; text-align: center; }
          .header h1 { color: #0066cc; font-size: 28px; margin-bottom: 10px; }
          .header p { color: #666; font-size: 16px; }
          .content { padding: 20px 40px 40px; background: white; }
          .content p { margin-bottom: 15px; color: #555; font-size: 15px; }
          .button-container { text-align: center; margin: 30px 0; }
          .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(220,53,69,0.3); transition: all 0.3s; }
          .button:hover { box-shadow: 0 6px 16px rgba(220,53,69,0.4); transform: translateY(-2px); }
          .link-box { background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #dc3545; margin: 20px 0; word-break: break-all; font-size: 13px; color: #666; }
          .warning-box { background: #fff3cd; border: 2px solid #ffc107; color: #856404; padding: 20px; border-radius: 6px; margin: 25px 0; text-align: center; }
          .warning-box strong { display: block; font-size: 16px; margin-bottom: 5px; }
          .security-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; border-radius: 6px; margin: 25px 0; }
          .security-box strong { color: #721c24; display: block; margin-bottom: 10px; }
          .security-box p { color: #721c24; font-size: 14px; margin-bottom: 8px; }
          .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
          .footer { background: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e0e0e0; }
          .footer p { color: #666; font-size: 13px; margin-bottom: 8px; }
          .footer a { color: #0066cc; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="logo-header">
              ${renderLogoHeader(logoUrl)}
            </div>
            
            <div class="header">
              <h1>🔐 Reset Your Password</h1>
              <p>Secure your account</p>
            </div>
            
            <div class="content">
              <p><strong>Hi ${name || 'there'},</strong></p>
              <p>We received a request to reset the password for your CarCatalog account associated with <strong>${email}</strong>.</p>
              <p>Click the button below to create a new password:</p>
              
              <div class="button-container">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p style="text-align: center; color: #999; font-size: 14px;">Button not working? Copy and paste this link:</p>
              <div class="link-box">${resetUrl}</div>
              
              <div class="warning-box">
                <strong>⏰ Time Sensitive</strong>
                This password reset link will expire in 1 hour for security reasons.
              </div>
              
              <div class="security-box">
                <strong>🛡️ Security Notice</strong>
                <p>• If you didn't request this password reset, please ignore this email.</p>
                <p>• Your password will remain unchanged until you create a new one.</p>
                <p>• Never share your password with anyone.</p>
                <p>• If you're concerned about your account security, contact our support team immediately.</p>
              </div>
              
              <div class="divider"></div>
              
              <p style="font-size: 13px; color: #999;">This is an automated security email. If you have any concerns, please contact our support team.</p>
            </div>
            
            <div class="footer">
              <p><strong>Need help?</strong> Contact our support team</p>
              <p>Email: <a href="mailto:support@carcatalog.com">support@carcatalog.com</a></p>
              <div class="divider" style="margin: 20px 0;"></div>
              <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
              <p style="font-size: 12px;">This email was sent to <strong>${email}</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Reset Your Password - CarCatalog\n\nHi ${name || 'there'},\n\nWe received a request to reset the password for your CarCatalog account (${email}).\n\nClick this link to create a new password:\n${resetUrl}\n\n⏰ This link will expire in 1 hour for security reasons.\n\n🛡️ Security Notice:\n• If you didn't request this, ignore this email\n• Your password remains unchanged until you create a new one\n• Never share your password with anyone\n• Contact support if you have security concerns\n\nNeed help? Contact support@carcatalog.com\n\n© ${new Date().getFullYear()} CarCatalog. All rights reserved.`
  };
};

/**
 * Email verification email - Professional AutoTrader-style template
 */
const emailVerificationEmail = (name, email, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  const logoUrl = process.env.LOGO_URL || '';

  return {
    subject: '✉️ Verify Your Email Address - CarCatalog',
    html: `
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
          .logo-text { color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
          .logo-text span { color: #ffd700; }
          .logo-tagline { color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
          .header { background: white; padding: 40px 40px 20px; text-align: center; }
          .header h1 { color: #0066cc; font-size: 28px; margin-bottom: 10px; }
          .header p { color: #666; font-size: 16px; }
          .content { padding: 20px 40px 40px; background: white; }
          .content p { margin-bottom: 15px; color: #555; font-size: 15px; }
          .button-container { text-align: center; margin: 30px 0; }
          .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0,102,204,0.3); }
          .link-box { background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #0066cc; margin: 20px 0; word-break: break-all; font-size: 13px; color: #666; }
          .warning-box { background: #fff3cd; border: 2px solid #ffc107; color: #856404; padding: 20px; border-radius: 6px; margin: 25px 0; text-align: center; }
          .warning-box strong { display: block; font-size: 16px; margin-bottom: 5px; }
          .info-box { background: #e7f3ff; border-left: 4px solid #0066cc; padding: 20px; border-radius: 6px; margin: 25px 0; }
          .info-box ul { margin-left: 20px; margin-top: 10px; }
          .info-box li { margin-bottom: 8px; color: #555; }
          .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
          .footer { background: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e0e0e0; }
          .footer p { color: #666; font-size: 13px; margin-bottom: 8px; }
          .footer a { color: #0066cc; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="logo-header">
              ${logoUrl
                ? `<img src="${logoUrl}" alt="CarCatalog" style="max-width: 180px; height: auto;" />`
                : `<div class="logo-text">Car<span>Cat</span>ALog</div><div class="logo-tagline">List it · Sell it · Buy it</div>`
              }
            </div>
            
            <div class="header">
              <h1>✉️ Verify Your Email Address</h1>
              <p>One more step to get started</p>
            </div>
            
            <div class="content">
              <p><strong>Hi ${name || 'there'},</strong></p>
              <p>Welcome to CarCatalog! We're excited to have you join our community of car enthusiasts.</p>
              <p>To complete your registration and unlock all features, please verify your email address by clicking the button below:</p>
              
              <div class="button-container">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p style="text-align: center; color: #999; font-size: 14px;">Button not working? Copy and paste this link:</p>
              <div class="link-box">${verificationUrl}</div>
              
              <div class="warning-box">
                <strong>⏰ Important</strong>
                This verification link will expire in 24 hours for security reasons.
              </div>
              
              <div class="info-box">
                <strong>Once verified, you'll be able to:</strong>
                <ul>
                  <li>Browse thousands of quality vehicles</li>
                  <li>Save your favorite listings</li>
                  <li>Get instant alerts for new cars</li>
                  <li>List your own vehicle for sale</li>
                  <li>Access exclusive dealer features</li>
                </ul>
              </div>
              
              <div class="divider"></div>
              
              <p style="font-size: 13px; color: #999;">If you didn't create an account with CarCatalog, you can safely ignore this email. No further action is required.</p>
            </div>
            
            <div class="footer">
              <p><strong>Need help?</strong> Contact our support team</p>
              <p>Email: <a href="mailto:support@carcatalog.com">support@carcatalog.com</a></p>
              <div class="divider" style="margin: 20px 0;"></div>
              <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
              <p style="font-size: 12px;">This email was sent to <strong>${email}</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Verify Your Email Address - CarCatalog\n\nHi ${name || 'there'},\n\nWelcome to CarCatalog! We're excited to have you join our community.\n\nTo complete your registration, please verify your email address by clicking this link:\n\n${verificationUrl}\n\n⏰ This link will expire in 10 minutes for security reasons.\n\nOnce verified, you'll be able to:\n- Browse thousands of quality vehicles\n- Save your favorite listings\n- Get instant alerts for new cars\n- List your own vehicle for sale\n- Access exclusive dealer features\n\nIf you didn't create an account, please ignore this email.\n\nNeed help? Contact support@carcatalog.com\n\n© ${new Date().getFullYear()} CarCatalog. All rights reserved.`
  };
};

/**
 * Car listing success email - Professional template
 */
const carListingSuccessEmail = (name, email, carDetails) => {
  const logoUrl = process.env.LOGO_URL || '';
  const carUrl = `${process.env.FRONTEND_URL}/cars/${carDetails.id}`;

  return {
    subject: '🚗 Your Car is Now Live on CarCatalog!',
    html: `
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
          .logo-header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px 40px; text-align: center; }
          .logo { max-width: 180px; height: auto; }
          .header { background: white; padding: 40px 40px 20px; text-align: center; }
          .header h1 { color: #28a745; font-size: 28px; margin-bottom: 10px; }
          .header p { color: #666; font-size: 16px; }
          .content { padding: 20px 40px 40px; background: white; }
          .content p { margin-bottom: 15px; color: #555; font-size: 15px; }
          .car-details { background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; border-radius: 6px; margin: 25px 0; }
          .car-details h3 { color: #28a745; margin-bottom: 15px; font-size: 18px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #495057; }
          .detail-value { color: #6c757d; }
          .button-container { text-align: center; margin: 30px 0; }
          .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3); transition: all 0.3s; }
          .button:hover { box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4); transform: translateY(-2px); }
          .tips-box { background: #e7f3ff; border-left: 4px solid #0066cc; padding: 20px; border-radius: 6px; margin: 25px 0; }
          .tips-box h4 { color: #0066cc; margin-bottom: 15px; }
          .tips-box ul { margin-left: 20px; }
          .tips-box li { margin-bottom: 8px; color: #555; }
          .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
          .footer { background: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e0e0e0; }
          .footer p { color: #666; font-size: 13px; margin-bottom: 8px; }
          .footer a { color: #0066cc; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="logo-header">
              ${renderLogoHeader(logoUrl)}
            </div>
            
            <div class="header">
              <h1>🎉 Your Car is Live!</h1>
              <p>Congratulations! Your listing is now active</p>
            </div>
            
            <div class="content">
              <p><strong>Hi ${name || 'there'},</strong></p>
              <p>Great news! Your car listing has been successfully published on CarCatalog and is now visible to thousands of potential buyers.</p>
              
              <div class="car-details">
                <h3>📋 Your Listing Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Vehicle:</span>
                  <span class="detail-value">${carDetails.make} ${carDetails.model}</span>
                </div>
                ${carDetails.year ? `
                <div class="detail-row">
                  <span class="detail-label">Year:</span>
                  <span class="detail-value">${carDetails.year}</span>
                </div>` : ''}
                ${carDetails.registration ? `
                <div class="detail-row">
                  <span class="detail-label">Registration:</span>
                  <span class="detail-value">${carDetails.registration}</span>
                </div>` : ''}
                ${carDetails.price ? `
                <div class="detail-row">
                  <span class="detail-label">Price:</span>
                  <span class="detail-value">£${carDetails.price.toLocaleString()}</span>
                </div>` : ''}
                <div class="detail-row">
                  <span class="detail-label">Listed:</span>
                  <span class="detail-value">${new Date().toLocaleDateString('en-GB')}</span>
                </div>
              </div>
              
              <div class="button-container">
                <a href="${carUrl}" class="button">View Your Listing</a>
              </div>
              
              <div class="tips-box">
                <h4>💡 Tips to Sell Faster</h4>
                <ul>
                  <li><strong>Add more photos:</strong> Listings with 5+ photos get 3x more views</li>
                  <li><strong>Write a detailed description:</strong> Include service history and unique features</li>
                  <li><strong>Respond quickly:</strong> Fast responses increase your chances of a sale</li>
                  <li><strong>Keep your listing updated:</strong> Update if you make any changes to the car</li>
                  <li><strong>Be competitive:</strong> Check similar cars to ensure your price is fair</li>
                </ul>
              </div>
              
              <div class="divider"></div>
              
              <p><strong>What happens next?</strong></p>
              <ul style="margin-left: 20px; margin-bottom: 20px;">
                <li>Your car is now searchable by thousands of buyers</li>
                <li>You'll receive email notifications when buyers contact you</li>
                <li>You can edit your listing anytime from your dashboard</li>
                <li>We'll send you weekly performance updates</li>
              </ul>
              
              <p>Need help? Our support team is here to assist you with any questions about selling your car.</p>
              
              <p>Best of luck with your sale!</p>
              <p><strong>The CarCatalog Team</strong></p>
            </div>
            
            <div class="footer">
              <p><strong>Need help?</strong> Contact our support team</p>
              <p>Email: <a href="mailto:support@carcatalog.co.uk">support@carcatalog.co.uk</a></p>
              <div class="divider" style="margin: 20px 0;"></div>
              <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
              <p style="font-size: 12px;">This email was sent to <strong>${email}</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `🎉 Your Car is Live on CarCatalog!

Hi ${name || 'there'},

Great news! Your car listing has been successfully published on CarCatalog and is now visible to thousands of potential buyers.

Your Listing Details:
- Vehicle: ${carDetails.make} ${carDetails.model}
${carDetails.year ? `- Year: ${carDetails.year}\n` : ''}${carDetails.registration ? `- Registration: ${carDetails.registration}\n` : ''}${carDetails.price ? `- Price: £${carDetails.price.toLocaleString()}\n` : ''}- Listed: ${new Date().toLocaleDateString('en-GB')}

View Your Listing: ${carUrl}

💡 Tips to Sell Faster:
- Add more photos: Listings with 5+ photos get 3x more views
- Write a detailed description: Include service history and unique features
- Respond quickly: Fast responses increase your chances of a sale
- Keep your listing updated: Update if you make any changes to the car
- Be competitive: Check similar cars to ensure your price is fair

What happens next?
- Your car is now searchable by thousands of buyers
- You'll receive email notifications when buyers contact you
- You can edit your listing anytime from your dashboard
- We'll send you weekly performance updates

Need help? Contact support@carcatalog.co.uk

Best of luck with your sale!
The CarCatalog Team

© ${new Date().getFullYear()} CarCatalog. All rights reserved.`
  };
};

module.exports = {
  welcomeEmail,
  loginNotificationEmail,
  passwordResetEmail,
  emailVerificationEmail,
  carListingSuccessEmail
};