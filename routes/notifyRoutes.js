const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');

// Simple in-memory dedup for the same process (MongoDB-less, lightweight)
const signedUp = new Set();

/**
 * POST /api/notify/signup
 * Coming Soon page — save email and send confirmation
 */
router.post('/signup', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }

    const normalised = email.toLowerCase().trim();

    if (signedUp.has(normalised)) {
      // Already signed up — still return success so UX is smooth
      return res.json({ success: true, message: 'Already registered' });
    }

    signedUp.add(normalised);

    // Send confirmation to the user
    const userHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .wrap { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0066cc 0%, #003d7a 100%); padding: 40px 30px; text-align: center; }
    .header img { max-width: 120px; border-radius: 12px; }
    .header h1 { color: white; margin: 16px 0 0; font-size: 26px; }
    .body { padding: 36px 30px; }
    .body p { color: #444; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    .highlight { background: #f0f7ff; border-left: 4px solid #0066cc; padding: 16px 20px; border-radius: 6px; margin: 24px 0; }
    .highlight p { margin: 0; color: #0066cc; font-weight: 600; font-size: 15px; }
    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
    .social { margin: 12px 0; }
    .social a { color: #0066cc; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <img src="https://res.cloudinary.com/dexgkptpg/image/upload/v1765219299/carcatalog/logo.jpg" alt="CarCatALog" />
      <h1>You're on the list! 🎉</h1>
    </div>
    <div class="body">
      <p>Hi there,</p>
      <p>Thanks for signing up — you're now on the early access list for <strong>CarCatALog</strong>, the smarter way to buy &amp; sell your car in the UK.</p>
      <div class="highlight">
        <p>🚀 We're launching very soon. You'll be the first to know!</p>
      </div>
      <p>In the meantime, follow us on Instagram for sneak peeks and updates:</p>
      <div class="social">
        <a href="https://www.instagram.com/carcatalog.co.uk/" target="_blank">@carcatalog.co.uk on Instagram →</a>
      </div>
      <p>See you at launch,<br><strong>The CarCatALog Team</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} CarCatALog · <a href="https://carcatalog.co.uk" style="color:#0066cc;">carcatalog.co.uk</a></p>
      <p>You received this because you signed up on our coming soon page.</p>
    </div>
  </div>
</body>
</html>`;

    const userText = `You're on the list!\n\nThanks for signing up for CarCatALog — the smarter way to buy & sell your car.\n\nWe're launching very soon. You'll be the first to know!\n\nFollow us: https://www.instagram.com/carcatalog.co.uk/\n\nThe CarCatALog Team`;

    // Send to user
    await sendEmail(normalised, "You're on the CarCatALog launch list! 🚀", userText, userHtml);

    // Notify admin
    const adminEmail = process.env.EMAIL_USER || 'admin@carcatalog.co.uk';
    await sendEmail(
      adminEmail,
      `New launch signup: ${normalised}`,
      `New email signup on coming soon page: ${normalised}`,
      `<p>New launch signup: <strong>${normalised}</strong></p><p>Total signups this session: ${signedUp.size}</p>`
    );

    res.json({ success: true, message: 'Signed up successfully' });
  } catch (error) {
    console.error('Notify signup error:', error);
    res.status(500).json({ success: false, message: 'Error processing signup' });
  }
});

module.exports = router;
