// Test the string conversion logic
const testData = {
  runningCosts: {
    fuelEconomy: {
      urban: null,
      extraUrban: null,
      combined: 470.8
    },
    annualTax: 195,
    co2Emissions: 17,
    insuranceGroup: null
  }
};

console.log('🧪 TESTING STRING CONVERSION');
console.log('============================');

console.log('\n📊 Original data:');
console.log(JSON.stringify(testData.runningCosts, null, 2));

console.log('\n🔧 After String() conversion:');
const converted = {
  fuelEconomy: {
    urban: String(testData.runningCosts.fuelEconomy.urban || ''),
    extraUrban: String(testData.runningCosts.fuelEconomy.extraUrban || ''),
    combined: String(testData.runningCosts.fuelEconomy.combined || '')
  },
  annualTax: String(testData.runningCosts.annualTax || ''),
  insuranceGroup: String(testData.runningCosts.insuranceGroup || ''),
  co2Emissions: String(testData.runningCosts.co2Emissions || '')
};

console.log(JSON.stringify(converted, null, 2));

console.log('\n✅ Expected frontend display:');
console.log('Combined MPG:', converted.fuelEconomy.combined || 'EMPTY');
console.log('Annual Tax:', converted.annualTax || 'EMPTY');
console.log('CO2 Emissions:', converted.co2Emissions || 'EMPTY');

console.log('\n🎯 Values for AutoFillField components:');
console.log('Combined MPG value prop:', `"${converted.fuelEconomy.combined}"`);
console.log('Annual Tax value prop:', `"${converted.annualTax}"`);
console.log('CO2 Emissions value prop:', `"${converted.co2Emissions}"`);

console.log('\n✅ All values are now strings - should display in frontend!');