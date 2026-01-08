/**
 * Welcome email template
 */
const welcomeEmail = (name, email) => {
  return {
    subject: 'Welcome to CarCatalog!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
          .logo-header { background: white; padding: 15px 20px; text-align: left; border-bottom: 2px solid #e0e0e0; }
          .logo { max-width: 120px; height: auto; display: block; }
          .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #0066cc !important; color: #000000ff !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-header">
            <img src="https://res.cloudinary.com/dexgkptpg/image/upload/v1765219299/carcatalog/logo.jpg" alt="CarCatalog Logo" class="logo" />
          </div>
          <div class="header">
            <h1>Welcome to <span style=\"color: #dc3545;\">Car</span><span style=\"color: #0066cc;\">Cat</span><span style=\"color: #ff9800;\">alog</span>!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name || 'there'}!</h2>
            <p>Thank you for creating an account with CarCatalog. We're excited to have you on board!</p>
            <p>Your account has been successfully created with the email: <strong>${email}</strong></p>
            <p>You can now:</p>
            <ul>
              <li>Browse thousands of cars</li>
              <li>Save your favorite listings</li>
              <li>Get instant alerts for new cars</li>
              <li>Sell your car easily</li>
            </ul>
            <a href="${process.env.FRONTEND_URL}" class="button">Start Browsing Cars</a>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to CarCatalog!\n\nHi ${name || 'there'}!\n\nThank you for creating an account. Your account has been successfully created with the email: ${email}\n\nVisit ${process.env.FRONTEND_URL} to start browsing cars.`
  };
};

/**
 * Login notification email
 */
const loginNotificationEmail = (name, email, ipAddress, userAgent) => {
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
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
          .logo-header { background: white; padding: 15px 20px; text-align: left; border-bottom: 2px solid #e0e0e0; }
          .logo { max-width: 120px; height: auto; display: block; }
          .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #0066cc; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-header">
            <img src="https://res.cloudinary.com/dexgkptpg/image/upload/v1765219299/carcatalog/logo.jpg" alt="CarCatalog Logo" class="logo" />
          </div>
          <div class="header">
            <h1>New Sign-in Detected</h1>
          </div>
          <div class="content">
            <h2>Hi ${name || 'there'}!</h2>
            <p>We detected a new sign-in to your CarCatalog account.</p>
            <div class="info-box">
              <p><strong>Date & Time:</strong> ${date}</p>
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
      </body>
      </html>
    `,
    text: `New Sign-in Detected\n\nHi ${name || 'there'}!\n\nWe detected a new sign-in to your account on ${date}.\n\nIf this wasn't you, please secure your account immediately.`
  };
};

/**
 * Password reset email
 */
const passwordResetEmail = (name, email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  return {
    subject: 'Reset Your CarCatalog Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
          .logo-header { background: white; padding: 15px 20px; text-align: left; border-bottom: 2px solid #e0e0e0; }
          .logo { max-width: 120px; height: auto; display: block; }
          .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #0066cc !important; color: #ffffff !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-header">
            <img src="https://res.cloudinary.com/dexgkptpg/image/upload/v1765219299/carcatalog/logo.jpg" alt="CarCatalog Logo" class="logo" />
          </div>
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hi ${name || 'there'}!</h2>
            <p>You requested to reset your password for your CarCatalog account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Reset Your Password\n\nHi ${name || 'there'}!\n\nYou requested to reset your password. Click this link to reset: ${resetUrl}\n\nThis link will expire in 1 hour.`
  };
};

/**
 * Email verification email
 */
const emailVerificationEmail = (name, email, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  return {
    subject: 'Verify Your Email Address - CarCatalog',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
          .logo-header { background: white; padding: 15px 20px; text-align: left; border-bottom: 2px solid #e0e0e0; }
          .logo { max-width: 120px; height: auto; display: block; }
          .header { background: #0066cc; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 15px 30px; background: #0066cc !important; color: #ffffff !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-header">
            <img src="https://res.cloudinary.com/dexgkptpg/image/upload/v1765219299/carcatalog/logo.jpg" alt="CarCatalog Logo" class="logo" />
          </div>
          <div class="header">
            <h1>✉️ Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Hi ${name || 'there'}!</h2>
            <p>Thank you for creating an account with CarCatalog!</p>
            <p>To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
            <center>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
            <div class="warning">
              <strong>⏰ This link will expire in 10 minutes.</strong>
            </div>
            <p>If you didn't create an account with CarCatalog, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Verify Your Email Address\n\nHi ${name || 'there'}!\n\nThank you for creating an account with CarCatalog!\n\nTo complete your registration, please verify your email address by clicking this link:\n\n${verificationUrl}\n\nThis link will expire in 10 minutes.\n\nIf you didn't create an account, please ignore this email.`
  };
};

module.exports = {
  welcomeEmail,
  loginNotificationEmail,
  passwordResetEmail,
  emailVerificationEmail
};








