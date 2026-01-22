/**
 * Remove Duplicate Adverts Script
 * Finds and removes duplicate active adverts with same registration number
 * Keeps the most recent one
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function removeDuplicateAdverts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all registration numbers with multiple active adverts
    const duplicates = await Car.aggregate([
      {
        $match: {
          registrationNumber: { $exists: true, $ne: null, $ne: '' },
          advertStatus: 'active'
        }
      },
      {
        $group: {
          _id: '$registrationNumber',
          count: { $sum: 1 },
          ids: { $push: '$_id' },
          dates: { $push: '$createdAt' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`\n📊 Found ${duplicates.length} registration numbers with duplicates\n`);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }

    let totalRemoved = 0;

    for (const dup of duplicates) {
      console.log(`\n🔍 Processing: ${dup._id} (${dup.count} duplicates)`);
      
      // Get all cars with this registration
      const cars = await Car.find({
        registrationNumber: dup._id,
        advertStatus: 'active'
      }).sort({ createdAt: -1 }); // Most recent first

      // Keep the first (most recent), remove the rest
      const toKeep = cars[0];
      const toRemove = cars.slice(1);

      console.log(`   ✅ Keeping: ${toKeep._id} (created: ${toKeep.createdAt})`);
      
      for (const car of toRemove) {
        console.log(`   ❌ Removing: ${car._id} (created: ${car.createdAt})`);
        
        // Mark as removed instead of deleting
        car.advertStatus = 'removed';
        await car.save();
        totalRemoved++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 DUPLICATE REMOVAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Registration numbers with duplicates: ${duplicates.length}`);
    console.log(`Total adverts removed: ${totalRemoved}`);
    console.log('\n✅ Duplicate removal complete!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run script
removeDuplicateAdverts();
