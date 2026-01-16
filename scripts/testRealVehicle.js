const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const HistoryService = require('../services/historyService');

async function testRealVehicle() {
    try {
        console.log('='.repeat(60));
        console.log('Testing with REAL UK Vehicle Registration');
        console.log('='.repeat(60));
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');
        
        const historyService = new HistoryService();
        
        // Use the registration from your screenshot
        const testVRM = 'HUM777A';
        
        console.log(`\n🚗 Fetching data for: ${testVRM}`);
        console.log('-'.repeat(60));
        
        // Force fresh API call
        const result = await historyService.checkVehicleHistory(testVRM, true);
        
        console.log('\n📊 EXTRACTED DATA:');
        console.log('-'.repeat(60));
        console.log('✓ Make:', result.make);
        console.log('✓ Model:', result.model);
        console.log('✓ Year:', result.yearOfManufacture);
        console.log('✓ Colour:', result.colour);
        console.log('✓ Fuel Type:', result.fuelType);
        console.log('✓ Body Type:', result.bodyType);
        console.log('✓ Previous Owners:', result.previousOwners);
        console.log('✓ Number of Owners:', result.numberOfOwners);
        console.log('✓ Number of Previous Keepers:', result.numberOfPreviousKeepers);
        
        console.log('\n🔍 FULL RESULT:');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

testRealVehicle();
