require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function testAllAPIsForRunningCosts() {
  console.log('\n🔍 TESTING ALL APIs FOR RUNNING COSTS DATA');
  console.log('='.repeat(80));
  
  const dvlaKey = process.env.DVLA_API_KEY;
  const checkCarKey = process.env.CHECKCARD_API_KEY;
  const historyKey = process.env.HISTORY_API_KEY;
  const valuationKey = process.env.VALUATION_API_KEY;
  
  const registration = 'HUM777A';
  const mileage = 50000;
  
  console.log(`Testing Registration: ${registration}`);
  console.log(`Mileage: ${mileage}`);
  console.log('='.repeat(80));
  
  // 1. DVLA API
  console.log('\n📍 1. DVLA API:');
  try {
    const dvlaResponse = await axios.post(
      'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
      { registrationNumber: registration },
      {
        headers: {
          'x-api-key': dvlaKey,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ DVLA SUCCESS');
    console.log('Available Fields:', Object.keys(dvlaResponse.data).join(', '));
  } catch (error) {
    console.log('❌ DVLA ERROR:', error.message);
  }
  
  // 2. CheckCarDetails API
  console.log('\n📍 2. CheckCarDetails API:');
  try {
    const checkCarResponse = await axios.get(
      `https://api.checkcardetails.co.uk/vehicledata/vehicleregistration`,
      {
        params: {
          apikey: checkCarKey,
          vrm: registration
        }
      }
    );
    console.log('✅ CheckCarDetails SUCCESS');
    console.log('Available Fields:', Object.keys(checkCarResponse.data).join(', '));
  } catch (error) {
    console.log('❌ CheckCarDetails ERROR:', error.message);
  }
  
  // 3. History API
  console.log('\n📍 3. History API (Vehicle History):');
  try {
    const historyResponse = await axios.get(
      `https://uk1.ukvehicledata.co.uk/api/datapackage/VehicleData`,
      {
        params: {
          v: '2',
          api_nullitems: '1',
          auth_apikey: historyKey,
          user_tag: '',
          key_VRM: registration
        }
      }
    );
    console.log('✅ History API SUCCESS');
    console.log('Full Response:');
    console.log(JSON.stringify(historyResponse.data, null, 2));
    
    // Check for running costs fields
    if (historyResponse.data.Response?.DataItems) {
      const dataItems = historyResponse.data.Response.DataItems;
      console.log('\n🔍 Checking for Running Costs Fields:');
      
      // Check for fuel economy
      if (dataItems.FuelConsumptionUrban) {
        console.log('  ✅ Fuel Economy Urban:', dataItems.FuelConsumptionUrban);
      }
      if (dataItems.FuelConsumptionExtraUrban) {
        console.log('  ✅ Fuel Economy Extra Urban:', dataItems.FuelConsumptionExtraUrban);
      }
      if (dataItems.FuelConsumptionCombined) {
        console.log('  ✅ Fuel Economy Combined:', dataItems.FuelConsumptionCombined);
      }
      
      // Check for insurance group
      if (dataItems.InsuranceGroup) {
        console.log('  ✅ Insurance Group:', dataItems.InsuranceGroup);
      }
      
      // Check for previous owners
      if (dataItems.PreviousOwners) {
        console.log('  ✅ Previous Owners:', dataItems.PreviousOwners);
      }
      if (dataItems.NumberOfPreviousOwners) {
        console.log('  ✅ Number of Previous Owners:', dataItems.NumberOfPreviousOwners);
      }
      
      // Check for tax
      if (dataItems.VehicleTax) {
        console.log('  ✅ Vehicle Tax:', dataItems.VehicleTax);
      }
      if (dataItems.AnnualTax) {
        console.log('  ✅ Annual Tax:', dataItems.AnnualTax);
      }
    }
  } catch (error) {
    console.log('❌ History API ERROR:', error.response?.data || error.message);
  }
  
  // 4. Valuation API
  console.log('\n📍 4. Valuation API:');
  try {
    const valuationResponse = await axios.get(
      `https://uk1.ukvehicledata.co.uk/api/datapackage/ValuationData`,
      {
        params: {
          v: '2',
          api_nullitems: '1',
          auth_apikey: valuationKey,
          user_tag: '',
          key_VRM: registration,
          key_Mileage: mileage
        }
      }
    );
    console.log('✅ Valuation API SUCCESS');
    console.log('Full Response:');
    console.log(JSON.stringify(valuationResponse.data, null, 2));
    
    // Check for running costs fields
    if (valuationResponse.data.Response?.DataItems) {
      const dataItems = valuationResponse.data.Response.DataItems;
      console.log('\n🔍 Checking for Running Costs Fields:');
      
      // Check for fuel economy
      if (dataItems.FuelConsumptionUrban) {
        console.log('  ✅ Fuel Economy Urban:', dataItems.FuelConsumptionUrban);
      }
      if (dataItems.FuelConsumptionExtraUrban) {
        console.log('  ✅ Fuel Economy Extra Urban:', dataItems.FuelConsumptionExtraUrban);
      }
      if (dataItems.FuelConsumptionCombined) {
        console.log('  ✅ Fuel Economy Combined:', dataItems.FuelConsumptionCombined);
      }
      
      // Check for insurance group
      if (dataItems.InsuranceGroup) {
        console.log('  ✅ Insurance Group:', dataItems.InsuranceGroup);
      }
      
      // Check for tax
      if (dataItems.VehicleTax) {
        console.log('  ✅ Vehicle Tax:', dataItems.VehicleTax);
      }
      if (dataItems.AnnualTax) {
        console.log('  ✅ Annual Tax:', dataItems.AnnualTax);
      }
    }
  } catch (error) {
    console.log('❌ Valuation API ERROR:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
  
  process.exit(0);
}

testAllAPIsForRunningCosts();
