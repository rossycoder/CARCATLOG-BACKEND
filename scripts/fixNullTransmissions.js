/**
 * Fix null transmission values in the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixNullTransmissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    // Find cars with null transmission
    const carsWithNullTransmission = await Car.find({
      $or: [
        { transmission: null },
        { transmission: '' },
        { transmission: { $exists: false } }
      ]
    });
    
    console.log(`Found ${carsWithNullTransmission.length} cars with null/empty transmission`);
    
    if (carsWithNullTransmission.length > 0) {
      // Update them to 'manual' as default
      const result = await Car.updateMany(
        {
          $or: [
            { transmission: null },
            { transmission: '' },
            { transmission: { $exists: false } }
          ]
        },
        {
          $set: { transmission: 'manual' }
        }
      );
      
      console.log(`✓ Updated ${result.modifiedCount} cars to have 'manual' transmission`);
    }
    
    // Verify
    const remaining = await Car.countDocuments({
      $or: [
        { transmission: null },
        { transmission: '' },
        { transmission: { $exists: false } }
      ]
    });
    
    console.log(`Remaining cars with null transmission: ${remaining}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');
  }
}

fixNullTransmissions();
