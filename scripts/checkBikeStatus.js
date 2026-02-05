/**
 * Check bike status in database to see why it's not showing in listings
 */

const mongoose = require('mongoose');
const Bike = require('../models/Bike');

async function checkBikeStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name');
    console.log('✅ Connected to MongoDB');

    console.log('🏍️ CHECKING BIKE STATUS IN DATABASE');
    console.log('='.repeat(50));

    // Get all bikes (regardless of status)
    const allBikes = await Bike.find({}).sort({ createdAt: -1 }).limit(10);
    
    console.log(`📊 Total bikes found: ${allBikes.length}`);
    console.log('');

    if (allBikes.length === 0) {
      console.log('❌ NO BIKES FOUND IN DATABASE');
      console.log('   - Make sure you have added bikes to the database');
      console.log('   - Check your MongoDB connection');
      return;
    }

    // Check status breakdown
    const statusCounts = await Bike.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('📈 BIKE STATUS BREAKDOWN:');
    statusCounts.forEach(status => {
      console.log(`   ${status._id}: ${status.count} bikes`);
    });
    console.log('');

    // Show recent bikes with their status
    console.log('🔍 RECENT BIKES (Last 10):');
    console.log('-'.repeat(80));
    
    allBikes.forEach((bike, index) => {
      console.log(`${index + 1}. ${bike.make} ${bike.model} (${bike.year})`);
      console.log(`   Status: ${bike.status}`);
      console.log(`   Price: £${bike.price || 'Not set'}`);
      console.log(`   Registration: ${bike.registrationNumber || 'Not set'}`);
      console.log(`   Created: ${bike.createdAt}`);
      console.log(`   ID: ${bike._id}`);
      console.log('');
    });

    // Check specifically for non-active bikes
    const nonActiveBikes = await Bike.find({ status: { $ne: 'active' } }).sort({ createdAt: -1 });
    
    if (nonActiveBikes.length > 0) {
      console.log('⚠️ NON-ACTIVE BIKES (These won\'t show in listings):');
      console.log('-'.repeat(60));
      
      nonActiveBikes.forEach((bike, index) => {
        console.log(`${index + 1}. ${bike.make} ${bike.model} - Status: ${bike.status}`);
        console.log(`   Reason: ${getStatusReason(bike.status)}`);
        console.log(`   ID: ${bike._id}`);
        console.log('');
      });
    }

    // Check for active bikes
    const activeBikes = await Bike.find({ status: 'active' });
    console.log(`✅ ACTIVE BIKES (Showing in listings): ${activeBikes.length}`);
    
    if (activeBikes.length > 0) {
      console.log('These bikes should appear in your listings:');
      activeBikes.forEach((bike, index) => {
        console.log(`   ${index + 1}. ${bike.make} ${bike.model} (${bike.year}) - £${bike.price}`);
      });
    }

    console.log('');
    console.log('🔧 TO FIX BIKE NOT SHOWING:');
    console.log('1. Change bike status to "active"');
    console.log('2. Make sure bike has required fields (price, make, model, year, etc.)');
    console.log('3. Check if bike has valid data');
    console.log('');
    console.log('💡 QUICK FIX COMMAND:');
    console.log('   Use: node backend/scripts/activateBike.js [bikeId]');

  } catch (error) {
    console.error('❌ Error checking bike status:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

function getStatusReason(status) {
  const reasons = {
    'draft': 'Bike is still in draft mode - not published yet',
    'incomplete': 'Bike is missing required information',
    'pending_payment': 'Waiting for payment to be completed',
    'sold': 'Bike has been marked as sold',
    'expired': 'Bike listing has expired',
    'removed': 'Bike has been removed from listings'
  };
  
  return reasons[status] || 'Unknown status';
}

// Run the check
checkBikeStatus();