const mongoose = require('mongoose');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const TradeDealer = require('../models/TradeDealer');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixTradeDashboardVehicles() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!\n');

    // Get all trade dealers
    const dealers = await TradeDealer.find({});
    console.log('Found trade dealers:\n');
    
    dealers.forEach((dealer, index) => {
      console.log(`${index + 1}. ${dealer.businessName} (${dealer.email})`);
      console.log(`   ID: ${dealer._id}\n`);
    });

    const dealerIndex = await question('Which dealer account do you want to use? (enter number): ');
    const selectedDealer = dealers[parseInt(dealerIndex) - 1];

    if (!selectedDealer) {
      console.log('Invalid selection');
      return;
    }

    console.log(`\nSelected: ${selectedDealer.businessName} (${selectedDealer.email})`);
    console.log(`Dealer ID: ${selectedDealer._id}\n`);

    // Find all cars for other dealers with same business name
    const otherDealers = dealers.filter(d => 
      d.businessName === selectedDealer.businessName && 
      d._id.toString() !== selectedDealer._id.toString()
    );

    if (otherDealers.length === 0) {
      console.log('No other dealers with same business name found.');
      return;
    }

    console.log('Found other dealers with same business name:');
    otherDealers.forEach(d => {
      console.log(`- ${d.email} (ID: ${d._id})`);
    });

    const otherDealerIds = otherDealers.map(d => d._id);
    const carsToMove = await Car.find({ dealerId: { $in: otherDealerIds } });

    console.log(`\nFound ${carsToMove.length} vehicle(s) from other accounts.\n`);

    if (carsToMove.length === 0) {
      console.log('No vehicles to move.');
      return;
    }

    console.log('Vehicles to move:');
    carsToMove.forEach((car, index) => {
      console.log(`${index + 1}. ${car.year} ${car.make} ${car.model} (ID: ${car._id})`);
    });

    const confirm = await question('\nMove all these vehicles to the selected dealer account? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Operation cancelled.');
      return;
    }

    // Move vehicles
    console.log('\nMoving vehicles...');
    for (const car of carsToMove) {
      car.dealerId = selectedDealer._id;
      car.isDealerListing = true;
      await car.save();
      console.log(`✓ Moved: ${car.year} ${car.make} ${car.model}`);
    }

    console.log(`\n✓ Successfully moved ${carsToMove.length} vehicle(s)!`);
    console.log('\nYou can now refresh your trade dashboard to see all vehicles.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

fixTradeDashboardVehicles();
