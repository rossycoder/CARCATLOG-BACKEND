const mongoose = require('mongoose');
const Bike = require('../models/Bike');
require('dotenv').config();

async function testBikeDetailPageFeatures() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔍 Testing bike detail page features...');
    
    // Get a sample bike
    const bike = await Bike.findOne({ status: 'active' });
    
    if (!bike) {
      console.log('❌ No active bikes found for testing');
      return;
    }
    
    console.log(`\n🏍️  Testing bike: ${bike.make} ${bike.model} (${bike._id})`);
    
    // Test 1: Basic bike data
    console.log('\n📋 Test 1: Basic bike data');
    console.log(`   Make: ${bike.make} ✅`);
    console.log(`   Model: ${bike.model} ✅`);
    console.log(`   Year: ${bike.year} ✅`);
    console.log(`   Price: £${bike.price} ✅`);
    console.log(`   Mileage: ${bike.mileage} miles ✅`);
    
    // Test 2: Running costs data
    console.log('\n💰 Test 2: Running costs data');
    if (bike.runningCosts) {
      console.log(`   Combined MPG: ${bike.runningCosts.fuelEconomy?.combined || 'Not set'}`);
      console.log(`   Urban MPG: ${bike.runningCosts.fuelEconomy?.urban || 'Not set'}`);
      console.log(`   Extra Urban MPG: ${bike.runningCosts.fuelEconomy?.extraUrban || 'Not set'}`);
      console.log(`   Annual Tax: £${bike.runningCosts.annualTax || 'Not set'}`);
      console.log(`   Insurance Group: ${bike.runningCosts.insuranceGroup || 'Not set'}`);
      console.log(`   CO2 Emissions: ${bike.runningCosts.co2Emissions || 'Not set'}g/km`);
      
      const hasRunningCosts = bike.runningCosts.fuelEconomy?.combined || 
                             bike.runningCosts.annualTax || 
                             bike.runningCosts.insuranceGroup || 
                             bike.runningCosts.co2Emissions;
      
      if (hasRunningCosts) {
        console.log('   ✅ Running costs section will display');
      } else {
        console.log('   ⚠️  Running costs section will be hidden (no data)');
      }
    } else {
      console.log('   ❌ No running costs data found');
    }
    
    // Test 3: Features data
    console.log('\n⭐ Test 3: Features data');
    if (bike.features && bike.features.length > 0) {
      console.log(`   Features count: ${bike.features.length}`);
      console.log(`   Features: ${bike.features.slice(0, 3).join(', ')}${bike.features.length > 3 ? '...' : ''}`);
      console.log('   ✅ Features section will display');
    } else {
      console.log('   ⚠️  No features data - features section will be hidden');
    }
    
    // Test 4: Image data
    console.log('\n📷 Test 4: Image data');
    if (bike.images && bike.images.length > 0) {
      console.log(`   Images count: ${bike.images.length}`);
      console.log(`   First image: ${bike.images[0]}`);
      console.log('   ✅ Image gallery will display');
    } else {
      console.log('   ⚠️  No images - will use placeholder');
    }
    
    // Test 5: Location data
    console.log('\n📍 Test 5: Location data');
    console.log(`   Location name: ${bike.locationName || 'Not set'}`);
    console.log(`   Postcode: ${bike.postcode || 'Not set'}`);
    console.log(`   Distance: ${bike.distance ? `${bike.distance} miles` : 'Not calculated'}`);
    
    // Test 6: Seller contact data
    console.log('\n👤 Test 6: Seller contact data');
    if (bike.sellerContact) {
      console.log(`   Type: ${bike.sellerContact.type || 'Not set'}`);
      console.log(`   Phone: ${bike.sellerContact.phoneNumber || 'Not set'}`);
      console.log(`   Email: ${bike.sellerContact.email || 'Not set'}`);
      console.log(`   Business name: ${bike.sellerContact.businessName || 'N/A (private seller)'}`);
    } else {
      console.log('   ❌ No seller contact data');
    }
    
    // Test 7: Vehicle history data
    console.log('\n📋 Test 7: Vehicle history data');
    console.log(`   Registration: ${bike.registrationNumber || 'Not set'}`);
    console.log(`   History check ID: ${bike.historyCheckId || 'Not set'}`);
    console.log(`   History check status: ${bike.historyCheckStatus || 'Not set'}`);
    
    // Test 8: MOT data
    console.log('\n🔍 Test 8: MOT data');
    if (bike.motHistory && bike.motHistory.length > 0) {
      console.log(`   MOT records: ${bike.motHistory.length}`);
      console.log(`   Latest MOT: ${bike.motHistory[0].testDate || 'Not set'}`);
      console.log('   ✅ MOT history section will display');
    } else {
      console.log('   ⚠️  No MOT history data');
    }
    
    // Test 9: Enhanced specifications
    console.log('\n🔧 Test 9: Enhanced specifications');
    console.log(`   Engine CC: ${bike.engineCC || 'Not set'}`);
    console.log(`   Bike type: ${bike.bikeType || 'Not set'}`);
    console.log(`   Fuel type: ${bike.fuelType || 'Not set'}`);
    console.log(`   Transmission: ${bike.transmission || 'Not set'}`);
    console.log(`   Color: ${bike.color || 'Not set'}`);
    console.log(`   Condition: ${bike.condition || 'Not set'}`);
    console.log(`   Emission class: ${bike.emissionClass || 'Not set'}`);
    
    // Summary
    console.log('\n📊 BIKE DETAIL PAGE FEATURE SUMMARY:');
    
    const features = {
      'Basic Info': true,
      'Image Gallery': bike.images && bike.images.length > 0,
      'Running Costs': bike.runningCosts && (bike.runningCosts.fuelEconomy?.combined || bike.runningCosts.annualTax),
      'Features List': bike.features && bike.features.length > 0,
      'Location Data': bike.locationName || bike.postcode,
      'Seller Contact': bike.sellerContact && bike.sellerContact.phoneNumber,
      'Vehicle History': bike.registrationNumber,
      'MOT History': bike.motHistory && bike.motHistory.length > 0,
      'Enhanced Specs': bike.engineCC && bike.bikeType
    };
    
    Object.entries(features).forEach(([feature, hasData]) => {
      console.log(`   ${hasData ? '✅' : '⚠️ '} ${feature}: ${hasData ? 'Available' : 'Missing/Limited'}`);
    });
    
    const availableFeatures = Object.values(features).filter(Boolean).length;
    const totalFeatures = Object.keys(features).length;
    
    console.log(`\n🎯 Feature Completeness: ${availableFeatures}/${totalFeatures} (${Math.round(availableFeatures/totalFeatures*100)}%)`);
    
    if (availableFeatures >= 7) {
      console.log('✅ EXCELLENT: Bike detail page has comprehensive features!');
    } else if (availableFeatures >= 5) {
      console.log('⚠️  GOOD: Most features available, some enhancements needed');
    } else {
      console.log('❌ NEEDS WORK: Many features missing or incomplete');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testBikeDetailPageFeatures();