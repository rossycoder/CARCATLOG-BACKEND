const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

async function deleteIncompleteCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all incomplete cars
    const incompleteCars = await Car.find({ advertStatus: 'incomplete' });
    
    console.log(`\n🔍 Found ${incompleteCars.length} incomplete cars:`);
    incompleteCars.forEach(car => {
      console.log(`- ${car.registrationNumber} (${car.make} ${car.model}) - Created: ${car.createdAt}`);
    });

    if (incompleteCars.length === 0) {
      console.log('\n✅ No incomplete cars to delete');
      return;
    }

    // Delete all incomplete cars
    const result = await Car.deleteMany({ advertStatus: 'incomplete' });
    
    console.log(`\n✅ Successfully deleted ${result.deletedCount} incomplete cars`);

    // Show remaining cars
    const remainingCars = await Car.find();
    console.log(`\n📊 Remaining cars in database: ${remainingCars.length}`);
    
    const activeCars = remainingCars.filter(c => c.advertStatus === 'active');
    const draftCars = remainingCars.filter(c => c.advertStatus === 'draft');
    
    console.log(`   - Active: ${activeCars.length}`);
    console.log(`   - Draft: ${draftCars.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

deleteIncompleteCars();
