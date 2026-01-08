require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function markCarsAsDealer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Update all cars to be marked as dealer listings
    const result = await Car.updateMany(
      {},
      {
        $set: {
          isDealerListing: true
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} cars`);
    console.log(`   - Set isDealerListing to true\n`);

    // Verify the update
    const cars = await Car.find();
    console.log(`Total cars in database: ${cars.length}\n`);
    console.log('Updated cars:');
    cars.forEach(car => {
      console.log(`\n- ${car.make} ${car.model}`);
      console.log(`  Dealer Listing: ${car.isDealerListing}`);
      console.log(`  Condition: ${car.condition}`);
      console.log(`  Status: ${car.advertStatus}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

markCarsAsDealer();
