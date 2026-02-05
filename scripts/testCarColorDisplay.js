const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testCarColorDisplay() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const carId = '6982517dd49cfacb5f246ff8';
    
    console.log('\n🎨 TESTING CAR COLOR DISPLAY');
    console.log('=============================');
    
    // Find the car
    const car = await Car.findById(carId);
    
    if (car) {
      console.log('🚗 Car Found:');
      console.log('   Make/Model:', car.make, car.model);
      console.log('   Registration:', car.registrationNumber);
      console.log('   Color in database:', `"${car.color}"`);
      
      console.log('\n🖥️ FRONTEND DISPLAY SIMULATION:');
      console.log('===============================');
      
      // Simulate the frontend logic
      const displayColor = car.color && car.color !== 'Not specified' && car.color !== 'null' && car.color !== 'undefined' 
        ? car.color 
        : 'Not specified';
      
      console.log('   Frontend will display:', `"${displayColor}"`);
      console.log('   Is showing actual color:', displayColor !== 'Not specified');
      
      if (displayColor === 'BLACK') {
        console.log('\n🎉 SUCCESS! Color will now display as "BLACK" on frontend');
      } else {
        console.log('\n❌ ISSUE! Color is still not displaying correctly');
      }
      
      // Test different color scenarios
      console.log('\n🧪 TESTING DIFFERENT COLOR SCENARIOS:');
      console.log('=====================================');
      
      const testColors = ['BLACK', 'WHITE', 'RED', 'BLUE', 'Not specified', null, undefined, ''];
      
      testColors.forEach(testColor => {
        const result = testColor && testColor !== 'Not specified' && testColor !== 'null' && testColor !== 'undefined' 
          ? testColor 
          : 'Not specified';
        console.log(`   "${testColor}" → "${result}"`);
      });
      
    } else {
      console.log('❌ Car not found');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCarColorDisplay();