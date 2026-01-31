/**
 * Test New Filters: Seller Type and Write-Off Status
 * Tests if the new filters work correctly
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testNewFilters() {
  try {
    console.log(`${colors.cyan}=== Testing New Filters ===${colors.reset}\n`);

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓ Connected to MongoDB${colors.reset}\n`);

    // Get total active cars
    const totalCars = await Car.countDocuments({ advertStatus: 'active' });
    console.log(`${colors.blue}Total active cars: ${totalCars}${colors.reset}\n`);

    // ========================================
    // TEST 1: Seller Type Filter
    // ========================================
    console.log(`${colors.cyan}TEST 1: Seller Type Filter${colors.reset}\n`);

    // Private sellers (userId exists, tradeDealerId is null)
    const privateSellers = await Car.countDocuments({
      advertStatus: 'active',
      userId: { $ne: null, $exists: true },
      tradeDealerId: null
    });

    // Trade sellers (tradeDealerId exists)
    const tradeSellers = await Car.countDocuments({
      advertStatus: 'active',
      tradeDealerId: { $ne: null, $exists: true }
    });

    console.log(`${colors.yellow}Private Sellers:${colors.reset} ${colors.green}${privateSellers} cars${colors.reset}`);
    
    // Show examples
    const privateExamples = await Car.find({
      advertStatus: 'active',
      userId: { $ne: null, $exists: true },
      tradeDealerId: null
    }).limit(3).select('make model year price userId');
    
    if (privateExamples.length > 0) {
      console.log(`  Examples:`);
      privateExamples.forEach(car => {
        console.log(`    - ${car.make} ${car.model} (${car.year}) - £${car.price} - User: ${car.userId}`);
      });
    }
    console.log();

    console.log(`${colors.yellow}Trade Sellers:${colors.reset} ${colors.green}${tradeSellers} cars${colors.reset}`);
    
    // Show examples
    const tradeExamples = await Car.find({
      advertStatus: 'active',
      tradeDealerId: { $ne: null, $exists: true }
    }).limit(3).select('make model year price tradeDealerId');
    
    if (tradeExamples.length > 0) {
      console.log(`  Examples:`);
      tradeExamples.forEach(car => {
        console.log(`    - ${car.make} ${car.model} (${car.year}) - £${car.price} - Dealer: ${car.tradeDealerId}`);
      });
    }
    console.log();

    const totalBySeller = privateSellers + tradeSellers;
    console.log(`${colors.blue}Total (Private + Trade): ${totalBySeller}${colors.reset}`);
    console.log();

    // ========================================
    // TEST 2: Write-Off Status Filter
    // ========================================
    console.log(`${colors.cyan}TEST 2: Write-Off Status Filter${colors.reset}\n`);

    // Cars with history check
    const carsWithHistory = await Car.countDocuments({
      advertStatus: 'active',
      historyCheckId: { $ne: null, $exists: true }
    });

    console.log(`${colors.blue}Cars with history check: ${carsWithHistory}${colors.reset}\n`);

    // Written off cars (has historyCheckId and writeOffCategory is not 'none' or 'unknown')
    const writtenOffCars = await Car.find({
      advertStatus: 'active',
      historyCheckId: { $ne: null, $exists: true }
    })
    .populate('historyCheckId', 'writeOffCategory isWrittenOff')
    .select('make model year price historyCheckId');

    let writtenOffCount = 0;
    let cleanCount = 0;
    const writtenOffExamples = [];

    writtenOffCars.forEach(car => {
      if (car.historyCheckId && 
          car.historyCheckId.writeOffCategory && 
          car.historyCheckId.writeOffCategory !== 'none' && 
          car.historyCheckId.writeOffCategory !== 'unknown') {
        writtenOffCount++;
        if (writtenOffExamples.length < 3) {
          writtenOffExamples.push(car);
        }
      } else {
        cleanCount++;
      }
    });

    console.log(`${colors.yellow}Written Off Vehicles:${colors.reset} ${colors.red}${writtenOffCount} cars${colors.reset}`);
    
    if (writtenOffExamples.length > 0) {
      console.log(`  Examples:`);
      writtenOffExamples.forEach(car => {
        const category = car.historyCheckId?.writeOffCategory || 'Unknown';
        console.log(`    - ${car.make} ${car.model} (${car.year}) - £${car.price} - Category ${category}`);
      });
    }
    console.log();

    console.log(`${colors.yellow}Clean Vehicles (No Write-Off):${colors.reset} ${colors.green}${cleanCount} cars${colors.reset}`);
    console.log();

    // Cars without history check
    const carsWithoutHistory = totalCars - carsWithHistory;
    console.log(`${colors.yellow}Cars without history check:${colors.reset} ${carsWithoutHistory}`);
    console.log();

    // ========================================
    // TEST 3: Combined Filters
    // ========================================
    console.log(`${colors.cyan}TEST 3: Combined Filters${colors.reset}\n`);

    // Private sellers with clean vehicles
    const privateCleanQuery = {
      advertStatus: 'active',
      userId: { $ne: null, $exists: true },
      tradeDealerId: null,
      $or: [
        { historyCheckId: null },
        { 'historyCheckId.writeOffCategory': { $in: ['none', 'unknown', null] } }
      ]
    };

    const privateClean = await Car.find(privateCleanQuery)
      .populate('historyCheckId', 'writeOffCategory')
      .limit(3)
      .select('make model year price');

    console.log(`${colors.yellow}Private Sellers + Clean Vehicles:${colors.reset}`);
    console.log(`  Query would return cars from private sellers with no write-off history`);
    if (privateClean.length > 0) {
      console.log(`  Examples:`);
      privateClean.forEach(car => {
        console.log(`    - ${car.make} ${car.model} (${car.year}) - £${car.price}`);
      });
    }
    console.log();

    console.log(`${colors.green}${colors.bright}=== Test Complete ===${colors.reset}\n`);

    // Summary
    console.log(`${colors.cyan}Summary:${colors.reset}`);
    console.log(`  Total Cars: ${totalCars}`);
    console.log(`  Private Sellers: ${privateSellers}`);
    console.log(`  Trade Sellers: ${tradeSellers}`);
    console.log(`  Written Off: ${writtenOffCount}`);
    console.log(`  Clean Vehicles: ${cleanCount}`);
    console.log(`  No History Check: ${carsWithoutHistory}`);
    console.log();

  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.yellow}Database connection closed${colors.reset}`);
  }
}

// Run the test
testNewFilters();
