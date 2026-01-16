const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const HistoryService = require('../services/historyService');

async function testVehicleData() {
    try {
        console.log('='.repeat(60));
        console.log('Testing Actual Vehicle Data Extraction');
        console.log('='.repeat(60));
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');
        
        const historyService = new HistoryService();
        
        // Test with a real UK registration
        const testVRM = 'AB12CDE'; // Test registration
        
        console.log(`\nFetching data for: ${testVRM}`);
        console.log('-'.repeat(60));
        
        const result = await historyService.checkVehicleHistory(testVRM, true); // Save to DB
        
        console.log('\n📊 EXTRACTED DATA:');
        console.log('-'.repeat(60));
        console.log('Make:', result.make);
        console.log('Model:', result.model);
        console.log('Year:', result.year);
        console.log('Colour:', result.colour);
        console.log('Fuel Type:', result.fuelType);
        console.log('Body Type:', result.bodyType);
        console.log('Previous Owners:', result.previousOwners);
        console.log('Number of Owners:', result.numberOfOwners);
        console.log('Model Source:', result.modelSource);
        console.log('Data Source:', result.dataSource);
        
        console.log('\n🔍 FULL RESULT OBJECT:');
        console.log(JSON.stringify(result, null, 2));
        
        console.log('\n✓ Test completed successfully');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

testVehicleData();
