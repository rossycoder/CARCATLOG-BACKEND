require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const axios = require('axios');

async function fetchMOTData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const advertId = '3655c431-391a-4081-ac9b-b323bded03d5';
    const registration = 'EX09MYY';
    
    // Find the car
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }
    
    console.log(`\n🔍 Fetching MOT data for: ${registration}\n`);
    
    // Fetch MOT data from UK Government MOT History API
    try {
      const response = await axios.get(`https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests`, {
        params: { registration },
        headers: {
          'x-api-key': process.env.MOT_API_KEY || 'YOUR_MOT_API_KEY'
        }
      });
      
      console.log('📋 MOT API Response:');
      console.log(JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.length > 0) {
        const latestMOT = response.data[0];
        
        if (latestMOT.expiryDate) {
          car.motExpiry = new Date(latestMOT.expiryDate);
          car.motDue = new Date(latestMOT.expiryDate);
          car.motStatus = latestMOT.testResult || 'PASSED';
          
          await car.save();
          
          console.log('\n✅ MOT data updated successfully!');
          console.log('  MOT Expiry:', car.motExpiry);
          console.log('  MOT Status:', car.motStatus);
        }
      } else {
        console.log('\n⚠️  No MOT data found for this vehicle');
      }
      
    } catch (apiError) {
      console.log('\n⚠️  MOT API not available or no API key configured');
      console.log('   Error:', apiError.message);
      
      // Set a default MOT expiry date (1 year from registration date)
      const registrationDate = new Date('2009-03-05');
      const motExpiry = new Date(registrationDate);
      motExpiry.setFullYear(motExpiry.getFullYear() + 1);
      
      car.motExpiry = motExpiry;
      car.motDue = motExpiry;
      car.motStatus = 'Unknown';
      
      await car.save();
      
      console.log('\n✅ Set default MOT expiry date');
      console.log('  MOT Expiry:', car.motExpiry);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fetchMOTData();
