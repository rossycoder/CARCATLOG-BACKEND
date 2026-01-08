/**
 * Activate all incomplete cars in production database
 * This script connects to MongoDB Atlas and sets advertStatus to 'active'
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function activateProductionCars() {
  try {
    // Use MongoDB Atlas connection
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    console.log('URI:', mongoUri.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB Atlas\n');
    
    // Find all cars with incomplete status
    const incompleteCars = await Car.find({ advertStatus: 'incomplete' });
    console.log(`Found ${incompleteCars.length} cars with 'incomplete' status\n`);
    
    if (incompleteCars.length === 0) {
      console.log('No cars to activate');
      return;
    }
    
    // Show details of cars to be activated
    console.log('Cars to be activated:');
    incompleteCars.forEach((car, index) => {
      console.log(`${index + 1}. ${car.year} ${car.make} ${car.model} - ${car.registrationNumber}`);
      console.log(`   Status: ${car.advertStatus} → active`);
      console.log(`   ID: ${car._id}\n`);
    });
    
    // Update all to active
    const result = await Car.updateMany(
      { advertStatus: 'incomplete' },
      { $set: { advertStatus: 'active' } }
    );
    
    console.log(`✓ Successfully activated ${result.modifiedCount} cars!\n`);
    
    // Verify the update
    const activeCars = await Car.countDocuments({ advertStatus: 'active' });
    console.log(`Total active cars now: ${activeCars}`);
    
    // Show filter options that will now be available
    const makes = await Car.distinct('make', { advertStatus: 'active' });
    const models = await Car.distinct('model', { advertStatus: 'active' });
    const colors = await Car.distinct('color', { advertStatus: 'active' });
    
    console.log('\n--- Filter Options Now Available ---');
    console.log(`Makes: ${makes.length} (${makes.join(', ')})`);
    console.log(`Models: ${models.length} (${models.slice(0, 5).join(', ')}${models.length > 5 ? '...' : ''})`);
    console.log(`Colors: ${colors.length} (${colors.join(', ')})`);
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ MongoDB connection closed');
  }
}

// Run the script
activateProductionCars().then(() => {
  console.log('\n=== Script Complete ===');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
