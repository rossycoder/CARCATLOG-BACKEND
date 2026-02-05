/**
 * Comprehensive diagnostic script to find why bikes are not showing in listings
 */

const mongoose = require('mongoose');
const Bike = require('../models/Bike');

async function diagnoseBikeListingIssue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name');
    console.log('✅ Connected to MongoDB');

    console.log('🔍 COMPREHENSIVE BIKE LISTING DIAGNOSIS');
    console.log('='.repeat(60));

    // 1. Check total bikes in database
    const totalBikes = await Bike.countDocuments({});
    console.log(`📊 TOTAL BIKES IN DATABASE: ${totalBikes}`);

    if (totalBikes === 0) {
      console.log('❌ NO BIKES FOUND IN DATABASE!');
      console.log('');
      console.log('🔧 SOLUTIONS:');
      console.log('   1. Add bikes using: node backend/scripts/addTestBikeToDatabase.js');
      console.log('   2. Check if you\'re connected to the correct database');
      console.log('   3. Verify your MongoDB connection string');
      return;
    }

    // 2. Check bikes by status
    console.log('');
    console.log('📈 BIKES BY STATUS:');
    const statusBreakdown = await Bike.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    statusBreakdown.forEach(status => {
      const emoji = status._id === 'active' ? '✅' : '⚠️';
      console.log(`   ${emoji} ${status._id}: ${status.count} bikes`);
    });

    // 3. Check active bikes (these should show in listings)
    const activeBikes = await Bike.find({ status: 'active' }).limit(10);
    console.log('');
    console.log(`🟢 ACTIVE BIKES (Should show in listings): ${activeBikes.length}`);
    
    if (activeBikes.length === 0) {
      console.log('❌ NO ACTIVE BIKES FOUND!');
      console.log('');
      console.log('🔧 QUICK FIX - Activate existing bikes:');
      
      const inactiveBikes = await Bike.find({ status: { $ne: 'active' } }).limit(5);
      if (inactiveBikes.length > 0) {
        console.log('   Found bikes that can be activated:');
        inactiveBikes.forEach((bike, index) => {
          console.log(`   ${index + 1}. ${bike.make} ${bike.model} (Status: ${bike.status})`);
          console.log(`      ID: ${bike._id}`);
        });
        console.log('');
        console.log('   Run this command to activate all bikes:');
        console.log('   > node backend/scripts/activateAllBikes.js');
      }
    } else {
      console.log('   Active bikes found:');
      activeBikes.forEach((bike, index) => {
        console.log(`   ${index + 1}. ${bike.make} ${bike.model} (${bike.year}) - £${bike.price?.toLocaleString() || 'No price'}`);
        console.log(`      ID: ${bike._id}`);
        console.log(`      Registration: ${bike.registrationNumber || 'Not set'}`);
        console.log(`      Location: ${bike.locationName || 'Not set'}`);
        console.log('');
      });
    }

    // 4. Check for missing required fields
    console.log('🔍 CHECKING FOR MISSING REQUIRED FIELDS:');
    const bikesWithIssues = await Bike.find({
      $or: [
        { make: { $exists: false } },
        { make: '' },
        { model: { $exists: false } },
        { model: '' },
        { year: { $exists: false } },
        { year: null },
        { price: { $exists: false } },
        { price: null },
        { price: 0 },
        { mileage: { $exists: false } },
        { mileage: null },
        { color: { $exists: false } },
        { color: '' },
        { fuelType: { $exists: false } },
        { fuelType: '' },
        { engineCC: { $exists: false } },
        { engineCC: null },
        { bikeType: { $exists: false } },
        { bikeType: '' }
      ]
    });

    if (bikesWithIssues.length > 0) {
      console.log(`⚠️ Found ${bikesWithIssues.length} bikes with missing required fields:`);
      bikesWithIssues.forEach((bike, index) => {
        console.log(`   ${index + 1}. ${bike.make || 'NO MAKE'} ${bike.model || 'NO MODEL'} (ID: ${bike._id})`);
        const issues = [];
        if (!bike.make) issues.push('make');
        if (!bike.model) issues.push('model');
        if (!bike.year) issues.push('year');
        if (!bike.price || bike.price === 0) issues.push('price');
        if (!bike.mileage) issues.push('mileage');
        if (!bike.color) issues.push('color');
        if (!bike.fuelType) issues.push('fuelType');
        if (!bike.engineCC) issues.push('engineCC');
        if (!bike.bikeType) issues.push('bikeType');
        console.log(`      Missing: ${issues.join(', ')}`);
      });
    } else {
      console.log('✅ All bikes have required fields');
    }

    // 5. Test API endpoint simulation
    console.log('');
    console.log('🧪 SIMULATING API ENDPOINT QUERY:');
    const apiQuery = { status: 'active' };
    const apiResults = await Bike.find(apiQuery).limit(12).lean();
    console.log(`   Query: ${JSON.stringify(apiQuery)}`);
    console.log(`   Results: ${apiResults.length} bikes`);
    
    if (apiResults.length > 0) {
      console.log('✅ API query would return bikes - frontend should show them');
    } else {
      console.log('❌ API query returns no bikes - this is why frontend is empty');
    }

    // 6. Check recent bikes
    console.log('');
    console.log('📅 MOST RECENT BIKES (Last 5):');
    const recentBikes = await Bike.find({}).sort({ createdAt: -1 }).limit(5);
    recentBikes.forEach((bike, index) => {
      console.log(`   ${index + 1}. ${bike.make} ${bike.model} - Status: ${bike.status}`);
      console.log(`      Created: ${bike.createdAt}`);
      console.log(`      Price: £${bike.price?.toLocaleString() || 'Not set'}`);
    });

    // 7. Summary and recommendations
    console.log('');
    console.log('🎯 DIAGNOSIS SUMMARY:');
    console.log('-'.repeat(40));
    
    if (activeBikes.length > 0) {
      console.log('✅ You have active bikes in database');
      console.log('✅ These should appear in your frontend listings');
      console.log('');
      console.log('🔧 IF BIKES STILL NOT SHOWING:');
      console.log('   1. Check frontend is calling correct API endpoint');
      console.log('   2. Verify backend server is running');
      console.log('   3. Check browser network tab for API errors');
      console.log('   4. Test API directly: GET /api/bikes');
    } else {
      console.log('❌ No active bikes found');
      console.log('');
      console.log('🔧 TO FIX:');
      console.log('   1. Run: node backend/scripts/activateAllBikes.js');
      console.log('   2. Or add new bikes: node backend/scripts/addTestBikeToDatabase.js');
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run diagnosis
diagnoseBikeListingIssue();