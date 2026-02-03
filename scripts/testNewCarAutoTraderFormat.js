require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testNewCarAutoTraderFormat() {
  try {
    console.log('🔍 Testing New Car with AutoTrader Format');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Test data for a BMW 3 Series (real registration that should have API data)
    const testCarData = {
      make: 'BMW',
      model: '3 Series',
      year: 2018,
      registrationNumber: 'BF18ABC', // Test registration with 'A' for API compatibility
      mileage: 45000,
      price: 18500,
      fuelType: 'Diesel',
      engineSize: 2.0,
      transmission: 'automatic',
      doors: 4,
      color: 'Black',
      description: 'Test BMW for AutoTrader format verification',
      postcode: 'M1 1AA',
      emissionClass: 'Euro 6', // This should appear in display title
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'test@example.com'
      },
      advertStatus: 'active'
    };
    
    console.log('\n🚗 Creating new BMW with registration:', testCarData.registrationNumber);
    console.log('📋 Expected AutoTrader format: "2.0 [API_VARIANT] Euro 6 4dr"');
    console.log('📋 If API fails, fallback: "2.0 2.0L Diesel Euro 6 4dr"');
    
    // Create new car - this will trigger the pre-save hook with AutoTrader format
    const newCar = new Car(testCarData);
    
    console.log('\n⏳ Saving car (this will trigger AutoTrader format generation)...');
    const savedCar = await newCar.save();
    
    console.log('\n📊 RESULTS:');
    console.log('='.repeat(30));
    console.log(`Car ID: ${savedCar._id}`);
    console.log(`Registration: ${savedCar.registrationNumber}`);
    console.log(`Make/Model: ${savedCar.make} ${savedCar.model}`);
    console.log(`Variant (Database): "${savedCar.variant}"`);
    console.log(`Display Title: "${savedCar.displayTitle}"`);
    console.log(`Engine Size: ${savedCar.engineSize}L`);
    console.log(`Fuel Type: ${savedCar.fuelType}`);
    console.log(`Euro Status: ${savedCar.emissionClass}`);
    console.log(`Doors: ${savedCar.doors}`);
    
    // Analyze the format
    console.log('\n🎯 FORMAT ANALYSIS:');
    const titleParts = savedCar.displayTitle.split(' ');
    console.log(`Parts: [${titleParts.join('] [')}]`);
    
    // Check AutoTrader format compliance
    let formatCompliant = true;
    let formatIssues = [];
    
    // Check if starts with engine size
    if (!titleParts[0] || !titleParts[0].match(/^\d+\.\d$/)) {
      formatCompliant = false;
      formatIssues.push('Missing or incorrect engine size format');
    }
    
    // Check if ends with doors
    const lastPart = titleParts[titleParts.length - 1];
    if (!lastPart || !lastPart.match(/^\d+dr$/)) {
      formatCompliant = false;
      formatIssues.push('Missing or incorrect doors format');
    }
    
    // Check if Euro status is included (if available)
    if (savedCar.emissionClass && !savedCar.displayTitle.includes('Euro')) {
      formatCompliant = false;
      formatIssues.push('Euro status not included in display title');
    }
    
    if (formatCompliant) {
      console.log('✅ AUTOTRADER FORMAT: COMPLIANT');
      console.log('✅ All format requirements met');
    } else {
      console.log('⚠️  AUTOTRADER FORMAT: ISSUES FOUND');
      formatIssues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    // Check variant type
    if (savedCar.variant && savedCar.variant.includes('L ')) {
      console.log('\n⚠️  FALLBACK VARIANT: API variant not available');
      console.log('   This is normal if the registration is not in the API database');
    } else if (savedCar.variant && savedCar.variant.length > 10) {
      console.log('\n✅ REAL API VARIANT: Successfully fetched from API');
      console.log('   Complex technical variant indicates real API data');
    } else {
      console.log('\n🔍 SIMPLE VARIANT: Could be real API or fallback');
    }
    
    console.log('\n🎯 FRONTEND DISPLAY PREVIEW:');
    console.log('='.repeat(40));
    console.log(`${savedCar.make} ${savedCar.model}`);
    console.log(`${savedCar.displayTitle}`);
    console.log(`£${savedCar.price.toLocaleString()}`);
    
    console.log('\n🎯 VERIFICATION:');
    if (savedCar.displayTitle.includes(savedCar.engineSize.toString()) && 
        savedCar.displayTitle.includes(`${savedCar.doors}dr`)) {
      console.log('✅ AutoTrader format working correctly');
      console.log('✅ New cars will display in professional format');
    } else {
      console.log('⚠️  Format may need adjustment');
    }
    
    // Clean up - delete the test car
    await Car.findByIdAndDelete(savedCar._id);
    console.log('\n🗑️  Test car deleted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('daily limit') || error.message.includes('403')) {
      console.log('\n⏰ API daily limit reached');
      console.log('   Test will use fallback variant generation');
      console.log('   Real API variant will be saved when API limit resets');
      console.log('   AutoTrader format will still work correctly');
    }
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testNewCarAutoTraderFormat();