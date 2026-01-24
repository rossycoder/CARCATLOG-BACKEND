require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function updateCarWithEstimate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const advertId = '3655c431-391a-4081-ac9b-b323bded03d5';
    
    // Find the car
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }
    
    console.log('\n📋 Current Car Data:');
    console.log('  Make/Model:', car.make, car.model);
    console.log('  Year:', car.year);
    console.log('  Mileage:', car.mileage);
    console.log('  Current Price:', car.price);
    
    // Calculate estimated value based on vehicle data
    // 2009 Honda Civic Type S with 5,000 miles
    // This is a low mileage car, so it should have good value
    const baseValue = 3500; // Base value for 2009 Honda Civic
    const lowMileageBonus = 1500; // Bonus for very low mileage
    const typeSBonus = 500; // Bonus for Type S trim
    
    const estimatedValue = baseValue + lowMileageBonus + typeSBonus;
    
    console.log('\n💰 Calculated Estimated Value: £' + estimatedValue);
    
    // Update the car
    car.estimatedValue = estimatedValue;
    car.price = estimatedValue;
    
    await car.save();
    
    console.log('\n✅ Car updated successfully!');
    console.log('  New Price:', car.price);
    console.log('  New Estimated Value:', car.estimatedValue);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateCarWithEstimate();
