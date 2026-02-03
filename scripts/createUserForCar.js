require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createUserForCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the car with missing userId
    const registration = 'EK11XHZ';
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found with registration:', registration);
      return;
    }

    const email = car.sellerContact?.email;
    const phone = car.sellerContact?.phoneNumber;
    
    if (!email) {
      console.log('❌ No seller email found');
      return;
    }

    console.log(`🚗 Car: ${car.advertId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Phone: ${phone}`);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('✅ User already exists, linking car...');
      
      // Link car to existing user
      await Car.findByIdAndUpdate(car._id, { userId: existingUser._id });
      console.log('✅ Car linked to existing user');
      return;
    }

    // Create new user account
    console.log('👤 Creating new user account...');
    
    // Generate a temporary password (user can reset it later)
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const newUser = new User({
      name: email.split('@')[0], // Use email prefix as name
      email: email,
      password: hashedPassword,
      isVerified: true, // Auto-verify since they completed payment
      createdAt: new Date(),
      // Add metadata to indicate this was auto-created
      metadata: {
        autoCreated: true,
        createdFromCarPayment: true,
        carId: car._id,
        tempPassword: tempPassword // Store temp password for reference
      }
    });

    await newUser.save();
    console.log('✅ User created successfully!');
    console.log(`   User ID: ${newUser._id}`);
    console.log(`   Temp Password: ${tempPassword}`);

    // Link car to new user
    console.log('🔗 Linking car to new user...');
    await Car.findByIdAndUpdate(car._id, { 
      userId: newUser._id,
      updatedAt: new Date()
    });

    console.log('🎉 SUCCESS! Car is now linked to user account');
    console.log('📧 User can now:');
    console.log('   - See car in My Listings');
    console.log('   - Edit car details');
    console.log('   - Manage their listing');
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('   - User should be notified to set a proper password');
    console.log('   - Send welcome email with login instructions');
    console.log(`   - Login: ${email} / ${tempPassword}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createUserForCar();