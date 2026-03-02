/**
 * Check Van Fields - See what fields exist in the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Van = require('../models/Van');

async function checkVanFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find one van to see its structure
    const van = await Van.findOne();
    
    if (van) {
      console.log('\n📋 Van Fields:');
      console.log(JSON.stringify(van, null, 2));
    } else {
      console.log('❌ No vans found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
checkVanFields();
