/**
 * Test: Verify write-off category is automatically saved when adding new registration
 * This simulates the complete flow when a user adds a new vehicle
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');
const VehicleHistory = require('./models/VehicleHistory');

async function testNewRegistrationFlow() {
  console.log('='.repeat(70));
  console.log('TEST: Write-off Category Auto-Save on New Registration');
  console.log('='.repeat(70));
  console.log();

  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autotrader');
    console.log('✅ Connected');
    console.log();

    // Clean up any existing test data
    console.log('Cleaning up existing test data...');
    await Car.deleteMany({ registrationNumber: 'TEST456' });
    await VehicleHistory.deleteMany({ vrm: 'TEST456' });
    console.log('✅ Cleanup complete');
    console.log();

    // Create a new car with registration number
    console.log('Creating new car with registration TEST456...');
    console.log('Note: This will trigger automatic history check via pre-save hook');
    console.log();

    const newCar = new Car({
      registrationNumber: 'TEST456',
      make: 'VOLKSWAGEN',
      model: 'GOLF',
      year: 2018,
      mileage: 45000,
      price: 12000,
      fuelType: 'Petrol',
      transmission: 'manual',
      color: 'Blue',
      description: 'Test vehicle for write-off category verification',
      postcode: 'SW1A 1AA',
      condition: 'used',
      vehicleType: 'car',
      advertStatus: 'draft',
      historyCheckStatus: 'pending', // This triggers the history check
      userId: new mongoose.Types.ObjectId(),
      dataSource: 'manual'
    });

    console.log('Saving car (this will trigger history check)...');
    console.log('⏳ Please wait...');
    console.log();

    try {
      await newCar.save();
      console.log('✅ Car saved successfully');
      console.log();

      // Check if history was created
      if (newCar.historyCheckId) {
        console.log('✅ History check was performed');
        console.log(`   History ID: ${newCar.historyCheckId}`);
        console.log(`   Status: ${newCar.historyCheckStatus}`);
        console.log();

        // Retrieve the history record
        const history = await VehicleHistory.findById(newCar.historyCheckId);
        
        if (history) {
          console.log('Vehicle History Data:');
          console.log('='.repeat(70));
          console.log(`VRM: ${history.vrm}`);
          console.log(`Make/Model: ${history.make} ${history.model}`);
          console.log(`Is Written Off: ${history.isWrittenOff}`);
          console.log(`Write-Off Category: ${history.writeOffCategory}`);
          console.log(`Write-Off Details:`, JSON.stringify(history.writeOffDetails, null, 2));
          console.log(`Accident Details:`, JSON.stringify(history.accidentDetails, null, 2));
          console.log(`Previous Keepers: ${history.numberOfPreviousKeepers}`);
          console.log(`Check Status: ${history.checkStatus}`);
          console.log(`API Provider: ${history.apiProvider}`);
          console.log('='.repeat(70));
          console.log();

          // Verify write-off category is saved
          if (history.writeOffCategory && history.writeOffCategory !== 'none') {
            console.log(`🎉 SUCCESS: Write-off category "${history.writeOffCategory}" automatically saved!`);
          } else {
            console.log('ℹ️  No write-off detected for this vehicle (category: none)');
          }
        } else {
          console.log('⚠️  History record not found');
        }
      } else {
        console.log('⚠️  History check was not performed');
        console.log(`   Status: ${newCar.historyCheckStatus}`);
        console.log('   This might be due to:');
        console.log('   - API daily limit reached');
        console.log('   - API key not configured');
        console.log('   - Network error');
      }
    } catch (saveError) {
      console.error('❌ Error saving car:', saveError.message);
      
      if (saveError.message.includes('daily limit')) {
        console.log();
        console.log('ℹ️  API daily limit reached. The history check will be retried later.');
        console.log('   Write-off category will be saved when API limit resets.');
      }
    }

    console.log();
    console.log('Cleaning up test data...');
    await Car.deleteMany({ registrationNumber: 'TEST456' });
    await VehicleHistory.deleteMany({ vrm: 'TEST456' });
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log();
    console.log('Database connection closed');
  }
}

console.log();
console.log('IMPORTANT: This test requires:');
console.log('1. MongoDB running');
console.log('2. CHECKCARD_API_KEY configured in .env');
console.log('3. API daily limit not exceeded');
console.log();
console.log('Starting test in 2 seconds...');
console.log();

setTimeout(() => {
  testNewRegistrationFlow();
}, 2000);
