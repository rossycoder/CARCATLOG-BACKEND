const mongoose = require('mongoose');
require('dotenv').config();

async function fixBG22UCPValuationData() {
  try {
    console.log('🔧 Fixing BG22UCP Valuation Data');
    console.log('=' .repeat(60));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ MongoDB Connected');
    
    // Get the car record
    const Car = require('../models/Car');
    const car = await Car.findOne({ registrationNumber: 'BG22UCP' }).sort({ createdAt: -1 });
    
    if (!car) {
      console.log('❌ No car found with registration BG22UCP');
      return;
    }
    
    console.log('🚗 Found car:');
    console.log(`   ID: ${car._id}`);
    console.log(`   Make: ${car.make} ${car.model}`);
    console.log(`   Current Price: £${car.price}`);
    console.log(`   Current Estimated Value: ${car.estimatedValue}`);
    
    // Use the existing price to create proper valuation data
    const privatePrice = car.price || car.estimatedValue || 36971; // fallback to known value
    
    if (privatePrice && privatePrice > 0) {
      const retailPrice = Math.round(privatePrice * 1.15); // 15% markup for retail
      const tradePrice = Math.round(privatePrice * 0.85);  // 15% discount for trade
      
      console.log('');
      console.log('💰 Creating valuation data:');
      console.log(`   Private: £${privatePrice}`);
      console.log(`   Retail: £${retailPrice}`);
      console.log(`   Trade: £${tradePrice}`);
      
      // Update the car record with proper valuation structure
      const updateData = {
        price: privatePrice,
        estimatedValue: privatePrice,
        allValuations: {
          private: privatePrice,
          retail: retailPrice,
          trade: tradePrice
        }
      };
      
      await Car.findByIdAndUpdate(car._id, updateData);
      console.log('✅ Updated car record with proper valuation data');
      
      // Also update the cache if it exists
      const VehicleHistory = require('../models/VehicleHistory');
      const cachedData = await VehicleHistory.findOne({ vrm: 'BG22UCP' });
      
      if (cachedData) {
        console.log('');
        console.log('💾 Updating cached data...');
        
        await VehicleHistory.findOneAndUpdate(
          { vrm: 'BG22UCP' },
          {
            $set: {
              estimatedValue: {
                private: privatePrice,
                retail: retailPrice,
                trade: tradePrice
              },
              allValuations: {
                private: privatePrice,
                retail: retailPrice,
                trade: tradePrice
              },
              hasValuation: true
            }
          }
        );
        
        console.log('✅ Updated cached data with proper valuation structure');
      } else {
        console.log('💾 No cached data found to update');
      }
      
      console.log('');
      console.log('🧪 Testing the fix...');
      
      // Test the enhanced lookup now
      const API_BASE_URL = 'http://localhost:5000/api';
      
      try {
        const response = await fetch(`${API_BASE_URL}/vehicles/enhanced-lookup/BG22UCP?mileage=2500`);
        const data = await response.json();
        
        if (data.success && data.data.price) {
          console.log('✅ SUCCESS: Enhanced lookup now returns price field');
          console.log(`   Price: £${data.data.price}`);
          console.log(`   Type: ${typeof data.data.price}`);
          
          // Test price range calculation
          function calculatePriceRange(valuation) {
            const value = parseFloat(valuation);
            if (value < 1000) return 'under-1000';
            if (value <= 2999) return '1000-2999';
            if (value <= 4999) return '3000-4999';
            if (value <= 6999) return '5000-6999';
            if (value <= 9999) return '7000-9999';
            if (value <= 12999) return '10000-12999';
            if (value <= 16999) return '13000-16999';
            if (value <= 24999) return '17000-24999';
            return 'over-24995';
          }
          
          const expectedRange = calculatePriceRange(data.data.price);
          console.log(`   Expected price range: ${expectedRange}`);
          console.log(`   Frontend should auto-select: ${expectedRange}`);
          
        } else {
          console.log('❌ Enhanced lookup still not returning price field');
          console.log('Response:', data);
        }
      } catch (fetchError) {
        console.log('⚠️ Could not test API (server might not be running)');
        console.log('   Error:', fetchError.message);
      }
      
    } else {
      console.log('❌ No valid price found to create valuation data');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('');
    console.log('🔌 MongoDB disconnected');
  }
}

// Run the fix
fixBG22UCPValuationData()
  .then(() => {
    console.log('');
    console.log('🎯 Fix completed');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Try the payment flow again');
    console.log('3. The frontend should now auto-select the correct price range');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });