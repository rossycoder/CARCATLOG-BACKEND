require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkActiveVehicles() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count total vehicles
    const totalVehicles = await Car.countDocuments();
    console.log(`📊 Total vehicles in database: ${totalVehicles}`);

    // Count by status
    const statuses = await Car.aggregate([
      { $group: { _id: '$advertStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Vehicles by status:');
    statuses.forEach(s => console.log(`   - ${s._id || 'null'}: ${s.count}`));

    // Count active vehicles
    const activeVehicles = await Car.countDocuments({ advertStatus: 'active' });
    console.log(`\n✅ Active vehicles: ${activeVehicles}`);

    if (activeVehicles > 0) {
      // Check filter fields
      console.log('\n🔍 Checking filter fields on active vehicles:');
      
      const makes = await Car.distinct('make', { advertStatus: 'active' });
      console.log(`   - Unique makes: ${makes.filter(Boolean).length}`);
      
      const models = await Car.distinct('model', { advertStatus: 'active' });
      console.log(`   - Unique models: ${models.filter(Boolean).length}`);
      
      const colors = await Car.distinct('color', { advertStatus: 'active' });
      console.log(`   - Unique colors: ${colors.filter(Boolean).length}`);
      
      const fuelTypes = await Car.distinct('fuelType', { advertStatus: 'active' });
      console.log(`   - Unique fuel types: ${fuelTypes.filter(Boolean).length}`);
      
      const transmissions = await Car.distinct('transmission', { advertStatus: 'active' });
      console.log(`   - Unique transmissions: ${transmissions.filter(Boolean).length}`);
      
      const bodyTypes = await Car.distinct('bodyType', { advertStatus: 'active' });
      console.log(`   - Unique body types: ${bodyTypes.filter(Boolean).length}`);

      // Show samples
      if (makes.filter(Boolean).length > 0) {
        console.log(`\n🔍 Sample makes: ${makes.filter(Boolean).slice(0, 5).join(', ')}`);
      }
      if (colors.filter(Boolean).length > 0) {
        console.log(`🔍 Sample colors: ${colors.filter(Boolean).slice(0, 5).join(', ')}`);
      }
    } else {
      console.log('\n⚠️  NO ACTIVE VEHICLES FOUND!');
      console.log('This is why filter options are empty.');
      console.log('\nSuggestion: Run a script to activate some vehicles.');
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkActiveVehicles();
