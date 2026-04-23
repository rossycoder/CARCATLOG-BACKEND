require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const APICallLog = require('../models/APICallLog');

const REG = 'MA57LDL';

async function deleteCarByReg() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Delete all Car records
  const carResult = await Car.deleteMany({ registrationNumber: REG });
  console.log(`🗑️  Cars deleted: ${carResult.deletedCount}`);

  // Delete VehicleHistory
  const histResult = await VehicleHistory.deleteMany({ vrm: REG });
  console.log(`🗑️  VehicleHistory deleted: ${histResult.deletedCount}`);

  // Delete API call logs
  const logResult = await APICallLog.deleteMany({ vrm: REG });
  console.log(`🗑️  APICallLogs deleted: ${logResult.deletedCount}`);

  console.log(`✅ Done — ${REG} fully removed from database`);
  await mongoose.disconnect();
}

deleteCarByReg().catch(console.error);
