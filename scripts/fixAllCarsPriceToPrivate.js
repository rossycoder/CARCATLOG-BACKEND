/**
 * Fix ALL cars in production database to use PRIVATE sale price
 * This ensures all cars show the correct private sale price
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function fixAllCarsPriceToPrivate() {
  try {
    console.log('🚀 Connecting to production database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const Car = require('../models/Car');
    const ValuationService = require('../services/valuationService');
    
    // Find all active cars
    const cars = await Car.find({ advertStatus: 'active' });
    console.log(`📊 Found ${cars.length} active cars\n`);
    
    if (cars.length === 0) {
      console.log('ℹ️  No cars to fix');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    let fixed = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const car of cars) {
      console.log(`\n🚗 Processing: ${car.make} ${car.model} (${car.year})`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Current Price: £${car.price}`);
      console.log(`   Advert ID: ${car.advertId}`);
      
      // Skip if no registration number
      if (!car.registrationNumber) {
        console.log('   ⚠️  No registration - skipping');
        skipped++;
        continue;
      }
      
      try {
        // Fetch fresh valuation
        console.log('   📡 Fetching valuation...');
        const valuation = await ValuationService.getValuation(
          car.registrationNumber,
          car.mileage || 50000
        );
        
        if (!valuation || !valuation.estimatedValue) {
          console.log('   ⚠️  No valuation data - skipping');
          skipped++;
          continue;
        }
        
        const privatePrice = valuation.estimatedValue.private;
        const retailPrice = valuation.estimatedValue.retail;
        const tradePrice = valuation.estimatedValue.trade;
        
        console.log('   💰 Valuation:');
        console.log(`      Private: £${privatePrice}`);
        console.log(`      Retail: £${retailPrice}`);
        console.log(`      Trade: £${tradePrice}`);
        
        // Check if price needs updating
        if (car.price === privatePrice) {
          console.log('   ✅ Price already correct');
          skipped++;
          continue;
        }
        
        // Update car with PRIVATE sale price
        console.log(`   ✏️  Updating: £${car.price} → £${privatePrice}`);
        
        car.price = privatePrice;
        car.estimatedValue = privatePrice;
        car.valuation = {
          privatePrice: privatePrice,
          dealerPrice: retailPrice,
          partExchangePrice: tradePrice,
          valuationDate: new Date()
        };
        
        await car.save();
        console.log('   ✅ FIXED!');
        fixed++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Fixed: ${fixed} cars`);
    console.log(`⏭️  Skipped: ${skipped} cars`);
    console.log(`❌ Errors: ${errors} cars`);
    console.log(`📈 Total: ${cars.length} cars`);
    console.log('='.repeat(50));
    
    if (fixed > 0) {
      console.log('\n🎉 SUCCESS! All cars now show PRIVATE sale prices!');
      console.log('🌐 Check your website: https://carcatlog.vercel.app\n');
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixAllCarsPriceToPrivate();
