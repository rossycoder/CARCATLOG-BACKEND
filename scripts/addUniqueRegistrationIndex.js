/**
 * Add Unique Index for Active Registration Numbers
 * Creates a partial unique index to prevent duplicate active adverts
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function addUniqueRegistrationIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const carsCollection = db.collection('cars');

    // Check existing indexes
    console.log('\n📋 Checking existing indexes...');
    const existingIndexes = await carsCollection.indexes();
    console.log('Current indexes:', existingIndexes.map(idx => idx.name));

    // Drop old registration index if it exists
    try {
      await carsCollection.dropIndex('registrationNumber_1');
      console.log('✅ Dropped old registrationNumber_1 index');
    } catch (error) {
      console.log('ℹ️  No old index to drop');
    }

    // Create partial unique index for active adverts only
    // This allows multiple records with same registration if they're not active
    console.log('\n🔨 Creating partial unique index...');
    await carsCollection.createIndex(
      { registrationNumber: 1 },
      {
        unique: true,
        partialFilterExpression: {
          registrationNumber: { $exists: true, $ne: null, $ne: '' },
          advertStatus: 'active'
        },
        name: 'unique_active_registration'
      }
    );

    console.log('✅ Created unique index: unique_active_registration');
    console.log('   - Ensures only ONE active advert per registration number');
    console.log('   - Allows multiple inactive/sold/removed adverts');

    // Verify the index
    const newIndexes = await carsCollection.indexes();
    const uniqueIndex = newIndexes.find(idx => idx.name === 'unique_active_registration');
    
    if (uniqueIndex) {
      console.log('\n✅ Index verified:');
      console.log(JSON.stringify(uniqueIndex, null, 2));
    }

    console.log('\n✅ Index creation complete!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run script
addUniqueRegistrationIndex();
