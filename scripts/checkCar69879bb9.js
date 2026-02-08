const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function checkCar69879bb9() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    const carId = '69879bb9d4a7f60f5dfb4083';
    
    // Find the car
    const car = await Car.findById(carId).populate('historyCheckId');
    
    if (!car) {
      console.log('❌ Car not found in database');
      return;
    }

    console.log('=== CAR IN DATABASE ===');
    console.log(`Registration: ${car.registrationNumber}`);
    console.log(`Make/Model: ${car.make} ${car.model}`);
    console.log(`Year: ${car.year}`);
    console.log(`Fuel Type: ${car.fuelType}`);
    console.log(`Engine Size: ${car.engineSize}`);
    console.log(`Transmission: ${car.transmission}`);
    console.log(`Mileage: ${car.mileage}`);
    console.log(`Color: ${car.color}`);
    console.log(`Doors: ${car.doors}`);
    console.log(`Seats: ${car.seats}`);
    console.log(`Variant: ${car.variant}`);
    console.log(`Body Type: ${car.bodyType}`);
    console.log(`CO2 Emissions: ${car.co2Emissions}`);
    console.log(`Insurance Group: ${car.insuranceGroup}`);
    console.log(`Annual Tax: ${car.annualTax}`);
    console.log(`Combined MPG: ${car.combinedMpg}`);
    console.log(`Urban MPG: ${car.urbanMpg}`);
    console.log(`Extra Urban MPG: ${car.extraUrbanMpg}`);
    
    console.log('\n=== MOT DATA ===');
    console.log(`MOT Status: ${car.motStatus}`);
    console.log(`MOT Due: ${car.motDue}`);
    console.log(`MOT Expiry: ${car.motExpiry}`);
    console.log(`MOT History Count: ${car.motHistory ? car.motHistory.length : 0}`);
    
    console.log('\n=== VALUATION DATA ===');
    console.log(`Estimated Value: ${car.estimatedValue}`);
    console.log(`Private Price: ${car.privatePrice}`);
    console.log(`Dealer Price: ${car.dealerPrice}`);
    console.log(`Part Exchange Price: ${car.partExchangePrice}`);
    
    console.log('\n=== RUNNING COSTS ===');
    if (car.runningCosts) {
      console.log(`Annual Tax: ${car.runningCosts.annualTax}`);
      console.log(`Insurance Group: ${car.runningCosts.insuranceGroup}`);
      console.log(`Combined MPG: ${car.runningCosts.combinedMpg}`);
      console.log(`CO2 Emissions: ${car.runningCosts.co2Emissions}`);
    } else {
      console.log('No running costs data');
    }

    console.log('\n=== VEHICLE HISTORY ===');
    if (car.historyCheckId) {
      console.log(`Previous Owners: ${car.historyCheckId.numberOfPreviousKeepers}`);
      console.log(`Write Off Category: ${car.historyCheckId.writeOffCategory}`);
      console.log(`Exported: ${car.historyCheckId.exported}`);
      console.log(`Scrapped: ${car.historyCheckId.scrapped}`);
    } else {
      console.log('No vehicle history linked');
    }

    // Now check what API would return
    console.log('\n=== CHECKING API DATA ===');
    
    if (!car.registrationNumber) {
      console.log('❌ No registration number to check API');
      return;
    }

    try {
      // Initialize API client
      const client = new CheckCarDetailsClient();
      
      console.log(`\n🔍 Fetching fresh API data for: ${car.registrationNumber}`);
      
      // Get vehicle specs
      console.log('\n--- Vehicle Specs API ---');
      try {
        const specsData = await client.getVehicleSpecs(car.registrationNumber);
        console.log('✅ Vehicle Specs API Response:');
        console.log(`   Make: ${specsData.make}`);
        console.log(`   Model: ${specsData.model}`);
        console.log(`   Variant: ${specsData.variant}`);
        console.log(`   Engine Size: ${specsData.engineSize}`);
        console.log(`   Fuel Type: ${specsData.fuelType}`);
        console.log(`   Transmission: ${specsData.transmission}`);
        console.log(`   Body Type: ${specsData.bodyType}`);
        console.log(`   Doors: ${specsData.doors}`);
        console.log(`   Seats: ${specsData.seats}`);
        console.log(`   CO2 Emissions: ${specsData.co2Emissions}`);
        console.log(`   Insurance Group: ${specsData.insuranceGroup}`);
        console.log(`   Annual Tax: ${specsData.annualTax}`);
        console.log(`   Combined MPG: ${specsData.combinedMpg}`);
        console.log(`   Urban MPG: ${specsData.urbanMpg}`);
        console.log(`   Extra Urban MPG: ${specsData.extraUrbanMpg}`);
        
        // Compare with database
        console.log('\n--- COMPARISON: Database vs API ---');
        const comparisons = [
          { field: 'Make', db: car.make, api: specsData.make },
          { field: 'Model', db: car.model, api: specsData.model },
          { field: 'Variant', db: car.variant, api: specsData.variant },
          { field: 'Engine Size', db: car.engineSize, api: specsData.engineSize },
          { field: 'Fuel Type', db: car.fuelType, api: specsData.fuelType },
          { field: 'Transmission', db: car.transmission, api: specsData.transmission },
          { field: 'Body Type', db: car.bodyType, api: specsData.bodyType },
          { field: 'Doors', db: car.doors, api: specsData.doors },
          { field: 'Seats', db: car.seats, api: specsData.seats },
          { field: 'CO2 Emissions', db: car.co2Emissions, api: specsData.co2Emissions },
          { field: 'Insurance Group', db: car.insuranceGroup, api: specsData.insuranceGroup },
          { field: 'Annual Tax', db: car.annualTax, api: specsData.annualTax },
          { field: 'Combined MPG', db: car.combinedMpg, api: specsData.combinedMpg },
          { field: 'Urban MPG', db: car.urbanMpg, api: specsData.urbanMpg },
          { field: 'Extra Urban MPG', db: car.extraUrbanMpg, api: specsData.extraUrbanMpg }
        ];

        let missingFields = [];
        let differentFields = [];

        comparisons.forEach(comp => {
          if (!comp.db && comp.api) {
            missingFields.push(`${comp.field}: Missing in DB (API has: ${comp.api})`);
          } else if (comp.db && comp.api && comp.db !== comp.api) {
            differentFields.push(`${comp.field}: DB="${comp.db}" vs API="${comp.api}"`);
          }
        });

        if (missingFields.length > 0) {
          console.log('\n❌ MISSING FIELDS IN DATABASE:');
          missingFields.forEach(field => console.log(`   ${field}`));
        }

        if (differentFields.length > 0) {
          console.log('\n⚠️  DIFFERENT VALUES:');
          differentFields.forEach(field => console.log(`   ${field}`));
        }

        if (missingFields.length === 0 && differentFields.length === 0) {
          console.log('\n✅ All vehicle specs data matches between DB and API');
        }

      } catch (error) {
        console.log(`❌ Vehicle Specs API failed: ${error.message}`);
      }

      // Get valuation data
      console.log('\n--- Valuation API ---');
      try {
        const valuationData = await client.getValuation(car.registrationNumber, car.mileage || 50000);
        console.log('✅ Valuation API Response:');
        console.log(`   Private Price: £${valuationData.privatePrice}`);
        console.log(`   Dealer Price: £${valuationData.dealerPrice}`);
        console.log(`   Part Exchange Price: £${valuationData.partExchangePrice}`);
        console.log(`   Estimated Value: £${valuationData.estimatedValue}`);
        
        console.log('\n--- VALUATION COMPARISON ---');
        console.log(`   DB Estimated Value: £${car.estimatedValue || 'Missing'}`);
        console.log(`   API Estimated Value: £${valuationData.estimatedValue}`);
        
        if (!car.estimatedValue && valuationData.estimatedValue) {
          console.log('❌ VALUATION MISSING IN DATABASE');
        }

      } catch (error) {
        console.log(`❌ Valuation API failed: ${error.message}`);
      }

      // Get MOT history
      console.log('\n--- MOT History API ---');
      try {
        const motData = await client.getMOTHistory(car.registrationNumber);
        console.log('✅ MOT History API Response:');
        console.log(`   Current Status: ${motData.currentStatus}`);
        console.log(`   Expiry Date: ${motData.expiryDate}`);
        console.log(`   Tests Count: ${motData.tests ? motData.tests.length : 0}`);
        
        if (motData.tests && motData.tests.length > 0) {
          const latestTest = motData.tests[0];
          console.log(`   Latest Test: ${latestTest.testResult} on ${latestTest.testDate}`);
          console.log(`   Latest Expiry: ${latestTest.expiryDate}`);
        }

        console.log('\n--- MOT COMPARISON ---');
        console.log(`   DB MOT Status: ${car.motStatus || 'Missing'}`);
        console.log(`   API MOT Status: ${motData.currentStatus}`);
        console.log(`   DB MOT Due: ${car.motDue || 'Missing'}`);
        console.log(`   API MOT Expiry: ${motData.expiryDate}`);

      } catch (error) {
        console.log(`❌ MOT History API failed: ${error.message}`);
      }

    } catch (error) {
      console.log(`❌ API check failed: ${error.message}`);
    }

    console.log('\n=== SUMMARY ===');
    console.log('Check the comparison above to see what data is missing or different');
    console.log('If API has more data than database, the auto-complete service should fix it');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkCar69879bb9();