/**
 * Clear cache for BG22UCP to test the price fix
 */

require('dotenv').config();
const enhancedVehicleService = require('../services/enhancedVehicleService');

async function clearCacheForBG22UCP() {
  try {
    console.log('🗑️ Clearing cache for BG22UCP to test price fix...');
    
    const result = await enhancedVehicleService.clearCache('BG22UCP');
    
    if (result) {
      console.log('✅ Cache cleared successfully for BG22UCP');
      console.log('🔄 Next API call will fetch fresh data and use the fixed cache reconstruction logic');
    } else {
      console.log('ℹ️ No cache found for BG22UCP or cache was already empty');
    }
    
    console.log('\n🧪 Now test the enhanced vehicle lookup to see if price displays correctly...');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
  }
}

clearCacheForBG22UCP();