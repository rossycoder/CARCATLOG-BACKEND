require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const cars = await Car.find({ model: { $exists: true }, variant: { $exists: true, $ne: null } }).lean();
  let fixed = 0;

  for (const car of cars) {
    if (!car.model || !car.variant) continue;
    const modelUpper = car.model.toUpperCase().trim();
    const variantUpper = car.variant.toUpperCase().trim();

    // If model starts with variant + space, they are swapped
    if (modelUpper.startsWith(variantUpper + ' ')) {
      const trueVariant = car.model.substring(car.variant.length).trim();
      await Car.updateOne(
        { _id: car._id },
        { $set: { model: car.variant, variant: trueVariant } }
      );
      console.log(`✅ Fixed [${car.registrationNumber}]: model="${car.variant}" | variant="${trueVariant}"`);
      fixed++;
    }
  }

  console.log(`\nTotal fixed: ${fixed} car(s)`);
  mongoose.disconnect();
}).catch(console.error);
