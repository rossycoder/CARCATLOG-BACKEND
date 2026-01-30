/**
 * Check valuation for CX18NBG
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ValuationService = require('../services/valuationService');

async function checkValuation() {
  try {
    const registration = 'CX18NBG';
    const mileage = 5000; // Default mileage, adjust if needed
    
    console.log(`\n🔍 Checking valuation for: ${registration}`);
    console.log(`   Mileage: ${mileage.toLocaleString()} miles\n`);
    
    const valuationService = new ValuationService();
    const valuation = await valuationService.getValuation(registration, mileage);
    
    console.log('✅ Valuation Retrieved Successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('💰 VALUATION BREAKDOWN:');
    console.log('═══════════════════════════════════════');
    console.log(`   🏠 PRIVATE SALE:  £${valuation.estimatedValue.private.toLocaleString()}`);
    console.log(`   🏪 RETAIL:        £${valuation.estimatedValue.retail.toLocaleString()}`);
    console.log(`   🔄 TRADE-IN:      £${valuation.estimatedValue.trade.toLocaleString()}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('📊 Additional Details:');
    console.log(`   Confidence: ${valuation.confidence}`);
    console.log(`   Valuation Date: ${new Date(valuation.valuationDate).toLocaleDateString()}`);
    console.log(`   Valid Until: ${new Date(valuation.validUntil).toLocaleDateString()}`);
    
    if (valuation.vehicleDescription) {
      console.log(`   Vehicle: ${valuation.vehicleDescription}`);
    }
    
    console.log('\n✨ FOR PRIVATE SELLERS:');
    console.log(`   Recommended Price: £${valuation.estimatedValue.private.toLocaleString()}`);
    console.log(`   This is the price shown on valuation page\n`);
    
    // Show the full object structure
    console.log('📋 Full Valuation Object:');
    console.log(JSON.stringify(valuation, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Details:', error);
  }
}

// Run the script
checkValuation();
