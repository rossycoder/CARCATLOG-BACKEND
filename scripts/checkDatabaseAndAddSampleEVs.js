/**
 * Check Database and Add Sample Electric Vehicles
 * This script checks the current database state and adds sample EVs for testing
 */

const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('✅ Connected to MongoDB');
    
    // Check all cars in database
    console.log('\n📊 Current database state:');
    const allCars = await Car.find({});
    console.log(`Total cars in database: ${allCars.length}`);
    
    if (allCars.length > 0) {
      console.log('\n🚗 Cars in database:');
      allCars.forEach((car, index) => {
        console.log(`${index + 1}. ${car.make} ${car.model} ${car.variant || 'N/A'} (${car.registrationNumber}) - ${car.fuelType}`);
      });
      
      // Check for electric vehicles
      const electricCars = allCars.filter(car => car.fuelType === 'Electric');
      console.log(`\n🔋 Electric vehicles: ${electricCars.length}`);
      
      if (electricCars.length > 0) {
        electricCars.forEach((car, index) => {
          console.log(`${index + 1}. ${car.make} ${car.model} ${car.variant || 'N/A'} (${car.registrationNumber})`);
          console.log(`   - Range: ${car.electricRange || 'N/A'} miles`);
          console.log(`   - Battery: ${car.batteryCapacity || 'N/A'} kWh`);
          console.log(`   - Charging: ${car.rapidChargingSpeed || 'N/A'} kW rapid`);
        });
      }
    } else {
      console.log('❌ No cars found in database');
      console.log('\n🔧 Adding sample electric vehicles for testing...');
      
      // Add sample BMW i4 M50
      const bmwI4 = new Car({
        make: 'BMW',
        model: 'i4',
        variant: 'M50',
        year: 2022,
        price: 36971,
        estimatedValue: 36971,
        mileage: 2500,
        color: 'Storm Bay',
        transmission: 'automatic',
        fuelType: 'Electric',
        description: 'BMW i4 M50 Electric Vehicle with advanced features and zero emissions',
        images: ['https://example.com/bmw-i4-image.jpg'],
        condition: 'used',
        vehicleType: 'car',
        bodyType: 'Coupe',
        doors: 5,
        seats: 5,
        registrationNumber: 'BG22UCP',
        dataSource: 'DVLA',
        co2Emissions: 0,
        historyCheckStatus: 'verified',
        sellerContact: {
          type: 'private',
          phoneNumber: '07123456789',
          email: 'seller@example.com',
          postcode: 'SW1A 1AA'
        },
        isDealerListing: false,
        viewCount: 0,
        uniqueViewCount: 0,
        features: [
          'Electric Vehicle',
          'Zero Emissions',
          'Instant Torque',
          'Regenerative Braking',
          'BMW iDrive',
          'BMW ConnectedDrive',
          'Rapid Charging Compatible',
          'Home Charging Compatible'
        ],
        // Electric vehicle specific data
        runningCosts: {
          electricRange: 270,
          batteryCapacity: 83.9,
          chargingTime: 8.25,
          homeChargingSpeed: 11,
          publicChargingSpeed: 50,
          rapidChargingSpeed: 150,
          chargingTime10to80: 35,
          electricMotorPower: 400,
          electricMotorTorque: 795,
          chargingPortType: 'Type 2 / CCS',
          fastChargingCapability: 'CCS Rapid Charging up to 150kW',
          co2Emissions: 0,
          annualTax: 0
        },
        electricRange: 270,
        batteryCapacity: 83.9,
        chargingTime: 8.25,
        homeChargingSpeed: 11,
        publicChargingSpeed: 50,
        rapidChargingSpeed: 150,
        chargingTime10to80: 35,
        electricMotorPower: 400,
        electricMotorTorque: 795,
        chargingPortType: 'Type 2 / CCS',
        fastChargingCapability: 'CCS Rapid Charging up to 150kW',
        annualTax: 0,
        postcode: 'SW1A 1AA',
        locationName: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
        location: {
          type: 'Point',
          coordinates: [-0.1278, 51.5074]
        }
      });
      
      await bmwI4.save();
      console.log('✅ Added BMW i4 M50 (BG22UCP)');
      
      // Add sample BMW 3 Series (the "Unknown" model one)
      const bmw3Series = new Car({
        make: 'BMW',
        model: '3 Series',
        variant: '320d',
        year: 2017,
        price: 19408,
        estimatedValue: 19408,
        mileage: 2500,
        color: 'WHITE',
        transmission: 'manual',
        fuelType: 'Diesel',
        description: 'BMW 3 Series 320d with excellent fuel economy and BMW build quality',
        images: ['https://example.com/bmw-3series-image.jpg'],
        condition: 'used',
        vehicleType: 'car',
        bodyType: 'Saloon',
        doors: 4,
        seats: 5,
        engineSize: 2.0,
        registrationNumber: 'YD17AVU',
        dataSource: 'DVLA',
        co2Emissions: 120,
        historyCheckStatus: 'verified',
        sellerContact: {
          type: 'private',
          phoneNumber: '07123456789',
          email: 'seller@example.com',
          postcode: 'M1 1AA'
        },
        isDealerListing: false,
        viewCount: 0,
        uniqueViewCount: 0,
        features: [
          'BMW iDrive',
          'BMW ConnectedDrive',
          'Automatic Climate Control',
          'Cruise Control',
          'Parking Sensors',
          'Alloy Wheels'
        ],
        runningCosts: {
          fuelEconomy: {
            urban: 45,
            extraUrban: 65,
            combined: 55
          },
          co2Emissions: 120,
          insuranceGroup: '25E',
          annualTax: 150
        },
        fuelEconomyUrban: 45,
        fuelEconomyExtraUrban: 65,
        fuelEconomyCombined: 55,
        insuranceGroup: '25E',
        annualTax: 150,
        postcode: 'M1 1AA',
        locationName: 'Manchester',
        latitude: 53.4808,
        longitude: -2.2426,
        location: {
          type: 'Point',
          coordinates: [-2.2426, 53.4808]
        }
      });
      
      await bmw3Series.save();
      console.log('✅ Added BMW 3 Series 320d (YD17AVU)');
      
      // Add a Tesla Model 3 for comparison
      const teslaModel3 = new Car({
        make: 'Tesla',
        model: 'Model 3',
        variant: 'Long Range',
        year: 2023,
        price: 45000,
        estimatedValue: 45000,
        mileage: 1000,
        color: 'Pearl White',
        transmission: 'automatic',
        fuelType: 'Electric',
        description: 'Tesla Model 3 Long Range with Autopilot and Supercharger access',
        images: ['https://example.com/tesla-model3-image.jpg'],
        condition: 'used',
        vehicleType: 'car',
        bodyType: 'Saloon',
        doors: 4,
        seats: 5,
        registrationNumber: 'TE23SLA',
        dataSource: 'DVLA',
        co2Emissions: 0,
        historyCheckStatus: 'verified',
        sellerContact: {
          type: 'private',
          phoneNumber: '07123456789',
          email: 'seller@example.com',
          postcode: 'EC1A 1BB'
        },
        isDealerListing: false,
        viewCount: 0,
        uniqueViewCount: 0,
        features: [
          'Electric Vehicle',
          'Zero Emissions',
          'Instant Torque',
          'Regenerative Braking',
          'Tesla Supercharger Network',
          'Over-the-Air Updates',
          'Autopilot Ready',
          'One-pedal driving'
        ],
        runningCosts: {
          electricRange: 358,
          batteryCapacity: 75,
          chargingTime: 10,
          homeChargingSpeed: 11,
          publicChargingSpeed: 150,
          rapidChargingSpeed: 250,
          chargingTime10to80: 30,
          electricMotorPower: 239,
          electricMotorTorque: 420,
          chargingPortType: 'Tesla Supercharger / Type 2',
          fastChargingCapability: 'Tesla Supercharger up to 250kW',
          co2Emissions: 0,
          annualTax: 0
        },
        electricRange: 358,
        batteryCapacity: 75,
        chargingTime: 10,
        homeChargingSpeed: 11,
        publicChargingSpeed: 150,
        rapidChargingSpeed: 250,
        chargingTime10to80: 30,
        electricMotorPower: 239,
        electricMotorTorque: 420,
        chargingPortType: 'Tesla Supercharger / Type 2',
        fastChargingCapability: 'Tesla Supercharger up to 250kW',
        annualTax: 0,
        postcode: 'EC1A 1BB',
        locationName: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
        location: {
          type: 'Point',
          coordinates: [-0.1278, 51.5074]
        }
      });
      
      await teslaModel3.save();
      console.log('✅ Added Tesla Model 3 Long Range (TE23SLA)');
      
      console.log('\n🎉 Sample electric vehicles added successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  checkDatabase();
}

module.exports = { checkDatabase };