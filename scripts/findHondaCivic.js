require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function findCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find Honda Civic
    const car = await Car.findOne({ 
      make: 'HONDA',
      model: 'Civic',
      registrationNumber: 'RJ08PFA'
    });
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }
    
    console.log('🚗 Found car:');
    console.log('  ID:', car._id);
    console.log('  Make:', car.make);
    console.log('  Model:', car.model);
    console.log('  Registration:', car.registrationNumber);
    console.log('  Year:', car.year);
    console.log('\n📊 Running costs:');
    console.log(JSON.stringify(car.runningCosts, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

findCar();
