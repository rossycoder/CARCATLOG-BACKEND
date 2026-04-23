/**
 * Check Sold Car Details
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');
const User = require('../models/User');

async function checkSoldCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find sold car
    const soldCar = await Car.findOne({ advertStatus: 'sold' })
      .populate('userId', 'email name isAdmin')
      .lean();

    if (!soldCar) {
      console.log('❌ No sold car found in database');
      return;
    }

    console.log('🚗 SOLD CAR DETAILS:');
    console.log('='.repeat(80));
    console.log(`Make/Model: ${soldCar.make} ${soldCar.model}`);
    console.log(`Year: ${soldCar.year}`);
    console.log(`Registration: ${soldCar.registrationNumber}`);
    console.log(`Price: £${soldCar.price?.toLocaleString() || '0'}`);
    console.log(`Status: ${soldCar.advertStatus}`);
    console.log();

    console.log('👤 OWNER DETAILS:');
    console.log('-'.repeat(80));
    if (soldCar.userId) {
      console.log(`Name: ${soldCar.userId.name || 'N/A'}`);
      console.log(`Email: ${soldCar.userId.email}`);
      console.log(`Is Admin: ${soldCar.userId.isAdmin ? 'Yes' : 'No'}`);
      console.log(`User ID: ${soldCar.userId._id}`);
    } else {
      console.log('No owner information found');
    }
    console.log();

    console.log('📦 PACKAGE DETAILS:');
    console.log('-'.repeat(80));
    if (soldCar.advertisingPackage) {
      console.log(`Package: ${soldCar.advertisingPackage.packageName || 'N/A'}`);
      console.log(`Package ID: ${soldCar.advertisingPackage.packageId || 'N/A'}`);
      console.log(`Duration: ${soldCar.advertisingPackage.duration || 'N/A'}`);
      console.log(`Price: £${soldCar.advertisingPackage.price || '0'}`);
    } else {
      console.log('No package information');
    }
    console.log();

    console.log('📅 DATES:');
    console.log('-'.repeat(80));
    console.log(`Created: ${new Date(soldCar.createdAt).toLocaleString()}`);
    console.log(`Updated: ${new Date(soldCar.updatedAt).toLocaleString()}`);
    console.log();

    // Get all admin users
    const admins = await User.find({ isAdmin: true }).select('email name').lean();
    console.log('👑 ADMIN USERS:');
    console.log('-'.repeat(80));
    if (admins.length > 0) {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name || 'N/A'} (${admin.email})`);
      });
    } else {
      console.log('No admin users found');
    }

    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkSoldCar();
