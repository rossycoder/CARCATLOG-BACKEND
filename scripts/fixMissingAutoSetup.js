/**
 * Fix Missing Auto Setup Data
 * Automatically fixes cars that are missing userId, coordinates, or vehicle history
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');
const HistoryService = require('../services/historyService');
const postcodeService = require('../services/postcodeService');

const historyService = new HistoryService();

async function fixMissingAutoSetup() {
  try {
    console.log('🔧 Fixing Missing Auto Setup Data...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fix 1: Missing User IDs
    console.log('📋 Fix 1: Missing User IDs');
    console.log('─'.repeat(50));
    
    const carsWithoutUserId = await Car.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ],
      'sellerContact.email': { $exists: true, $ne: null }
    });
    
    console.log(`Found ${carsWithoutUserId.length} cars without userId but with email`);
    
    let userIdFixed = 0;
    for (const car of carsWithoutUserId) {
      try {
        const user = await User.findOne({ email: car.sellerContact.email });
        if (user) {
          car.userId = user._id;
          await car.save();
          console.log(`✅ Set userId for ${car.make} ${car.model} (${car.registrationNumber})`);
          userIdFixed++;
        } else {
          console.log(`⚠️  No user found for email: ${car.sellerContact.email}`);
        }
      } catch (error) {
        console.error(`❌ Error setting userId for ${car.registrationNumber}:`, error.message);
      }
    }
    
    console.log(`✅ Fixed ${userIdFixed} cars with userId\n`);

    // Fix 2: Missing Coordinates
    console.log('📋 Fix 2: Missing Coordinates');
    console.log('─'.repeat(50));
    
    const carsWithoutCoordinates = await Car.find({
      postcode: { $exists: true, $ne: null },
      $or: [
        { latitude: { $exists: false } },
        { latitude: null },
        { longitude: { $exists: false } },
        { longitude: null }
      ]
    }).limit(20); // Limit to avoid rate limiting
    
    console.log(`Found ${carsWithoutCoordinates.length} cars without coordinates (processing first 20)`);
    
    let coordinatesFixed = 0;
    for (const car of carsWithoutCoordinates) {
      try {
        console.log(`Fetching coordinates for ${car.postcode}...`);
        const postcodeData = await postcodeService.lookupPostcode(car.postcode);
        
        car.latitude = postcodeData.latitude;
        car.longitude = postcodeData.longitude;
        car.location = {
          type: 'Point',
          coordinates: [postcodeData.longitude, postcodeData.latitude]
        };
        
        await car.save();
        console.log(`✅ Set coordinates for ${car.make} ${car.model}: ${car.latitude}, ${car.longitude}`);
        coordinatesFixed++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error setting coordinates for ${car.registrationNumber}:`, error.message);
      }
    }
    
    console.log(`✅ Fixed ${coordinatesFixed} cars with coordinates\n`);

    // Fix 3: Missing Vehicle History
    console.log('📋 Fix 3: Missing Vehicle History');
    console.log('─'.repeat(50));
    
    const carsWithoutHistory = await Car.find({
      registrationNumber: { $exists: true, $ne: null },
      $or: [
        { historyCheckId: { $exists: false } },
        { historyCheckId: null },
        { historyCheckStatus: 'pending' }
      ]
    }).limit(10); // Limit to avoid API rate limiting
    
    console.log(`Found ${carsWithoutHistory.length} cars without history check (processing first 10)`);
    
    let historyFixed = 0;
    for (const car of carsWithoutHistory) {
      try {
        console.log(`Fetching history for ${car.registrationNumber}...`);
        const historyData = await historyService.checkVehicleHistory(car.registrationNumber, false);
        
        if (historyData && historyData._id) {
          car.historyCheckId = historyData._id;
          car.historyCheckStatus = 'verified';
          car.historyCheckDate = new Date();
          await car.save();
          console.log(`✅ Set history for ${car.make} ${car.model}`);
          console.log(`   Previous Owners: ${historyData.numberOfPreviousKeepers || 0}`);
          console.log(`   Has Accident: ${historyData.hasAccidentHistory}`);
          historyFixed++;
        }
        
        // Delay to avoid API rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Error setting history for ${car.registrationNumber}:`, error.message);
        car.historyCheckStatus = 'failed';
        await car.save();
      }
    }
    
    console.log(`✅ Fixed ${historyFixed} cars with vehicle history\n`);

    // Fix 4: Missing Published Dates
    console.log('📋 Fix 4: Missing Published Dates');
    console.log('─'.repeat(50));
    
    const activeCarsWithoutPublishedDate = await Car.find({
      advertStatus: 'active',
      $or: [
        { publishedAt: { $exists: false } },
        { publishedAt: null }
      ]
    });
    
    console.log(`Found ${activeCarsWithoutPublishedDate.length} active cars without published date`);
    
    let publishedDateFixed = 0;
    for (const car of activeCarsWithoutPublishedDate) {
      try {
        // Use createdAt as published date if available, otherwise use current date
        car.publishedAt = car.createdAt || new Date();
        await car.save();
        console.log(`✅ Set published date for ${car.make} ${car.model}: ${car.publishedAt}`);
        publishedDateFixed++;
      } catch (error) {
        console.error(`❌ Error setting published date for ${car.registrationNumber}:`, error.message);
      }
    }
    
    console.log(`✅ Fixed ${publishedDateFixed} cars with published date\n`);

    // Summary
    console.log('📊 Summary');
    console.log('═'.repeat(50));
    console.log(`User IDs Fixed: ${userIdFixed}`);
    console.log(`Coordinates Fixed: ${coordinatesFixed}`);
    console.log(`Vehicle History Fixed: ${historyFixed}`);
    console.log(`Published Dates Fixed: ${publishedDateFixed}`);
    console.log('');
    
    if (userIdFixed + coordinatesFixed + historyFixed + publishedDateFixed > 0) {
      console.log('✅ Auto setup data has been fixed!');
      console.log('');
      console.log('💡 Run verification script to check:');
      console.log('   node backend/scripts/verifyAutoSetup.js');
    } else {
      console.log('✅ No fixes needed - all data is already set!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run fix
fixMissingAutoSetup();
