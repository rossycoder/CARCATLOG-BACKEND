const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Bike = require('../models/Bike');

const sampleBikes = [
  {
    make: 'Honda',
    model: 'CBR600RR',
    year: 2022,
    price: 8500,
    mileage: 5000,
    color: 'Red',
    transmission: 'manual',
    fuelType: 'Petrol',
    description: 'Excellent condition Honda CBR600RR, full service history, one owner from new.',
    engineCC: 599,
    bikeType: 'Sport',
    condition: 'used',
    status: 'active',
    postcode: 'L1 8JQ',
    locationName: 'Liverpool',
    location: { type: 'Point', coordinates: [-2.9916, 53.4084] },
    images: ['https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800']
  },
  {
    make: 'Yamaha',
    model: 'MT-07',
    year: 2023,
    price: 7200,
    mileage: 2500,
    color: 'Blue',
    transmission: 'manual',
    fuelType: 'Petrol',
    description: 'Nearly new Yamaha MT-07, perfect first big bike or commuter.',
    engineCC: 689,
    bikeType: 'Naked',
    condition: 'used',
    status: 'active',
    postcode: 'M1 1AA',
    locationName: 'Manchester',
    location: { type: 'Point', coordinates: [-2.2426, 53.4808] },
    images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800']
  },
  {
    make: 'Kawasaki',
    model: 'Ninja 400',
    year: 2024,
    price: 5999,
    mileage: 0,
    color: 'Green',
    transmission: 'manual',
    fuelType: 'Petrol',
    description: 'Brand new Kawasaki Ninja 400, perfect A2 licence bike.',
    engineCC: 399,
    bikeType: 'Sport',
    condition: 'new',
    status: 'active',
    postcode: 'B1 1AA',
    locationName: 'Birmingham',
    location: { type: 'Point', coordinates: [-1.8904, 52.4862] },
    images: ['https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800']
  },
  {
    make: 'BMW',
    model: 'R1250GS',
    year: 2021,
    price: 14500,
    mileage: 12000,
    color: 'White',
    transmission: 'manual',
    fuelType: 'Petrol',
    description: 'BMW R1250GS Adventure, fully loaded with panniers and top box.',
    engineCC: 1254,
    bikeType: 'Adventure',
    condition: 'used',
    status: 'active',
    postcode: 'SW1A 1AA',
    locationName: 'London',
    location: { type: 'Point', coordinates: [-0.1276, 51.5074] },
    images: ['https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800']
  },
  {
    make: 'Ducati',
    model: 'Monster 821',
    year: 2020,
    price: 9800,
    mileage: 8500,
    color: 'Red',
    transmission: 'manual',
    fuelType: 'Petrol',
    description: 'Stunning Ducati Monster 821, Termignoni exhaust, carbon extras.',
    engineCC: 821,
    bikeType: 'Naked',
    condition: 'used',
    status: 'active',
    postcode: 'EH1 1AA',
    locationName: 'Edinburgh',
    location: { type: 'Point', coordinates: [-3.1883, 55.9533] },
    images: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800']
  },
  {
    make: 'Suzuki',
    model: 'GSX-R750',
    year: 2019,
    price: 7500,
    mileage: 15000,
    color: 'Blue/White',
    transmission: 'manual',
    fuelType: 'Petrol',
    description: 'Classic Suzuki GSX-R750, well maintained with full history.',
    engineCC: 750,
    bikeType: 'Sport',
    condition: 'used',
    status: 'active',
    postcode: 'G1 1AA',
    locationName: 'Glasgow',
    location: { type: 'Point', coordinates: [-4.2518, 55.8642] },
    images: ['https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800']
  },
  {
    make: 'Triumph',
    model: 'Street Triple RS',
    year: 2023,
    price: 11500,
    mileage: 3000,
    color: 'Silver',
    transmission: 'manual',
    fuelType: 'Petrol',
    description: 'Triumph Street Triple RS, quickshifter, Ohlins suspension.',
    engineCC: 765,
    bikeType: 'Naked',
    condition: 'used',
    status: 'active',
    postcode: 'LS1 1AA',
    locationName: 'Leeds',
    location: { type: 'Point', coordinates: [-1.5491, 53.8008] },
    images: ['https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=800']
  },
  {
    make: 'KTM',
    model: '390 Duke',
    year: 2024,
    price: 5499,
    mileage: 0,
    color: 'Orange',
    transmission: 'manual',
    fuelType: 'Petrol',
    description: 'Brand new KTM 390 Duke, A2 compliant, ready to ride.',
    engineCC: 373,
    bikeType: 'Naked',
    condition: 'new',
    status: 'active',
    postcode: 'BS1 1AA',
    locationName: 'Bristol',
    location: { type: 'Point', coordinates: [-2.5879, 51.4545] },
    images: ['https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800']
  },
  {
    make: 'Harley-Davidson',
    model: 'Iron 883',
    year: 2020,
    price: 8200,
    mileage: 6000,
    color: 'Black',
    transmission: 'manual',
    fuelType: 'Petrol',
    description: 'Harley-Davidson Iron 883, stage 1 kit, forward controls.',
    engineCC: 883,
    bikeType: 'Cruiser',
    condition: 'used',
    status: 'active',
    postcode: 'NE1 1AA',
    locationName: 'Newcastle',
    location: { type: 'Point', coordinates: [-1.6178, 54.9783] },
    images: ['https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800']
  },
  {
    make: 'Royal Enfield',
    model: 'Interceptor 650',
    year: 2022,
    price: 5800,
    mileage: 4500,
    color: 'Orange',
    transmission: 'manual',
    fuelType: 'Petrol',
    description: 'Royal Enfield Interceptor 650, classic styling, modern reliability.',
    engineCC: 648,
    bikeType: 'Classic',
    condition: 'used',
    status: 'active',
    postcode: 'CF10 1AA',
    locationName: 'Cardiff',
    location: { type: 'Point', coordinates: [-3.1791, 51.4816] },
    images: ['https://images.unsplash.com/photo-1558981033-0f0309284409?w=800']
  }
];

async function seedBikes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing bikes
    await Bike.deleteMany({});
    console.log('Cleared existing bikes');

    // Insert sample bikes
    const result = await Bike.insertMany(sampleBikes);
    console.log(`Inserted ${result.length} bikes`);

    console.log('\\nSample bikes:');
    result.forEach(bike => {
      console.log(`  - ${bike.make} ${bike.model} (${bike.year}) - £${bike.price} - ${bike.bikeType}`);
    });

    await mongoose.disconnect();
    console.log('\\nDone! Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding bikes:', error);
    process.exit(1);
  }
}

seedBikes();
