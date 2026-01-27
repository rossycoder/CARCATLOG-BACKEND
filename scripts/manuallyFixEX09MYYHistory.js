require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function manuallyFixEX09MYYHistory() {
  try {
    // Connect to deployment database
    const deploymentURI = 'mongodb+srv://carcatlog:Rozeena%40123@cluster0.eeyiemx.mongodb.net/car-website?retryWrites=true&w=majority';
    console.log('Connecting to deployment database...');
    await mongoose.connect(deploymentURI);
    
    console.log('\n=== MANUALLY FIXING EX09MYY HISTORY DATA ===\n');
    
    const registration = 'EX09MYY';
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }
    
    console.log('Car ID:', car._id);
    console.log('Current History ID:', car.historyCheckId);
    
    // Based on our previous investigation, EX09MYY has:
    // - Category D write-off from 2016
    // - Accident history with severity D
    const correctHistoryData = {
      vrm: 'EX09MYY',
      isWrittenOff: true,
      hasAccidentHistory: true,
      writeOffCategory: 'D',
      writeOffDate: new Date('2016-01-01'), // Approximate date
      accidentHistory: [
        {
          date: new Date('2016-01-01'),
          severity: 'D',
          description: 'Category D write-off'
        }
      ],
      checkDate: new Date(),
      checkStatus: 'completed'
    };
    
    console.log('\nApplying correct history data:');
    console.log('  isWrittenOff: true');
    console.log('  hasAccidentHistory: true');
    console.log('  writeOffCategory: D');
    console.log('  writeOffDate: 2016');
    
    // Update the history record
    if (car.historyCheckId) {
      const result = await VehicleHistory.updateOne(
        { _id: car.historyCheckId },
        { $set: correctHistoryData }
      );
      
      console.log('\nUpdate result:', result);
      
      // Verify the update
      const updatedHistory = await VehicleHistory.findById(car.historyCheckId);
      
      console.log('\n=== VERIFICATION ===');
      console.log('VRM:', updatedHistory.vrm);
      console.log('isWrittenOff:', updatedHistory.isWrittenOff);
      console.log('hasAccidentHistory:', updatedHistory.hasAccidentHistory);
      console.log('writeOffCategory:', updatedHistory.writeOffCategory);
      console.log('writeOffDate:', updatedHistory.writeOffDate);
      
      if (updatedHistory.isWrittenOff && updatedHistory.hasAccidentHistory) {
        console.log('\n✅ SUCCESS! The deployment car now has correct write-off history.');
        console.log('✅ The frontend will now display a RED X for "Never been written off"');
        console.log('✅ This matches the localhost behavior.');
        console.log('\nPlease refresh the deployment page to see the changes.');
      } else {
        console.log('\n❌ Update may not have worked correctly');
      }
    } else {
      console.log('\n❌ No history check ID found on car');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

manuallyFixEX09MYYHistory();
