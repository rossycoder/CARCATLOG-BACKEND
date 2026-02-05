/**
 * Check Car UserId
 * Check if car has userId and which user it belongs to
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function checkCarUserId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get the car IDs from command line or use defaults
    const carIds = process.argv.slice(2);
    
    if (carIds.length === 0) {
      console.log('Usage: node checkCarUserId.js <carId1> [carId2] ...');
      console.log('Example: node checkCarUserId.js 69851434714547b1f87fac02\n');
      
      // Show all cars with their userId
      console.log('📋 All cars in database:\n');
      const allCars = await Car.find({})
        .select('_id registrationNumber make model userId advertStatus')
        .limit(10);
      
      for (const car of allCars) {
        console.log(`Car: ${car.registrationNumber || 'NO REG'} - ${car.make} ${car.model}`);
        console.log(`  ID: ${car._id}`);
        console.log(`  Status: ${car.advertStatus}`);
        console.log(`  UserId: ${car.userId || '❌ MISSING!'}`);
        
        if (car.userId) {
          const user = await User.findById(car.userId);
          if (user) {
            console.log(`  User: ${user.email} (${user.name})`);
          } else {
            console.log(`  User: ⚠️ User not found in database!`);
          }
        }
        console.log('');
      }
      
      process.exit(0);
    }
    
    // Check specific cars
    for (const carId of carIds) {
      console.log(`\n🔍 Checking car: ${carId}\n`);
      
      let car;
      if (/^[0-9a-fA-F]{24}$/.test(carId)) {
        car = await Car.findById(carId);
      } else {
        car = await Car.findOne({ 
          $or: [
            { advertId: carId },
            { registrationNumber: carId.toUpperCase() }
          ]
        });
      }
      
      if (!car) {
        console.log('❌ Car not found\n');
        continue;
      }
      
      console.log('📋 Car Details:');
      console.log(`  Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`  Make/Model: ${car.make} ${car.model}`);
      console.log(`  Advert ID: ${car.advertId}`);
      console.log(`  Status: ${car.advertStatus}`);
      console.log(`  Database ID: ${car._id}`);
      console.log('');
      
      console.log('👤 User Details:');
      if (car.userId) {
        console.log(`  UserId: ${car.userId} ✅`);
        
        const user = await User.findById(car.userId);
        if (user) {
          console.log(`  User Email: ${user.email}`);
          console.log(`  User Name: ${user.name}`);
          console.log(`  User Role: ${user.role}`);
          console.log(`  User Status: Active ✅`);
        } else {
          console.log(`  ⚠️ WARNING: UserId exists but user not found in database!`);
          console.log(`  This car will NOT show in "My Listings" for any user!`);
        }
      } else {
        console.log(`  UserId: ❌ MISSING!`);
        console.log(`  ⚠️ This car will NOT show in "My Listings"!`);
        console.log(`  Need to assign a userId to this car.`);
      }
      console.log('');
      
      console.log('📧 Contact Details:');
      if (car.sellerContact) {
        console.log(`  Email: ${car.sellerContact.email || 'N/A'}`);
        console.log(`  Phone: ${car.sellerContact.phoneNumber || 'N/A'}`);
        console.log(`  Postcode: ${car.sellerContact.postcode || 'N/A'}`);
      } else {
        console.log(`  ❌ No contact details`);
      }
      console.log('');
      
      console.log('🖼️  Images:');
      console.log(`  Count: ${car.images?.length || 0}`);
      if (car.images?.length > 0) {
        console.log(`  ✅ Has images`);
      } else {
        console.log(`  ❌ No images - car may not display properly`);
      }
      console.log('');
      
      console.log('📝 Description:');
      if (car.description && car.description.trim()) {
        console.log(`  ✅ Has description (${car.description.length} chars)`);
      } else {
        console.log(`  ❌ No description`);
      }
      console.log('');
      
      // Summary
      console.log('📊 Summary:');
      const hasUserId = !!car.userId;
      const hasImages = car.images?.length > 0;
      const hasDescription = car.description && car.description.trim();
      const hasContact = car.sellerContact?.email && car.sellerContact?.phoneNumber;
      
      if (hasUserId && hasImages && hasDescription && hasContact) {
        console.log('  ✅ Car is COMPLETE and should show in "My Listings"');
      } else {
        console.log('  ⚠️ Car is INCOMPLETE:');
        if (!hasUserId) console.log('     - Missing userId');
        if (!hasImages) console.log('     - Missing images');
        if (!hasDescription) console.log('     - Missing description');
        if (!hasContact) console.log('     - Missing contact details');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkCarUserId();
