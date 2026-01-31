/**
 * Test Filter Counts
 * Tests if filter counts are calculated correctly
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testFilterCounts() {
  try {
    console.log(`${colors.cyan}=== Testing Filter Counts ===${colors.reset}\n`);

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓ Connected to MongoDB${colors.reset}\n`);

    // Base query for active cars
    const baseQuery = { advertStatus: 'active' };

    // ========================================
    // Calculate Counts (same as backend)
    // ========================================
    
    console.log(`${colors.cyan}Calculating counts...${colors.reset}\n`);

    // Total cars
    const totalCars = await Car.countDocuments(baseQuery);
    console.log(`${colors.blue}Total Active Cars: ${totalCars.toLocaleString()}${colors.reset}`);

    // Private sellers
    const privateSellerCount = await Car.countDocuments({
      ...baseQuery,
      userId: { $ne: null, $exists: true },
      tradeDealerId: null
    });
    console.log(`${colors.green}Private Sellers: ${privateSellerCount.toLocaleString()}${colors.reset}`);

    // Trade sellers
    const tradeSellerCount = await Car.countDocuments({
      ...baseQuery,
      tradeDealerId: { $ne: null, $exists: true }
    });
    console.log(`${colors.green}Trade Sellers: ${tradeSellerCount.toLocaleString()}${colors.reset}`);

    // Write-off counts
    console.log(`\n${colors.yellow}Calculating write-off counts (this may take a moment)...${colors.reset}`);
    
    const carsWithHistory = await Car.find({
      ...baseQuery,
      historyCheckId: { $ne: null, $exists: true }
    }).populate('historyCheckId', 'writeOffCategory isWrittenOff');
    
    let writtenOffCount = 0;
    let cleanWithHistoryCount = 0;
    
    carsWithHistory.forEach(car => {
      if (car.historyCheckId && 
          car.historyCheckId.writeOffCategory && 
          car.historyCheckId.writeOffCategory !== 'none' && 
          car.historyCheckId.writeOffCategory !== 'unknown') {
        writtenOffCount++;
      } else {
        cleanWithHistoryCount++;
      }
    });
    
    // Cars without history check
    const carsWithoutHistory = await Car.countDocuments({
      ...baseQuery,
      historyCheckId: null
    });
    
    const cleanCount = cleanWithHistoryCount + carsWithoutHistory;
    
    console.log(`${colors.red}Written Off: ${writtenOffCount.toLocaleString()}${colors.reset}`);
    console.log(`${colors.green}Clean (No Write-Off): ${cleanCount.toLocaleString()}${colors.reset}`);
    console.log(`  - With history check: ${cleanWithHistoryCount.toLocaleString()}`);
    console.log(`  - Without history check: ${carsWithoutHistory.toLocaleString()}`);

    // ========================================
    // Verify Totals
    // ========================================
    
    console.log(`\n${colors.cyan}Verification:${colors.reset}\n`);

    const sellerTotal = privateSellerCount + tradeSellerCount;
    const writeOffTotal = writtenOffCount + cleanCount;
    
    console.log(`Seller Type Total: ${sellerTotal.toLocaleString()} (should equal ${totalCars.toLocaleString()})`);
    if (sellerTotal === totalCars) {
      console.log(`${colors.green}✓ Seller counts match!${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Seller counts don't match! Difference: ${Math.abs(sellerTotal - totalCars)}${colors.reset}`);
    }
    
    console.log(`\nWrite-Off Total: ${writeOffTotal.toLocaleString()} (should equal ${totalCars.toLocaleString()})`);
    if (writeOffTotal === totalCars) {
      console.log(`${colors.green}✓ Write-off counts match!${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Write-off counts don't match! Difference: ${Math.abs(writeOffTotal - totalCars)}${colors.reset}`);
    }

    // ========================================
    // Show Examples
    // ========================================
    
    console.log(`\n${colors.cyan}Examples:${colors.reset}\n`);

    // Private seller example
    const privateExample = await Car.findOne({
      ...baseQuery,
      userId: { $ne: null, $exists: true },
      tradeDealerId: null
    }).select('make model year price userId');
    
    if (privateExample) {
      console.log(`${colors.yellow}Private Seller Example:${colors.reset}`);
      console.log(`  ${privateExample.make} ${privateExample.model} (${privateExample.year}) - £${privateExample.price}`);
      console.log(`  User ID: ${privateExample.userId}`);
    }

    // Trade seller example
    const tradeExample = await Car.findOne({
      ...baseQuery,
      tradeDealerId: { $ne: null, $exists: true }
    }).select('make model year price tradeDealerId');
    
    if (tradeExample) {
      console.log(`\n${colors.yellow}Trade Seller Example:${colors.reset}`);
      console.log(`  ${tradeExample.make} ${tradeExample.model} (${tradeExample.year}) - £${tradeExample.price}`);
      console.log(`  Dealer ID: ${tradeExample.tradeDealerId}`);
    }

    // Written off example
    const writtenOffExample = await Car.findOne({
      ...baseQuery,
      historyCheckId: { $ne: null, $exists: true }
    })
    .populate('historyCheckId', 'writeOffCategory')
    .select('make model year price historyCheckId');
    
    if (writtenOffExample && 
        writtenOffExample.historyCheckId?.writeOffCategory && 
        writtenOffExample.historyCheckId.writeOffCategory !== 'none' && 
        writtenOffExample.historyCheckId.writeOffCategory !== 'unknown') {
      console.log(`\n${colors.yellow}Written Off Example:${colors.reset}`);
      console.log(`  ${writtenOffExample.make} ${writtenOffExample.model} (${writtenOffExample.year}) - £${writtenOffExample.price}`);
      console.log(`  Category: ${writtenOffExample.historyCheckId.writeOffCategory}`);
    }

    // ========================================
    // API Response Format
    // ========================================
    
    console.log(`\n${colors.cyan}API Response Format:${colors.reset}\n`);
    
    const apiResponse = {
      success: true,
      data: {
        counts: {
          total: totalCars,
          privateSellers: privateSellerCount,
          tradeSellers: tradeSellerCount,
          writtenOff: writtenOffCount,
          clean: cleanCount
        }
      }
    };
    
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log(`\n${colors.green}${colors.bright}=== Test Complete ===${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.yellow}Database connection closed${colors.reset}`);
  }
}

// Run the test
testFilterCounts();
