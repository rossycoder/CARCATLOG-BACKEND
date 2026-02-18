const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkFuelTypeIssue() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://carcatlog:Rozeena%40123@cluster0.eeyiemx.mongodb.net/car-website?retryWrites=true&w=majority';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const registrations = ['RO67DZC', 'SA22FLN'];
    
    console.log('\n🔍 Checking fuel type for registrations:', registrations);
    console.log('─'.repeat(80));
    
    const cars = await Car.find({
      registrationNumber: { $in: registrations }
    }).select('registrationNumber make model year fuelType electricVehicle');
    
    if (cars.length === 0) {
      console.log('❌ No cars found with these registrations');
    } else {
      cars.forEach(car => {
        console.log('\n📋 Car Details:');
        console.log(`   Registration: ${car.registrationNumber}`);
        console.log(`   Make/Model: ${car.make} ${car.model}`);
        console.log(`   Year: ${car.year}`);
        console.log(`   Fuel Type: ${car.fuelType}`);
        console.log(`   Electric Vehicle: ${JSON.stringify(car.electricVehicle, null, 2)}`);
        console.log('─'.repeat(80));
      });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkFuelTypeIssue();
