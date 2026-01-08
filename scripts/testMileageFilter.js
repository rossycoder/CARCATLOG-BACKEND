const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');

async function testMileageFilter() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test 1: Get all active cars
    const allActiveCars = await Car.find({ advertStatus: 'active' });
    console.log('\n=== All Active Cars ===');
    console.log('Total:', allActiveCars.length);
    console.log('Sample mileages:', allActiveCars.slice(0, 10).map(c => ({ 
      id: c._id, 
      make: c.make, 
      model: c.model,
      mileage: c.mileage 
    })));

    // Test 2: Filter by mileage <= 3000
    const lowMileageCars = await Car.find({ 
      advertStatus: 'active',
      mileage: { $lte: 3000 }
    });
    console.log('\n=== Cars with Mileage <= 3000 ===');
    console.log('Total:', lowMileageCars.length);
    console.log('Cars:', lowMileageCars.map(c => ({ 
      id: c._id, 
      make: c.make, 
      model: c.model,
      mileage: c.mileage 
    })));

    // Test 3: Check mileage distribution
    const mileageStats = await Car.aggregate([
      { $match: { advertStatus: 'active' } },
      { 
        $group: { 
          _id: null, 
          minMileage: { $min: '$mileage' }, 
          maxMileage: { $max: '$mileage' },
          avgMileage: { $avg: '$mileage' }
        } 
      }
    ]);
    console.log('\n=== Mileage Statistics ===');
    console.log(mileageStats[0]);

    // Test 4: Count cars in different mileage ranges
    const ranges = [
      { label: '0-3000', min: 0, max: 3000 },
      { label: '3001-10000', min: 3001, max: 10000 },
      { label: '10001-30000', min: 10001, max: 30000 },
      { label: '30001+', min: 30001, max: 999999 }
    ];

    console.log('\n=== Cars by Mileage Range ===');
    for (const range of ranges) {
      const count = await Car.countDocuments({
        advertStatus: 'active',
        mileage: { $gte: range.min, $lte: range.max }
      });
      console.log(`${range.label}: ${count} cars`);
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testMileageFilter();
