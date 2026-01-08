const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const TradeDealer = require('../models/TradeDealer');

async function autoFixTradeDashboard() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!\n');

    // Get all trade dealers
    const dealers = await TradeDealer.find({});
    console.log(`Found ${dealers.length} trade dealer(s)\n`);

    if (dealers.length < 2) {
      console.log('No duplicate accounts found. Nothing to fix.');
      return;
    }

    // Find dealers with same business name
    const dealersByBusiness = {};
    dealers.forEach(dealer => {
      if (!dealersByBusiness[dealer.businessName]) {
        dealersByBusiness[dealer.businessName] = [];
      }
      dealersByBusiness[dealer.businessName].push(dealer);
    });

    // Process each business with multiple accounts
    for (const [businessName, businessDealers] of Object.entries(dealersByBusiness)) {
      if (businessDealers.length > 1) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Found ${businessDealers.length} accounts for: ${businessName}`);
        console.log('='.repeat(60));

        // Count vehicles for each dealer
        const dealerVehicleCounts = await Promise.all(
          businessDealers.map(async (dealer) => {
            const count = await Car.countDocuments({
              dealerId: dealer._id,
              isDealerListing: true
            });
            return { dealer, count };
          })
        );

        // Sort by vehicle count (descending) and use the one with most vehicles
        dealerVehicleCounts.sort((a, b) => b.count - a.count);
        
        const primaryDealer = dealerVehicleCounts[0].dealer;
        const otherDealers = dealerVehicleCounts.slice(1);

        console.log(`\nPrimary account (keeping): ${primaryDealer.email}`);
        console.log(`  - Has ${dealerVehicleCounts[0].count} vehicles`);
        console.log(`  - Dealer ID: ${primaryDealer._id}`);

        // Move vehicles from other accounts to primary
        for (const { dealer, count } of otherDealers) {
          console.log(`\nMoving vehicles from: ${dealer.email}`);
          console.log(`  - Has ${count} vehicles`);
          console.log(`  - Dealer ID: ${dealer._id}`);

          if (count > 0) {
            const result = await Car.updateMany(
              { dealerId: dealer._id },
              { 
                $set: { 
                  dealerId: primaryDealer._id,
                  isDealerListing: true
                } 
              }
            );
            console.log(`  ✓ Moved ${result.modifiedCount} vehicle(s)`);
          }
        }

        // Count total vehicles now
        const totalVehicles = await Car.countDocuments({
          dealerId: primaryDealer._id,
          isDealerListing: true
        });

        console.log(`\n✓ Consolidation complete!`);
        console.log(`  Primary account (${primaryDealer.email}) now has ${totalVehicles} vehicles`);
        console.log(`\n  To see all vehicles, log in with: ${primaryDealer.email}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('FIX COMPLETE');
    console.log('='.repeat(60));
    console.log('\nAll vehicles have been consolidated.');
    console.log('Refresh your trade dashboard to see the changes.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

autoFixTradeDashboard();
