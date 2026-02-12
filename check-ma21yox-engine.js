require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

async function checkMA21YOXEngine() {
  try {
    console.log('🔍 Checking MA21YOX Engine Size\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const car = await Car.findOne({ registrationNumber: 'MA21YOX' });
    
    if (!car) {
      console.log('❌ MA21YOX not found');
      await mongoose.disconnect();
      return;
    }
    
    console.log('📊 ENGINE DATA:');
    console.log('='.repeat(60));
    console.log('Registration:', car.registrationNumber);
    console.log('Engine Size (stored):', car.engineSize, 'L');
    console.log('Display Title:', car.displayTitle);
    console.log('Model:', car.model);
    console.log('='.repeat(60));
    
    console.log('\n🔍 ANALYSIS:');
    console.log('API says: 1598cc = 1.598L ≈ 1.6L');
    console.log('Database has:', car.engineSize, 'L');
    console.log('Display shows:', car.displayTitle);
    
    if (car.engineSize === 1.598) {
      console.log('\n✅ Engine size is correct from API (1598cc = 1.598L)');
      console.log('   This rounds to 1.6L for display');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Done');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMA21YOXEngine();
