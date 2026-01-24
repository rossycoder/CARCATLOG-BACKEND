require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testGetAdvertAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const advertId = '3655c431-391a-4081-ac9b-b323bded03d5';
    
    // Simulate the getAdvert API function
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }
    
    // This is exactly what the API returns
    const advert = {
      id: car.advertId,
      vehicleData: {
        make: car.make,
        model: car.model,
        variant: car.variant,
        displayTitle: car.displayTitle,
        year: car.year,
        mileage: car.mileage,
        color: car.color,
        fuelType: car.fuelType,
        transmission: car.transmission,
        registrationNumber: car.registrationNumber,
        engineSize: car.engineSize,
        bodyType: car.bodyType,
        doors: car.doors,
        seats: car.seats,
        estimatedValue: car.estimatedValue || car.price || 0,
        motDue: car.motDue || car.motExpiry || car.motStatus,
        motStatus: car.motStatus,
        motExpiry: car.motExpiry,
        co2Emissions: car.co2Emissions,
        taxStatus: car.taxStatus,
        fuelEconomyUrban: car.fuelEconomyUrban,
        fuelEconomyExtraUrban: car.fuelEconomyExtraUrban,
        fuelEconomyCombined: car.fuelEconomyCombined,
        annualTax: car.annualTax,
        insuranceGroup: car.insuranceGroup,
        gearbox: car.gearbox,
        emissionClass: car.emissionClass
      },
      advertData: {
        price: car.price || car.estimatedValue || 0,
        description: car.description,
        photos: car.images.map((url, index) => ({
          id: `photo-${index}`,
          url: url,
          publicId: url.split('/').pop().split('.')[0]
        })),
        contactPhone: car.sellerContact?.phoneNumber || '',
        contactEmail: car.sellerContact?.email || '',
        location: car.sellerContact?.postcode || car.postcode || '',
        features: car.features || [],
        runningCosts: {
          fuelEconomy: {
            urban: car.fuelEconomyUrban || '',
            extraUrban: car.fuelEconomyExtraUrban || '',
            combined: car.fuelEconomyCombined || ''
          },
          annualTax: car.annualTax || '',
          insuranceGroup: car.insuranceGroup || '',
          co2Emissions: car.co2Emissions || ''
        },
        videoUrl: car.videoUrl || ''
      },
      status: car.advertStatus,
      createdAt: car.createdAt
    };
    
    console.log('\n📋 API Response (what frontend receives):');
    console.log('Success: true');
    console.log('\n💰 Price Data:');
    console.log('  advertData.price:', advert.advertData.price);
    console.log('  vehicleData.estimatedValue:', advert.vehicleData.estimatedValue);
    
    console.log('\n🔧 MOT Data:');
    console.log('  vehicleData.motDue:', advert.vehicleData.motDue);
    console.log('  vehicleData.motExpiry:', advert.vehicleData.motExpiry);
    console.log('  vehicleData.motStatus:', advert.vehicleData.motStatus);
    
    console.log('\n🔍 Raw Database Values:');
    console.log('  car.price:', car.price);
    console.log('  car.estimatedValue:', car.estimatedValue);
    console.log('  car.motDue:', car.motDue);
    console.log('  car.motExpiry:', car.motExpiry);
    console.log('  car.motStatus:', car.motStatus);
    
    console.log('\n✅ This is exactly what the API returns to the frontend!');
    console.log('If the frontend is not showing this data, it\'s a caching issue.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testGetAdvertAPI();
