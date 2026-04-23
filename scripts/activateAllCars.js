require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function activateAllCars() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all cars with any status
    const allCars = await Car.find({});
    console.log(`📊 Total cars in database: ${allCars.length}\n`);

    // Count by status
    const statusCounts = {};
    allCars.forEach(car => {
      const status = car.advertStatus || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('📈 Current status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log('');

    // Update all cars to active status
    console.log('🔄 Activating all cars...');
    const result = await Car.updateMany(
      {}, // Empty filter = all documents
      { 
        $set: { 
          advertStatus: 'active',
          publishedAt: new Date() // Set published date if not already set
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} cars to active status`);
    console.log(`📊 Total matched: ${result.matchedCount}`);

    // Verify the update
    const activeCars = await Car.countDocuments({ advertStatus: 'active' });
    console.log(`\n✅ Verification: ${activeCars} cars are now active`);

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

activateAllCars();
