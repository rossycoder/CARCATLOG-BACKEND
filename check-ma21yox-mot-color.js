require('dotenv').config();
const CheckCarDetailsClient = require('./clients/CheckCarDetailsClient');

async function checkMA21YOXData() {
  console.log('🔍 Checking MA21YOX vehicle data from API...\n');
  
  const vrm = 'MA21YOX';
  const mileage = 1000;
  
  try {
    const client = new CheckCarDetailsClient();
    
    // Call VehicleSpecs API
    console.log('📞 Calling VehicleSpecs API...');
    const response = await client.getVehicleSpecs(vrm, mileage);
    
    console.log('\n✅ API Response received!\n');
    console.log('=' .repeat(80));
    
    // Extract MOT data
    console.log('\n🔧 MOT INFORMATION:');
    console.log('-'.repeat(80));
    
    if (response.Response?.DataItems?.MotHistoryData) {
      const motData = response.Response.DataItems.MotHistoryData;
      console.log('MOT Status:', motData.MotStatus || 'Not available');
      console.log('MOT Due Date:', motData.MotDueDate || 'Not available');
      console.log('MOT Expiry:', motData.MotExpiry || 'Not available');
      
      if (motData.MotTests && motData.MotTests.length > 0) {
        console.log('\nLatest MOT Test:');
        const latestTest = motData.MotTests[0];
        console.log('  Test Date:', latestTest.TestDate);
        console.log('  Expiry Date:', latestTest.ExpiryDate);
        console.log('  Result:', latestTest.TestResult);
        console.log('  Mileage:', latestTest.OdometerValue, latestTest.OdometerUnit);
      }
    } else {
      console.log('❌ No MOT data found in API response');
    }
    
    // Extract Color data
    console.log('\n🎨 COLOR INFORMATION:');
    console.log('-'.repeat(80));
    
    if (response.Response?.DataItems?.VehicleRegistration) {
      const vehReg = response.Response.DataItems.VehicleRegistration;
      console.log('Color (VehicleRegistration):', vehReg.Colour || 'Not available');
      console.log('Color Code:', vehReg.ColourCode || 'Not available');
    }
    
    if (response.Response?.DataItems?.ClassificationDetails) {
      const classDetails = response.Response.DataItems.ClassificationDetails;
      console.log('Color (ClassificationDetails):', classDetails.Colour || 'Not available');
    }
    
    if (response.Response?.DataItems?.VehicleStatus) {
      const vehStatus = response.Response.DataItems.VehicleStatus;
      console.log('Color (VehicleStatus):', vehStatus.Colour || 'Not available');
    }
    
    // Check all possible color fields
    console.log('\n🔍 Searching all fields for color...');
    const allData = JSON.stringify(response, null, 2);
    const colorMatches = allData.match(/"[Cc]olou?r[^"]*":\s*"([^"]+)"/g);
    
    if (colorMatches) {
      console.log('\nAll color-related fields found:');
      colorMatches.forEach(match => {
        console.log('  ', match);
      });
    }
    
    // Extract basic vehicle info
    console.log('\n🚗 BASIC VEHICLE INFO:');
    console.log('-'.repeat(80));
    
    if (response.Response?.DataItems?.VehicleRegistration) {
      const vehReg = response.Response.DataItems.VehicleRegistration;
      console.log('Make:', vehReg.Make);
      console.log('Model:', vehReg.Model);
      console.log('Year:', vehReg.YearOfManufacture);
      console.log('Fuel Type:', vehReg.FuelType);
      console.log('Body Type:', vehReg.BodyStyle);
      console.log('Engine Size:', vehReg.EngineCapacity, 'cc');
      console.log('Transmission:', vehReg.Transmission);
      console.log('Doors:', vehReg.NumberOfDoors);
      console.log('Seats:', vehReg.SeatingCapacity);
    }
    
    // Save full response for analysis
    console.log('\n💾 Saving full API response to file...');
    const fs = require('fs');
    fs.writeFileSync(
      'backend/ma21yox-full-response.json',
      JSON.stringify(response, null, 2)
    );
    console.log('✅ Saved to: backend/ma21yox-full-response.json');
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkMA21YOXData();
