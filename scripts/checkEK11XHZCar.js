const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Car = require('../models/Car');

async function checkCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const registration = 'EK11XHZ';
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found with registration:', registration);
      return;
    }

    console.log('🚗 Car Found!');
    console.log('=====================================\n');
    
    // Check all critical fields
    console.log('📋 Basic Info:');
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Year: ${car.year}`);
    console.log(`   Price: £${car.price}`);
    console.log(`   Mileage: ${car.mileage}`);
    
    console.log('\n🔍 Status Checks:');
    console.log(`   advertStatus: ${car.advertStatus} ${car.advertStatus === 'active' ? '✅' : '❌'}`);
    console.log(`   publishedAt: ${car.publishedAt || 'NOT SET'} ${car.publishedAt ? '✅' : '❌'}`);
    
    console.log('\n👤 Seller Info:');
    console.log(`   userId: ${car.userId || 'NOT SET'} ${car.userId ? '✅' : '❌'}`);
    console.log(`   tradeDealerId: ${car.tradeDealerId || 'NOT SET'}`);
    console.log(`   sellerContact.type: ${car.sellerContact?.type || 'NOT SET'}`);
    
    console.log('\n📍 Location:');
    console.log(`   postcode: ${car.postcode || 'NOT SET'} ${car.postcode ? '✅' : '❌'}`);
    console.log(`   latitude: ${car.latitude || 'NOT SET'} ${car.latitude ? '✅' : '❌'}`);
    console.log(`   longitude: ${car.longitude || 'NOT SET'} ${car.longitude ? '✅' : '❌'}`);
    console.log(`   locationName: ${car.locationName || 'NOT SET'}`);
    
    console.log('\n📸 Images:');
    console.log(`   images: ${car.images?.length || 0} photos ${car.images?.length > 0 ? '✅' : '❌ NO PHOTOS!'}`);
    
    console.log('\n📝 Description:');
    console.log(`   description: ${car.description ? car.description.substring(0, 50) + '...' : 'EMPTY ❌'}`);
    
    console.log('\n🔧 Technical:');
    console.log(`   bodyType: ${car.bodyType || 'NOT SET'}`);
    console.log(`   transmission: ${car.transmission || 'NOT SET'}`);
    console.log(`   fuelType: ${car.fuelType || 'NOT SET'}`);
    console.log(`   doors: ${car.doors || 'NOT SET'}`);
    console.log(`   seats: ${car.seats || 'NOT SET'}`);
    console.log(`   engineSize: ${car.engineSize || 'NOT SET'}`);
    console.log(`   engineCapacity: ${car.engineCapacity || 'NOT SET'}`);
    
    console.log('\n📦 Advertising Package:');
    console.log(`   packageId: ${car.advertisingPackage?.packageId || 'NOT SET'}`);
    console.log(`   packageName: ${car.advertisingPackage?.packageName || 'NOT SET'}`);
    console.log(`   expiryDate: ${car.advertisingPackage?.expiryDate || 'NOT SET'}`);
    
    console.log('\n🔍 History Check:');
    console.log(`   historyCheckStatus: ${car.historyCheckStatus || 'NOT SET'}`);
    console.log(`   historyCheckId: ${car.historyCheckId || 'NOT SET'}`);
    console.log(`   writeOffCategory: ${car.writeOffCategory || 'NOT SET'}`);
    
    console.log('\n=====================================');
    console.log('\n❗ ISSUES FOUND:');
    
    const issues = [];
    
    if (car.advertStatus !== 'active') issues.push('❌ Status is not active');
    if (!car.publishedAt) issues.push('❌ No publishedAt date');
    if (!car.userId) issues.push('❌ No userId set');
    if (!car.postcode) issues.push('❌ No postcode');
    if (!car.latitude || !car.longitude) issues.push('❌ No coordinates');
    if (!car.images || car.images.length === 0) issues.push('❌ NO PHOTOS - This is likely why it\'s not showing!');
    if (!car.description || car.description.trim() === '') issues.push('⚠️  No description (optional but recommended)');
    
    if (issues.length === 0) {
      console.log('✅ No critical issues found! Car should be visible.');
    } else {
      issues.forEach(issue => console.log(issue));
    }
    
    console.log('\n=====================================');
    
    // Test if car would appear in search
    console.log('\n🔎 Testing Search Query:');
    const searchQuery = { advertStatus: 'active' };
    const wouldAppear = await Car.countDocuments({ 
      ...searchQuery,
      _id: car._id 
    });
    
    console.log(`   Would appear in search: ${wouldAppear > 0 ? '✅ YES' : '❌ NO'}`);
    
    if (wouldAppear === 0) {
      console.log('\n   Reason: advertStatus is not "active"');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkCar();
