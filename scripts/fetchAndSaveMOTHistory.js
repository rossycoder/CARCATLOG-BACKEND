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
    const registration = 'EK11XHZ';
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found with registration:', registration);
      return;
    }

    console.log(`🚗 Car: ${car.advertId}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Payment Status: ${car.advertisingPackage?.packageId ? 'PAID ✅' : 'NOT PAID ❌'}`);

    // Since payment is completed, we should fetch and save MOT history
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
        
        // Update vehicle history document with MOT data
        console.log('💾 Saving MOT history to vehicle history document...');
        
        const vehicleHistory = await VehicleHistory.findById(car.historyCheckId);
        if (vehicleHistory) {
          vehicleHistory.motHistory = motData.motHistory;
          vehicleHistory.motStatus = latestMOT?.testResult || 'Unknown';
          vehicleHistory.motExpiryDate = latestMOT?.expiryDate || null;
          vehicleHistory.updatedAt = new Date();
          
          await vehicleHistory.save();
          console.log('✅ MOT history saved to vehicle history document');
        } else {
          console.log('⚠️ Vehicle history document not found, MOT data only saved to car');
        }
        
        console.log('\n🎉 SUCCESS! MOT history now saved to database');
        console.log(`   Latest MOT: ${latestMOT?.testDate}`);
        console.log(`   MOT Status: ${latestMOT?.testResult}`);
        console.log(`   MOT Expiry: ${latestMOT?.expiryDate}`);
        
      } else {
        console.log('⚠️ No MOT history found for this vehicle');
      }
      
    } catch (apiError) {
      console.error('❌ Error fetching MOT data from API:', apiError.message);
      console.log('💡 This might be due to API limits or vehicle not found in MOT database');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fetchAndSaveMOTHistory();