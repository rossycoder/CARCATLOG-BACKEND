/**
 * Check Package Names in Database
 * Run this script to see what package names are actually stored
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');

async function checkPackageNames() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get all unique package names
    const cars = await Car.find({ advertStatus: 'active' })
      .select('advertisingPackage.packageName advertisingPackage.packageId sellerContact.type make model')
      .lean();

    console.log('📦 PACKAGE NAMES IN DATABASE:');
    console.log('='.repeat(80));
    
    const packageNames = new Set();
    const packageDetails = [];

    cars.forEach(car => {
      const packageName = car.advertisingPackage?.packageName || 'N/A';
      const packageId = car.advertisingPackage?.packageId || 'N/A';
      const sellerType = car.sellerContact?.type || 'unknown';
      
      packageNames.add(packageName);
      packageDetails.push({
        vehicle: `${car.make} ${car.model}`,
        packageName,
        packageId,
        sellerType
      });
    });

    console.log('\n🏷️  UNIQUE PACKAGE NAMES:');
    packageNames.forEach(name => {
      const count = packageDetails.filter(p => p.packageName === name).length;
      console.log(`   - ${name} (${count} cars)`);
    });

    console.log('\n📋 DETAILED BREAKDOWN:');
    console.log('-'.repeat(80));
    
    // Group by seller type
    const privatePackages = packageDetails.filter(p => p.sellerType === 'private');
    const tradePackages = packageDetails.filter(p => p.sellerType === 'trade');
    const unknownPackages = packageDetails.filter(p => p.sellerType === 'unknown');

    console.log(`\n👤 PRIVATE SELLERS (${privatePackages.length} cars):`);
    const privateNames = new Set(privatePackages.map(p => p.packageName));
    privateNames.forEach(name => {
      const count = privatePackages.filter(p => p.packageName === name).length;
      console.log(`   - ${name}: ${count} cars`);
    });

    console.log(`\n🏢 TRADE DEALERS (${tradePackages.length} cars):`);
    const tradeNames = new Set(tradePackages.map(p => p.packageName));
    tradeNames.forEach(name => {
      const count = tradePackages.filter(p => p.packageName === name).length;
      console.log(`   - ${name}: ${count} cars`);
    });

    if (unknownPackages.length > 0) {
      console.log(`\n❓ UNKNOWN TYPE (${unknownPackages.length} cars):`);
      const unknownNames = new Set(unknownPackages.map(p => p.packageName));
      unknownNames.forEach(name => {
        const count = unknownPackages.filter(p => p.packageName === name).length;
        console.log(`   - ${name}: ${count} cars`);
      });
    }

    console.log('\n📊 SAMPLE DATA (First 10 cars):');
    console.log('-'.repeat(80));
    packageDetails.slice(0, 10).forEach((detail, index) => {
      console.log(`${index + 1}. ${detail.vehicle}`);
      console.log(`   Package Name: ${detail.packageName}`);
      console.log(`   Package ID: ${detail.packageId}`);
      console.log(`   Seller Type: ${detail.sellerType}`);
      console.log();
    });

    console.log('✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
checkPackageNames();
