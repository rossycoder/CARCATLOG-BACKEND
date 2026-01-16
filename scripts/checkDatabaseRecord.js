const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const VehicleHistory = require('../models/VehicleHistory');

async function checkDatabaseRecord() {
    try {
        console.log('='.repeat(60));
        console.log('Checking Database Record');
        console.log('='.repeat(60));
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');
        
        const testVRM = 'AB12CDE';
        
        const record = await VehicleHistory.findOne({ registrationNumber: testVRM });
        
        if (!record) {
            console.log(`\n❌ No record found for ${testVRM}`);
            return;
        }
        
        console.log(`\n📦 DATABASE RECORD for ${testVRM}:`);
        console.log('-'.repeat(60));
        console.log('Make:', record.make);
        console.log('Model:', record.model);
        console.log('Previous Owners:', record.previousOwners);
        console.log('Number of Owners:', record.numberOfOwners);
        
        console.log('\n📄 RAW API RESPONSE (stored):');
        if (record.rawApiResponse) {
            const vehicleHistory = record.rawApiResponse.VehicleHistory;
            console.log('VehicleHistory.NumberOfPreviousKeepers:', vehicleHistory?.NumberOfPreviousKeepers);
            console.log('VehicleHistory.KeeperChangesCount:', vehicleHistory?.KeeperChangesCount);
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

checkDatabaseRecord();
