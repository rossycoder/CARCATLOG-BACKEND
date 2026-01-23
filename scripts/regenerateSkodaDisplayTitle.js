const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

async function regenerateDisplayTitle() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const skoda = await Car.findOne({ make: 'SKODA', model: 'Octavia' });

    if (!skoda) {
      console.log('Skoda not found');
      return;
    }

    console.log('\n=== BEFORE ===');
    console.log('Variant:', skoda.variant);
    console.log('DisplayTitle:', skoda.displayTitle);

    // Force regeneration by clearing displayTitle
    skoda.displayTitle = '';
    await skoda.save();

    // Fetch again to see the auto-generated value
    const updated = await Car.findById(skoda._id);
    
    console.log('\n=== AFTER ===');
    console.log('Variant:', updated.variant);
    console.log('DisplayTitle:', updated.displayTitle);
    console.log('\n✅ Done!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

regenerateDisplayTitle();
