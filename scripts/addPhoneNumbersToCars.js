const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

// Sample phone numbers for testing
const testPhoneNumbers = [
  '07700 900123',
  '07700 900456',
  '07700 900789',
  '020 7946 0958',
  '0161 496 0123',
  '0113 496 0456',
  '0117 496 0789',
  '0121 496 0321'
];

async function addPhoneNumbersToCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get cars without phone numbers
    const carsWithoutPhone = await Car.find({
      advertStatus: 'active',
      $or: [
        { 'sellerContact.phoneNumber': { $exists: false } },
        { 'sellerContact.phoneNumber': null },
        { 'sellerContact.phoneNumber': '' }
      ]
    }).limit(20);

    console.log(`\nFound ${carsWithoutPhone.length} cars without phone numbers`);
    console.log('Adding phone numbers...\n');

    let updated = 0;
    for (const car of carsWithoutPhone) {
      // Pick a random phone number
      const phoneNumber = testPhoneNumbers[Math.floor(Math.random() * testPhoneNumbers.length)];
      
      // Initialize sellerContact if it doesn't exist
      if (!car.sellerContact) {
        car.sellerContact = {
          type: 'private',
          phoneNumber: phoneNumber,
          email: `seller${car._id}@example.com`,
          allowEmailContact: true
        };
      } else {
        car.sellerContact.phoneNumber = phoneNumber;
      }

      await car.save();
      updated++;
      console.log(`✓ Updated ${car.make} ${car.model} (${car._id}) - Phone: ${phoneNumber}`);
    }

    console.log(`\n✅ Successfully added phone numbers to ${updated} cars`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

addPhoneNumbersToCars();
