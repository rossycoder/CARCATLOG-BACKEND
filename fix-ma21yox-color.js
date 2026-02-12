require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');
const VehicleHistory = require('./models/VehicleHistory');

async function fixMA21YOXColor() {
  try {
    console.log('🔍 Connecting to database...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const vrm = 'MA21YOX';
    
    // Find car
    const car = await Car.findOne({ registrationNumber: vrm });
    
    if (!car) {
      console.log('❌ Car not found');
      await mongoose.disconnect();
      return;
    }
    
    console.log('✅ Car found:', car.make, car.model);
    console.log('Current color:', car.color || 'Not set');
    
    // For MA21YOX (2021 KIA XCeed), typical colors are:
    // Based on KIA XCeed 2021 model, common colors include:
    // - Fusion White
    // - Aurora Black
    // - Quantum Yellow
    // - Infra Red
    // - Blue Flame
    
    // Since API is not available, we'll set a placeholder
    // User can edit this later using the edit feature
    const defaultColor = 'Contact seller for color details';
    
    console.log('\n📝 Updating color to:', defaultColor);
    
    car.color = defaultColor;
    await car.save();
    
    console.log('✅ Car color updated');
    
    // Update VehicleHistory if linked
    if (car.historyCheckId) {
      const history = await VehicleHistory.findById(car.historyCheckId);
      if (history) {
        history.colour = defaultColor;
        await history.save();
        console.log('✅ VehicleHistory color updated');
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Fix complete!');
    console.log('\n💡 Note: User can now edit the color using the edit feature');
    console.log('   or contact seller for actual color information.');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

fixMA21YOXColor();
