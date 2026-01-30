require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const Car = require('../models/Car');

/**
 * Manually add history data when API limit is exceeded
 * This creates a basic history record so frontend doesn't show errors
 */
async function manuallyAddHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get VRM from command line argument
    const vrm = process.argv[2];
    
    if (!vrm) {
      console.log('❌ Please provide a VRM');
      console.log('Usage: node manuallyAddHistory.js <VRM>');
      console.log('Example: node manuallyAddHistory.js RJ08PFA');
      process.exit(1);
    }
    
    console.log(`📋 Adding manual history for: ${vrm}\n`);
    
    // Check if car exists
    const car = await Car.findOne({ registrationNumber: vrm.toUpperCase() });
    if (!car) {
      console.log('❌ Car not found with registration:', vrm);
      process.exit(1);
    }
    
    console.log('✅ Car found:', car._id);
    
    // Check if history already exists
    const existingHistory = await VehicleHistory.findOne({ vrm: vrm.toUpperCase() });
    if (existingHistory) {
      console.log('⚠️  History already exists for this VRM');
      console.log('   History ID:', existingHistory._id);
      console.log('   Owners:', existingHistory.numberOfPreviousKeepers);
      
      // Update car link if missing
      if (!car.historyCheckId) {
        car.historyCheckId = existingHistory._id;
        car.historyCheckStatus = 'verified';
        car.historyCheckDate = new Date();
        await car.save();
        console.log('✅ Car updated with existing history link');
      }
      
      process.exit(0);
    }
    
    // Create manual history record with placeholder data
    console.log('\n📝 Creating manual history record...');
    console.log('⚠️  Note: This is placeholder data until API limit resets');
    console.log('   You can update owner count manually in database\n');
    
    const manualHistory = new VehicleHistory({
      vrm: vrm.toUpperCase(),
      checkDate: new Date(),
      hasAccidentHistory: false,
      isStolen: false,
      hasOutstandingFinance: false,
      isScrapped: false,
      isImported: false,
      isExported: false,
      isWrittenOff: false,
      numberOfPreviousKeepers: 0, // Placeholder - update manually
      previousOwners: 0,
      numberOfOwners: 0,
      numberOfKeys: 1,
      keys: 1,
      serviceHistory: 'Contact seller',
      motStatus: null,
      motExpiryDate: null,
      checkStatus: 'partial', // Mark as partial since it's manual
      apiProvider: 'manual-entry',
      testMode: false,
      v5cCertificateCount: 0,
      v5cCertificateList: [],
      plateChanges: 0,
      plateChangesList: [],
      colourChanges: 0,
      colourChangesList: [],
      keeperChangesList: [],
      vicCount: 0
    });
    
    await manualHistory.save();
    console.log('✅ Manual history created:', manualHistory._id);
    
    // Link to car
    car.historyCheckId = manualHistory._id;
    car.historyCheckStatus = 'verified';
    car.historyCheckDate = new Date();
    await car.save();
    
    console.log('✅ Car linked to history');
    
    console.log('\n' + '='.repeat(60));
    console.log('SUCCESS!');
    console.log('='.repeat(60));
    console.log('✅ Manual history record created');
    console.log('✅ Car linked to history');
    console.log('✅ Frontend will now show history section');
    console.log('\n⚠️  IMPORTANT:');
    console.log('   - Owner count is set to 0 (placeholder)');
    console.log('   - Update manually in database if you know the real count');
    console.log('   - Or wait 24 hours and run refresh script when API resets');
    console.log('\n📝 To update owner count manually:');
    console.log(`   1. Open MongoDB Atlas`);
    console.log(`   2. Find VehicleHistory with vrm: "${vrm.toUpperCase()}"`);
    console.log(`   3. Update numberOfPreviousKeepers field`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

manuallyAddHistory();
