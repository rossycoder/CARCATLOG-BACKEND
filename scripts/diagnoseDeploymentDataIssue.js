const mongoose = require('mongoose');
require('dotenv').config();
const Car = require('../models/Car');

async function diagnoseDeploymentDataIssue() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database:', process.env.MONGODB_URI.includes('localhost') ? 'LOCAL' : 'PRODUCTION');

    // Find the most recently added car
    const recentCar = await Car.findOne().sort({ createdAt: -1 });
    
    if (!recentCar) {
      console.log('❌ No cars found in database');
      return;
    }

    console.log('\n📊 Most Recent Car Data:');
    console.log('='.repeat(60));
    console.log('ID:', recentCar._id);
    console.log('Registration:', recentCar.registrationNumber);
    console.log('Make:', recentCar.make);
    console.log('Model:', recentCar.model);
    console.log('Variant:', recentCar.variant);
    console.log('Color:', recentCar.color);
    console.log('Year:', recentCar.year);
    console.log('Price:', recentCar.price);
    console.log('Advert Status:', recentCar.advertStatus);
    console.log('Created At:', recentCar.createdAt);
    console.log('Display Title:', recentCar.displayTitle);
    
    console.log('\n🔍 Vehicle History Data:');
    console.log('History Check Status:', recentCar.historyCheckStatus);
    console.log('History Check ID:', recentCar.historyCheckId);
    
    // Check if there's history data
    if (recentCar.historyCheckId) {
      const VehicleHistory = require('../models/VehicleHistory');
      const history = await VehicleHistory.findById(recentCar.historyCheckId);
      
      if (history) {
        console.log('\n📋 Vehicle History Record:');
        console.log('Check Status:', history.checkStatus);
        console.log('Written Off:', history.writtenOff);
        console.log('Stolen:', history.stolen);
        console.log('Scrapped:', history.scrapped);
        console.log('Imported:', history.imported);
        console.log('Exported:', history.exported);
        console.log('Previous Owners:', history.previousOwners);
      } else {
        console.log('⚠️  History record not found');
      }
    }
    
    console.log('\n🔍 Checking for red color cars with "never been written off":');
    const redCars = await Car.find({ 
      color: /red/i,
      advertStatus: 'active'
    }).populate('historyCheckId');
    
    console.log(`Found ${redCars.length} red cars`);
    
    for (const car of redCars) {
      console.log('\n---');
      console.log('Registration:', car.registrationNumber);
      console.log('Make/Model:', `${car.make} ${car.model}`);
      console.log('Color:', car.color);
      console.log('Status:', car.advertStatus);
      console.log('Created:', car.createdAt);
      
      if (car.historyCheckId) {
        console.log('Written Off:', car.historyCheckId.writtenOff ? 'YES' : 'NO');
      } else {
        console.log('⚠️  No history check data');
      }
    }
    
    console.log('\n✅ Diagnosis complete');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

diagnoseDeploymentDataIssue();
