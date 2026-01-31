/**
 * Test Engine Size Filter
 * Tests if engine size filtering works correctly
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

async function testEngineSizeFilter() {
  try {
    console.log(`${colors.cyan}=== Testing Engine Size Filter ===${colors.reset}\n`);

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓ Connected to MongoDB${colors.reset}\n`);

    // Get all active cars with engine capacity
    const allCars = await Car.find({ 
      advertStatus: 'active',
      engineCapacity: { $exists: true, $ne: null }
    }).select('make model engineCapacity year price');

    console.log(`${colors.blue}Total active cars with engine capacity: ${allCars.length}${colors.reset}\n`);

    // Test each engine size range
    const testRanges = [
      { label: 'Up to 1.0L', value: '1.0', query: { $lte: 1000 } },
      { label: '1.0L - 1.5L', value: '1.5', query: { $gt: 1000, $lte: 1500 } },
      { label: '1.5L - 2.0L', value: '2.0', query: { $gt: 1500, $lte: 2000 } },
      { label: '2.0L - 2.5L', value: '2.5', query: { $gt: 2000, $lte: 2500 } },
      { label: '2.5L - 3.0L', value: '3.0', query: { $gt: 2500, $lte: 3000 } },
      { label: '3.0L+', value: '3.0+', query: { $gt: 3000 } }
    ];

    console.log(`${colors.cyan}Testing each engine size range:${colors.reset}\n`);

    for (const range of testRanges) {
      const query = {
        advertStatus: 'active',
        engineCapacity: range.query
      };

      const cars = await Car.find(query).select('make model engineCapacity year price');
      
      console.log(`${colors.yellow}${range.label} (${range.value}):${colors.reset}`);
      console.log(`  Query: engineCapacity ${JSON.stringify(range.query)}`);
      console.log(`  ${colors.green}Found: ${cars.length} cars${colors.reset}`);
      
      if (cars.length > 0) {
        // Show first 3 examples
        const examples = cars.slice(0, 3);
        console.log(`  Examples:`);
        examples.forEach(car => {
          const engineLiters = (car.engineCapacity / 1000).toFixed(1);
          console.log(`    - ${car.make} ${car.model} (${car.year}) - ${car.engineCapacity}cc (${engineLiters}L) - £${car.price}`);
        });
      }
      console.log();
    }

    // Show distribution of engine capacities
    console.log(`${colors.cyan}Engine Capacity Distribution:${colors.reset}\n`);
    
    const distribution = await Car.aggregate([
      { 
        $match: { 
          advertStatus: 'active',
          engineCapacity: { $exists: true, $ne: null }
        }
      },
      {
        $bucket: {
          groupBy: '$engineCapacity',
          boundaries: [0, 1000, 1500, 2000, 2500, 3000, 10000],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' },
            examples: { 
              $push: { 
                make: '$make', 
                model: '$model', 
                engineCapacity: '$engineCapacity' 
              } 
            }
          }
        }
      }
    ]);

    distribution.forEach(bucket => {
      const rangeLabel = 
        bucket._id === 0 ? 'Up to 1.0L (0-1000cc)' :
        bucket._id === 1000 ? '1.0L - 1.5L (1001-1500cc)' :
        bucket._id === 1500 ? '1.5L - 2.0L (1501-2000cc)' :
        bucket._id === 2000 ? '2.0L - 2.5L (2001-2500cc)' :
        bucket._id === 2500 ? '2.5L - 3.0L (2501-3000cc)' :
        bucket._id === 3000 ? '3.0L+ (3001cc+)' :
        'Other';
      
      console.log(`  ${rangeLabel}:`);
      console.log(`    Count: ${bucket.count}`);
      console.log(`    Avg Price: £${Math.round(bucket.avgPrice)}`);
      console.log();
    });

    console.log(`${colors.green}${colors.bright}=== Test Complete ===${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.yellow}Database connection closed${colors.reset}`);
  }
}

// Run the test
testEngineSizeFilter();
