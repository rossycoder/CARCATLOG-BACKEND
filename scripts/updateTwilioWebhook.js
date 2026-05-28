require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function updateTwilioWebhook() {
  try {
    const backendUrl = 'https://carcatlog-backendnpm-install.onrender.com';
    const webhookUrl = `${backendUrl}/api/calls/webhook/voice`;

    console.log('🔄 Updating Twilio webhook URL to:', webhookUrl);

    // List all incoming phone numbers
    const numbers = await twilio.incomingPhoneNumbers.list();
    console.log(`📞 Found ${numbers.length} Twilio number(s)`);

    for (const num of numbers) {
      console.log(`\nUpdating: ${num.phoneNumber} (SID: ${num.sid})`);
      console.log(`  Old voiceUrl: ${num.voiceUrl}`);

      await twilio.incomingPhoneNumbers(num.sid).update({
        voiceUrl: webhookUrl,
        voiceMethod: 'POST'
      });

      console.log(`  ✅ New voiceUrl: ${webhookUrl}`);
    }

    console.log('\n✅ All Twilio numbers updated!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateTwilioWebhook();
