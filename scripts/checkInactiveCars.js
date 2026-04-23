/**
 * Check Inactive Cars
 * Shows all cars that are not active
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');

async function checkInactiveCars() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    console.log('🔍 INACTIVE CARS ANALYSIS');
    console.log('='.repeat(80));

    // Get all inactive cars
    const inactiveCars = await Car.find({
      advertStatus: { $ne: 'active' }
    })
    .select('advertId make model year registrationNumber advertStatus sellerContact createdAt advertisingPackage')
    .lean();

    console.log(`Total Inactive Cars: ${inactiveCars.length}\n`);

    // Group by status
    const byStatus = {};
    inactiveCars.forEach(car => {
      const status = car.advertStatus || 'unknown';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(car);
    });

    // Show breakdown
    console.log('📊 Breakdown by Status:');
    console.log('-'.repeat(80));
    Object.keys(byStatus).forEach(status => {
      console.log(`${status.toUpperCase()}: ${byStatus[status].length} cars`);
    });
    console.log();

    // Show details for each status
    Object.keys(byStatus).forEach(status => {
      console.log(`\n${status.toUpperCase()} CARS (${byStatus[status].length}):`);
      console.log('='.repeat(80));
      
      byStatus[status].forEach((car, index) => {
        console.log(`${index + 1}. ${car.make} ${car.model} (${car.year})`);
        console.log(`   Registration: ${car.registrationNumber}`);
        console.log(`   Advert ID: ${car.advertId}`);
        console.log(`   Status: ${car.advertStatus}`);
        console.log(`   Seller Type: ${car.sellerContact?.type || 'unknown'}`);
        console.log(`   Seller Email: ${car.sellerContact?.email || 'N/A'}`);
        console.log(`   Created: ${new Date(car.createdAt).toLocaleDateString()}`);
        
        if (car.advertisingPackage) {
          console.log(`   Package: ${car.advertisingPackage.packageName || car.advertisingPackage.packageId || 'N/A'}`);
          if (car.advertisingPackage.expiryDate) {
            const expiryDate = new Date(car.advertisingPackage.expiryDate);
            const now = new Date();
            const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            console.log(`   Expiry: ${expiryDate.toLocaleDateString()} (${diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`})`);
          }
        }
        console.log();
      });
    });

    // Private vs Trade breakdown
    console.log('\n📈 INACTIVE CARS BY SELLER TYPE:');
    console.log('='.repeat(80));
    
    const inactivePrivate = inactiveCars.filter(c => c.sellerContact?.type === 'private').length;
    const inactiveTrade = inactiveCars.filter(c => c.sellerContact?.type === 'trade').length;
    const inactiveUnknown = inactiveCars.filter(c => !c.sellerContact?.type || c.sellerContact?.type === null).length;
    
    console.log(`Private Sellers: ${inactivePrivate}`);
    console.log(`Trade Dealers: ${inactiveTrade}`);
    console.log(`Unknown Type: ${inactiveUnknown}`);
    console.log();

    console.log('✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
checkInactiveCars();
