/**
 * Check valuation data in cache for BG22UCP
 */

require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function checkValuationCache() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const history = await VehicleHistory.findOne({ vrm: 'BG22UCP' });
    if (history) {
      console.log('✅ History found for BG22UCP');
      console.log('\n📊 VALUATION DATA ANALYSIS:');
      console.log('Has valuation object:', !!history.valuation);
      
      if (history.valuation) {
        console.log('\nValuation structure:');
        console.log('- privatePrice:', history.valuation.privatePrice);
        console.log('- dealerPrice:', history.valuation.dealerPrice);
        console.log('- partExchangePrice:', history.valuation.partExchangePrice);
        console.log('- confidence:', history.valuation.confidence);
        console.log('- estimatedValue exists:', !!history.valuation.estimatedValue);
        
        if (history.valuation.estimatedValue) {
          console.log('\nEstimatedValue object:');
          console.log(JSON.stringify(history.valuation.estimatedValue, null, 2));
          console.log('Keys in estimatedValue:', Object.keys(history.valuation.estimatedValue));
          console.log('Is empty object:', Object.keys(history.valuation.estimatedValue).length === 0);
        } else {
          console.log('\n❌ No estimatedValue object found');
        }
        
        console.log('\nFull valuation object:');
        console.log(JSON.stringify(history.valuation, null, 2));
      } else {
        console.log('❌ No valuation object found in history');
      }
      
    } else {
      console.log('❌ No history found for BG22UCP');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkValuationCache();