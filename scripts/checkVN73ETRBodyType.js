require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function checkVN73ETRBodyType() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const registration = 'VN73ETR';
    console.log(`\n🔍 Checking registration: ${registration}`);
    console.log('=====================================');

    // Variables to store API data
    let dvlaData = null;
    let specsData = null;

    // 1. Check if car exists in database
    console.log('\n1️⃣ Checking database...');
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (car) {
      console.log('✅ Car found in database');
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Body Type: "${car.bodyType}"`);
      console.log(`   Fuel Type: "${car.fuelType}"`);
      console.log(`   Transmission: "${car.transmission}"`);
      console.log(`   Year: ${car.year}`);
      console.log(`   Engine Size: ${car.engineSize}`);
      console.log(`   Variant: "${car.variant || 'Not set'}"`);
      console.log(`   Display Title: "${car.displayTitle || 'Not set'}"`);
    } else {
      console.log('❌ Car not found in database');
    }

    // 2. Check API data
    console.log('\n2️⃣ Checking API data...');
    
    try {
      // Check DVLA basic data
      console.log('\n📡 Fetching DVLA data...');
      const dvlaResponse = await CheckCarDetailsClient.getUKVehicleData(registration);
      
      if (dvlaResponse) {
        console.log('✅ DVLA data received:');
        
        // Parse the response to get structured data
        dvlaData = CheckCarDetailsClient.parseResponse(dvlaResponse);
        
        console.log(`   Make: "${dvlaData.make}"`);
        console.log(`   Model: "${dvlaData.model}"`);
        console.log(`   Body Type: "${dvlaData.bodyType}"`);
        console.log(`   Fuel Type: "${dvlaData.fuelType}"`);
        console.log(`   Engine Size: "${dvlaData.engineSize}"`);
        console.log(`   Year: ${dvlaData.year}`);
        console.log(`   Transmission: "${dvlaData.transmission || 'Not provided'}"`);
        console.log(`   Doors: ${dvlaData.doors || 'Not provided'}`);
        console.log(`   Seats: ${dvlaData.seats || 'Not provided'}`);
        console.log(`   Variant: "${dvlaData.variant || 'Not provided'}"`);
      } else {
        console.log('❌ No DVLA data received');
      }
    } catch (dvlaError) {
      console.log('❌ DVLA API error:', dvlaError.message);
    }

    try {
      // Check enhanced vehicle data (specs)
      console.log('\n📡 Fetching vehicle specs data...');
      const specsResponse = await CheckCarDetailsClient.getVehicleSpecs(registration);
      
      if (specsResponse) {
        console.log('✅ Vehicle specs data received:');
        
        // Parse the response to get structured data
        specsData = CheckCarDetailsClient.parseResponse(specsResponse);
        
        console.log(`   Make: "${specsData.make}"`);
        console.log(`   Model: "${specsData.model}"`);
        console.log(`   Variant: "${specsData.variant || 'Not provided'}"`);
        console.log(`   Body Type: "${specsData.bodyType}"`);
        console.log(`   Fuel Type: "${specsData.fuelType}"`);
        console.log(`   Engine Size: "${specsData.engineSize}"`);
        console.log(`   Transmission: "${specsData.transmission || 'Not provided'}"`);
        console.log(`   Doors: ${specsData.doors || 'Not provided'}`);
        console.log(`   Seats: ${specsData.seats || 'Not provided'}`);
      } else {
        console.log('❌ No vehicle specs data received');
      }
    } catch (specsError) {
      console.log('❌ Vehicle specs API error:', specsError.message);
    }

    // 3. Compare data sources
    console.log('\n3️⃣ Data comparison...');
    console.log('=====================================');
    
    if (car && dvlaData) {
      console.log('\n🔍 Database vs DVLA comparison:');
      console.log(`   Body Type: DB="${car.bodyType}" vs DVLA="${dvlaData.bodyType}"`);
      console.log(`   Fuel Type: DB="${car.fuelType}" vs DVLA="${dvlaData.fuelType}"`);
      
      if (car.bodyType !== dvlaData.bodyType) {
        console.log('⚠️  BODY TYPE MISMATCH!');
      } else {
        console.log('✅ Body type matches');
      }
      
      if (car.fuelType !== dvlaData.fuelType) {
        console.log('⚠️  FUEL TYPE MISMATCH!');
      } else {
        console.log('✅ Fuel type matches');
      }
    }
    
    if (dvlaData && specsData) {
      console.log('\n🔍 DVLA vs Specs comparison:');
      console.log(`   Body Type: DVLA="${dvlaData.bodyType}" vs Specs="${specsData.bodyType}"`);
      console.log(`   Fuel Type: DVLA="${dvlaData.fuelType}" vs Specs="${specsData.fuelType}"`);
      
      if (dvlaData.bodyType !== specsData.bodyType) {
        console.log('⚠️  BODY TYPE DIFFERS BETWEEN API ENDPOINTS!');
      } else {
        console.log('✅ Body type consistent across APIs');
      }
    }

    // 4. Check what frontend would display
    console.log('\n4️⃣ Frontend display logic...');
    console.log('=====================================');
    
    if (car) {
      console.log('\n🖥️  What frontend would show:');
      
      // Simulate frontend logic
      let displayBodyType = car.bodyType;
      let displayFuelType = car.fuelType;
      
      // Check if there are any transformations
      if (car.fuelType && car.fuelType.toLowerCase().includes('hybrid')) {
        console.log(`   Original fuel type: "${car.fuelType}"`);
        console.log(`   Contains 'hybrid': YES`);
      }
      
      if (car.bodyType && car.bodyType.toLowerCase().includes('suv')) {
        console.log(`   Original body type: "${car.bodyType}"`);
        console.log(`   Contains 'SUV': YES`);
      }
      
      console.log(`   Frontend would display:`);
      console.log(`     Body Type: "${displayBodyType}"`);
      console.log(`     Fuel Type: "${displayFuelType}"`);
      console.log(`     Make/Model: "${car.make} ${car.model}"`);
      console.log(`     Variant: "${car.variant || 'Not set'}"`);
    }

    // 5. Recommendations
    console.log('\n5️⃣ Analysis & Recommendations...');
    console.log('=====================================');
    
    console.log('\n📋 Summary:');
    if (car && dvlaData) {
      if (car.bodyType === dvlaData.bodyType && car.fuelType === dvlaData.fuelType) {
        console.log('✅ Database data matches DVLA - frontend is showing correct information');
      } else {
        console.log('⚠️  Database data differs from DVLA - may need to update database');
        console.log('\n🔧 Recommended actions:');
        if (car.bodyType !== dvlaData.bodyType) {
          console.log(`   - Update body type from "${car.bodyType}" to "${dvlaData.bodyType}"`);
        }
        if (car.fuelType !== dvlaData.fuelType) {
          console.log(`   - Update fuel type from "${car.fuelType}" to "${dvlaData.fuelType}"`);
        }
      }
    } else if (!car) {
      console.log('ℹ️  Car not in database - would need to be added first');
      if (dvlaData) {
        console.log('\n📊 API shows this vehicle as:');
        console.log(`   Make/Model: ${dvlaData.make} ${dvlaData.model}`);
        console.log(`   Body Type: "${dvlaData.bodyType}"`);
        console.log(`   Fuel Type: "${dvlaData.fuelType}"`);
        console.log(`   Year: ${dvlaData.year}`);
      }
    } else {
      console.log('⚠️  Could not fetch DVLA data for comparison');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

checkVN73ETRBodyType();