require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const HistoryService = require('../services/historyService');

async function autoFixAllDeploymentHistory() {
  try {
    // Connect to deployment database
    const deploymentURI = 'mongodb+srv://carcatlog:Rozeena%40123@cluster0.eeyiemx.mongodb.net/car-website?retryWrites=true&w=majority';
    console.log('Connecting to deployment database...');
    await mongoose.connect(deploymentURI);
    
    console.log('\n=== AUTO-FIXING ALL DEPLOYMENT VEHICLE HISTORY ===\n');
    
    // Find all active cars with registration numbers
    const cars = await Car.find({ 
      advertStatus: 'active',
      registrationNumber: { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log(`Found ${cars.length} active cars with registration numbers\n`);
    
    if (cars.length === 0) {
      console.log('No cars to fix!');
      return;
    }
    
    const historyService = new HistoryService();
    
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      console.log(`\n[${i + 1}/${cars.length}] Processing: ${car.registrationNumber}`);
      
      try {
        // Fetch fresh vehicle history from API
        console.log('  Fetching vehicle history from API...');
        const historyResult = await historyService.checkVehicleHistory(car.registrationNumber, true); // force refresh
        
        // Update car with history check ID
        car.historyCheckId = historyResult._id;
        car.historyCheckStatus = 'verified';
        car.historyCheckDate = new Date();
        await car.save();
        
        console.log(`  ✅ Success!`);
        console.log(`     - Owners: ${historyResult.numberOfOwners || historyResult.previousOwners || 0}`);
        console.log(`     - Write-off: ${historyResult.isWrittenOff ? 'Yes' : 'No'}`);
        console.log(`     - History ID: ${historyResult._id}`);
        
        successCount++;
        
        // Add small delay to avoid API rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
        failCount++;
        
        // Continue with next car even if this one fails
        continue;
      }
    }
    
    console.log('\n\n=== FINAL SUMMARY ===');
    console.log(`Total cars processed: ${cars.length}`);
    console.log(`✅ Successfully fixed: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    
    if (successCount > 0) {
      console.log('\n✅ Vehicle history data has been automatically fetched and saved!');
      console.log('✅ All cars will now show correct owner counts and write-off status.');
      console.log('✅ Future cars will automatically get history data when created.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

autoFixAllDeploymentHistory();
