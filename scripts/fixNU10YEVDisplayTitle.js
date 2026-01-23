require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixNU10YEVDisplayTitle() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: 'NU10YEV' });
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }
    
    console.log('📊 Current Car Data:');
    console.log('='.repeat(60));
    console.log(`Make: ${car.make}`);
    console.log(`Model: ${car.model}`);
    console.log(`Variant: "${car.variant}"`);
    console.log(`DisplayTitle: "${car.displayTitle}"`);
    console.log(`Engine Size: ${car.engineSize}L`);
    console.log(`Doors: ${car.doors}`);
    console.log(`Fuel Type: ${car.fuelType}`);
    
    console.log('\n📝 API Data Shows:');
    console.log('='.repeat(60));
    console.log('ModelVariant: "S TDI CR"');
    console.log('DvlaModel: "OCTAVIA S TDI CR"');
    console.log('SmmtDetails.Variant: "S TDI CR"');
    
    console.log('\n🔧 Fixing...');
    console.log('='.repeat(60));
    
    // Update variant to match AutoTrader format
    car.variant = 'S TDI CR';
    
    // Update displayTitle to AutoTrader format: "EngineSize Variant Doors"
    // Format: "1.6 S TDI CR 5dr"
    car.displayTitle = `${car.engineSize} S TDI CR ${car.doors}dr`;
    
    await car.save();
    
    console.log('✅ Updated Successfully!');
    console.log('\n📊 New Car Data:');
    console.log('='.repeat(60));
    console.log(`Variant: "${car.variant}"`);
    console.log(`DisplayTitle: "${car.displayTitle}"`);
    
    console.log('\n✅ This matches AutoTrader format:');
    console.log('   - Engine size: 1.6');
    console.log('   - Trim/Variant: S TDI CR');
    console.log('   - Body style: 5dr');
    console.log('\n🎯 Perfect AutoTrader-style listing!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

fixNU10YEVDisplayTitle();
