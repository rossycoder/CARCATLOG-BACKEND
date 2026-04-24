require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

const REGS = ['LK68AZZ', 'MA57LDL'];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  for (const reg of REGS) {
    const cars = await Car.deleteMany({ registrationNumber: reg });
    const hist = await VehicleHistory.deleteMany({ vrm: reg });
    console.log(`✅ ${reg} — Cars: ${cars.deletedCount}, History: ${hist.deletedCount}`);
  }
  console.log('Done.');
  mongoose.disconnect();
}).catch(console.error);
