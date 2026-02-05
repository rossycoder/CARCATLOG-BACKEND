/**
 * Check for duplicate car listings (same registration number)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find duplicate registration numbers
    const duplicates = await Car.aggregate([
      {
        $group: {
          _id: '$registrationNumber',
          count: { $sum: 1 },
          cars: { $push: { id: '$_id', status: '$advertStatus', price: '$price', createdAt: '$createdAt' } }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    if (duplicates.length === 0) {
      console.log('\n✅ No duplicate cars found!');
      console.log('   Each registration number has only one listing');
    } else {
      console.log(`\n⚠️  Found ${duplicates.length} duplicate registration numbers:\n`);
      
      duplicates.forEach((dup, index) => {
        console.log(`${index + 1}. ${dup._id} (${dup.count} listings):`);
        dup.cars.forEach((car, i) => {
          console.log(`   ${i + 1}. ID: ${car.id}`);
          console.log(`      Status: ${car.status}`);
          console.log(`      Price: £${car.price}`);
          console.log(`      Created: ${new Date(car.createdAt).toLocaleString()}\n`);
        });
      });

      console.log('💡 Note: Multiple listings of same car are allowed if:');
      console.log('   - Different sellers own the same model');
      console.log('   - User re-listed after deleting');
      console.log('   - Test data during development');
    }

    // Check total cars
    const totalCars = await Car.countDocuments();
    const uniqueRegistrations = await Car.distinct('registrationNumber');
    
    console.log('\n📊 Summary:');
    console.log(`   Total Cars: ${totalCars}`);
    console.log(`   Unique Registrations: ${uniqueRegistrations.length}`);
    console.log(`   Duplicates: ${totalCars - uniqueRegistrations.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkDuplicates();
