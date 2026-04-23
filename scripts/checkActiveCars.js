require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkActiveCars() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Count all cars by status
    const totalCars = await Car.countDocuments({});
    const activeCars = await Car.countDocuments({ advertStatus: 'active' });
    const draftCars = await Car.countDocuments({ advertStatus: 'draft' });
    const soldCars = await Car.countDocuments({ advertStatus: 'sold' });
    const expiredCars = await Car.countDocuments({ advertStatus: 'expired' });
    const pendingCars = await Car.countDocuments({ advertStatus: 'pending_payment' });

    console.log('\n📊 Car Status Breakdown:');
    console.log('========================');
    console.log(`Total Cars: ${totalCars}`);
    console.log(`Active Cars: ${activeCars}`);
    console.log(`Draft Cars: ${draftCars}`);
    console.log(`Sold Cars: ${soldCars}`);
    console.log(`Expired Cars: ${expiredCars}`);
    console.log(`Pending Payment: ${pendingCars}`);
    console.log('========================\n');

    // Show recent active cars
    console.log('🚗 Recent Active Cars (Last 5):');
    const recentActive = await Car.find({ advertStatus: 'active' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('make model year registrationNumber createdAt advertStatus')
      .lean();

    recentActive.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model} (${car.year}) - ${car.registrationNumber}`);
      console.log(`   Status: ${car.advertStatus}, Listed: ${new Date(car.createdAt).toLocaleDateString()}`);
    });

    // Show draft cars if any
    if (draftCars > 0) {
      console.log('\n📝 Draft Cars:');
      const drafts = await Car.find({ advertStatus: 'draft' })
        .sort({ createdAt: -1 })
        .select('make model year registrationNumber createdAt advertStatus')
        .lean();

      drafts.forEach((car, index) => {
        console.log(`${index + 1}. ${car.make} ${car.model} (${car.year}) - ${car.registrationNumber}`);
        console.log(`   Status: ${car.advertStatus}, Created: ${new Date(car.createdAt).toLocaleDateString()}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkActiveCars();
