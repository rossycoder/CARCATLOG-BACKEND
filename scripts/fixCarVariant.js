/**
 * Fix Car Variant - Update the variant to the correct one from API
 * Car ID: 6985f07d4b37080dccab7fb1 (YD17AVU)
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

async function fixCarVariant() {
  try {
    console.log('🔧 Fixing Car Variant...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const carId = '6985f07d4b37080dccab7fb1';
    
    // Find and update the car
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }
    
    console.log('📊 Current car data:');
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Current Variant: "${car.variant}"`);
    console.log(`   Engine Size: ${car.engineSize}L`);
    
    // Update variant to the correct one from API
    const correctVariant = '520D XDrive M Sport';
    
    console.log('\n🔄 Updating variant...');
    console.log(`   From: "${car.variant}"`);
    console.log(`   To: "${correctVariant}"`);
    
    car.variant = correctVariant;
    
    // Update display title
    const newDisplayTitle = `${car.engineSize} ${correctVariant}`;
    console.log(`   Display Title: "${car.displayTitle}" → "${newDisplayTitle}"`);
    car.displayTitle = newDisplayTitle;
    
    // Save the car
    await car.save();
    
    console.log('\n✅ Car variant updated successfully!');
    console.log('📊 Final data:');
    console.log(`   Variant: ${car.variant}`);
    console.log(`   Display Title: ${car.displayTitle}`);
    console.log(`   Doors: ${car.doors}`);
    console.log(`   Seats: ${car.seats}`);
    console.log(`   Body Type: ${car.bodyType}`);
    console.log(`   Mileage: ${car.mileage.toLocaleString()} miles`);
    
    console.log('\n🎯 Car should now display correctly at:');
    console.log(`   https://carcatlog.vercel.app/cars/${carId}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  fixCarVariant();
}

module.exports = { fixCarVariant };