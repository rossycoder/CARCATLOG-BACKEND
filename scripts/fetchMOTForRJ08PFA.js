require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function fetchAndSaveMOTHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the car
    const registration = 'RJ08PFA';
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found with registration:', registration);
      return;
    }

    console.log(`🚗 Car: ${car.advertId}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Current MOT History Count: ${car.motHistory ? car.motHistory.length : 0}`);

    // Fetch MOT history from API
    console.log('\n🔍 Fetching MOT history from API...');
    
    try {
      const motData = await CheckCarDetailsClient.getMOTHistory(registration);
      console.log('✅ MOT data fetched from API');
      console.log(`   Found ${motData?.motHistory?.length || 0} MOT records`);
      
      if (motData && motData.motHistory && motData.motHistory.length > 0) {
        // Update car document with MOT history
        console.log('💾 Saving MOT history to car document...');
        
        const latestMOT = motData.motHistory[0];
        const updateData = {
          motHistory: motData.motHistory,
          motStatus: latestMOT?.testResult || 'Unknown',
          motExpiry: latestMOT?.expiryDate || null,
          motDue: latestMOT?.expiryDate || null,
          updatedAt: new Date()
        };
        
        await Car.findByIdAndUpdate(car._id, updateData);
        console.log('✅ MOT history saved to car document');
        
        // Update vehicle history document with MOT data if it exists
        if (car.historyCheckId) {
          console.log('💾 Updating vehicle history document with MOT data...');
          
          const vehicleHistory = await VehicleHistory.findById(car.historyCheckId);
          if (vehicleHistory) {
            vehicleHistory.motHistory = motData.motHistory;
            vehicleHistory.motStatus = latestMOT?.testResult || 'Unknown';
            vehicleHistory.motExpiry = latestMOT?.expiryDate || null;
            vehicleHistory.updatedAt = new Date();
            
            await vehicleHistory.save();
            console.log('✅ MOT history saved to vehicle history document');
          }
        }
        
        console.log('\n🎉 SUCCESS! MOT history now saved to database');
        console.log(`   Latest MOT: ${latestMOT?.testDate}`);
        console.log(`   MOT Status: ${latestMOT?.testResult}`);
        console.log(`   MOT Expiry: ${latestMOT?.expiryDate}`);
        
      } else {
        console.log('⚠️  No MOT history found for this vehicle');
      }
      
    } catch (apiError) {
      console.error('❌ Error fetching MOT data from API:', apiError.message);
      
      if (apiError.message.includes('daily limit')) {
        console.log('⏰ API daily limit exceeded - MOT history will be fetched later');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

fetchAndSaveMOTHistory();