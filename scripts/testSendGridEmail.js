/**
 * Test SendGrid Email Configuration
 * Run: node backend/scripts/testSendGridEmail.js
 */

require('dotenv').config();
const EmailService = require('../services/emailService');

async function testSendGridEmail() {
  console.log('🧪 Testing SendGrid Email Configuration...\n');
  
  // Check environment variables
  console.log('📋 Configuration:');
  console.log('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('  SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('');

  // Create email service instance
  const emailService = new EmailService();
  
  if (!emailService.enabled) {
    console.error('❌ Email service is not enabled. Check your configuration.');
    process.exit(1);
  }

  // Test email data
  const testEmail = {
    to: process.env.EMAIL_USER || 'test@example.com',
    subject: 'Test Email from CarCatalog',
    text: 'This is a test email to verify SendGrid configuration.',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #667eea;">✅ SendGrid Test Email</h2>
        <p>This is a test email to verify your SendGrid configuration is working correctly.</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">
          This is an automated test email from CarCatalog.
        </p>
      </div>
    `
  };

  console.log('📧 Sending test email to:', testEmail.to);
  console.log('');

  try {
    const result = await emailService.sendEmail(
      testEmail.to,
      testEmail.subject,
      testEmail.text,
      testEmail.html
    );

    if (result) {
      console.log('');
      console.log('✅ SUCCESS! Email sent successfully.');
      console.log('📬 Check your inbox at:', testEmail.to);
      console.log('');
      console.log('💡 Tips:');
      console.log('  - Check spam folder if you don\'t see the email');
      console.log('  - For production, set up domain authentication in SendGrid');
      console.log('  - Monitor your SendGrid dashboard for delivery status');
    } else {
      console.error('❌ Failed to send email. Check the error messages above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during email test:', error.message);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
    process.exit(1);
  }
}

// Run the test
testSendGridEmail();
