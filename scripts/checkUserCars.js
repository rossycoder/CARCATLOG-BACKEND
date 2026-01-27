const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const User = require('../models/User');

async function checkUserCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find().select('_id email name');
    console.log(`\n👥 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name}) - ID: ${user._id}`);
    });

    // Get all cars
    const allCars = await Car.find().select('_id registrationNumber make model userId advertStatus createdAt');
    console.log(`\n🚗 Found ${allCars.length} total cars in database`);

    // Cars without userId
    const carsWithoutUserId = allCars.filter(car => !car.userId);
    console.log(`\n⚠️  ${carsWithoutUserId.length} cars without userId:`);
    carsWithoutUserId.forEach(car => {
      console.log(`- ${car.registrationNumber} (${car.make} ${car.model}) - Status: ${car.advertStatus} - Created: ${car.createdAt}`);
    });

    // Cars with userId
    const carsWithUserId = allCars.filter(car => car.userId);
    console.log(`\n✅ ${carsWithUserId.length} cars with userId:`);
    carsWithUserId.forEach(car => {
      console.log(`- ${car.registrationNumber} (${car.make} ${car.model}) - User: ${car.userId} - Status: ${car.advertStatus}`);
    });

    // If you want to assign all cars without userId to a specific user, uncomment below:
    // const targetUserId = users[0]._id; // Change index to select different user
    // console.log(`\n🔧 Would you like to assign all cars without userId to user: ${users[0].email}?`);
    // console.log('Run: node backend/scripts/assignCarsToUser.js');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkUserCars();
