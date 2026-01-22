require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function updateAllCarsModelHierarchy() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all cars that don't have submodel set
    const cars = await Car.find({
      $or: [
        { submodel: { $exists: false } },
        { submodel: null },
        { submodel: '' }
      ]
    });

    console.log(`\nFound ${cars.length} cars to update\n`);

    let updated = 0;
    let skipped = 0;

    for (const car of cars) {
      console.log(`\nProcessing: ${car.make} ${car.model}`);
      console.log(`Current model: "${car.model}"`);

      // Try to intelligently split the model into model and variant
      // Common patterns:
      // "3 Series 335I M Sport" -> model: "3 Series", variant: "335I M Sport"
      // "A4 2.0 TDI S Line" -> model: "A4", variant: "2.0 TDI S Line"
      // "Golf GTI" -> model: "Golf", variant: "GTI"
      
      let modelPart = car.model;
      let variantPart = '';

      // Pattern 1: Series/Class followed by variant (BMW, Mercedes)
      const seriesMatch = car.model.match(/^(.*?(?:Series|Class))\s+(.+)$/i);
      if (seriesMatch) {
        modelPart = seriesMatch[1].trim();
        variantPart = seriesMatch[2].trim();
      }
      // Pattern 2: Just "X Series" or "X Class" with no variant - keep as is
      else if (car.model.match(/^.*?(?:Series|Class)$/i)) {
        // Don't split - this is just the model name
        modelPart = car.model;
        variantPart = '';
      }
      // Pattern 3: Model name followed by alphanumeric variant
      else {
        const parts = car.model.split(' ');
        if (parts.length > 1) {
          // First part is usually the model
          modelPart = parts[0];
          // Rest is the variant
          variantPart = parts.slice(1).join(' ');
        }
      }

      if (variantPart) {
        car.model = modelPart;
        car.submodel = variantPart;
        await car.save();
        
        console.log(`✓ Updated to:`);
        console.log(`  Make: ${car.make}`);
        console.log(`  Model: ${car.model}`);
        console.log(`  Submodel: ${car.submodel}`);
        updated++;
      } else {
        console.log(`⊘ Skipped - couldn't determine variant split`);
        skipped++;
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Migration Complete!`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Updated: ${updated} cars`);
    console.log(`Skipped: ${skipped} cars`);
    console.log(`Total processed: ${cars.length} cars`);

  } catch (error) {
    console.error('Error updating cars:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

updateAllCarsModelHierarchy();
