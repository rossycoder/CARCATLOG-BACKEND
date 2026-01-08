const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Car = require('../models/Car');
const expirationService = require('../services/expirationService');

dotenv.config();

/**
 * Test script for the expiration system
 * Creates test listings with various expiry dates and tests the expiration logic
 */

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestListings() {
  console.log('\n📝 Creating test listings...\n');

  const testListings = [
    {
      name: 'Expired Bronze (1 day ago)',
      data: {
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        price: 15000,
        mileage: 30000,
        color: 'Silver',
        transmission: 'automatic',
        fuelType: 'Petrol',
        description: 'Test listing - expired',
        postcode: 'SW1A 1AA',
        registrationNumber: 'TEST001',
        advertStatus: 'active',
        advertId: `TEST-${Date.now()}-1`,
        sellerContact: {
          type: 'private',
          email: 'test@example.com',
          phoneNumber: '07700900000'
        },
        advertisingPackage: {
          packageId: 'bronze',
          packageName: 'Bronze Package',
          duration: '3 weeks',
          price: 999,
          purchaseDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), // 22 days ago
          expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        }
      }
    },
    {
      name: 'Expiring Soon (2 days)',
      data: {
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        price: 18000,
        mileage: 20000,
        color: 'Blue',
        transmission: 'manual',
        fuelType: 'Petrol',
        description: 'Test listing - expiring soon',
        postcode: 'M1 1AA',
        registrationNumber: 'TEST002',
        advertStatus: 'active',
        advertId: `TEST-${Date.now()}-2`,
        sellerContact: {
          type: 'private',
          email: 'test@example.com',
          phoneNumber: '07700900001'
        },
        advertisingPackage: {
          packageId: 'bronze',
          packageName: 'Bronze Package',
          duration: '3 weeks',
          price: 999,
          purchaseDate: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000), // 19 days ago
          expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
        }
      }
    },
    {
      name: 'Active Silver (20 days left)',
      data: {
        make: 'Ford',
        model: 'Focus',
        year: 2019,
        price: 12000,
        mileage: 45000,
        color: 'Red',
        transmission: 'automatic',
        fuelType: 'Diesel',
        description: 'Test listing - active',
        postcode: 'B1 1AA',
        registrationNumber: 'TEST003',
        advertStatus: 'active',
        advertId: `TEST-${Date.now()}-3`,
        sellerContact: {
          type: 'private',
          email: 'test@example.com',
          phoneNumber: '07700900002'
        },
        advertisingPackage: {
          packageId: 'silver',
          packageName: 'Silver Package',
          duration: '6 weeks',
          price: 1399,
          purchaseDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), // 22 days ago
          expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) // 20 days from now
        }
      }
    },
    {
      name: 'Gold Package (no expiry)',
      data: {
        make: 'BMW',
        model: '3 Series',
        year: 2022,
        price: 28000,
        mileage: 10000,
        color: 'Black',
        transmission: 'automatic',
        fuelType: 'Petrol',
        description: 'Test listing - gold package',
        postcode: 'E1 6AN',
        registrationNumber: 'TEST004',
        advertStatus: 'active',
        advertId: `TEST-${Date.now()}-4`,
        sellerContact: {
          type: 'trade',
          email: 'test@example.com',
          phoneNumber: '07700900003',
          businessName: 'Test Motors'
        },
        advertisingPackage: {
          packageId: 'gold',
          packageName: 'Gold Package',
          duration: 'Until sold',
          price: 1699,
          purchaseDate: new Date(),
          expiryDate: null // Gold packages don't expire
        }
      }
    },
    {
      name: 'Trade Seller - Expired Date (should NOT expire)',
      data: {
        make: 'Mercedes',
        model: 'C-Class',
        year: 2021,
        price: 25000,
        mileage: 15000,
        color: 'White',
        transmission: 'automatic',
        fuelType: 'Diesel',
        description: 'Test listing - trade seller with expired date',
        postcode: 'W1A 1AA',
        registrationNumber: 'TEST005',
        advertStatus: 'active',
        advertId: `TEST-${Date.now()}-5`,
        sellerContact: {
          type: 'trade',
          email: 'test@example.com',
          phoneNumber: '07700900004',
          businessName: 'Premium Motors'
        },
        advertisingPackage: {
          packageId: 'bronze',
          packageName: 'Bronze Package',
          duration: '3 weeks',
          price: 999,
          purchaseDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
          expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago - but trade seller so won't expire
        }
      }
    }
  ];

  const createdListings = [];

  for (const listing of testListings) {
    try {
      const car = new Car(listing.data);
      await car.save();
      createdListings.push(car);
      console.log(`✅ Created: ${listing.name}`);
      console.log(`   ID: ${car._id}`);
      console.log(`   Advert ID: ${car.advertId}`);
      console.log(`   Expiry: ${car.advertisingPackage.expiryDate || 'Never'}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Failed to create ${listing.name}:`, error.message);
    }
  }

  return createdListings;
}

