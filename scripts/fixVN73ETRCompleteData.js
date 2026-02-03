require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function fixVN73ETRCompleteData() {
  try {
    console.log('🔧 Fixing VN73ETR complete data...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the VN73ETR car
    const car = await Car.findOne({ registrationNumber: 'VN73ETR' });
    
    if (!car) {
      console.log('❌ VN73ETR car not found');
      return;
    }
    
    console.log('✅ Found VN73ETR car:', car._id);
    
    // 1. Fix body type (should be SUV, not ESTATE)
    console.log('\n1️⃣ Fixing body type...');
    car.bodyType = 'SUV';
    console.log('✅ Body type updated to SUV');
    
    // 2. Add running costs from API data
    console.log('\n2️⃣ Adding running costs...');
    car.runningCosts = {
      fuelEconomy: {
        urban: null, // Not available for hybrid
        extraUrban: null, // Not available for hybrid
        combined: 470.8
      },
      annualTax: 195,
      insuranceGroup: null, // Not available
      co2Emissions: 17
    };
    console.log('✅ Running costs added');
    
    // 3. Add MOT data for new car (2023 + 3 years = 2026)
    console.log('\n3️⃣ Adding MOT data...');
    car.motStatus = 'Not due';
    car.motDue = '2026-10-31';
    car.motExpiry = '2026-10-31';
    console.log('✅ MOT data added (due 2026)');
    
    // 4. Create/find a test user and assign car
    console.log('\n4️⃣ Creating/finding test user...');
    let user = await User.findOne({ email: 'test@vn73etr.com' });
    
    if (!user) {
      user = new User({
        email: 'test@vn73etr.com',
        name: 'VN73ETR Test User',
        firstName: 'VN73ETR',
        lastName: 'Test',
        isVerified: true
      });
      await user.save();
      console.log('✅ Created test user:', user._id);
    } else {
      console.log('✅ Found existing test user:', user._id);
    }
    
    // Assign car to user
    car.userId = user._id;
    console.log('✅ Car assigned to user');
    
    // 5. Ensure proper valuation structure
    console.log('\n5️⃣ Updating valuation structure...');
    if (!car.valuation) {
      car.valuation = {};
    }
    car.valuation.privatePrice = 83084;
    car.valuation.retailPrice = 93028;
    car.valuation.tradePrice = 78981;
    
    // Also set allValuations for frontend compatibility
    car.allValuations = {
      private: 83084,
      retail: 93028,
      trade: 78981
    };
    console.log('✅ Valuation structure updated');
    
    // Save all changes
    await car.save();
    console.log('\n✅ All changes saved to database');
    
    // Display final state
    console.log('\n📊 FINAL CAR DATA:');
    console.log('==================');
    console.log('Car ID:', car._id);
    console.log('User ID:', car.userId);
    console.log('Registration:', car.registrationNumber);
    console.log('Body Type:', car.bodyType);
    console.log('Fuel Type:', car.fuelType);
    console.log('Price:', car.price);
    console.log('Advert Status:', car.advertStatus);
    
    console.log('\n🏃 Running Costs:');
    console.log('  Combined MPG:', car.runningCosts?.fuelEconomy?.combined || 'N/A');
    console.log('  Annual Tax: £' + (car.runningCosts?.annualTax || 'N/A'));
    console.log('  CO2 Emissions:', (car.runningCosts?.co2Emissions || 'N/A') + ' g/km');
    
    console.log('\n💰 Valuation:');
    console.log('  Private: £' + (car.valuation?.privatePrice || 'N/A'));
    console.log('  Retail: £' + (car.valuation?.retailPrice || 'N/A'));
    console.log('  Trade: £' + (car.valuation?.tradePrice || 'N/A'));
    
    console.log('\n🔧 MOT:');
    console.log('  Status:', car.motStatus || 'N/A');
    console.log('  Due:', car.motDue || 'N/A');
    
    console.log('\n📱 TEST FRONTEND:');
    console.log('==================');
    console.log(`URL: http://localhost:3000/selling/advert/edit/${car._id}`);
    console.log('Expected Results:');
    console.log('  ✅ Body Type: SUV');
    console.log('  ✅ Combined MPG: 470.8');
    console.log('  ✅ Annual Tax: £195');
    console.log('  ✅ CO2: 17 g/km');
    console.log('  ✅ MOT: Not due until 31 October 2026');
    console.log('  ✅ Price: £83,084');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixVN73ETRCompleteData();