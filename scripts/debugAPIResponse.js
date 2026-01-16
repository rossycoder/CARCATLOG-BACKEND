const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const HistoryAPIClient = require('../clients/HistoryAPIClient');
const { loadAPICredentials } = require('../config/apiCredentials');

async function debugAPIResponse() {
    try {
        console.log('='.repeat(60));
        console.log('Debugging Raw API Response');
        console.log('='.repeat(60));
        
        const credentials = loadAPICredentials();
        const client = new HistoryAPIClient(
            credentials.history.apiKey,
            credentials.history.baseUrl,
            credentials.history.isTestMode
        );
        
        const testVRM = 'AB12CDE';
        
        console.log(`\nFetching raw data for: ${testVRM}`);
        console.log('-'.repeat(60));
        
        const rawResponse = await client.checkHistory(testVRM);
        
        console.log('\n📦 RAW API RESPONSE:');
        console.log(JSON.stringify(rawResponse, null, 2));
        
        console.log('\n🔍 VEHICLE HISTORY OBJECT:');
        console.log(JSON.stringify(rawResponse.VehicleHistory, null, 2));
        
        console.log('\n👥 PREVIOUS KEEPERS:');
        console.log('NumberOfPreviousKeepers:', rawResponse.VehicleHistory?.NumberOfPreviousKeepers);
        console.log('KeeperChangesCount:', rawResponse.VehicleHistory?.KeeperChangesCount);
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    }
}

debugAPIResponse();
