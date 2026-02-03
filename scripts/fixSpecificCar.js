const mongoose = require('mongoose');
const ComprehensiveVehicleService = require('../services/comprehensiveVehicleService');

// Load environment variables
require('dotenv').config();

// Fix specific car with complete data
async function fixSpecificCar() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');

    const specificCarId = '697e75e49e282f63c4b77c09'; // EK11XHZ car
    
    console.log(`\n🔧 Fixing Car: ${specificCarId}`);
    console.log('=' .repeat(60));

    const comprehensiveService = new ComprehensiveVehicleService();
    
    // Fix the specific car
    const result = await comprehensiveService.fixSpecificCar(specificCarId);
    
    console.log('\n✅ Fix Result:', JSON.stringify(result, null, 2));
    
    // Also cleanup orphaned vehicle history documents
    console.log('\n🧹 Cleaning up orphaned VehicleHistory documents...');
    const cleanupResult = await comprehensiveService.cleanupOrphanedVehicleHistory();
    
    console.log('\n✅ Cleanup Result:', JSON.stringify(cleanupResult, null, 2));
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 Car Fix Complete');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the fix
if (require.main === module) {
  fixSpecificCar();
}

module.exports = fixSpecificCar;