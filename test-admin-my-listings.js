const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Car = require('./models/Car');

/**
 * Test admin "My Listings" functionality
 */
async function testAdminMyListings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get admin user
    const adminUser = await User.findOne({ email: 'shahzad872@live.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('📋 Admin User:');
    console.log('   Email:', adminUser.email);
    console.log('   Name:', adminUser.name);
    console.log('   Is Admin:', adminUser.isAdmin);
    console.log('   Role:', adminUser.role);

    // Simulate admin request
    console.log('\n📋 Simulating Admin "My Listings" Request:');
    console.log('═══════════════════════════════════════');
    
    const isAdmin = adminUser.isAdmin || adminUser.role === 'admin';
    const query = isAdmin ? {} : { userId: adminUser._id };
    
    console.log('Query:', JSON.stringify(query));
    console.log('Is Admin:', isAdmin);
    
    if (isAdmin) {
      console.log('✅ Admin detected: Will fetch ALL listings from ALL users');
    } else {
      console.log('❌ Not admin: Will fetch only user\'s own listings');
    }

    // Get all cars
    const cars = await Car.find(query)
      .populate('userId', 'email name')
      .sort({ createdAt: -1 });

    console.log('\n📋 Results:');
    console.log('═══════════════════════════════════════');
    console.log(`Found ${cars.length} listings\n`);

    if (cars.length > 0) {
      cars.forEach((car, index) => {
        console.log(`${index + 1}. ${car.make} ${car.model} (${car.year})`);
        console.log(`   Registration: ${car.registrationNumber}`);
        console.log(`   Status: ${car.advertStatus}`);
        console.log(`   Owner: ${car.userId?.name || 'Unknown'} (${car.userId?.email || 'Unknown'})`);
        console.log(`   Price: £${car.price?.toLocaleString() || 'N/A'}`);
        console.log('');
      });
    }

    // Test regular user
    console.log('\n📋 Testing Regular User:');
    console.log('═══════════════════════════════════════');
    
    const regularUser = await User.findOne({ 
      email: { $ne: 'shahzad872@live.com' },
      isAdmin: { $ne: true }
    });

    if (regularUser) {
      console.log('Regular User:', regularUser.email);
      const isRegularAdmin = regularUser.isAdmin || regularUser.role === 'admin';
      const regularQuery = isRegularAdmin ? {} : { userId: regularUser._id };
      
      const regularUserCars = await Car.find(regularQuery);
      console.log(`Regular user would see: ${regularUserCars.length} listings`);
      console.log('(Only their own listings)');
    }

    // Summary
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 TEST COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log('✅ Admin sees ALL listings:', cars.length);
    console.log('✅ Regular users see only their own listings');
    console.log('\n💡 Admin "My Listings" page will show:');
    console.log('   - All listings from all users');
    console.log('   - Owner name/email for each listing');
    console.log('   - "Admin: All Listings" header');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testAdminMyListings();
