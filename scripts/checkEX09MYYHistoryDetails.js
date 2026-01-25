require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function checkHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const histories = await VehicleHistory.find({ vrm: 'EX09MYY' });
    
    console.log(`Found ${histories.length} history record(s) for EX09MYY\n`);
    
    for (const history of histories) {
      console.log('='.repeat(60));
      console.log('History ID:', history._id);
      console.log('VRM:', history.vrm);
      console.log('Created:', history.createdAt);
      console.log('\n--- FULL RECORD ---');
      console.log(JSON.stringify(history.toObject(), null, 2));
      console.log('='.repeat(60) + '\n');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkHistory();
