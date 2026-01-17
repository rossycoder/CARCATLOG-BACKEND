require('dotenv').config();
const mongoose = require('mongoose');
const TradeDealer = require('../models/TradeDealer');
const Car = require('../models/Car');

async function checkDealerLogos() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find all dealers
    const dealers = await TradeDealer.find({});
    
    console.log(`📊 Total Dealers: ${dealers.length}\n`);

    for (const dealer of dealers) {
      console.log(`🏢 ${dealer.businessName}`);
      console.log(`   Email: ${dealer.email}`);
      console.log(`   Status: ${dealer.status}`);
      console.log(`   Logo: ${dealer.logo || '❌ No logo'}`);
      
      // Check if dealer has vehicles
      const vehicleCount = await Car.countDocuments({ dealerId: dealer._id });
      console.log(`   Vehicles: ${vehicleCount}`);
      
      if (vehicleCount > 0) {
        const activeVehicles = await Car.countDocuments({ 
          dealerId: dealer._id, 
          advertStatus: 'active' 
        });
        console.log(`   Active Vehicles: ${activeVehicles}`);
        
        if (activeVehicles > 0) {
          const sampleVehicle = await Car.findOne({ 
            dealerId: dealer._id, 
            advertStatus: 'active' 
          });
          console.log(`   Sample Vehicle: ${sampleVehicle.make} ${sampleVehicle.model} (ID: ${sampleVehicle._id})`);
        }
      }
      console.log('');
    }

    // Summary
    const dealersWithLogos = dealers.filter(d => d.logo).length;
    const dealersWithoutLogos = dealers.length - dealersWithLogos;
    
    console.log('📈 Summary:');
    console.log(`   Dealers with logos: ${dealersWithLogos}`);
    console.log(`   Dealers without logos: ${dealersWithoutLogos}\n`);

    if (dealersWithoutLogos > 0) {
      console.log('💡 To add a logo to a dealer:');
      console.log('   1. Upload logo to Cloudinary');
      console.log('   2. Update dealer.logo field with the URL');
      console.log('   3. Or use: node scripts/addTestDealerLogo.js\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

checkDealerLogos();
