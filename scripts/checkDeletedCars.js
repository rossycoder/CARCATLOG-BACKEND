require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkDeletedCars() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check for any soft delete fields (isDeleted, deleted, etc.)
    const allCars = await Car.find({}).lean();
    console.log(`📊 Total cars in database: ${allCars.length}\n`);

    // Check if any car has delete-related fields
    const deleteFields = ['isDeleted', 'deleted', 'deletedAt', 'isActive'];
    let foundDeleteFields = false;

    allCars.forEach((car, index) => {
      deleteFields.forEach(field => {
        if (car.hasOwnProperty(field)) {
          if (!foundDeleteFields) {
            console.log('⚠️  Found cars with delete-related fields:\n');
            foundDeleteFields = true;
          }
          console.log(`Car ${index + 1}: ${car.make} ${car.model} (${car.registrationNumber || 'no-reg'})`);
          console.log(`   Field: ${field} = ${car[field]}`);
          console.log(`   Status: ${car.advertStatus}`);
          console.log('');
        }
      });
    });

    if (!foundDeleteFields) {
      console.log('✅ No soft delete fields found in any car!');
      console.log('✅ Car model does NOT use soft delete pattern');
    }

    // Show status breakdown
    const statusCounts = {};
    allCars.forEach(car => {
      const status = car.advertStatus || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📈 Current status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDeletedCars();
