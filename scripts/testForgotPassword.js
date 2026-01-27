/**
 * Test Forgot Password Email Functionality
 * Run: node backend/scripts/testForgotPassword.js
 */

require('dotenv').config({ path: './backend/.env' });
const EmailService = require('../services/emailService');
const { passwordResetEmail } = require('../utils/emailTemplates');

async function testForgotPasswordEmail() {
  console.log('\n🔐 Testing Forgot Password Email System\n');
  console.log('=' .repeat(50));
  
  // Test data
  const testUser = {
    name: 'Test User',
    email: 'rozeena.career031@gmail.com',
    resetToken: 'test-token-' + Date.now()
  };

  console.log('\n📧 Email Configuration:');
  console.log('   Service:', process.env.EMAIL_SERVICE);
  console.log('   From:', process.env.EMAIL_FROM);
  console.log('   To:', testUser.email);
  
  try {
    // Create email service instance
    const emailService = new EmailService();
    
    if (!emailService.enabled) {
      console.log('\n❌ Email service is disabled!');
      console.log('   Please check your .env configuration:');
      console.log('   - EMAIL_SERVICE=gmail');
      console.log('   - EMAIL_USER=your-email@gmail.com');
      console.log('   - EMAIL_PASSWORD=your-app-password');
      return;
    }

    console.log('\n✅ Email service is enabled');
    console.log('\n📝 Generating email template...');
    
    // Generate email content
    const emailContent = passwordResetEmail(
      testUser.name,
      testUser.email,
      testUser.resetToken
    );

    console.log('   Subject:', emailContent.subject);
    console.log('   HTML Length:', emailContent.html.length, 'characters');
    console.log('   Text Length:', emailContent.text.length, 'characters');

    console.log('\n📤 Sending test email...');
    
    // Send email
    const result = await emailService.sendEmail(
      testUser.email,
      emailContent.subject,
      emailContent.text,
      emailContent.html
    );

    if (result) {
      console.log('\n✅ SUCCESS! Email sent successfully!');
      console.log('\n📬 Check your inbox:');
      console.log('   Email:', testUser.email);
      console.log('   Subject:', emailContent.subject);
      console.log('\n💡 Tips:');
      console.log('   - Check spam folder if not in inbox');
      console.log('   - Email should arrive within 1-2 minutes');
      console.log('   - Look for professional CarCatalog design');
    } else {
      console.log('\n❌ FAILED! Email was not sent');
      console.log('   Check the error messages above');
    }

  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    if (error.response) {
      console.log('   Details:', error.response.body);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n');
}

// Run test
testForgotPasswordEmail();
