/**
 * Fix Van Submodel - Remove duplicate words
 * This script fixes vans that have duplicate words in their submodel field
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Van = require('../models/Van');

async function fixVanSubmodels() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all vans with submodel field
    const vans = await Van.find({ submodel: { $exists: true, $ne: null } });
    console.log(`📊 Found ${vans.length} vans with submodel field`);

    let fixedCount = 0;

    for (const van of vans) {
      const originalSubmodel = van.submodel;
      
      // Remove duplicate words from submodel
      const words = originalSubmodel.split(/\s+/);
      const uniqueWords = [...new Set(words)]; // Remove duplicates
      const cleanedSubmodel = uniqueWords.join(' ').trim();

      if (originalSubmodel !== cleanedSubmodel) {
        console.log(`\n🔧 Fixing van: ${van._id}`);
        console.log(`   Before: "${originalSubmodel}"`);
        console.log(`   After:  "${cleanedSubmodel}"`);

        van.submodel = cleanedSubmodel;
        await van.save();
        fixedCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} vans`);
    console.log(`✅ ${vans.length - fixedCount} vans were already correct`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the script
fixVanSubmodels();
