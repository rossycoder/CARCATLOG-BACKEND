require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function fixAllUnknownModelCars() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find all cars with "Unknown" model or missing variant
    console.log('🔍 Finding cars with "Unknown" model or missing variants...');
    
    const problematicCars = await Car.find({
      $or: [
        { model: 'Unknown' },
        { model: null },
        { variant: null },
        { variant: 'null' },
        { variant: 'undefined' },
        { variant: '' },
        { variant: /^\d+\.?\d*L\s+(Petrol|Diesel|Electric|Hybrid)$/i } // Fallback variants like "2.0L Diesel"
      ],
      registrationNumber: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`\n📊 Found ${problematicCars.length} cars that need fixing\n`);

    if (problematicCars.length === 0) {
      console.log('✅ All cars have proper model and variant data!');
      await mongoose.connection.close();
      return;
    }

    // Import the variant service
    const variantOnlyService = require('../services/variantOnlyService');
    
    let successCount = 0;
    let failCount = 0;
    let apiLimitReached = false;

    for (let i = 0; i < problematicCars.length; i++) {
      const car = problematicCars[i];
      
      console.log(`\n[${i + 1}/${problematicCars.length}] Processing: ${car.make} ${car.model}`);
      console.log(`   Registration: ${car.registrationNumber}`);
      console.log(`   Current Variant: ${car.variant || 'MISSING'}`);

      if (apiLimitReached) {
        console.log('   ⏰ Skipping (API limit reached)');
        continue;
      }

      try {
        // Fetch real vehicle data from API (use cache if available)
        const vehicleData = await variantOnlyService.getVariantOnly(car.registrationNumber, true);
        
        // Extract values from wrapped format if needed
        const extractValue = (field) => {
          if (!field) return null;
          return typeof field === 'object' && field.value ? field.value : field;
        };

        const newModel = extractValue(vehicleData.model);
        const newVariant = extractValue(vehicleData.variant);
        const newEngineSize = extractValue(vehicleData.engineSize);
        const newBodyType = extractValue(vehicleData.bodyType);
        const newDoors = extractValue(vehicleData.doors);
        const newEmissionClass = extractValue(vehicleData.emissionClass);

        // Update car with real data
        let updated = false;

        if (newModel && newModel !== 'Unknown' && car.model === 'Unknown') {
          car.model = newModel;
          updated = true;
          console.log(`   ✅ Model updated: ${newModel}`);
        }

        if (newVariant && newVariant !== 'null' && newVariant !== 'undefined') {
          car.variant = newVariant;
          updated = true;
          console.log(`   ✅ Variant updated: ${newVariant}`);
        }

        if (newEngineSize && !car.engineSize) {
          car.engineSize = parseFloat(newEngineSize);
          updated = true;
          console.log(`   ✅ Engine size updated: ${car.engineSize}L`);
        }

        if (newBodyType && !car.bodyType) {
          car.bodyType = newBodyType;
          updated = true;
          console.log(`   ✅ Body type updated: ${newBodyType}`);
        }

        if (newDoors && !car.doors) {
          car.doors = parseInt(newDoors);
          updated = true;
          console.log(`   ✅ Doors updated: ${car.doors}`);
        }

        if (newEmissionClass && !car.emissionClass) {
          car.emissionClass = newEmissionClass;
          updated = true;
          console.log(`   ✅ Emission class updated: ${newEmissionClass}`);
        }

        // Link to vehicle history if available
        if (vehicleData.historyCheckId && !car.historyCheckId) {
          car.historyCheckId = vehicleData.historyCheckId;
          car.historyCheckStatus = 'verified';
          car.historyCheckDate = new Date();
          updated = true;
          console.log(`   ✅ Linked to vehicle history`);
        }

        if (updated) {
          // Save the car (pre-save hook will generate proper displayTitle)
          await car.save();
          console.log(`   ✅ Car saved with new display title: "${car.displayTitle}"`);
          successCount++;
        } else {
          console.log(`   ⚠️  No updates needed`);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (apiError) {
        console.error(`   ❌ Error: ${apiError.message}`);
        
        if (apiError.message.includes('daily limit') || apiError.message.includes('403')) {
          console.log('   ⏰ API daily limit reached - stopping further API calls');
          apiLimitReached = true;
        }
        
        failCount++;
      }
    }

    console.log('\n\n📊 Summary:');
    console.log('=====================================');
    console.log(`✅ Successfully fixed: ${successCount} cars`);
    console.log(`❌ Failed: ${failCount} cars`);
    console.log(`📋 Total processed: ${problematicCars.length} cars`);

    if (apiLimitReached) {
      console.log('\n⏰ API daily limit was reached');
      console.log('   Run this script again tomorrow to fix remaining cars');
    }

    await mongoose.connection.close();
    console.log('\n✅ Fix completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixAllUnknownModelCars();
