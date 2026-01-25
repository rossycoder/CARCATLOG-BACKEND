const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function cleanupPendingPaymentCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all cars with pending_payment status
    const pendingCars = await Car.find({ advertStatus: 'pending_payment' });
    
    console.log(`📊 Found ${pendingCars.length} cars with pending_payment status\n`);
    
    if (pendingCars.length === 0) {
      console.log('✅ No pending payment cars to clean up');
      await mongoose.connection.close();
      return;
    }

    // Show details of pending cars
    console.log('Cars to be deleted:');
    pendingCars.forEach((car, index) => {
      console.log(`\n${index + 1}. ${car.make} ${car.model} (${car.year})`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Created: ${car.createdAt}`);
      console.log(`   Advert ID: ${car.advertId}`);
      console.log(`   Price: £${car.price}`);
    });

    console.log('\n⚠️  These cars were created but payment was never completed.');
    console.log('⚠️  They should be deleted to prevent database clutter.\n');

    // Delete all pending payment cars
    const result = await Car.deleteMany({ advertStatus: 'pending_payment' });
    
    console.log(`✅ Deleted ${result.deletedCount} pending payment cars`);

    await mongoose.connection.close();
    console.log('\n✅ Cleanup complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupPendingPaymentCars();
