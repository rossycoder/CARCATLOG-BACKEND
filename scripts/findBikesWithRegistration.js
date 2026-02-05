require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');

async function findBikesWithRegistration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const bikes = await Bike.find({
      registrationNumber: { $exists: true, $ne: null }
    }).limit(5);
    
    console.log('\n🏍️ Bikes with registration numbers:');
    bikes.forEach(bike => {
      console.log(`${bike.registrationNumber} - ${bike.make} ${bike.model} (${bike.year})`);
    });
    
    if (bikes.length === 0) {
      console.log('No bikes found with registration numbers');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

findBikesWithRegistration();