async function testExpirationLogic() {
  console.log('\n🔍 Testing expiration logic...\n');

  try {
    // Test expiration
    console.log('1️⃣ Running expiration check...');
    const expirationResults = await expirationService.expireListings();
    console.log('Results:', expirationResults);
    console.log('');

    // Test warnings
    console.log('2️⃣ Sending expiration warnings (3 days)...');
    const warningResults = await expirationService.sendExpirationWarnings(3);
    console.log('Results:', warningResults);
    console.log('');

    // Get statistics
    console.log('3️⃣ Getting expiration statistics...');
    const stats = await expirationService.getExpirationStats();
    console.log('Statistics:', stats);
    console.log('');

  } catch (error) {
    console.error('❌ Error testing expiration logic:', error);
  }
}

async function cleanupTestListings() {
  console.log('\n🧹 Cleaning up test listings...\n');

  try {
    const result = await Car.deleteMany({
      advertId: { $regex: /^TEST-/ }
    });
    console.log(`✅ Deleted ${result.deletedCount} test listings`);
  } catch (error) {
    console.error('❌ Error cleaning up:', error);
  }
}

async function displayCurrentListings() {
  console.log('\n📋 Current test listings:\n');

  try {
    const listings = await Car.find({
      advertId: { $regex: /^TEST-/ }
    }).select('advertId make model advertStatus advertisingPackage.expiryDate');

    if (listings.length === 0) {
      console.log('No test listings found');
      return;
    }

    listings.forEach(listing => {
      const expiryDate = listing.advertisingPackage?.expiryDate;
      const status = listing.advertStatus;
      const expiryStr = expiryDate 
        ? expiryDate.toLocaleDateString() 
        : 'Never';
      
      console.log(`${listing.advertId}: ${listing.make} ${listing.model}`);
      console.log(`  Status: ${status}`);
      console.log(`  Expires: ${expiryStr}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error displaying listings:', error);
  }
}

async function main() {
  console.log('🚀 Expiration System Test Script\n');
  console.log('================================\n');

  await connectDB();

  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'create':
      await createTestListings();
      await displayCurrentListings();
      break;

    case 'test':
      await testExpirationLogic();
      await displayCurrentListings();
      break;

    case 'cleanup':
      await cleanupTestListings();
      break;

    case 'list':
      await displayCurrentListings();
      break;

    case 'full':
      await createTestListings();
      console.log('\n⏳ Waiting 2 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await testExpirationLogic();
      await displayCurrentListings();
      console.log('\n💡 Run "npm run test:expiration cleanup" to remove test data');
      break;

    case 'help':
    default:
      console.log('Usage: node testExpirationSystem.js [command]\n');
      console.log('Commands:');
      console.log('  create   - Create test listings with various expiry dates');
      console.log('  test     - Run expiration logic on existing listings');
      console.log('  list     - Display current test listings');
      console.log('  cleanup  - Remove all test listings');
      console.log('  full     - Run complete test (create + test + display)');
      console.log('  help     - Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  node backend/scripts/testExpirationSystem.js create');
      console.log('  node backend/scripts/testExpirationSystem.js test');
      console.log('  node backend/scripts/testExpirationSystem.js full');
      console.log('  node backend/scripts/testExpirationSystem.js cleanup');
      break;
  }

  await mongoose.connection.close();
  console.log('\n✅ Done!\n');
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
