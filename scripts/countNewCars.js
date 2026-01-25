require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function countNewCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Count all cars
    const totalCars = await Car.countDocuments();
    console.log(`\nTotal cars in database: ${totalCars}`);

    // Count by status
    const activeCars = await Car.countDocuments({ status: 'active' });
    const pendingCars = await Car.countDocuments({ status: 'pending_payment' });
    const incompleteCars = await Car.countDocuments({ status: 'incomplete' });

    console.log(`\nBreakdown by status:`);
    console.log(`- Active: ${activeCars}`);
    console.log(`- Pending Payment: ${pendingCars}`);
    console.log(`- Incomplete: ${incompleteCars}`);

    // Count recent additions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCars = await Car.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo } 
    });
    console.log(`\nCars added in last 7 days: ${recentCars}`);

    // Count recent additions (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const todayCars = await Car.countDocuments({ 
      createdAt: { $gte: oneDayAgo } 
    });
    console.log(`Cars added in last 24 hours: ${todayCars}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

countNewCars();
