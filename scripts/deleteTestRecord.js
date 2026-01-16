const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const VehicleHistory = require('../models/VehicleHistory');

async function deleteTestRecord() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');
        
        const testVRM = 'AB12CDE';
        const result = await VehicleHistory.deleteOne({ registrationNumber: testVRM });
        
        console.log(`Deleted ${result.deletedCount} record(s) for ${testVRM}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');
    }
}

deleteTestRecord();
