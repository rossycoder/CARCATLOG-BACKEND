/**
 * Test Email Script
 * Sends a test email to verify HTML rendering
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { sendEmail } = require('../services/emailService');

async function sendTestEmail() {
  try {
    console.log('📧 Starting email test...\n');

    // Connect to database
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/motormate';
    console.log('🔌 Connecting to:', dbUri);
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    // Test email address (change this to your email)
    const testEmail = process.env.TEST_EMAIL || 'daniyalahmadrayan@gmail.com';
    
    console.log('📨 Sending test email to:', testEmail);
    console.log('');

    // Create test email content
    const subject = 'Test Email - HTML Rendering Check';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Test Email - HTML Rendering</h2>
        
        <p>Hello,</p>
        
        <p>This is a test email to verify that HTML is rendering correctly.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #007bff;">Test Vehicle Details</h3>
          <p style="margin: 5px 0;"><strong>Make:</strong> Dacia</p>
          <p style="margin: 5px 0;"><strong>Model:</strong> Duster</p>
          <p style="margin: 5px 0;"><strong>Year:</strong> 2025</p>
          <p style="margin: 5px 0;"><strong>Registration:</strong> SR25FRX</p>
          <p style="margin: 5px 0;"><strong>Price:</strong> £20,144</p>
        </div>
        
        <p><strong>If you can see this properly formatted:</strong></p>
        <ul>
          <li>✅ HTML is rendering correctly</li>
          <li>✅ Styles are being applied</li>
          <li>✅ Colors and formatting work</li>
        </ul>
        
        <div style="margin: 30px 0;">
          <a href="http://localhost:3000" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Test Button Link
          </a>
        </div>
        
        <p style="color: #666; font-size: 0.9rem; margin-top: 30px;">
          This is a test email sent from CarCatalog backend.
        </p>
      </div>
    `;

    const text = `Test Email - HTML Rendering Check

Hello,

This is a test email to verify that HTML is rendering correctly.

Test Vehicle Details:
- Make: Dacia
- Model: Duster
- Year: 2025
- Registration: SR25FRX
- Price: £20,144

If you can see this properly formatted:
- HTML is rendering correctly
- Styles are being applied
- Colors and formatting work

Test Button Link: http://localhost:3000

This is a test email sent from CarCatalog backend.`;

    // Send email
    const result = await sendEmail(testEmail, subject, text, html);
    
    if (result) {
      console.log('✅ Test email sent successfully!');
      console.log('');
      console.log('📬 Check your inbox:', testEmail);
      console.log('');
      console.log('What to check:');
      console.log('1. Email should have colored headings (red, blue)');
      console.log('2. Vehicle details should be in a gray box');
      console.log('3. Button should be blue with white text');
      console.log('4. NO raw HTML tags like <div>, <p>, <strong>');
      console.log('');
    } else {
      console.log('❌ Failed to send test email');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
sendTestEmail();
