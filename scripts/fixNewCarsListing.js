const mongoose = require('mongoose');
const Car = require('../models/Car');

mongoose.connect('mongodb://localhost:27017/car-website', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  try {
    console.log('Updating new cars to be dealer listings...\n');
    
    // Update all cars with condition='new' to have isDealerListing=true
    const result = await Car.updateMany(
      { condition: 'new' },
      { 
        isDealerListing: true,
        advertStatus: 'active'
      }
    );
    
    console.log(`✓ Updated ${result.modifiedCount} cars`);
    console.log(`✓ Matched ${result.matchedCount} cars`);
    
    // Verify the update
    const newDealerCars = await Car.countDocuments({ 
      condition: 'new', 
      isDealerListing: true,
      advertStatus: 'active'
    });
    
    console.log(`\n✓ Verification: ${newDealerCars} cars now match the frontend query`);
    
    // Show sample
    const sample = await Car.findOne({ condition: 'new', isDealerListing: true });
    if (sample) {
      console.log('\nSample car:');
      console.log(`- Make: ${sample.make}`);
      console.log(`- Model: ${sample.model}`);
      console.log(`- Year: ${sample.year}`);
      console.log(`- Condition: ${sample.condition}`);
      console.log(`- isDealerListing: ${sample.isDealerListing}`);
      console.log(`- advertStatus: ${sample.advertStatus}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
