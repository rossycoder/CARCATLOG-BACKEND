/**
 * Example: Add New Car with Automatic Setup
 * 
 * This script demonstrates how to add a new car and shows
 * how userId, coordinates, and vehicle history are automatically set
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');
const VehicleHistory = require('../models/VehicleHistory');

async function addCarExample() {
  try {
    console.log('🚗 Example: Adding New Car with Automatic Setup\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get a test user
    const testUser = await User.findOne();
    if (!testUser) {
      console.error('❌ No users found in database. Please create a user first.');
      return;
    }

    console.log('📋 Test User:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   ID: ${testUser._id}\n`);

    // Example 1: Add car with authenticated user
    console.log('Example 1: Add Car with Authenticated User');
    console.log('─'.repeat(50));
    
    const carData1 = {
      // Basic info
      make: 'BMW',
      model: '3 Series',
      variant: '320d M Sport',
      year: 2018,
      price: 18500,
      mileage: 45000,
      color: 'Black',
      transmission: 'automatic',
      fuelType: 'Diesel',
      description: 'Excellent condition, full service history',
      
      // Location
      postcode: 'M1 1AA', // ⬅️ Coordinates will be auto-fetched from this
      
      // Registration
      registrationNumber: 'AB18XYZ',
      
      // User (will be set automatically if authenticated)
      userId: testUser._id, // ⬅️ Set from authenticated user
      
      // Status
      advertStatus: 'active', // ⬅️ Published date will be auto-set
      
      // Other fields
      bodyType: 'Saloon',
      doors: 4,
      seats: 5,
      engineSize: 2.0,
      
      // Seller contact
      sellerContact: {
        type: 'private',
        email: testUser.email, // ⬅️ Can be used to auto-set userId
        phoneNumber: '07700900000',
        allowEmailContact: true
      }
    };

    console.log('Creating car with data:');
    console.log(JSON.stringify(carData1, null, 2));
    console.log('');

    // Create car - pre-save hooks will run automatically
    const car1 = new Car(carData1);
    
    console.log('💾 Saving car... (pre-save hooks will run)');
    await car1.save();
    
    console.log('✅ Car saved!\n');
    
    // Show what was automatically set
    console.log('🎯 Automatically Set Fields:');
    console.log(`   User ID: ${car1.userId} ${car1.userId ? '✅' : '❌'}`);
    console.log(`   Latitude: ${car1.latitude} ${car1.latitude ? '✅' : '❌'}`);
    console.log(`   Longitude: ${car1.longitude} ${car1.longitude ? '✅' : '❌'}`);
    console.log(`   Location (GeoJSON): ${car1.location ? 'Set ✅' : 'Not set ❌'}`);
    console.log(`   Published Date: ${car1.publishedAt} ${car1.publishedAt ? '✅' : '❌'}`);
    console.log('');

    // Now fetch vehicle history (this would normally be done in the controller)
    console.log('🔍 Fetching Vehicle History...');
    try {
      const HistoryService = require('../services/historyService');
      const historyService = new HistoryService();
      
      const historyData = await historyService.checkVehicleHistory(car1.registrationNumber, false);
      
      if (historyData && historyData._id) {
        car1.historyCheckId = historyData._id;
        car1.historyCheckStatus = 'verified';
        car1.historyCheckDate = new Date();
        await car1.save();
        
        console.log('✅ Vehicle History Saved!');
        console.log(`   History ID: ${car1.historyCheckId}`);
        console.log(`   Status: ${car1.historyCheckStatus}`);
        console.log(`   Check Date: ${car1.historyCheckDate}`);
        console.log('');
        
        // Show history details
        const history = await VehicleHistory.findById(car1.historyCheckId);
        if (history) {
          console.log('📊 Vehicle History Details:');
          console.log(`   VRM: ${history.vrm}`);
          console.log(`   Make: ${history.make}`);
          console.log(`   Model: ${history.model}`);
          console.log(`   Previous Owners: ${history.numberOfPreviousKeepers || history.previousOwners || 0}`);
          console.log(`   Has Accident: ${history.hasAccidentHistory}`);
          console.log(`   Is Stolen: ${history.isStolen}`);
          console.log(`   Has Finance: ${history.hasOutstandingFinance}`);
          console.log(`   V5C Certificates: ${history.v5cCertificateCount || 0}`);
          console.log(`   Plate Changes: ${history.plateChanges || 0}`);
          console.log(`   Colour Changes: ${history.colourChanges || 0}`);
        }
      }
    } catch (historyError) {
      console.warn('⚠️  Vehicle history check failed:', historyError.message);
      car1.historyCheckStatus = 'failed';
      await car1.save();
    }
    console.log('');

    // Example 2: Add car with only email (userId will be auto-set)
    console.log('Example 2: Add Car with Email Only (userId auto-set)');
    console.log('─'.repeat(50));
    
    const carData2 = {
      make: 'Audi',
      model: 'A4',
      variant: '2.0 TDI S Line',
      year: 2019,
      price: 22000,
      mileage: 35000,
      color: 'White',
      transmission: 'automatic',
      fuelType: 'Diesel',
      description: 'Low mileage, one owner',
      postcode: 'SW1A 1AA', // ⬅️ Coordinates will be auto-fetched
      registrationNumber: 'CD19ABC',
      advertStatus: 'active',
      bodyType: 'Saloon',
      doors: 4,
      seats: 5,
      engineSize: 2.0,
      
      // Only email provided - userId will be auto-set from this
      sellerContact: {
        type: 'private',
        email: testUser.email, // ⬅️ userId will be auto-set from this email
        phoneNumber: '07700900001',
        allowEmailContact: true
      }
      // Note: No userId field - it will be set automatically!
    };

    console.log('Creating car WITHOUT userId (will be auto-set from email)...');
    const car2 = new Car(carData2);
    await car2.save();
    
    console.log('✅ Car saved!\n');
    console.log('🎯 Automatically Set Fields:');
    console.log(`   User ID: ${car2.userId} ${car2.userId ? '✅ (from email)' : '❌'}`);
    console.log(`   Latitude: ${car2.latitude} ${car2.latitude ? '✅' : '❌'}`);
    console.log(`   Longitude: ${car2.longitude} ${car2.longitude ? '✅' : '❌'}`);
    console.log(`   Published Date: ${car2.publishedAt} ${car2.publishedAt ? '✅' : '❌'}`);
    console.log('');

    // Summary
    console.log('📊 Summary');
    console.log('═'.repeat(50));
    console.log('✅ Created 2 example cars');
    console.log('✅ User IDs automatically set');
    console.log('✅ Coordinates automatically fetched from postcodes');
    console.log('✅ Vehicle history automatically fetched and saved');
    console.log('✅ Published dates automatically set for active cars');
    console.log('');
    console.log('💡 Key Takeaways:');
    console.log('   1. Just provide basic car info + postcode');
    console.log('   2. System automatically sets userId (from auth or email)');
    console.log('   3. System automatically fetches coordinates from postcode');
    console.log('   4. System automatically fetches and saves vehicle history');
    console.log('   5. System automatically sets published date for active cars');
    console.log('');
    console.log('🎉 No manual intervention needed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run example
addCarExample();
