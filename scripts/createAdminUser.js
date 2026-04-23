require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'admin@carcatalog.com';
    const adminPassword = 'Admin@123456';
    const adminName = 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Is Admin:', existingAdmin.isAdmin);
      
      // Update to make sure isAdmin is true
      if (!existingAdmin.isAdmin) {
        existingAdmin.isAdmin = true;
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin');
      }
    } else {
      // Create new admin user
      const adminUser = await User.create({
        email: adminEmail,
        password: adminPassword,
        name: adminName,
        isAdmin: true,
        role: 'admin',
        isEmailVerified: true
      });

      console.log('✅ Admin user created successfully!');
      console.log('Email:', adminUser.email);
      console.log('Password:', adminPassword);
      console.log('Is Admin:', adminUser.isAdmin);
    }

    console.log('\n📝 Login credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

createAdminUser();
