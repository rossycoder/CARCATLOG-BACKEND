require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function checkUserCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user by email
    const email = process.argv[2] || 'rozeena031@gmail.com';
    const user = await User.findOne({ email }).lean();

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      await mongoose.connection.close();
      return;
    }

    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Role: ${user.role || 'user'}, isAdmin: ${user.isAdmin || false}\n`);

    // Find all cars for this user
    const cars = await Car.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .select('make model year registrationNumber advertStatus createdAt userId purchaseId')
      .lean();

    console.log(`🚗 Cars linked to this user (userId match): ${cars.length}`);
    cars.forEach((car, i) => {
      console.log(`  ${i + 1}. ${car.make} ${car.model} (${car.year}) - ${car.registrationNumber}`);
      console.log(`     Status: ${car.advertStatus} | Created: ${new Date(car.createdAt).toLocaleDateString()}`);
      console.log(`     userId: ${car.userId} | purchaseId: ${car.purchaseId || 'none'}`);
    });

    // Also check recent cars with NO userId (orphaned)
    const recentCars = await Car.find({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
      .sort({ createdAt: -1 })
      .select('make model year registrationNumber advertStatus createdAt userId')
      .lean();

    const orphaned = recentCars.filter(c => !c.userId);
    console.log(`\n⚠️  Recent cars (last 7 days) with NO userId: ${orphaned.length}`);
    orphaned.forEach((car, i) => {
      console.log(`  ${i + 1}. ${car.make} ${car.model} (${car.year}) - ${car.registrationNumber}`);
      console.log(`     Status: ${car.advertStatus} | Created: ${new Date(car.createdAt).toLocaleDateString()}`);
    });

    // Show ALL recent cars regardless
    console.log(`\n📋 ALL cars added in last 7 days: ${recentCars.length}`);
    recentCars.forEach((car, i) => {
      console.log(`  ${i + 1}. ${car.make} ${car.model} (${car.year}) - ${car.registrationNumber}`);
      console.log(`     Status: ${car.advertStatus} | userId: ${car.userId || 'MISSING'} | Created: ${new Date(car.createdAt).toLocaleDateString()}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserCars();
