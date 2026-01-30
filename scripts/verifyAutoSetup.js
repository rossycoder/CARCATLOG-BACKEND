/**
 * Verify Automatic Car Setup
 * Tests that userId, coordinates, and vehicle history are automatically set
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const User = require('../models/User');

async function verifyAutoSetup() {
  try {
    console.log('🔍 Verifying Automatic Car Setup...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Check if userId is automatically set
    console.log('📋 Test 1: User ID Auto-Set');
    console.log('─'.repeat(50));
    
    const testUser = await User.findOne().limit(1);
    if (testUser) {
      console.log(`✅ Found test user: ${testUser.email}`);
      
      // Find cars with this user
      const userCars = await Car.find({ userId: testUser._id });
      console.log(`✅ Found ${userCars.length} cars with userId set`);
      
      if (userCars.length > 0) {
        const car = userCars[0];
        console.log(`   Car: ${car.make} ${car.model} (${car.registrationNumber})`);
        console.log(`   User ID: ${car.userId}`);
      }
    } else {
      console.log('⚠️  No users found in database');
    }
    console.log('');

    // Test 2: Check if coordinates are automatically set
    console.log('📋 Test 2: Coordinates Auto-Set');
    console.log('─'.repeat(50));
    
    const carsWithCoordinates = await Car.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    }).limit(5);
    
    console.log(`✅ Found ${carsWithCoordinates.length} cars with coordinates`);
    
    carsWithCoordinates.forEach((car, index) => {
      console.log(`   ${index + 1}. ${car.make} ${car.model}`);
      console.log(`      Postcode: ${car.postcode}`);
      console.log(`      Coordinates: ${car.latitude}, ${car.longitude}`);
      console.log(`      Location: ${car.location ? 'Set' : 'Not set'}`);
    });
    console.log('');

    // Test 3: Check if vehicle history is saved
    console.log('📋 Test 3: Vehicle History Auto-Save');
    console.log('─'.repeat(50));
    
    const carsWithHistory = await Car.find({
      historyCheckId: { $exists: true, $ne: null }
    }).limit(5);
    
    console.log(`✅ Found ${carsWithHistory.length} cars with history check`);
    
    for (const car of carsWithHistory) {
      console.log(`   ${car.make} ${car.model} (${car.registrationNumber})`);
      console.log(`      History Check ID: ${car.historyCheckId}`);
      console.log(`      History Status: ${car.historyCheckStatus}`);
      console.log(`      Check Date: ${car.historyCheckDate}`);
      
      // Verify history exists in database
      const history = await VehicleHistory.findById(car.historyCheckId);
      if (history) {
        console.log(`      ✅ History found in database`);
        console.log(`         VRM: ${history.vrm}`);
        console.log(`         Previous Owners: ${history.numberOfPreviousKeepers || history.previousOwners || 0}`);
        console.log(`         Has Accident: ${history.hasAccidentHistory}`);
        console.log(`         Is Stolen: ${history.isStolen}`);
        console.log(`         Has Finance: ${history.hasOutstandingFinance}`);
      } else {
        console.log(`      ⚠️  History NOT found in database`);
      }
      console.log('');
    }

    // Test 4: Check published dates
    console.log('📋 Test 4: Published Date Auto-Set');
    console.log('─'.repeat(50));
    
    const activeCars = await Car.find({
      advertStatus: 'active',
      publishedAt: { $exists: true, $ne: null }
    }).limit(5);
    
    console.log(`✅ Found ${activeCars.length} active cars with published date`);
    
    activeCars.forEach((car, index) => {
      console.log(`   ${index + 1}. ${car.make} ${car.model}`);
      console.log(`      Status: ${car.advertStatus}`);
      console.log(`      Published: ${car.publishedAt}`);
    });
    console.log('');

    // Summary
    console.log('📊 Summary');
    console.log('═'.repeat(50));
    
    const totalCars = await Car.countDocuments();
    const carsWithUserId = await Car.countDocuments({ userId: { $exists: true, $ne: null } });
    const carsWithCoords = await Car.countDocuments({ 
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    });
    const carsWithHistoryCheck = await Car.countDocuments({ 
      historyCheckId: { $exists: true, $ne: null }
    });
    const carsWithPublishedDate = await Car.countDocuments({ 
      publishedAt: { $exists: true, $ne: null }
    });
    
    console.log(`Total Cars: ${totalCars}`);
    console.log(`Cars with User ID: ${carsWithUserId} (${((carsWithUserId/totalCars)*100).toFixed(1)}%)`);
    console.log(`Cars with Coordinates: ${carsWithCoords} (${((carsWithCoords/totalCars)*100).toFixed(1)}%)`);
    console.log(`Cars with History Check: ${carsWithHistoryCheck} (${((carsWithHistoryCheck/totalCars)*100).toFixed(1)}%)`);
    console.log(`Cars with Published Date: ${carsWithPublishedDate} (${((carsWithPublishedDate/totalCars)*100).toFixed(1)}%)`);
    console.log('');

    // Recommendations
    console.log('💡 Recommendations');
    console.log('═'.repeat(50));
    
    if (carsWithUserId < totalCars) {
      console.log(`⚠️  ${totalCars - carsWithUserId} cars missing userId`);
      console.log('   Run: node backend/scripts/fixAllMissingUserIds.js');
    }
    
    if (carsWithCoords < totalCars) {
      console.log(`⚠️  ${totalCars - carsWithCoords} cars missing coordinates`);
      console.log('   Run: node backend/scripts/addCoordinatesToAllCars.js');
    }
    
    if (carsWithHistoryCheck < totalCars) {
      console.log(`⚠️  ${totalCars - carsWithHistoryCheck} cars missing history check`);
      console.log('   Run: node backend/scripts/fixAllVehicleHistory.js');
    }
    
    if (carsWithUserId === totalCars && carsWithCoords === totalCars && carsWithHistoryCheck === totalCars) {
      console.log('✅ All cars have complete automatic setup!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run verification
verifyAutoSetup();
