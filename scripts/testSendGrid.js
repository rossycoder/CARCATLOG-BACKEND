require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sgMail = require('@sendgrid/mail');

const TO_EMAIL = process.argv[2];

if (!TO_EMAIL) {
  console.error('❌ Usage: node scripts/testSendGrid.js your@email.com');
  process.exit(1);
}

async function testSendGrid() {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = 'admin@carcatalog.co.uk';

  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
  console.log('📧 Sending test email to:', TO_EMAIL);
  console.log('📤 From:', fromEmail);

  sgMail.setApiKey(apiKey);

  try {
    await sgMail.send({
      to: TO_EMAIL,
      from: { email: fromEmail, name: 'CarCatalog' },
      subject: '✅ SendGrid Test - CarCatalog',
      text: 'SendGrid is working correctly for CarCatalog!',
      html: '<h2>✅ SendGrid Test</h2><p>SendGrid is working correctly for <strong>CarCatalog</strong>!</p>'
    });

    console.log('✅ Email sent successfully!');
    console.log('📬 Check your inbox at:', TO_EMAIL);
  } catch (error) {
    console.error('❌ SendGrid error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Body:', JSON.stringify(error.response.body, null, 2));
    }
  }
}

testSendGrid();
