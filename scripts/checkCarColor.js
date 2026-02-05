const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCarColor() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const carId = '6982517dd49cfacb5f246ff8'; // The car showing color issue
    
    console.log('\n🎨 CHECKING CAR COLOR FIELD');
    console.log('============================');
    
    // Find the car
    const car = await Car.findById(carId);
    
    if (car) {
      console.log('🚗 Car Found:');
      console.log('   ID:', car._id);
      console.log('   Make/Model:', car.make, car.model);
      console.log('   Registration:', car.registrationNumber);
      
      console.log('\n🎨 COLOR FIELD ANALYSIS:');
      console.log('========================');
      console.log('   car.color:', `"${car.color}"`);
      console.log('   Type:', typeof car.color);
      console.log('   Length:', car.color ? car.color.length : 'N/A');
      console.log('   Truthy:', !!car.color);
      console.log('   Empty string:', car.color === '');
      console.log('   Null:', car.color === null);
      console.log('   Undefined:', car.color === undefined);
      
      // Check all possible color-related fields
      console.log('\n🔍 ALL COLOR-RELATED FIELDS:');
      console.log('=============================');
      console.log('   car.color:', car.color);
      console.log('   car.colour:', car.colour);
      console.log('   car.bodyColor:', car.bodyColor);
      console.log('   car.bodyColour:', car.bodyColour);
      
      // Check the raw document
      console.log('\n📄 RAW DOCUMENT FIELDS (color-related):');
      console.log('=======================================');
      const rawDoc = car.toObject();
      Object.keys(rawDoc).forEach(key => {
        if (key.toLowerCase().includes('color') || key.toLowerCase().includes('colour')) {
          console.log(`   ${key}:`, rawDoc[key]);
        }
      });
      
      // Test what the frontend condition would be
      console.log('\n🖥️ FRONTEND DISPLAY LOGIC TEST:');
      console.log('===============================');
      const displayColor = car.color || 'Not specified';
      console.log('   Display value:', `"${displayColor}"`);
      console.log('   Would show "Not specified":', displayColor === 'Not specified');
      
    } else {
      console.log('❌ Car not found');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCarColor();