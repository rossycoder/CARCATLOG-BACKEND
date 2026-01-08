const mongoose = require('mongoose');
require('dotenv').config();

async function listDatabases() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');

    // Get admin database
    const adminDb = mongoose.connection.db.admin();
    
    // List all databases
    const { databases } = await adminDb.listDatabases();
    
    console.log('\n📋 Available databases:');
    databases.forEach((db, index) => {
      console.log(`${index + 1}. ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listDatabases();
