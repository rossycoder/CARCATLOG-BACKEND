const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');

async function setToTrade() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const registration = 'EK11XHZ';
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found with registration:', registration);
      return;
    }

    console.log('🚗 Found car:', car.make, car.model);
    console.log('Current sellerContact.type:', car.sellerContact?.type || 'NOT SET');
    
    // Update to trade seller
    if (!car.sellerContact) {
      car.sellerContact = {};
    }
    
    car.sellerContact.type = 'trade';
    
    // Optionally add trade seller details
    if (!car.sellerContact.businessName) {
      car.sellerContact.businessName = 'Auto Trader Motors';
    }
    
    if (!car.sellerContact.businessAddress) {
      car.sellerContact.businessAddress = {
        street: '123 High Street',
        city: 'London',
        postcode: car.postcode || 'SW1A 1AA',
        country: 'United Kingdom'
      };
    }
    
    await car.save();
    
    console.log('\n✅ Successfully updated to TRADE seller!');
    console.log('New sellerContact.type:', car.sellerContact.type);
    console.log('Business Name:', car.sellerContact.businessName);
    
    console.log('\n🔄 Please refresh the frontend to see changes.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

setToTrade();
