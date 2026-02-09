/**
 * Clear cache for specific car to force fresh API call
 */

require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('./models/VehicleHistory');

async function clearCache() {
  const vrm = 'EX09MYY'; // Change this to your car's registration
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autotrader');
    console.log('Connected to database');
    
    console.log(`Clearing cache for ${vrm}...`);
    const result = await VehicleHistory.deleteMany({ vrm: vrm });
    
    console.log(`✅ Deleted ${result.deletedCount} cache records for ${vrm}`);
    console.log('Now refresh the page - it will fetch fresh data from API');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

clearCache();
