require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const VehicleHistory = require('../models/VehicleHistory');

async function checkPurchase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    // Get the purchase ID from the log: 69761db5425af921b7da4d94
    const purchaseId = '69761db5425af921b7da4d94';
    
    const purchase = await AdvertisingPackagePurchase.findById(purchaseId);
    
    if (!purchase) {
      console.log('❌ Purchase not found with ID:', purchaseId);
      
      // Try to find recent purchases
      console.log('\n=== RECENT PURCHASES ===');
      const recentPurchases = await AdvertisingPackagePurchase.find()
        .sort({ createdAt: -1 })
        .limit(5);
      
      recentPurchases.forEach(p => {
        console.log(`\nID: ${p._id}`);
        console.log(`Registration: ${p.advertData?.registration || 'N/A'}`);
        console.log(`Status: ${p.status}`);
        console.log(`Created: ${p.createdAt}`);
      });
      
      await mongoose.connection.close();
      return;
    }

    console.log('=== PURCHASE DETAILS ===');
    console.log('Registration:', purchase.advertData?.registration);
    console.log('Make/Model:', purchase.advertData?.make, purchase.advertData?.model);
    console.log('Status:', purchase.status);
    console.log('Created:', purchase.createdAt);
    console.log('Car ID:', purchase.carId);

    // Check if history exists for this registration
    const registration = purchase.advertData?.registration;
    if (registration) {
      console.log('\n=== CHECKING HISTORY FOR', registration, '===');
      const history = await VehicleHistory.findOne({ vrm: registration });
      
      if (history) {
        console.log('✅ History record found');
        console.log('History ID:', history._id);
        console.log('Created:', history.createdAt);
        console.log('Has been written off?', history.writtenOff);
        
        if (history.writeOffDetails) {
          console.log('\n⚠️ WRITE-OFF DETAILS:');
          console.log(JSON.stringify(history.writeOffDetails, null, 2));
        }
      } else {
        console.log('❌ No history record found for this registration');
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPurchase();
