const mongoose = require('mongoose');
const Car = require('../models/Car');

mongoose.connect('mongodb://localhost:27017/car-website', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  try {
    // Check trade dealer cars
    const tradeCars = await Car.find({ dealerId: { $exists: true, $ne: null } }).limit(5);
    console.log('Trade Dealer Cars Found:', tradeCars.length);
    if (tradeCars.length > 0) {
      console.log('Sample Trade Car:');
      console.log('- condition:', tradeCars[0].condition);
      console.log('- isDealerListing:', tradeCars[0].isDealerListing);
      console.log('- advertStatus:', tradeCars[0].advertStatus);
      console.log('- dealerId:', tradeCars[0].dealerId);
    }
    
    // Check all cars with isDealerListing = true
    const dealerListings = await Car.countDocuments({ isDealerListing: true });
    console.log('\nTotal cars with isDealerListing=true:', dealerListings);
    
    // Check cars with condition = 'new'
    const newCars = await Car.countDocuments({ condition: 'new' });
    console.log('Total cars with condition=new:', newCars);
    
    // Check cars with both
    const newDealerCars = await Car.countDocuments({ condition: 'new', isDealerListing: true });
    console.log('Total cars with condition=new AND isDealerListing=true:', newDealerCars);
    
    // Check what the frontend is actually querying
    console.log('\n--- Frontend Query Check ---');
    const frontendQuery = await Car.find({ 
      condition: 'new',
      advertStatus: 'active',
      isDealerListing: true
    }).limit(5);
    console.log('Cars matching frontend query:', frontendQuery.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
