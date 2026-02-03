const mongoose = require('mongoose');
const Car = require('../models/Car');

async function addSampleMOTDataForNewCar() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const carId = '6982517dd49cfacb5f246ff8';
    const vrm = 'EX09MYY';
    
    console.log('\n🚗 ADDING MOT HISTORY TO NEW CAR');
    console.log('=================================');
    
    // Find the new car
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }
    
    console.log('🚗 Car Found:');
    console.log('   ID:', car._id);
    console.log('   Make/Model:', car.make, car.model);
    console.log('   Registration:', car.registrationNumber);
    console.log('   Current MOT History Count:', car.motHistory ? car.motHistory.length : 0);
    
    // Sample MOT data for EX09MYY (2009 Honda Civic)
    const sampleMOTData = [
      {
        testDate: new Date('2024-10-15'),
        testNumber: '123456789012',
        testResult: 'PASSED',
        expiryDate: new Date('2025-10-14'),
        odometerValue: 85000,
        odometerUnit: 'mi',
        defects: [
          {
            type: 'ADVISORY',
            text: 'Nearside front tyre worn close to legal limit (5.2.3 (e))',
            dangerous: false
          },
          {
            type: 'ADVISORY', 
            text: 'Offside rear brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))',
            dangerous: false
          }
        ],
        advisoryText: [
          'Nearside front tyre worn close to legal limit (5.2.3 (e))',
          'Offside rear brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))'
        ],
        testClass: '4',
        testType: 'Normal Test',
        completedDate: new Date('2024-10-15'),
        testStation: {
          name: 'Test Station Name',
          number: '12345',
          address: '123 Test Street',
          postcode: 'TE5T 1NG'
        }
      },
      {
        testDate: new Date('2023-10-12'),
        testNumber: '123456789011',
        testResult: 'PASSED',
        expiryDate: new Date('2024-10-11'),
        odometerValue: 82000,
        odometerUnit: 'mi',
        defects: [
          {
            type: 'ADVISORY',
            text: 'Offside front tyre worn close to legal limit (5.2.3 (e))',
            dangerous: false
          }
        ],
        advisoryText: [
          'Offside front tyre worn close to legal limit (5.2.3 (e))'
        ],
        testClass: '4',
        testType: 'Normal Test',
        completedDate: new Date('2023-10-12'),
        testStation: {
          name: 'Test Station Name',
          number: '12345',
          address: '123 Test Street',
          postcode: 'TE5T 1NG'
        }
      },
      {
        testDate: new Date('2022-10-08'),
        testNumber: '123456789010',
        testResult: 'FAILED',
        expiryDate: null,
        odometerValue: 79000,
        odometerUnit: 'mi',
        defects: [
          {
            type: 'FAIL',
            text: 'Nearside headlamp not working (4.1.1 (a) (ii))',
            dangerous: false
          },
          {
            type: 'ADVISORY',
            text: 'Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))',
            dangerous: false
          }
        ],
        advisoryText: [
          'Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))'
        ],
        testClass: '4',
        testType: 'Normal Test',
        completedDate: new Date('2022-10-08'),
        testStation: {
          name: 'Test Station Name',
          number: '12345',
          address: '123 Test Street',
          postcode: 'TE5T 1NG'
        }
      },
      {
        testDate: new Date('2022-10-10'),
        testNumber: '123456789013',
        testResult: 'PASSED',
        expiryDate: new Date('2023-10-09'),
        odometerValue: 79000,
        odometerUnit: 'mi',
        defects: [
          {
            type: 'ADVISORY',
            text: 'Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))',
            dangerous: false
          }
        ],
        advisoryText: [
          'Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))'
        ],
        testClass: '4',
        testType: 'Normal Test',
        completedDate: new Date('2022-10-10'),
        testStation: {
          name: 'Test Station Name',
          number: '12345',
          address: '123 Test Street',
          postcode: 'TE5T 1NG'
        }
      }
    ];
    
    console.log('\n💾 Adding sample MOT history to car...');
    
    // Update the car with MOT history
    car.motHistory = sampleMOTData;
    car.motStatus = 'Valid'; // Latest test passed
    car.motExpiry = new Date('2025-10-14');
    car.motDue = new Date('2025-10-14');
    
    await car.save();
    
    console.log('✅ MOT history added successfully!');
    console.log('   MOT Tests:', sampleMOTData.length);
    console.log('   Latest Test:', sampleMOTData[0].testDate.toDateString());
    console.log('   Test Result:', sampleMOTData[0].testResult);
    console.log('   MOT Status:', car.motStatus);
    console.log('   MOT Expiry:', car.motExpiry.toDateString());
    
    console.log('\n🎉 SUCCESS! New car now has MOT history');
    console.log('   Car ID:', car._id);
    console.log('   Registration:', car.registrationNumber);
    console.log('   Make/Model:', car.make, car.model);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addSampleMOTDataForNewCar();