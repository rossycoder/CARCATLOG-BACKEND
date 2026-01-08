const mongoose = require('mongoose');
require('dotenv').config();

const Van = require('../models/Van');

const newVans = [
  {
    make: 'Citroen',
    model: 'Berlingo',
    year: 2024,
    price: 23999,
    mileage: 0,
    color: 'White',
    transmission: 'manual',
    fuelType: 'Diesel',
    condition: 'new',
    vanType: 'Panel Van',
    payloadCapacity: 950,
    wheelbase: 'Medium',
    roofHeight: 'Medium',
    description: '1.5 950 Driver XL LWB Euro 6 (s/s) 6dr - Brand new with full manufacturer warranty',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop'],
    status: 'active',
    postcode: 'SW1A 1AA',
    latitude: 51.5014,
    longitude: -0.1419
  },
  {
    make: 'Land Rover',
    model: 'Defender 90',
    year: 2024,
    price: 65995,
    mileage: 0,
    color: 'Green',
    transmission: 'automatic',
    fuelType: 'Diesel',
    condition: 'new',
    vanType: 'Panel Van',
    payloadCapacity: 900,
    wheelbase: 'Short',
    roofHeight: 'High',
    description: '3.0 D350 MHEV X-Dynamic HSE Hard Top SUV Auto 4WD SWB Euro 6 (s/s) 3dr',
    images: ['https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=600&h=400&fit=crop'],
    status: 'active',
    postcode: 'M1 1AA',
    latitude: 53.4808,
    longitude: -2.2426
  },
  {
    make: 'Ford',
    model: 'Transit Custom',
    year: 2024,
    price: 32499,
    mileage: 0,
    color: 'White',
    transmission: 'manual',
    fuelType: 'Diesel',
    condition: 'new',
    vanType: 'Panel Van',
    payloadCapacity: 1100,
    wheelbase: 'Long',
    roofHeight: 'Medium',
    description: '2.0 280 EcoBlue Limited L1 H1 Euro 6 (s/s) 5dr - Ready for immediate delivery',
    images: ['https://images.unsplash.com/photo-1632245889029-e406faaa34cd?w=600&h=400&fit=crop'],
    status: 'active',
    postcode: 'B1 1AA',
    latitude: 52.4862,
    longitude: -1.8904
  },
  {
    make: 'Mercedes-Benz',
    model: 'Sprinter',
    year: 2024,
    price: 45999,
    mileage: 0,
    color: 'Silver',
    transmission: 'automatic',
    fuelType: 'Diesel',
    condition: 'new',
    vanType: 'Panel Van',
    payloadCapacity: 1500,
    wheelbase: 'Long',
    roofHeight: 'High',
    description: '314 CDI Premium L2 H2 FWD - Top spec with all the extras',
    images: ['https://images.unsplash.com/photo-1566008885218-90abf9200ddb?w=600&h=400&fit=crop'],
    status: 'active',
    postcode: 'LS1 1AA',
    latitude: 53.8008,
    longitude: -1.5491
  },
  {
    make: 'Volkswagen',
    model: 'Transporter',
    year: 2024,
    price: 38750,
    mileage: 0,
    color: 'Blue',
    transmission: 'automatic',
    fuelType: 'Diesel',
    condition: 'new',
    vanType: 'Panel Van',
    payloadCapacity: 1200,
    wheelbase: 'Medium',
    roofHeight: 'Medium',
    description: 'T6.1 2.0 TDI Highline SWB DSG - German engineering at its finest',
    images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&h=400&fit=crop'],
    status: 'active',
    postcode: 'G1 1AA',
    latitude: 55.8642,
    longitude: -4.2518
  },
  {
    make: 'Renault',
    model: 'Trafic',
    year: 2024,
    price: 29995,
    mileage: 0,
    color: 'White',
    transmission: 'manual',
    fuelType: 'Diesel',
    condition: 'new',
    vanType: 'Panel Van',
    payloadCapacity: 1100,
    wheelbase: 'Long',
    roofHeight: 'Low',
    description: 'LL30 Blue dCi 150 Sport - Sporty looks with practical space',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop'],
    status: 'active',
    postcode: 'EH1 1AA',
    latitude: 55.9533,
    longitude: -3.1883
  },
  {
    make: 'Peugeot',
    model: 'Expert',
    year: 2024,
    price: 27499,
    mileage: 0,
    color: 'Grey',
    transmission: 'manual',
    fuelType: 'Diesel',
    condition: 'new',
    vanType: 'Panel Van',
    payloadCapacity: 1000,
    wheelbase: 'Medium',
    roofHeight: 'Medium',
    description: '1400 2.0 BlueHDi 145 Professional Premium+ Standard - Fully loaded',
    images: ['https://images.unsplash.com/photo-1632245889029-e406faaa34cd?w=600&h=400&fit=crop'],
    status: 'active',
    postcode: 'CF1 1AA',
    latitude: 51.4816,
    longitude: -3.1791
  },
  {
    make: 'Vauxhall',
    model: 'Vivaro',
    year: 2024,
    price: 28750,
    mileage: 0,
    color: 'Black',
    transmission: 'manual',
    fuelType: 'Diesel',
    condition: 'new',
    vanType: 'Panel Van',
    payloadCapacity: 1050,
    wheelbase: 'Long',
    roofHeight: 'Medium',
    description: '2900 2.0 Turbo D 145 Sportive L2 H1 - British reliability',
    images: ['https://images.unsplash.com/photo-1566008885218-90abf9200ddb?w=600&h=400&fit=crop'],
    status: 'active',
    postcode: 'NE1 1AA',
    latitude: 54.9783,
    longitude: -1.6178
  },
  {
    make: 'Fiat',
    model: 'Ducato',
    year: 2024,
    price: 35999,
    mileage: 0,
    color: 'White',
    transmission: 'manual',
    fuelType: 'Diesel',
    condition: 'new',
    vanType: 'Luton',
    payloadCapacity: 1800,
    wheelbase: 'Extra Long',
    roofHeight: 'High',
    description: '35 MAXI 2.2 Multijet 180 Tecnico - Maximum cargo capacity',
    images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&h=400&fit=crop'],
    status: 'active',
    postcode: 'BS1 1AA',
    latitude: 51.4545,
    longitude: -2.5879
  },
  {
    make: 'Toyota',
    model: 'Proace',
    year: 2024,
    price: 31250,
    mileage: 0,
    color: 'Silver',
    transmission: 'automatic',
    fuelType: 'Diesel',
    condition: 'new',
    vanType: 'Panel Van',
    payloadCapacity: 1100,
    wheelbase: 'Medium',
    roofHeight: 'Medium',
    description: 'L2 2.0D 180 Design Auto - Japanese quality, European style',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop'],
    status: 'active',
    postcode: 'L1 1AA',
    latitude: 53.4084,
    longitude: -2.9916
  }
];

async function seedNewVans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove existing new vans (optional - comment out if you want to keep existing)
    const deleted = await Van.deleteMany({ condition: 'new' });
    console.log(`Deleted ${deleted.deletedCount} existing new vans`);

    // Insert new vans
    const result = await Van.insertMany(newVans);
    console.log(`Successfully inserted ${result.length} new vans`);

    // Verify
    const count = await Van.countDocuments({ condition: 'new', status: 'active' });
    console.log(`Total new active vans in database: ${count}`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error seeding vans:', error);
    process.exit(1);
  }
}

seedNewVans();
