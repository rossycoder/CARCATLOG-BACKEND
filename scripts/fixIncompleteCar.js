/**
 * Fix Incomplete Car
 * Fixes car with:
 * - Running costs from VehicleHistory
 * - Sample images
 * - Default description
 * - UserId assignment
 * - Contact details
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');
const VehicleHistory = require('../models/VehicleHistory');
const ComprehensiveVehicleService = require('../services/comprehensiveVehicleService');

async function fixIncompleteCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const carId = process.argv[2];
    const userEmail = process.argv[3];
    
    if (!carId) {
      console.log('Usage: node fixIncompleteCar.js <carId> [userEmail]');
      console.log('Example: node fixIncompleteCar.js 69851434714547b1f87fac02 user@example.com\n');
      process.exit(1);
    }
    
    console.log(`🔧 Fixing car: ${carId}\n`);
    
    // Find car
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
      process.exit(1);
    }
    
    console.log('📋 Current car state:');
    console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   UserId: ${car.userId || '❌ MISSING'}`);
    console.log(`   Images: ${car.images?.length || 0}`);
    console.log(`   Description: ${car.description ? '✅' : '❌'}`);
    console.log(`   Running Costs: ${car.fuelEconomyCombined ? '✅' : '❌'}`);
    console.log('');
    
    // Step 1: Fix running costs from VehicleHistory
    console.log('1️⃣ Fixing running costs...');
    if (car.registrationNumber) {
      const comprehensiveService = new ComprehensiveVehicleService();
      const result = await comprehensiveService.fetchCompleteVehicleData(
        car.registrationNumber,
        car.mileage,
        false // Use cache
      );
      
      console.log(`   API Calls: ${result.apiCalls}, Cost: £${result.totalCost.toFixed(2)}`);
      
      // Reload car to get updated data
      car = await Car.findById(car._id);
      
      if (car.fuelEconomyCombined) {
        console.log(`   ✅ Running costs saved: MPG ${car.fuelEconomyCombined}, CO2 ${car.co2Emissions}g/km`);
      } else {
        console.log(`   ⚠️ Running costs still null`);
      }
    } else {
      console.log(`   ⚠️ No registration number, skipping`);
    }
    console.log('');
    
    // Step 2: Add sample images
    console.log('2️⃣ Adding sample images...');
    if (!car.images || car.images.length === 0) {
      // Add placeholder images based on car type
      const sampleImages = [
        'https://res.cloudinary.com/dexgkptpg/image/upload/v1/sample-cars/placeholder-1.jpg',
        'https://res.cloudinary.com/dexgkptpg/image/upload/v1/sample-cars/placeholder-2.jpg',
        'https://res.cloudinary.com/dexgkptpg/image/upload/v1/sample-cars/placeholder-3.jpg'
      ];
      car.images = sampleImages;
      console.log(`   ✅ Added ${sampleImages.length} sample images`);
    } else {
      console.log(`   ✅ Already has ${car.images.length} images`);
    }
    console.log('');
    
    // Step 3: Add description
    console.log('3️⃣ Adding description...');
    if (!car.description || car.description.trim() === '') {
      car.description = `${car.year} ${car.make} ${car.model} ${car.variant || ''} in ${car.color} color. ` +
        `This ${car.bodyType || 'vehicle'} has ${car.mileage.toLocaleString()} miles on the clock. ` +
        `Features ${car.transmission} transmission and ${car.fuelType} engine. ` +
        `MOT valid until ${car.motExpiry ? new Date(car.motExpiry).toLocaleDateString('en-GB') : 'contact seller'}. ` +
        `Well maintained and ready to drive. Contact seller for more details and to arrange a viewing.`;
      console.log(`   ✅ Added description (${car.description.length} chars)`);
    } else {
      console.log(`   ✅ Already has description`);
    }
    console.log('');
    
    // Step 4: Assign userId
    console.log('4️⃣ Assigning userId...');
    if (!car.userId) {
      let user;
      
      if (userEmail) {
        // Find user by email
        user = await User.findOne({ email: userEmail });
        if (!user) {
          console.log(`   ⚠️ User not found: ${userEmail}`);
          console.log(`   Creating new user...`);
          
          const bcrypt = require('bcryptjs');
          const tempPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(tempPassword, 10);
          
          user = new User({
            name: userEmail.split('@')[0],
            email: userEmail,
            password: hashedPassword,
            isEmailVerified: true,
            provider: 'local',
            role: 'user'
          });
          
          await user.save();
          console.log(`   ✅ User created: ${user.email}`);
          console.log(`   Temp password: ${tempPassword}`);
        } else {
          console.log(`   ✅ Found user: ${user.email}`);
        }
      } else {
        // Find first user or create default
        user = await User.findOne({});
        if (!user) {
          console.log(`   ⚠️ No users in database, creating default user...`);
          
          const bcrypt = require('bcryptjs');
          const tempPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(tempPassword, 10);
          
          user = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: hashedPassword,
            isEmailVerified: true,
            provider: 'local',
            role: 'user'
          });
          
          await user.save();
          console.log(`   ✅ Default user created: ${user.email}`);
          console.log(`   Temp password: ${tempPassword}`);
        } else {
          console.log(`   ✅ Using existing user: ${user.email}`);
        }
      }
      
      car.userId = user._id;
      console.log(`   ✅ UserId assigned: ${user._id}`);
    } else {
      console.log(`   ✅ Already has userId: ${car.userId}`);
    }
    console.log('');
    
    // Step 5: Add contact details
    console.log('5️⃣ Adding contact details...');
    if (!car.sellerContact || !car.sellerContact.email || !car.sellerContact.phoneNumber) {
      const user = await User.findById(car.userId);
      car.sellerContact = {
        type: 'private',
        email: user.email,
        phoneNumber: '+447123456789',
        postcode: 'SW1A 1AA',
        allowEmailContact: true
      };
      car.postcode = 'SW1A 1AA';
      console.log(`   ✅ Contact details added`);
    } else {
      console.log(`   ✅ Already has contact details`);
    }
    console.log('');
    
    // Save car
    console.log('6️⃣ Saving car...');
    await car.save();
    console.log(`   ✅ Car saved successfully`);
    console.log('');
    
    // Summary
    console.log('📊 Final state:');
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   UserId: ${car.userId} ✅`);
    console.log(`   Images: ${car.images.length} ✅`);
    console.log(`   Description: ${car.description ? '✅' : '❌'} (${car.description?.length || 0} chars)`);
    console.log(`   Running Costs:`);
    console.log(`     MPG Combined: ${car.fuelEconomyCombined || 'N/A'}`);
    console.log(`     CO2: ${car.co2Emissions || 'N/A'} g/km`);
    console.log(`     Insurance Group: ${car.insuranceGroup || 'N/A'}`);
    console.log(`     Annual Tax: £${car.annualTax || 'N/A'}`);
    console.log(`   Contact: ${car.sellerContact?.email || 'N/A'} ✅`);
    console.log('');
    console.log('✅ Car is now COMPLETE and will show in "My Listings"!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

fixIncompleteCar();
