require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const TradeDealer = require('../models/TradeDealer');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  const dealers = await TradeDealer.find({}).select('_id email businessName status').lean();
  console.log('=== DEALERS ===');
  dealers.forEach(d => console.log(`ID: ${d._id} | ${d.email} | ${d.businessName} | status: ${d.status}`));

  console.log('\n=== ALL CARS ===');
  const allCars = await Car.find({}).select('make model registrationNumber dealerId isDealerListing advertStatus').lean();
  console.log(`Total cars: ${allCars.length}`);
  allCars.forEach(c => console.log(`Reg: ${c.registrationNumber} | dealerId: ${c.dealerId || 'NONE'} | isDealerListing: ${c.isDealerListing} | status: ${c.advertStatus}`));

  await mongoose.disconnect();
}

check().catch(console.error);
