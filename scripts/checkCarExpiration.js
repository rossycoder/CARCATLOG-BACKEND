/**
 * Check specific car expiration details
 * Usage: node scripts/checkCarExpiration.js LC65AOV
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');

async function checkCarExpiration(registration) {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find car by registration
    const car = await Car.findOne({ 
      registrationNumber: new RegExp(registration, 'i') 
    }).lean();

    if (!car) {
      console.log(`❌ Car not found with registration: ${registration}`);
      return;
    }

    console.log('🚗 CAR DETAILS:');
    console.log('='.repeat(80));
    console.log(`Make/Model: ${car.make} ${car.model}`);
    console.log(`Year: ${car.year}`);
    console.log(`Registration: ${car.registrationNumber}`);
    console.log(`Advert ID: ${car.advertId}`);
    console.log(`Status: ${car.advertStatus}`);
    console.log('='.repeat(80));
    console.log();

    console.log('👤 SELLER INFORMATION:');
    console.log('-'.repeat(80));
    console.log(`Type: ${car.sellerContact?.type || 'Not set'}`);
    console.log(`Name: ${car.sellerContact?.name || 'N/A'}`);
    console.log(`Email: ${car.sellerContact?.email || 'N/A'}`);
    console.log(`Phone: ${car.sellerContact?.phoneNumber || 'N/A'}`);
    if (car.sellerContact?.businessName) {
      console.log(`Business: ${car.sellerContact.businessName}`);
    }
    console.log();

    console.log('📦 ADVERTISING PACKAGE:');
    console.log('-'.repeat(80));
    if (car.advertisingPackage) {
      console.log(`Package: ${car.advertisingPackage.packageName || car.advertisingPackage.packageId || 'N/A'}`);
      console.log(`Duration: ${car.advertisingPackage.duration || 'N/A'}`);
      console.log(`Price: £${car.advertisingPackage.price || 0}`);
      
      if (car.advertisingPackage.purchaseDate) {
        console.log(`Purchase Date: ${new Date(car.advertisingPackage.purchaseDate).toLocaleString()}`);
      }
      
      if (car.advertisingPackage.expiryDate) {
        const expiryDate = new Date(car.advertisingPackage.expiryDate);
        const now = new Date();
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log(`Expiry Date: ${expiryDate.toLocaleString()}`);
        
        if (diffDays > 0) {
          console.log(`⏰ Status: Expires in ${diffDays} days`);
        } else if (diffDays === 0) {
          console.log(`⏰ Status: Expires today!`);
        } else {
          console.log(`⚠️  Status: OVERDUE by ${Math.abs(diffDays)} days`);
        }
      } else {
        console.log(`Expiry Date: No expiry (unlimited)`);
        console.log(`⏰ Status: Never expires`);
      }
    } else {
      console.log('No advertising package found');
    }
    console.log();

    console.log('📊 EXPIRATION ANALYSIS:');
    console.log('-'.repeat(80));
    
    const sellerType = car.sellerContact?.type;
    const hasExpiryDate = car.advertisingPackage?.expiryDate;
    const isActive = car.advertStatus === 'active';
    
    if (sellerType === 'trade') {
      console.log('✅ TRADE DEALER - Will NOT expire automatically');
      console.log('   Trade dealer listings have unlimited duration');
      if (hasExpiryDate) {
        const expiryDate = new Date(car.advertisingPackage.expiryDate);
        const now = new Date();
        if (expiryDate < now) {
          console.log('   ⚠️  Note: Has expiry date in past, but will not be deleted (trade dealer)');
        }
      }
    } else if (sellerType === 'private' || !sellerType) {
      console.log('👤 PRIVATE SELLER - Will expire automatically');
      
      if (!hasExpiryDate) {
        console.log('   ⚠️  Warning: No expiry date set!');
      } else {
        const expiryDate = new Date(car.advertisingPackage.expiryDate);
        const now = new Date();
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          console.log(`   ⏰ Will expire in ${diffDays} days`);
          console.log(`   📧 Warning email will be sent 3 days before expiry`);
          console.log(`   🗑️  Will be deleted on: ${expiryDate.toLocaleDateString()}`);
        } else {
          console.log(`   ⚠️  OVERDUE by ${Math.abs(diffDays)} days`);
          console.log(`   🗑️  Should have been deleted on: ${expiryDate.toLocaleDateString()}`);
          console.log(`   📧 Expiration email should be sent`);
          console.log(`   ⚡ Will be deleted at next cron run (2:00 AM daily)`);
        }
      }
    }
    console.log();

    console.log('🔧 ADDITIONAL INFO:');
    console.log('-'.repeat(80));
    console.log(`Created: ${new Date(car.createdAt).toLocaleString()}`);
    console.log(`Updated: ${new Date(car.updatedAt).toLocaleString()}`);
    console.log(`Views: ${car.viewCount || 0}`);
    console.log(`Price: £${car.price?.toLocaleString() || 0}`);
    console.log();

    console.log('✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Get registration from command line argument
const registration = process.argv[2];

if (!registration) {
  console.log('Usage: node scripts/checkCarExpiration.js <REGISTRATION>');
  console.log('Example: node scripts/checkCarExpiration.js LC65AOV');
  process.exit(1);
}

// Run the script
checkCarExpiration(registration);
