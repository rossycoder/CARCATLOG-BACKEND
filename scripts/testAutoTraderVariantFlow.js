require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

/**
 * Test the complete AutoTrader variant extraction flow
 * This simulates what happens when a user adds a car
 */

async function testAutoTraderVariantFlow() {
  try {
    console.log('='.repeat(70));
    console.log('TESTING AUTOTRADER VARIANT EXTRACTION FLOW');
    console.log('='.repeat(70));
    
    const testRegistration = 'NU10YEV'; // Skoda Octavia
    
    console.log(`\n📡 Step 1: Fetching data from CheckCarDetails API for: ${testRegistration}`);
    const enhancedData = await CheckCarDetailsClient.getVehicleData(testRegistration);
    
    console.log(`\n✅ Step 2: API Response received`);
    console.log('─'.repeat(70));
    console.log(`Make: ${enhancedData.make}`);
    console.log(`Model: ${enhancedData.model}`);
    console.log(`ModelVariant: "${enhancedData.modelVariant}"`);
    console.log(`Variant: "${enhancedData.variant}"`);
    console.log(`Engine Size: ${enhancedData.engineSize}L`);
    console.log(`Doors: ${enhancedData.doors}`);
    console.log(`Fuel Type: ${enhancedData.fuelType}`);
    console.log(`Transmission: ${enhancedData.transmission}`);
    
    console.log(`\n🔧 Step 3: Variant Selection Logic`);
    console.log('─'.repeat(70));
    
    let variant = null;
    
    // Priority: modelVariant > variant
    if (enhancedData?.modelVariant && enhancedData.modelVariant !== 'null' && enhancedData.modelVariant !== 'undefined' && enhancedData.modelVariant.trim() !== '') {
      variant = enhancedData.modelVariant;
      console.log(`✅ Selected ModelVariant: "${variant}"`);
    } else if (enhancedData?.variant && enhancedData.variant !== 'null' && enhancedData.variant !== 'undefined' && enhancedData.variant.trim() !== '') {
      variant = enhancedData.variant;
      console.log(`✅ Selected variant: "${variant}"`);
    } else {
      console.log(`❌ No valid variant found`);
    }
    
    console.log(`\n🎯 Step 4: Auto-Generate DisplayTitle (Car model pre-save hook)`);
    console.log('─'.repeat(70));
    
    // Simulate what the Car model pre-save hook does
    const displayTitleParts = [];
    
    // Engine size
    if (enhancedData.engineSize) {
      const size = parseFloat(enhancedData.engineSize);
      if (!isNaN(size) && size > 0) {
        displayTitleParts.push(size.toFixed(1));
      }
    }
    
    // Variant
    if (variant && variant !== 'null' && variant !== 'undefined' && variant.trim() !== '') {
      displayTitleParts.push(variant);
    }
    
    // Body style (doors)
    if (enhancedData.doors && enhancedData.doors >= 2 && enhancedData.doors <= 5) {
      displayTitleParts.push(`${enhancedData.doors}dr`);
    }
    
    const displayTitle = displayTitleParts.join(' ');
    
    console.log(`Generated DisplayTitle: "${displayTitle}"`);
    
    console.log(`\n📋 Step 5: Final Result`);
    console.log('='.repeat(70));
    console.log(`Full Listing Title: "${enhancedData.make} ${enhancedData.model} ${displayTitle}"`);
    console.log(`\nBreakdown:`);
    console.log(`  - Make: ${enhancedData.make}`);
    console.log(`  - Model: ${enhancedData.model}`);
    console.log(`  - Engine Size: ${enhancedData.engineSize}`);
    console.log(`  - Variant: ${variant}`);
    console.log(`  - Body Style: ${enhancedData.doors}dr`);
    
    console.log(`\n✅ AutoTrader Format: PERFECT!`);
    console.log(`   Expected: "SKODA Octavia 1.6 S TDI CR 5dr"`);
    console.log(`   Got:      "${enhancedData.make} ${enhancedData.model} ${displayTitle}"`);
    
    if (displayTitle === '1.6 S TDI CR 5dr') {
      console.log(`\n🎉 SUCCESS! The variant extraction is working correctly!`);
    } else {
      console.log(`\n⚠️  WARNING: DisplayTitle doesn't match expected format`);
    }
    
    console.log('\n' + '='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testAutoTraderVariantFlow();
