require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testDraftCarsVisibility() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check environment variable
    const showDraftCars = process.env.SHOW_DRAFT_CARS === 'true';
    console.log(`📋 SHOW_DRAFT_CARS environment variable: ${process.env.SHOW_DRAFT_CARS}`);
    console.log(`📋 Draft cars will ${showDraftCars ? 'BE SHOWN' : 'NOT BE SHOWN'} on frontend\n`);

    // Count cars by status
    const activeCars = await Car.countDocuments({ advertStatus: 'active' });
    const draftCars = await Car.countDocuments({ advertStatus: 'draft' });
    const incompleteCars = await Car.countDocuments({ advertStatus: 'incomplete' });
    const totalCars = await Car.countDocuments({});

    console.log('📊 Database Statistics:');
    console.log(`   Total cars: ${totalCars}`);
    console.log(`   Active cars: ${activeCars}`);
    console.log(`   Draft cars: ${draftCars}`);
    console.log(`   Incomplete cars: ${incompleteCars}\n`);

    // Simulate the query that will be used on frontend
    const query = showDraftCars 
      ? { advertStatus: { $in: ['active', 'draft'] } }
      : { advertStatus: 'active' };

    const visibleCars = await Car.countDocuments(query);
    console.log(`🔍 Cars visible on frontend: ${visibleCars}`);
    console.log(`   Query used: ${JSON.stringify(query)}\n`);

    // Show some draft cars if they exist
    if (draftCars > 0) {
      console.log('📝 Sample Draft Cars:');
      const sampleDrafts = await Car.find({ advertStatus: 'draft' })
        .limit(5)
        .select('make model year registrationNumber price images createdAt');
      
      sampleDrafts.forEach((car, index) => {
        console.log(`   ${index + 1}. ${car.make} ${car.model} (${car.year})`);
        console.log(`      Registration: ${car.registrationNumber || 'N/A'}`);
        console.log(`      Price: £${car.price}`);
        console.log(`      Images: ${car.images.length}`);
        console.log(`      Created: ${car.createdAt.toISOString().split('T')[0]}`);
      });
    }

    console.log('\n✅ Test complete!');
    console.log('\n💡 To change visibility:');
    console.log('   - Edit backend/.env');
    console.log('   - Set SHOW_DRAFT_CARS=true (show draft) or false (hide draft)');
    console.log('   - Restart backend server');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDraftCarsVisibility();
