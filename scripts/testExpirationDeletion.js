const mongoose = require('mongoose');
require('dotenv').config();
const expirationService = require('../services/expirationService');

async function testExpirationDeletion() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get stats before deletion
    console.log('\n=== BEFORE DELETION ===');
    const statsBefore = await expirationService.getExpirationStats();
    console.log('Statistics:', JSON.stringify(statsBefore, null, 2));

    // Run expiration check (will delete expired listings)
    console.log('\n=== RUNNING EXPIRATION CHECK ===');
    const results = await expirationService.expireListings();
    console.log('Deletion Results:', JSON.stringify(results, null, 2));

    // Get stats after deletion
    console.log('\n=== AFTER DELETION ===');
    const statsAfter = await expirationService.getExpirationStats();
    console.log('Statistics:', JSON.stringify(statsAfter, null, 2));

    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

testExpirationDeletion();
