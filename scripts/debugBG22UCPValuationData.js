const mongoose = require('mongoose');
require('dotenv').config();

async function debugBG22UCPValuationData() {
  try {
    console.log('🔍 Debugging BG22UCP Valuation Data');
    console.log('=' .repeat(60));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ MongoDB Connected');
    
    // Check what's in the database for BG22UCP
    const Car = require('../models/Car');
    const cars = await Car.find({ registrationNumber: 'BG22UCP' }).sort({ createdAt: -1 });
    
    console.log(`Found ${cars.length} cars with registration BG22UCP`);
    
    if (cars.length > 0) {
      const latestCar = cars[0];
      console.log('');
      console.log('🚗 Latest car data:');
      console.log(`   ID: ${latestCar._id}`);
      console.log(`   Make: ${latestCar.make}`);
      console.log(`   Model: ${latestCar.model}`);
      console.log(`   Year: ${latestCar.year}`);
      console.log(`   Price: ${latestCar.price}`);
      console.log(`   Estimated Value: ${JSON.stringify(latestCar.estimatedValue)}`);
      console.log(`   All Valuations: ${JSON.stringify(latestCar.allValuations)}`);
      
      // Check if there's any valuation data
      if (latestCar.allValuations && latestCar.allValuations.private) {
        console.log('');
        console.log('💰 Found private valuation in database:');
        console.log(`   Private: £${latestCar.allValuations.private}`);
        console.log(`   Retail: £${latestCar.allValuations.retail}`);
        console.log(`   Trade: £${latestCar.allValuations.trade}`);
      } else {
        console.log('');
        console.log('⚠️ No valuation data found in database');
      }
    }
    
    // Check cache
    const VehicleHistory = require('../models/VehicleHistory');
    const cachedData = await VehicleHistory.findOne({ vrm: 'BG22UCP' });
    
    if (cachedData) {
      console.log('');
      console.log('💾 Cached data found:');
      console.log(`   VRM: ${cachedData.vrm}`);
      console.log(`   Estimated Value: ${JSON.stringify(cachedData.estimatedValue)}`);
      console.log(`   All Valuations: ${JSON.stringify(cachedData.allValuations)}`);
      console.log(`   Has Valuation: ${cachedData.hasValuation}`);
      console.log(`   Data Sources: ${JSON.stringify(cachedData.dataSources)}`);
    } else {
      console.log('');
      console.log('💾 No cached data found');
    }
    
    // Test with a mock valuation to see if the fix works
    console.log('');
    console.log('🧪 Testing fix with mock valuation data:');
    
    const mockWrappedData = {
      make: { value: 'BMW', source: 'dvla' },
      model: { value: 'i4', source: 'dvla' },
      year: { value: 2022, source: 'dvla' },
      valuation: {
        estimatedValue: {
          private: 36971,
          retail: 42517,
          trade: 31425
        },
        confidence: 'high',
        source: 'api'
      }
    };
    
    // Import the vehicle controller to test the unwrap function
    const VehicleController = require('../controllers/vehicleController');
    const controller = new VehicleController();
    
    const unwrapped = controller.unwrapVehicleData(mockWrappedData);
    
    console.log('📦 Unwrapped mock data:');
    console.log(`   make: ${unwrapped.make}`);
    console.log(`   model: ${unwrapped.model}`);
    console.log(`   year: ${unwrapped.year}`);
    console.log(`   price: ${unwrapped.price}`);
    console.log(`   valuation: ${JSON.stringify(unwrapped.valuation)}`);
    
    if (unwrapped.price === 36971) {
      console.log('✅ SUCCESS: Fix works correctly with mock data');
      console.log(`   Private sale value (${unwrapped.valuation.estimatedValue.private}) correctly set as price field (${unwrapped.price})`);
    } else {
      console.log('❌ ISSUE: Fix not working with mock data');
      console.log(`   Expected price: 36971, Got: ${unwrapped.price}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('');
    console.log('🔌 MongoDB disconnected');
  }
}

// Run the debug
debugBG22UCPValuationData()
  .then(() => {
    console.log('');
    console.log('🎯 Debug completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });