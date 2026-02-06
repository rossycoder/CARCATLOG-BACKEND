require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function fixAllIncompleteCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Finding all cars with incomplete data...');
    
    // Find all cars
    const cars = await Car.find({}).populate('historyCheckId').lean();
    console.log(`📊 Total cars in database: ${cars.length}`);
    
    const incompleteCars = [];
    
    for (const car of cars) {
      const issues = [];
      
      // Check for missing or generic variant
      if (!car.variant || car.variant === 'null' || car.variant === 'undefined' || 
          car.variant.match(/^\d+(\.\d+)?L?\s*(Diesel|Petrol|Electric)$/i)) {
        issues.push('variant');
      }
      
      // Check for missing doors
      if (!car.doors || car.doors === null || car.doors === undefined) {
        issues.push('doors');
      }
      
      // Check for missing seats
      if (!car.seats || car.seats === null || car.seats === undefined) {
        issues.push('seats');
      }
      
      // Check for missing body type
      if (!car.bodyType || car.bodyType === 'null' || car.bodyType === 'undefined' || car.bodyType === 'Unknown') {
        issues.push('bodyType');
      }
      
      // Check for missing transmission
      if (!car.transmission || car.transmission === 'null' || car.transmission === 'Unknown') {
        issues.push('transmission');
      }
      
      // Check for missing color
      if (!car.color || car.color === 'null' || car.color === 'Not specified' || car.color === 'Unknown') {
        issues.push('color');
      }
      
      if (issues.length > 0) {
        incompleteCars.push({
          _id: car._id,
          registration: car.registrationNumber,
          make: car.make,
          model: car.model,
          variant: car.variant,
          issues: issues,
          hasHistory: !!car.historyCheckId
        });
      }
    }
    
    console.log(`\n📊 Found ${incompleteCars.length} cars with incomplete data`);
    
    if (incompleteCars.length === 0) {
      console.log('🎉 All cars have complete data!');
      process.exit(0);
    }
    
    console.log('\n📋 Incomplete cars:');
    incompleteCars.forEach((car, index) => {
      console.log(`\n${index + 1}. ${car.registration} - ${car.make} ${car.model}`);
      console.log(`   Variant: ${car.variant || 'MISSING'}`);
      console.log(`   Missing: ${car.issues.join(', ')}`);
      console.log(`   Has History: ${car.hasHistory ? 'YES' : 'NO'}`);
    });
    
    console.log('\n\n🔧 FIXING ALL INCOMPLETE CARS...');
    console.log('='.repeat(80));
    
    let fixedCount = 0;
    let failedCount = 0;
    
    for (const incompleteCar of incompleteCars) {
      try {
        console.log(`\n🔧 Fixing: ${incompleteCar.registration}`);
        
        const car = await Car.findById(incompleteCar._id).populate('historyCheckId');
        
        if (!car) {
          console.log('❌ Car not found');
          failedCount++;
          continue;
        }
        
        if (!car.historyCheckId) {
          console.log('⚠️  No history check data available - skipping');
          failedCount++;
          continue;
        }
        
        const vh = car.historyCheckId;
        let updated = false;
        
        // Fix variant
        if (incompleteCar.issues.includes('variant') && vh.variant) {
          console.log(`   ✅ Updating variant: ${vh.variant}`);
          car.variant = vh.variant;
          updated = true;
        }
        
        // Fix doors
        if (incompleteCar.issues.includes('doors') && vh.doors) {
          console.log(`   ✅ Updating doors: ${vh.doors}`);
          car.doors = vh.doors;
          updated = true;
        }
        
        // Fix seats
        if (incompleteCar.issues.includes('seats') && vh.seats) {
          console.log(`   ✅ Updating seats: ${vh.seats}`);
          car.seats = vh.seats;
          updated = true;
        }
        
        // Fix body type
        if (incompleteCar.issues.includes('bodyType') && vh.bodyType) {
          console.log(`   ✅ Updating body type: ${vh.bodyType}`);
          car.bodyType = vh.bodyType;
          updated = true;
        }
        
        // Fix transmission
        if (incompleteCar.issues.includes('transmission') && vh.transmission) {
          console.log(`   ✅ Updating transmission: ${vh.transmission}`);
          car.transmission = vh.transmission.toLowerCase();
          updated = true;
        }
        
        // Fix color
        if (incompleteCar.issues.includes('color') && vh.colour) {
          console.log(`   ✅ Updating color: ${vh.colour}`);
          car.color = vh.colour;
          updated = true;
        }
        
        if (updated) {
          // Regenerate display title
          const parts = [];
          
          if (car.engineSize) {
            const size = parseFloat(car.engineSize);
            if (!isNaN(size) && size > 0) {
              parts.push(size.toFixed(1));
            }
          }
          
          if (car.variant && car.variant !== 'null' && car.variant !== 'undefined') {
            parts.push(car.variant);
          }
          
          if (car.bodyType && car.bodyType !== 'null' && car.bodyType !== 'undefined') {
            parts.push(car.bodyType);
          }
          
          if (car.transmission) {
            const trans = car.transmission.toLowerCase();
            if (trans === 'automatic' || trans === 'auto') {
              parts.push('Auto');
            } else if (trans === 'manual') {
              parts.push('Manual');
            }
          }
          
          if (car.doors) {
            parts.push(`${car.doors}dr`);
          }
          
          if (parts.length > 0) {
            car.displayTitle = parts.join(' ');
            console.log(`   ✅ Updated display title: ${car.displayTitle}`);
          }
          
          await car.save();
          console.log(`   ✅ Car fixed successfully!`);
          fixedCount++;
        } else {
          console.log(`   ⚠️  No data available in history to fix issues`);
          failedCount++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error fixing ${incompleteCar.registration}:`, error.message);
        failedCount++;
      }
    }
    
    console.log('\n\n📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total incomplete cars: ${incompleteCars.length}`);
    console.log(`✅ Fixed: ${fixedCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`📈 Success rate: ${Math.round(fixedCount / incompleteCars.length * 100)}%`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixAllIncompleteCars();
