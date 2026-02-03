require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');

async function addRunningCostsSavingToPaymentWebhook() {
  try {
    console.log('🔧 Adding running costs saving to payment webhook...');
    
    const paymentControllerPath = path.join(__dirname, '../controllers/paymentController.js');
    let content = fs.readFileSync(paymentControllerPath, 'utf8');
    
    // Find the first occurrence (updating existing car)
    const searchText1 = `                  // Update car with historyCheckId if available
                  if (result.historyCheckId) {
                    car.historyCheckId = result.historyCheckId;
                    await car.save();
                    console.log(\`✅ Car linked to vehicle history: \${result.historyCheckId}\`);
                  }`;
    
    const replaceText1 = `                  // Update car with historyCheckId if available
                  if (result.historyCheckId) {
                    car.historyCheckId = result.historyCheckId;
                    console.log(\`✅ Car linked to vehicle history: \${result.historyCheckId}\`);
                  }
                  
                  // CRITICAL FIX: Save running costs to database after payment
                  if (result.vehicleData && result.vehicleData.runningCosts) {
                    console.log(\`🏃 Saving running costs to database...\`);
                    car.runningCosts = {
                      fuelEconomy: {
                        urban: result.vehicleData.runningCosts.fuelEconomy?.urban || null,
                        extraUrban: result.vehicleData.runningCosts.fuelEconomy?.extraUrban || null,
                        combined: result.vehicleData.runningCosts.fuelEconomy?.combined || null
                      },
                      annualTax: result.vehicleData.runningCosts.annualTax || null,
                      insuranceGroup: result.vehicleData.runningCosts.insuranceGroup || null,
                      co2Emissions: result.vehicleData.runningCosts.co2Emissions || null
                    };
                    console.log(\`✅ Running costs saved:\`, {
                      combined: car.runningCosts.fuelEconomy.combined,
                      annualTax: car.runningCosts.annualTax,
                      co2: car.runningCosts.co2Emissions
                    });
                  }
                  
                  // Save enhanced valuation data if available
                  if (result.vehicleData && result.vehicleData.valuation) {
                    console.log(\`💰 Saving enhanced valuation to database...\`);
                    car.valuation = {
                      privatePrice: result.vehicleData.valuation.estimatedValue?.private || car.price,
                      retailPrice: result.vehicleData.valuation.estimatedValue?.retail || null,
                      tradePrice: result.vehicleData.valuation.estimatedValue?.trade || null
                    };
                    car.allValuations = result.vehicleData.valuation.estimatedValue;
                    console.log(\`✅ Valuation saved:\`, {
                      private: car.valuation.privatePrice,
                      retail: car.valuation.retailPrice,
                      trade: car.valuation.tradePrice
                    });
                  }
                  
                  // Save MOT data if available
                  if (result.vehicleData && (result.vehicleData.motStatus || result.vehicleData.motDue)) {
                    console.log(\`🔧 Saving MOT data to database...\`);
                    car.motStatus = result.vehicleData.motStatus || car.motStatus;
                    car.motDue = result.vehicleData.motDue || result.vehicleData.motExpiry || car.motDue;
                    car.motExpiry = result.vehicleData.motExpiry || result.vehicleData.motDue || car.motExpiry;
                    console.log(\`✅ MOT data saved:\`, {
                      status: car.motStatus,
                      due: car.motDue
                    });
                  } else if (car.year >= 2020) {
                    // For new cars, calculate MOT due date (3 years from first registration)
                    const motDueYear = car.year + 3;
                    const motDueDate = new Date(\`\${motDueYear}-10-31\`);
                    car.motStatus = 'Not due';
                    car.motDue = motDueDate;
                    car.motExpiry = motDueDate;
                    console.log(\`✅ MOT calculated for new car: Due \${motDueDate.toDateString()}\`);
                  }
                  
                  await car.save();
                  console.log(\`✅ Car updated with comprehensive data\`);`;
    
    // Check if the enhancement is already applied
    if (content.includes('CRITICAL FIX: Save running costs to database after payment')) {
      console.log('✅ Running costs saving already implemented in payment webhook');
      return;
    }
    
    // Apply the first replacement
    if (content.includes(searchText1)) {
      content = content.replace(searchText1, replaceText1);
      console.log('✅ Added running costs saving to existing car update section');
    } else {
      console.log('⚠️ Could not find first section to update');
    }
    
    // Find the second occurrence (creating new car)
    const searchText2 = `                  // Update car with historyCheckId if available
                  if (result.historyCheckId) {
                    car.historyCheckId = result.historyCheckId;
                    await car.save();
                    console.log(\`✅ Car linked to vehicle history: \${result.historyCheckId}\`);
                  }`;
    
    const replaceText2 = `                  // Update car with historyCheckId if available
                  if (result.historyCheckId) {
                    car.historyCheckId = result.historyCheckId;
                    console.log(\`✅ Car linked to vehicle history: \${result.historyCheckId}\`);
                  }
                  
                  // CRITICAL FIX: Save running costs to database after payment
                  if (result.vehicleData && result.vehicleData.runningCosts) {
                    console.log(\`🏃 Saving running costs to database...\`);
                    car.runningCosts = {
                      fuelEconomy: {
                        urban: result.vehicleData.runningCosts.fuelEconomy?.urban || null,
                        extraUrban: result.vehicleData.runningCosts.fuelEconomy?.extraUrban || null,
                        combined: result.vehicleData.runningCosts.fuelEconomy?.combined || null
                      },
                      annualTax: result.vehicleData.runningCosts.annualTax || null,
                      insuranceGroup: result.vehicleData.runningCosts.insuranceGroup || null,
                      co2Emissions: result.vehicleData.runningCosts.co2Emissions || null
                    };
                    console.log(\`✅ Running costs saved:\`, {
                      combined: car.runningCosts.fuelEconomy.combined,
                      annualTax: car.runningCosts.annualTax,
                      co2: car.runningCosts.co2Emissions
                    });
                  }
                  
                  // Save enhanced valuation data if available
                  if (result.vehicleData && result.vehicleData.valuation) {
                    console.log(\`💰 Saving enhanced valuation to database...\`);
                    car.valuation = {
                      privatePrice: result.vehicleData.valuation.estimatedValue?.private || car.price,
                      retailPrice: result.vehicleData.valuation.estimatedValue?.retail || null,
                      tradePrice: result.vehicleData.valuation.estimatedValue?.trade || null
                    };
                    car.allValuations = result.vehicleData.valuation.estimatedValue;
                    console.log(\`✅ Valuation saved:\`, {
                      private: car.valuation.privatePrice,
                      retail: car.valuation.retailPrice,
                      trade: car.valuation.tradePrice
                    });
                  }
                  
                  // Save MOT data if available
                  if (result.vehicleData && (result.vehicleData.motStatus || result.vehicleData.motDue)) {
                    console.log(\`🔧 Saving MOT data to database...\`);
                    car.motStatus = result.vehicleData.motStatus || car.motStatus;
                    car.motDue = result.vehicleData.motDue || result.vehicleData.motExpiry || car.motDue;
                    car.motExpiry = result.vehicleData.motExpiry || result.vehicleData.motDue || car.motExpiry;
                    console.log(\`✅ MOT data saved:\`, {
                      status: car.motStatus,
                      due: car.motDue
                    });
                  } else if (car.year >= 2020) {
                    // For new cars, calculate MOT due date (3 years from first registration)
                    const motDueYear = car.year + 3;
                    const motDueDate = new Date(\`\${motDueYear}-10-31\`);
                    car.motStatus = 'Not due';
                    car.motDue = motDueDate;
                    car.motExpiry = motDueDate;
                    console.log(\`✅ MOT calculated for new car: Due \${motDueDate.toDateString()}\`);
                  }
                  
                  await car.save();
                  console.log(\`✅ Car updated with comprehensive data\`);`;
    
    // Apply the second replacement
    if (content.includes(searchText2)) {
      content = content.replace(searchText2, replaceText2);
      console.log('✅ Added running costs saving to new car creation section');
    } else {
      console.log('⚠️ Could not find second section to update');
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(paymentControllerPath, content, 'utf8');
    console.log('✅ Payment controller updated successfully');
    
    console.log('\n📋 SUMMARY:');
    console.log('===========');
    console.log('✅ Running costs will now be saved to database when payment is completed');
    console.log('✅ Enhanced valuation data will be saved');
    console.log('✅ MOT data will be saved or calculated for new cars');
    console.log('✅ All data will be available in frontend without API calls');
    
    console.log('\n🔄 RESTART REQUIRED:');
    console.log('====================');
    console.log('Please restart the backend server to apply changes:');
    console.log('1. Stop current server (Ctrl+C)');
    console.log('2. cd backend && npm start');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addRunningCostsSavingToPaymentWebhook();