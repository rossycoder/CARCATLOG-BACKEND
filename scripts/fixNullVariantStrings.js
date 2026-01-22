/**
 * Fix cars with variant="null" (string) in database
 * Convert "null" strings to actual null values
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixNullVariantStrings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find all cars with variant as string "null"
    const carsWithNullString = await Car.find({ 
      variant: 'null' 
    });

    console.log(`Found ${carsWithNullString.length} cars with variant="null" (string)\n`);

    if (carsWithNullString.length === 0) {
      console.log('No cars to fix!');
      await mongoose.connection.close();
      return;
    }

    // Update all cars with "null" string to actual null
    const result = await Car.updateMany(
      { variant: 'null' },
      { $set: { variant: null } }
    );

    console.log(`✅ Updated ${result.modifiedCount} cars`);
    console.log(`   - Changed variant from "null" (string) to null (actual null value)`);

    // Verify the fix
    const remainingNullStrings = await Car.countDocuments({ variant: 'null' });
    console.log(`\nVerification: ${remainingNullStrings} cars still have variant="null" string`);

    const actualNulls = await Car.countDocuments({ variant: null });
    console.log(`Total cars with variant=null (actual null): ${actualNulls}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixNullVariantStrings();
