/**
 * Send Test Car Expiration Email
 * Sends actual car expiration email to test HTML rendering
 */

require('dotenv').config();
const mongoose = require('mongoose');
const expirationService = require('../services/expirationService');

async function sendTestExpirationEmail() {
  try {
    console.log('📧 Sending test car expiration email...\n');

    // Connect to database
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/motormate';
    console.log('🔌 Connecting to:', dbUri);
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');

    // Create a mock car object for testing
    const mockCar = {
      _id: 'test123',
      advertId: 'TEST-001',
      make: 'Dacia',
      model: 'Duster',
      year: 2025,
      registrationNumber: 'SR25FRX',
      price: 20144,
      sellerContact: {
        email: 'daniyalahmadrayan@gmail.com', // Change this to your test email
        type: 'private'
      },
      advertisingPackage: {
        packageName: 'Bronze',
        expiryDate: new Date('2026-03-08')
      }
    };

    console.log('📨 Sending expiration email to:', mockCar.sellerContact.email);
    console.log('🚗 Vehicle:', mockCar.year, mockCar.make, mockCar.model);
    console.log('📅 Expiry Date:', mockCar.advertisingPackage.expiryDate.toLocaleDateString());
    console.log('');

    // Send the expiration notification
    await expirationService.sendExpirationNotification(mockCar);

    console.log('✅ Test expiration email sent successfully!');
    console.log('');
    console.log('📬 Check your inbox:', mockCar.sellerContact.email);
    console.log('');
    console.log('What to check in email:');
    console.log('1. ✅ Red heading "Your Listing Has Expired"');
    console.log('2. ✅ Gray box with vehicle details');
    console.log('3. ✅ Blue "List Your Vehicle Again" button');
    console.log('4. ✅ Proper formatting and colors');
    console.log('5. ❌ NO raw HTML tags like <div>, <p>, <strong>');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
sendTestExpirationEmail();
