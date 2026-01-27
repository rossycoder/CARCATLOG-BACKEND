require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function forceFixDeploymentCar() {
  try {
    // Connect to deployment database
    const deploymentURI = 'mongodb+srv://carcatlog:Rozeena%40123@cluster0.eeyiemx.mongodb.net/car-website?retryWrites=true&w=majority';
    console.log('Connecting to deployment database...');
    await mongoose.connect(deploymentURI);
    
    const carId = '6976622476505e4661921032';
    const registration = 'EX09MYY';
    
    console.log('\n=== FORCE FIXING DEPLOYMENT CAR ===');
    console.log('Car ID:', carId);
    console.log('Registration:', registration);
    
    // Use direct MongoDB update to bypass schema
    const carResult = await Car.updateOne(
      { _id: carId },
      { $set: { registration: registration } }
    );
    
    console.log('\nCar update result:', carResult);
    
    // Get the car to find history ID
    const car = await Car.findById(carId);
    console.log('Car historyCheckId:', car.historyCheckId);
    
    if (car.historyCheckId) {
      // Update history record
      const historyResult = await VehicleHistory.updateOne(
        { _id: car.historyCheckId },
        { $set: { registration: registration } }
      );
      
      console.log('History update result:', historyResult);
    }
    
    // Now fetch fresh history data from API for this registration
    console.log('\n=== FETCHING FRESH HISTORY DATA ===');
    const HistoryAPIClient = require('../clients/HistoryAPIClient');
    const historyClient = new HistoryAPIClient();
    
    try {
      const freshHistoryData = await historyClient.getVehicleHistory(registration);
      console.log('\nFresh history data received:');
      console.log('isWrittenOff:', freshHistoryData.isWrittenOff);
      console.log('hasAccidentHistory:', freshHistoryData.hasAccidentHistory);
      console.log('writeOffCategory:', freshHistoryData.writeOffCategory);
      
      // Update the history record with fresh data
      if (car.historyCheckId) {
        const updateResult = await VehicleHistory.updateOne(
          { _id: car.historyCheckId },
          { 
            $set: {
              registration: registration,
              isWrittenOff: freshHistoryData.isWrittenOff,
              hasAccidentHistory: freshHistoryData.hasAccidentHistory,
              writeOffCategory: freshHistoryData.writeOffCategory,
              writeOffDate: freshHistoryData.writeOffDate,
              accidentHistory: freshHistoryData.accidentHistory
            }
          }
        );
        console.log('\n✅ History record updated with fresh data:', updateResult);
      }
      
    } catch (apiError) {
      console.error('API Error:', apiError.message);
    }
    
    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    const finalCar = await Car.findById(carId);
    console.log('Car registration:', finalCar.registration);
    
    if (finalCar.historyCheckId) {
      const finalHistory = await VehicleHistory.findById(finalCar.historyCheckId);
      console.log('History registration:', finalHistory.registration);
      console.log('History isWrittenOff:', finalHistory.isWrittenOff);
      console.log('History hasAccidentHistory:', finalHistory.hasAccidentHistory);
      console.log('History writeOffCategory:', finalHistory.writeOffCategory);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

forceFixDeploymentCar();
