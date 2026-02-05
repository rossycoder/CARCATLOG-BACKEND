require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const Bike = require('../models/Bike');
const Van = require('../models/Van');

/**
 * Clean location name - extract only town/city name
 * @param {string} locationName - Original location name
 * @returns {string} Cleaned location name
 */
function cleanLocationName(locationName) {
  if (!locationName) return locationName;
  
  // Remove "unparished area" and similar descriptors
  let cleanName = locationName
    .replace(/,?\s*unparished area/gi, '')
    .replace(/,?\s*\(unparished area\)/gi, '')
    .trim();
  
  // If location contains comma, take the first part (usually the town name)
  if (cleanName.includes(',')) {
    cleanName = cleanName.split(',')[0].trim();
  }
  
  // Remove any postcode patterns from the location name
  cleanName = cleanName.replace(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/gi, '').trim();
  
  return cleanName;
}

async function cleanAllLocationNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clean Cars
    console.log('\n🚗 Cleaning Car location names...');
    const cars = await Car.find({ locationName: { $exists: true, $ne: null } });
    console.log(`Found ${cars.length} cars with location names`);
    
    let carUpdated = 0;
    for (const car of cars) {
      const originalName = car.locationName;
      const cleanedName = cleanLocationName(originalName);
      
      if (cleanedName !== originalName) {
        car.locationName = cleanedName;
        await car.save();
        carUpdated++;
        console.log(`  Updated: "${originalName}" → "${cleanedName}"`);
      }
    }
    console.log(`✅ Updated ${carUpdated} car location names`);
    
    // Clean Bikes
    console.log('\n🏍️  Cleaning Bike location names...');
    const bikes = await Bike.find({ locationName: { $exists: true, $ne: null } });
    console.log(`Found ${bikes.length} bikes with location names`);
    
    let bikeUpdated = 0;
    for (const bike of bikes) {
      const originalName = bike.locationName;
      const cleanedName = cleanLocationName(originalName);
      
      if (cleanedName !== originalName) {
        bike.locationName = cleanedName;
        await bike.save();
        bikeUpdated++;
        console.log(`  Updated: "${originalName}" → "${cleanedName}"`);
      }
    }
    console.log(`✅ Updated ${bikeUpdated} bike location names`);
    
    // Clean Vans
    console.log('\n🚐 Cleaning Van location names...');
    const vans = await Van.find({ locationName: { $exists: true, $ne: null } });
    console.log(`Found ${vans.length} vans with location names`);
    
    let vanUpdated = 0;
    for (const van of vans) {
      const originalName = van.locationName;
      const cleanedName = cleanLocationName(originalName);
      
      if (cleanedName !== originalName) {
        van.locationName = cleanedName;
        await van.save();
        vanUpdated++;
        console.log(`  Updated: "${originalName}" → "${cleanedName}"`);
      }
    }
    console.log(`✅ Updated ${vanUpdated} van location names`);
    
    console.log('\n✅ All location names cleaned successfully!');
    console.log(`Total updated: ${carUpdated + bikeUpdated + vanUpdated}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

cleanAllLocationNames();
