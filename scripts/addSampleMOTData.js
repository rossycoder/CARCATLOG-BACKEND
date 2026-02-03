const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function addSampleMOTData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const vrm = 'EX09MYY';
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: vrm });
    
    if (!car) {
      console.log('❌ Car not found with registration:', vrm);
      process.exit(1);
    }
    
    console.log('🚗 Car:', car.advertId);
    console.log('   Registration:', car.registrationNumber);
    
    // Sample MOT data for a 2009 Honda Civic
    const sampleMOTData = [
      {
        testDate: new Date('2024-10-15'),
        testNumber: '123456789012',
        testResult: 'PASSED',
        expiryDate: new Date('2025-10-14'),
        odometerValue: 85000,
        odometerUnit: 'mi',
        rfrAndComments: [
          {
            type: 'ADVISORY',
            text: 'Nearside front tyre worn close to legal limit (5.2.3 (e))'
          },
          {
            type: 'ADVISORY', 
            text: 'Offside rear brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))'
          }
        ]
      },
      {
        testDate: new Date('2023-10-12'),
        testNumber: '123456789011',
        testResult: 'PASSED',
        expiryDate: new Date('2024-10-11'),
        odometerValue: 82000,
        odometerUnit: 'mi',
        rfrAndComments: [
          {
            type: 'ADVISORY',
            text: 'Offside front tyre worn close to legal limit (5.2.3 (e))'
          }
        ]
      },
      {
        testDate: new Date('2022-10-08'),
        testNumber: '123456789010',
        testResult: 'FAILED',
        expiryDate: null,
        odometerValue: 79000,
        odometerUnit: 'mi',
        rfrAndComments: [
          {
            type: 'FAIL',
            text: 'Nearside headlamp not working (4.1.1 (a) (ii))'
          },
          {
            type: 'ADVISORY',
            text: 'Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))'
          }
        ]
      },
      {
        testDate: new Date('2022-10-10'),
        testNumber: '123456789013',
        testResult: 'PASSED',
        expiryDate: new Date('2023-10-09'),
        odometerValue: 79000,
        odometerUnit: 'mi',
        rfrAndComments: [
          {
            type: 'ADVISORY',
            text: 'Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))'
          }
        ]
      }
    ];
    
    console.log('💾 Adding sample MOT history to car document...');
    car.motHistory = sampleMOTData;
    car.motStatus = 'PASSED';
    car.motExpiry = new Date('2025-10-14');
    car.motDue = new Date('2025-10-14');
    await car.save();
    console.log('✅ MOT history saved to car document');
    
    // Update vehicle history document if it exists
    if (car.historyCheckId) {
      console.log('💾 Updating vehicle history document with MOT data...');
      const vehicleHistory = await VehicleHistory.findById(car.historyCheckId);
      if (vehicleHistory) {
        vehicleHistory.motHistory = sampleMOTData;
        vehicleHistory.motStatus = 'PASSED';
        vehicleHistory.motExpiryDate = new Date('2025-10-14');
        await vehicleHistory.save();
        console.log('✅ MOT history saved to vehicle history document');
      }
    }
    
    console.log('\n🎉 SUCCESS! Sample MOT history added to database');
    console.log('   MOT Tests:', sampleMOTData.length);
    console.log('   Latest MOT:', sampleMOTData[0].testDate);
    console.log('   MOT Status:', 'PASSED');
    console.log('   MOT Expiry:', '2025-10-14');
    
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addSampleMOTData();