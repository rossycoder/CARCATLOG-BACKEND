require('dotenv').config();
const dvlaService = require('../services/dvlaService');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const dataMerger = require('../utils/dataMerger');

async function verifyMX08XMT() {
  const vrm = 'MX08XMT';
  
  console.log('='.repeat(80));
  console.log('🔍 TESTING MX08XMT - Data Merger Validation');
  console.log('='.repeat(80));
  console.log();

  try {
    // Step 1: Get DVLA Data
    console.log('📡 Step 1: Fetching DVLA Data...');
    console.log('-'.repeat(80));
    let dvlaData = null;
    try {
      const dvlaResponse = await dvlaService.getVehicleData(vrm);
      dvlaData = dvlaResponse;
      console.log('✅ DVLA Response:');
      console.log(JSON.stringify(dvlaData, null, 2));
    } catch (error) {
      console.log('❌ DVLA Error:', error.message);
    }
    console.log();

    // Step 2: Get CheckCarDetails Data
    console.log('📡 Step 2: Fetching CheckCarDetails Data...');
    console.log('-'.repeat(80));
    let checkCarData = null;
    try {
      const checkCarResponse = await CheckCarDetailsClient.getVehicleData(vrm);
      checkCarData = checkCarResponse;
      console.log('✅ CheckCarDetails Response:');
      console.log(JSON.stringify(checkCarData, null, 2));
    } catch (error) {
      console.log('❌ CheckCarDetails Error:', error.message);
    }
    console.log();

    // Step 3: Merge Data
    console.log('🔀 Step 3: Merging Data with DataMerger...');
    console.log('-'.repeat(80));
    const mergedData = dataMerger.merge(dvlaData, checkCarData, null);
    console.log('✅ Merged Data:');
    console.log(JSON.stringify(mergedData, null, 2));
    console.log();

    // Step 4: Analysis
    console.log('📊 Step 4: Data Analysis');
    console.log('-'.repeat(80));
    
    console.log('\n🎯 KEY FIELDS COMPARISON:');
    console.log('┌─────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐');
    console.log('│ Field           │ DVLA                 │ CheckCarDetails      │ Merged (Final)       │');
    console.log('├─────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤');
    
    const fields = ['make', 'model', 'transmission', 'bodyType', 'engineSize'];
    fields.forEach(field => {
      const dvlaVal = dvlaData?.[field] || 'NULL';
      const checkVal = checkCarData?.[field] || 'NULL';
      const mergedVal = mergedData?.[field]?.value || 'NULL';
      console.log(`│ ${field.padEnd(15)} │ ${String(dvlaVal).padEnd(20)} │ ${String(checkVal).padEnd(20)} │ ${String(mergedVal).padEnd(20)} │`);
    });
    console.log('└─────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘');

    console.log('\n💰 RUNNING COSTS:');
    console.log('┌─────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐');
    console.log('│ Field           │ DVLA                 │ CheckCarDetails      │ Merged (Final)       │');
    console.log('├─────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤');
    
    const runningCostFields = [
      { key: 'fuelEconomy.combined', label: 'Fuel Economy' },
      { key: 'annualTax', label: 'Annual Tax' },
      { key: 'insuranceGroup', label: 'Insurance Group' },
      { key: 'co2Emissions', label: 'CO2 Emissions' }
    ];
    
    runningCostFields.forEach(({ key, label }) => {
      const keys = key.split('.');
      let dvlaVal = dvlaData?.runningCosts || dvlaData;
      let checkVal = checkCarData?.runningCosts || checkCarData;
      let mergedVal = mergedData?.runningCosts;
      
      keys.forEach(k => {
        dvlaVal = dvlaVal?.[k];
        checkVal = checkVal?.[k];
        mergedVal = mergedVal?.[k];
      });
      
      dvlaVal = dvlaVal || 'NULL';
      checkVal = checkVal || 'NULL';
      mergedVal = mergedVal?.value || 'NULL';
      
      console.log(`│ ${label.padEnd(15)} │ ${String(dvlaVal).padEnd(20)} │ ${String(checkVal).padEnd(20)} │ ${String(mergedVal).padEnd(20)} │`);
    });
    console.log('└─────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘');

    // Step 5: Issues Detection
    console.log('\n⚠️  ISSUES DETECTED:');
    console.log('-'.repeat(80));
    
    const issues = [];
    
    // Check if model is just engine size
    if (mergedData.model?.value && /^\d+\.?\d*\s*L?\s*(petrol|diesel)?$/i.test(mergedData.model.value)) {
      issues.push(`❌ Model field contains engine size: "${mergedData.model.value}"`);
    }
    
    // Check if model is null
    if (!mergedData.model?.value) {
      issues.push('⚠️  Model field is NULL (may have been rejected by validation)');
    }
    
    // Check running costs availability
    const hasRunningCosts = mergedData.runningCosts?.annualTax?.value || 
                           mergedData.runningCosts?.insuranceGroup?.value ||
                           mergedData.runningCosts?.fuelEconomy?.combined?.value;
    
    if (!hasRunningCosts) {
      issues.push('❌ No running costs data available from any API');
    }
    
    // Check transmission mismatch
    if (dvlaData?.transmission && checkCarData?.transmission && 
        dvlaData.transmission !== checkCarData.transmission) {
      issues.push(`⚠️  Transmission mismatch: DVLA="${dvlaData.transmission}" vs CheckCar="${checkCarData.transmission}"`);
    }
    
    // Check body type mismatch
    if (dvlaData?.bodyType && checkCarData?.bodyType && 
        dvlaData.bodyType !== checkCarData.bodyType) {
      issues.push(`⚠️  Body Type mismatch: DVLA="${dvlaData.bodyType}" vs CheckCar="${checkCarData.bodyType}"`);
    }
    
    if (issues.length === 0) {
      console.log('✅ No issues detected - all data looks good!');
    } else {
      issues.forEach(issue => console.log(issue));
    }
    
    console.log();
    console.log('='.repeat(80));
    console.log('✅ Verification Complete');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Verification failed:', error);
    console.error(error.stack);
  }
}

verifyMX08XMT();
