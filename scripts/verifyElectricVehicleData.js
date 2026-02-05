/**
 * Verify Electric Vehicle Data Script
 * Displays comprehensive electric vehicle data to verify enhancements
 */

const mongoose = require('mongoose');
const Car = require('../models/Car');

async function verifyElectricVehicleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('✅ Connected to MongoDB');
    
    // Get all electric vehicles
    const electricCars = await Car.find({ fuelType: 'Electric' });
    console.log(`\n🔋 Found ${electricCars.length} electric vehicles in database\n`);
    
    electricCars.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model} ${car.variant} (${car.registrationNumber})`);
      console.log(`   📊 Basic Info:`);
      console.log(`      - Year: ${car.year}`);
      console.log(`      - Price: £${car.price?.toLocaleString()}`);
      console.log(`      - Mileage: ${car.mileage?.toLocaleString()} miles`);
      console.log(`      - Color: ${car.color}`);
      console.log(`      - Body Type: ${car.bodyType}`);
      
      console.log(`   🔋 Electric Vehicle Data:`);
      console.log(`      - Range: ${car.electricRange || car.runningCosts?.electricRange || 'N/A'} miles`);
      console.log(`      - Battery Capacity: ${car.batteryCapacity || car.runningCosts?.batteryCapacity || 'N/A'} kWh`);
      console.log(`      - Motor Power: ${car.electricMotorPower || car.runningCosts?.electricMotorPower || 'N/A'} kW`);
      console.log(`      - Motor Torque: ${car.electricMotorTorque || car.runningCosts?.electricMotorTorque || 'N/A'} Nm`);
      
      console.log(`   ⚡ Charging Information:`);
      console.log(`      - Home Charging: ${car.homeChargingSpeed || car.runningCosts?.homeChargingSpeed || 'N/A'} kW`);
      console.log(`      - Public Charging: ${car.publicChargingSpeed || car.runningCosts?.publicChargingSpeed || 'N/A'} kW`);
      console.log(`      - Rapid Charging: ${car.rapidChargingSpeed || car.runningCosts?.rapidChargingSpeed || 'N/A'} kW`);
      console.log(`      - Charging Time (0-100%): ${car.chargingTime || car.runningCosts?.chargingTime || 'N/A'} hours`);
      console.log(`      - Rapid Charging (10-80%): ${car.chargingTime10to80 || car.runningCosts?.chargingTime10to80 || 'N/A'} minutes`);
      console.log(`      - Charging Port: ${car.chargingPortType || car.runningCosts?.chargingPortType || 'N/A'}`);
      console.log(`      - Fast Charging: ${car.fastChargingCapability || car.runningCosts?.fastChargingCapability || 'N/A'}`);
      
      console.log(`   💰 Running Costs:`);
      console.log(`      - CO2 Emissions: ${car.co2Emissions || car.runningCosts?.co2Emissions || 'N/A'} g/km`);
      console.log(`      - Annual Tax: £${car.annualTax || car.runningCosts?.annualTax || 'N/A'}`);
      console.log(`      - Insurance Group: ${car.insuranceGroup || car.runningCosts?.insuranceGroup || 'N/A'}`);
      
      console.log(`   🎯 Features (${car.features?.length || 0}):`);
      if (car.features && car.features.length > 0) {
        car.features.forEach(feature => {
          console.log(`      - ${feature}`);
        });
      }
      
      console.log(`   📍 Location:`);
      console.log(`      - Postcode: ${car.postcode}`);
      console.log(`      - Location: ${car.locationName}`);
      console.log(`      - Coordinates: ${car.latitude}, ${car.longitude}`);
      
      console.log(`   📈 Analytics:`);
      console.log(`      - View Count: ${car.viewCount}`);
      console.log(`      - Unique Views: ${car.uniqueViewCount}`);
      console.log(`      - History Status: ${car.historyCheckStatus}`);
      
      console.log(`   🔧 Technical:`);
      console.log(`      - Data Source: ${car.dataSource}`);
      console.log(`      - Dealer Listing: ${car.isDealerListing ? 'Yes' : 'No'}`);
      console.log(`      - Created: ${car.createdAt?.toLocaleDateString()}`);
      console.log(`      - Updated: ${car.updatedAt?.toLocaleDateString()}`);
      
      console.log('\n' + '='.repeat(80) + '\n');
    });
    
    // Summary statistics
    console.log(`📊 Electric Vehicle Summary:`);
    console.log(`   - Total EVs: ${electricCars.length}`);
    console.log(`   - Average Range: ${Math.round(electricCars.reduce((sum, car) => sum + (car.electricRange || car.runningCosts?.electricRange || 0), 0) / electricCars.length)} miles`);
    console.log(`   - Average Battery: ${Math.round(electricCars.reduce((sum, car) => sum + (car.batteryCapacity || car.runningCosts?.batteryCapacity || 0), 0) / electricCars.length)} kWh`);
    console.log(`   - Average Price: £${Math.round(electricCars.reduce((sum, car) => sum + (car.price || 0), 0) / electricCars.length).toLocaleString()}`);
    
    const makes = [...new Set(electricCars.map(car => car.make))];
    console.log(`   - Makes: ${makes.join(', ')}`);
    
    const chargingTypes = [...new Set(electricCars.map(car => car.chargingPortType || car.runningCosts?.chargingPortType).filter(Boolean))];
    console.log(`   - Charging Types: ${chargingTypes.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error verifying electric vehicle data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  verifyElectricVehicleData();
}

module.exports = { verifyElectricVehicleData };