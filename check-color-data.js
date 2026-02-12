require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');
const VehicleHistory = require('./models/VehicleHistory');

async function checkColorData() {
  try {
    console.log('🎨 Checking Color Data for MA21YOX\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find MA21YOX
    const car = await Car.findOne({ registrationNumber: 'MA21YOX' });
    
    if (!car) {
      console.log('❌ MA21YOX not found');
      await mongoose.disconnect();
      return;
    }
    
    console.log('📊 CAR DATA:');
    console.log('Color:', car.color);
    console.log('History Check ID:', car.historyCheckId);
    
    if (car.historyCheckId) {
      const history = await VehicleHistory.findById(car.historyCheckId);
      
      if (history) {
        console.log('\n📊 VEHICLE HISTORY RAW DATA:');
        console.log('Full document keys:', Object.keys(history.toObject()));
        
        // Check for color in various possible locations
        console.log('\n🔍 Searching for color data:');
        console.log('history.colour:', history.colour);
        console.log('history.color:', history.color);
        console.log('history.vehicleColour:', history.vehicleColour);
        
        // Check raw API data if stored
        if (history.rawApiData) {
          console.log('\n📦 RAW API DATA EXISTS');
          const raw = typeof history.rawApiData === 'string' 
            ? JSON.parse(history.rawApiData) 
            : history.rawApiData;
          
          console.log('VehicleRegistration?.Colour:', raw.VehicleRegistration?.Colour);
          console.log('VehicleIdentification?.Colour:', raw.VehicleIdentification?.Colour);
          console.log('DvlaVehicleDetails?.Colour:', raw.DvlaVehicleDetails?.Colour);
        }
        
        // Print full history object (limited)
        console.log('\n📄 FULL HISTORY OBJECT (first 50 fields):');
        const historyObj = history.toObject();
        const keys = Object.keys(historyObj).slice(0, 50);
        keys.forEach(key => {
          if (key.toLowerCase().includes('col')) {
            console.log(`  ${key}:`, historyObj[key]);
          }
        });
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Done');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkColorData();
