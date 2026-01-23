require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

/**
 * Diagnose why the car is being created with wrong variant
 */

async function diagnoseCarCreationFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find the problematic car
    const car = await Car.findOne({ registrationNumber: 'NU10YEV' }).sort({ createdAt: -1 });
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }
    
    console.log('='.repeat(70));
    console.log('CAR CREATION DIAGNOSIS');
    console.log('='.repeat(70));
    
    console.log(`\n📊 Current Car Data:`);
    console.log(`  ID: ${car._id}`);
    console.log(`  Created: ${car.createdAt}`);
    console.log(`  Advert ID: ${car.advertId}`);
    console.log(`  Make: ${car.make}`);
    console.log(`  Model: ${car.model}`);
    console.log(`  Variant: "${car.variant}"`);
    console.log(`  DisplayTitle: "${car.displayTitle}"`);
    console.log(`  Engine Size: ${car.engineSize}`);
    console.log(`  Doors: ${car.doors}`);
    console.log(`  Data Source: ${car.dataSource}`);
    console.log(`  Data Sources:`, car.dataSources);
    
    console.log(`\n❌ PROBLEM IDENTIFIED:`);
    console.log(`  Expected variant: "S TDI CR"`);
    console.log(`  Actual variant: "${car.variant}"`);
    console.log(`  Expected displayTitle: "1.6 S TDI CR 5dr"`);
    console.log(`  Actual displayTitle: "${car.displayTitle}"`);
    
    console.log(`\n🔍 DIAGNOSIS:`);
    console.log(`  The car was created with variant="TDI" instead of "S TDI CR"`);
    console.log(`  This means the CheckCarDetails API was NOT called during creation`);
    console.log(`  OR the modelVariant field was not extracted from the API response`);
    
    console.log(`\n📝 SOLUTION:`);
    console.log(`  The car needs to be updated with the correct variant from the API`);
    console.log(`  Run: node backend/scripts/fixNU10YEVDisplayTitle.js`);
    
    console.log('\n' + '='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

diagnoseCarCreationFlow();
