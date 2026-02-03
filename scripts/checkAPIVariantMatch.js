require('dotenv').config();
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function checkAPIVariantMatch() {
  try {
    console.log('🔍 Checking API variant for EK11XHZ (Honda Civic)');
    console.log('='.repeat(60));
    
    const registration = 'EK11XHZ';
    
    console.log('\n📋 Database mein stored variant: "1.3L Petrol"');
    console.log('📋 Ab API se actual variant check karte hain...');
    
    // Call ONLY Vehiclespecs API (cheap - £0.05) NOT expensive history API
    console.log('\n⏳ Calling CheckCarDetails Vehiclespecs API (Cost: £0.05)...');
    
    const vehicleData = await CheckCarDetailsClient.getVehicleData(registration);
    
    if (!vehicleData) {
      console.log('❌ No data received from API');
      return;
    }
    
    console.log('\n📊 API Response Analysis:');
    console.log('='.repeat(40));
    
    // Check all possible variant fields
    const possibleVariants = {
      'modelVariant': vehicleData.modelVariant,
      'variant': vehicleData.variant,
      'trim': vehicleData.trim,
      'grade': vehicleData.grade,
      'specification': vehicleData.specification,
      'subModel': vehicleData.subModel
    };
    
    console.log('\n🔍 All possible variant fields from API:');
    Object.entries(possibleVariants).forEach(([key, value]) => {
      console.log(`   ${key}: "${value}"`);
    });
    
    // Extract the best variant
    const apiVariant = vehicleData.modelVariant || 
                      vehicleData.variant || 
                      vehicleData.trim || 
                      vehicleData.grade || 
                      vehicleData.specification ||
                      vehicleData.subModel ||
                      null;
    
    console.log('\n📊 Comparison:');
    console.log('='.repeat(30));
    console.log(`Database Variant: "1.3L Petrol"`);
    console.log(`API Variant:      "${apiVariant}"`);
    
    // Check if they match
    if (apiVariant === '1.3L Petrol') {
      console.log('\n✅ PERFECT MATCH! Database aur API variant same hain');
    } else if (apiVariant && apiVariant.includes('1.3')) {
      console.log('\n⚠️  PARTIAL MATCH! API mein 1.3 hai lekin format different hai');
      console.log(`   Database: "1.3L Petrol"`);
      console.log(`   API:      "${apiVariant}"`);
    } else if (!apiVariant) {
      console.log('\n❌ API mein variant nahi mila - Database variant generated hai');
      console.log('   Database variant "1.3L Petrol" engine size + fuel type se banaya gaya hai');
    } else {
      console.log('\n❌ MISMATCH! Database aur API variant different hain');
      console.log(`   Database: "1.3L Petrol"`);
      console.log(`   API:      "${apiVariant}"`);
    }
    
    // Show other relevant data
    console.log('\n📋 Other API Data:');
    console.log(`   Make: ${vehicleData.make}`);
    console.log(`   Model: ${vehicleData.model}`);
    console.log(`   Engine Size: ${vehicleData.engineSize}cc (${vehicleData.engineSizeLitres}L)`);
    console.log(`   Fuel Type: ${vehicleData.fuelType}`);
    console.log(`   Year: ${vehicleData.year}`);
    
    // Generate what the fallback would be
    const fallbackVariant = vehicleData.engineSizeLitres && vehicleData.fuelType 
      ? `${vehicleData.engineSizeLitres}L ${vehicleData.fuelType}`
      : 'Unknown';
    
    console.log('\n🔧 Fallback Generation:');
    console.log(`   If API variant missing, fallback would be: "${fallbackVariant}"`);
    
    if (fallbackVariant === '1.3L Petrol') {
      console.log('   ✅ Database variant matches fallback generation logic');
    } else {
      console.log('   ⚠️  Database variant different from fallback logic');
    }
    
    console.log('\n💰 Cost Analysis:');
    console.log('   This API call cost: £0.05 (Vehiclespecs only)');
    console.log('   Vehicle History would cost: £1.82 (37x more expensive!)');
    console.log('   ✅ Using cheap API call for variant check');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('daily limit') || error.message.includes('403')) {
      console.log('\n⏰ API daily limit reached');
      console.log('   Cannot verify variant from API right now');
      console.log('   Database variant "1.3L Petrol" is likely generated from engine + fuel');
    }
  }
}

checkAPIVariantMatch();