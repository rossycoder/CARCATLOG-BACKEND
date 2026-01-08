const mongoose = require('mongoose');
const Car = require('../models/Car');
const TradeDealer = require('../models/TradeDealer');

mongoose.connect('mongodb://localhost:27017/car-website', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  try {
    console.log('Linking new cars to trade dealer...\n');
    
    // Get the trade dealer
    const dealer = await TradeDealer.findOne({ businessName: 'Auraluk' });
    
    if (!dealer) {
      console.error('❌ Trade dealer "Auraluk" not found');
      process.exit(1);
    }
    
    console.log(`✓ Found dealer: ${dealer.businessName} (ID: ${dealer._id})`);
    
    // Link all new cars to this dealer
    const result = await Car.updateMany(
      { condition: 'new' },
      { 
        dealerId: dealer._id,
        isDealerListing: true,
        advertStatus: 'active'
      }
    );
    
    console.log(`\n✓ Updated ${result.modifiedCount} cars`);
    console.log(`✓ Matched ${result.matchedCount} cars`);
    
    // Verify the update
    const linkedCars = await Car.find({ dealerId: dealer._id });
    console.log(`\n✓ Total cars linked to dealer: ${linkedCars.length}`);
    
    // Show sample
    const sample = await Car.findOne({ dealerId: dealer._id });
    if (sample) {
      console.log('\nSample car:');
      console.log(`- Make: ${sample.make}`);
      console.log(`- Model: ${sample.model}`);
      console.log(`- Year: ${sample.year}`);
      console.log(`- Condition: ${sample.condition}`);
      console.log(`- isDealerListing: ${sample.isDealerListing}`);
      console.log(`- dealerId: ${sample.dealerId}`);
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
