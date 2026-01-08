const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website';

async function activateVan() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const Van = require('../models/Van');
    
    // Find all vans with pending_payment status and activate them
    const result = await Van.updateMany(
      { status: 'pending_payment' },
      { 
        $set: { 
          status: 'active',
          publishedAt: new Date()
        } 
      }
    );
    
    console.log(`✅ Activated ${result.modifiedCount} van(s)`);
    
    // Show all active vans
    const activeVans = await Van.find({ status: 'active' }).lean();
    console.log(`\n📋 Active vans (${activeVans.length}):`);
    activeVans.forEach(van => {
      console.log(`  - ${van.make} ${van.model} (${van.year}) - £${van.price} - ${van.locationName || van.postcode}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

activateVan();
