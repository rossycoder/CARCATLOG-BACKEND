require('dotenv').config();
const dvlaService = require('../services/dvlaService');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const dataMerger = require('../utils/dataMerger');

async function quickVerify() {
  const vrm = 'MX08XMT';
  
  console.log('🔍 Testing MX08XMT\n');

  try {
    // Get DVLA Data
    let dvlaData = null;
    try {
      dvlaData = await dvlaService.getVehicleData(vrm);
      console.log('✅ DVLA Data:');
      console.log('  Make:', dvlaData?.make);
      console.log('  Model:', dvlaData?.model);
      console.log('  Transmission:', dvlaData?.transmission);
      console.log('  Body Type:', dvlaData?.bodyType);
      console.log('  Engine:', dvlaData?.engineSize);
    } catch (error) {
      console.log('❌ DVLA Error:', error.message);
    }
    console.log();

    // Get CheckCarDetails Data
    let checkCarData = null;
    try {
      checkCarData = await CheckCarDetailsClient.getVehicleData(vrm);
      console.log('✅ CheckCarDetails Data:');
      console.log('  Make:', checkCarData?.make);
      console.log('  Model:', checkCarData?.model);
      console.log('  Transmission:', checkCarData?.transmission);
      console.log('  Body Type:', checkCarData?.bodyType);
      console.log('  Engine:', checkCarData?.engineSize);
      console.log('  Running Costs:', checkCarData?.runningCosts ? 'Available' : 'NULL');
    } catch (error) {
      console.log('❌ CheckCarDetails Error:', error.message);
    }
    console.log();

    // Merge Data
    const merged = dataMerger.merge(dvlaData, checkCarData, null);
    console.log('🔀 MERGED Data (Final):');
    console.log('  Make:', merged.make?.value);
    console.log('  Model:', merged.model?.value, `(source: ${merged.model?.source})`);
    console.log('  Transmission:', merged.transmission?.value, `(source: ${merged.transmission?.source})`);
    console.log('  Body Type:', merged.bodyType?.value, `(source: ${merged.bodyType?.source})`);
    console.log('  Engine:', merged.engineSize?.value);
    console.log();
    
    console.log('💰 Running Costs:');
    console.log('  Fuel Economy:', merged.runningCosts?.fuelEconomy?.combined?.value || 'NULL');
    console.log('  Annual Tax:', merged.runningCosts?.annualTax?.value || 'NULL');
    console.log('  Insurance Group:', merged.runningCosts?.insuranceGroup?.value || 'NULL');
    console.log('  CO2:', merged.runningCosts?.co2Emissions?.value || 'NULL');
    console.log();

    // Issues
    console.log('⚠️  ISSUES:');
    if (!merged.model?.value) {
      console.log('  ❌ Model is NULL (likely rejected by validation)');
    }
    if (!merged.runningCosts?.annualTax?.value) {
      console.log('  ❌ Running costs NOT available');
    }
    if (dvlaData?.transmission !== checkCarData?.transmission) {
      console.log(`  ⚠️  Transmission mismatch: DVLA="${dvlaData?.transmission}" vs CheckCar="${checkCarData?.transmission}"`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickVerify();
