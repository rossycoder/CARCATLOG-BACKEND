require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');
const VehicleHistory = require('./models/VehicleHistory');

async function checkMA21YOX() {
  try {
    console.log('🔍 Checking MA21YOX Data\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find MA21YOX
    const car = await Car.findOne({ registrationNumber: 'MA21YOX' });
    
    if (!car) {
      console.log('❌ MA21YOX not found in database');
      await mongoose.disconnect();
      return;
    }
    
    console.log('📊 CAR DATA:');
    console.log('='.repeat(60));
    console.log('Registration:', car.registrationNumber);
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('Display Title:', car.displayTitle);
    console.log('Fuel Type:', car.fuelType);
    console.log('CO2 Emissions:', car.co2Emissions);
    console.log('Engine Size:', car.engineSize);
    console.log('='.repeat(60));
    
    // Check VehicleHistory
    if (car.historyCheckId) {
      const history = await VehicleHistory.findById(car.historyCheckId);
      if (history) {
        console.log('\n📊 VEHICLE HISTORY DATA:');
        console.log('='.repeat(60));
        console.log('VRM:', history.vrm);
        console.log('Make:', history.make);
        console.log('Model:', history.model);
        console.log('Variant:', history.variant);
        console.log('Fuel Type:', history.fuelType);
        console.log('CO2 Emissions:', history.co2Emissions);
        console.log('Engine Capacity:', history.engineCapacity);
        console.log('='.repeat(60));
      }
    }
    
    // Check if MHEV
    const modelLower = (car.model || '').toLowerCase();
    const variantLower = (car.variant || '').toLowerCase();
    const displayLower = (car.displayTitle || '').toLowerCase();
    
    console.log('\n🔍 MHEV DETECTION:');
    console.log('Model contains MHEV:', modelLower.includes('mhev'));
    console.log('Variant contains MHEV:', variantLower.includes('mhev'));
    console.log('Display Title contains MHEV:', displayLower.includes('mhev'));
    
    const isMHEV = modelLower.includes('mhev') || 
                   variantLower.includes('mhev') ||
                   displayLower.includes('mhev');
    
    console.log('\n🎯 IS MHEV:', isMHEV ? 'YES ✅' : 'NO ❌');
    
    if (isMHEV && !car.fuelType.toLowerCase().includes('hybrid')) {
      console.log('\n⚠️  NEEDS FIX:');
      console.log(`   Current: ${car.fuelType}`);
      console.log(`   Should be: ${car.fuelType} Hybrid`);
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMA21YOX();
