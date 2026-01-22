require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function extractVariantsFromModel() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find cars without submodel but with detailed model field
    const cars = await Car.find({
      $or: [
        { submodel: { $exists: false } },
        { submodel: null },
        { submodel: '' }
      ],
      model: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`Found ${cars.length} cars to process\n`);

    let updated = 0;
    let skipped = 0;

    for (const car of cars) {
      // Check if model field contains variant information
      // Examples: "335I M SPORT AUTO", "Octavia 1.6 TDI S", "3 Series 320d"
      
      const model = car.model.trim();
      
      // Skip if model is just a simple name (likely no variant)
      if (model.split(' ').length <= 2 && !/\d/.test(model)) {
        skipped++;
        continue;
      }

      // Try to extract variant from model field
      // Common patterns:
      // - "Model Variant" (e.g., "Octavia 1.6 TDI S")
      // - "Model-Variant" (e.g., "3-Series 320d")
      
      let extractedVariant = null;
      
      // Pattern 1: Model contains numbers/technical specs (likely includes variant)
      if (/\d/.test(model)) {
        // Split by common model names and take the rest as variant
        const commonModels = ['Series', 'Class', 'Octavia', 'Focus', 'Golf', 'Astra', 'Corsa'];
        
        for (const modelName of commonModels) {
          if (model.includes(modelName)) {
            const parts = model.split(modelName);
            if (parts.length > 1 && parts[1].trim()) {
              extractedVariant = parts[1].trim();
              break;
            }
          }
        }
        
        // If no match, take everything after first word as variant
        if (!extractedVariant) {
          const parts = model.split(' ');
          if (parts.length > 1) {
            extractedVariant = parts.slice(1).join(' ');
          }
        }
      }

      if (extractedVariant && extractedVariant.trim()) {
        console.log(`${car.make} ${car.model}`);
        console.log(`  → Extracted variant: ${extractedVariant}`);
        
        car.submodel = extractedVariant.trim();
        await car.save();
        updated++;
      } else {
        skipped++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('EXTRACTION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total processed: ${cars.length}`);
    console.log(`✅ Successfully extracted: ${updated}`);
    console.log(`⏭️  Skipped (no variant found): ${skipped}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

extractVariantsFromModel();
