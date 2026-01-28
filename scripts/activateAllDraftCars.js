require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function activateAllDraftCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all draft cars
    const draftCars = await Car.find({ advertStatus: 'draft' });
    
    console.log(`📊 Found ${draftCars.length} draft car(s)\n`);

    if (draftCars.length === 0) {
      console.log('✅ No draft cars to activate');
      process.exit(0);
    }

    // Activate each draft car
    for (const car of draftCars) {
      console.log(`📝 Activating car:`);
      console.log(`   ID: ${car._id}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Registration: ${car.registrationNumber}`);
      console.log(`   Current Status: ${car.advertStatus}`);
      
      car.advertStatus = 'active';
      car.publishedAt = new Date();
      
      await car.save();
      
      console.log(`   ✅ Activated! New Status: ${car.advertStatus}`);
      console.log(`   Published At: ${car.publishedAt}\n`);
    }

    console.log(`\n🎉 Successfully activated ${draftCars.length} car(s)!`);
    console.log(`\n💡 Now your cars will show on Vercel deployment!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

activateAllDraftCars();
