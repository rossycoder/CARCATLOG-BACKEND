require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await Car.updateOne(
    { registrationNumber: 'MA57LDL' },
    { $set: { model: 'Fiesta', variant: 'ZETEC CLIMATE' } }
  );
  console.log('Updated:', result.modifiedCount, 'document(s)');

  const car = await Car.findOne({ registrationNumber: 'MA57LDL' }).lean();
  console.log('Now - model:', car.model, '| variant:', car.variant);
  mongoose.disconnect();
});
