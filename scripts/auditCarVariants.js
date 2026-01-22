require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function auditCarVariants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const totalCars = await Car.countDocuments();
    const carsWithVariant = await Car.countDocuments({
      submodel: { $exists: true, $ne: null, $ne: '' }
    });
    const carsWithoutVariant = totalCars - carsWithVariant;

    console.log('='.repeat(60));
    console.log('CAR VARIANT AUDIT REPORT');
    console.log('='.repeat(60));
    console.log(`Total cars in database: ${totalCars}`);
    console.log(`Cars WITH model variant: ${carsWithVariant} (${((carsWithVariant/totalCars)*100).toFixed(1)}%)`);
    console.log(`Cars WITHOUT model variant: ${carsWithoutVariant} (${((carsWithoutVariant/totalCars)*100).toFixed(1)}%)`);
    console.log('='.repeat(60));

    // Sample cars without variants
    console.log('\nSample cars WITHOUT model variant (first 10):');
    console.log('-'.repeat(60));
    const samplesWithout = await Car.find({
      $or: [
        { submodel: { $exists: false } },
        { submodel: null },
        { submodel: '' }
      ]
    }).limit(10);

    samplesWithout.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   ID: ${car._id}`);
      console.log('');
    });

    // Sample cars with variants
    console.log('\nSample cars WITH model variant (first 10):');
    console.log('-'.repeat(60));
    const samplesWith = await Car.find({
      submodel: { $exists: true, $ne: null, $ne: '' }
    }).limit(10);

    samplesWith.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model}`);
      console.log(`   Variant: ${car.submodel}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log('');
    });

    // Group by make
    console.log('\nBreakdown by Make:');
    console.log('-'.repeat(60));
    const makeBreakdown = await Car.aggregate([
      {
        $group: {
          _id: '$make',
          total: { $sum: 1 },
          withVariant: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ['$submodel', null] },
                  { $ne: ['$submodel', ''] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    makeBreakdown.forEach(make => {
      const percentage = ((make.withVariant / make.total) * 100).toFixed(1);
      console.log(`${make._id}: ${make.withVariant}/${make.total} (${percentage}%)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

auditCarVariants();
