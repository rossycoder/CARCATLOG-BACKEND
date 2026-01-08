const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Car = require('../models/Car');

dotenv.config();

// Sample UK postcodes with coordinates
const ukLocations = [
  { postcode: 'SW1A 1AA', latitude: 51.5014, longitude: -0.1419 }, // Westminster, London
  { postcode: 'M1 1AE', latitude: 53.4808, longitude: -2.2426 }, // Manchester
  { postcode: 'B1 1AA', latitude: 52.4862, longitude: -1.8904 }, // Birmingham
  { postcode: 'LS1 1UR', latitude: 53.7997, longitude: -1.5492 }, // Leeds
  { postcode: 'G1 1AA', latitude: 55.8642, longitude: -4.2518 }, // Glasgow
  { postcode: 'EH1 1YZ', latitude: 55.9533, longitude: -3.1883 }, // Edinburgh
  { postcode: 'L1 1AA', latitude: 53.4084, longitude: -2.9916 }, // Liverpool
  { postcode: 'BS1 1AA', latitude: 51.4545, longitude: -2.5879 }, // Bristol
  { postcode: 'NE1 1AA', latitude: 54.9783, longitude: -1.6178 }, // Newcastle
  { postcode: 'S1 1AA', latitude: 53.3811, longitude: -1.4701 }, // Sheffield
  { postcode: 'NG1 1AA', latitude: 52.9548, longitude: -1.1581 }, // Nottingham
  { postcode: 'CV1 1AA', latitude: 52.4081, longitude: -1.5106 }, // Coventry
  { postcode: 'SO14 0AA', latitude: 50.9097, longitude: -1.4044 }, // Southampton
  { postcode: 'PO1 1AA', latitude: 50.8198, longitude: -1.0880 }, // Portsmouth
  { postcode: 'RG1 1AA', latitude: 51.4543, longitude: -0.9781 }, // Reading
  { postcode: 'OX1 1AA', latitude: 51.7520, longitude: -1.2577 }, // Oxford
  { postcode: 'CB1 1AA', latitude: 52.2053, longitude: 0.1218 }, // Cambridge
  { postcode: 'BN1 1AA', latitude: 50.8225, longitude: -0.1372 }, // Brighton
  { postcode: 'CF10 1AA', latitude: 51.4816, longitude: -3.1791 }, // Cardiff
  { postcode: 'AB10 1AA', latitude: 57.1497, longitude: -2.0943 }, // Aberdeen
];

const makes = ['Ford', 'Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Toyota', 'Honda', 'Nissan', 'Vauxhall', 'Peugeot'];
const models = {
  Ford: ['Focus', 'Fiesta', 'Mondeo', 'Kuga'],
  Volkswagen: ['Golf', 'Polo', 'Passat', 'Tiguan'],
  BMW: ['3 Series', '5 Series', 'X3', 'X5'],
  Mercedes: ['C-Class', 'E-Class', 'GLC', 'A-Class'],
  Audi: ['A3', 'A4', 'Q3', 'Q5'],
  Toyota: ['Corolla', 'RAV4', 'Yaris', 'Camry'],
  Honda: ['Civic', 'CR-V', 'Jazz', 'Accord'],
  Nissan: ['Qashqai', 'Juke', 'Leaf', 'Micra'],
  Vauxhall: ['Corsa', 'Astra', 'Insignia', 'Mokka'],
  Peugeot: ['208', '308', '3008', '5008']
};

const colors = ['Black', 'White', 'Silver', 'Blue', 'Red', 'Grey', 'Green'];
const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const transmissions = ['automatic', 'manual'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedCars() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');

    // Clear existing cars (optional - comment out if you want to keep existing data)
    // await Car.deleteMany({});
    // console.log('🗑️  Cleared existing cars');

    const cars = [];

    // Generate 50 sample cars
    for (let i = 0; i < 50; i++) {
      const location = getRandomElement(ukLocations);
      const make = getRandomElement(makes);
      const model = getRandomElement(models[make]);
      const year = getRandomNumber(2015, 2024);
      const mileage = getRandomNumber(5000, 100000);
      const price = getRandomNumber(8000, 45000);

      const car = {
        make,
        model,
        year,
        price,
        mileage,
        color: getRandomElement(colors),
        transmission: getRandomElement(transmissions),
        fuelType: getRandomElement(fuelTypes),
        description: `${year} ${make} ${model} in excellent condition. Well maintained with full service history.`,
        postcode: location.postcode,
        latitude: location.latitude,
        longitude: location.longitude,
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        condition: year >= 2023 ? 'new' : 'used',
        bodyType: 'Saloon',
        doors: getRandomNumber(3, 5),
        seats: getRandomNumber(4, 7),
        engineSize: parseFloat((Math.random() * 2 + 1).toFixed(1)),
        images: [
          'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80'
        ],
        dataSource: 'manual',
        advertStatus: 'active'
      };

      cars.push(car);
    }

    // Insert cars into database
    await Car.insertMany(cars);
    console.log(`✅ Successfully seeded ${cars.length} cars with postcode data`);

    // Display sample of created cars
    console.log('\n📋 Sample cars created:');
    cars.slice(0, 5).forEach((car, index) => {
      console.log(`${index + 1}. ${car.year} ${car.make} ${car.model} - ${car.postcode} (${car.latitude}, ${car.longitude})`);
    });

    mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding cars:', error);
    process.exit(1);
  }
}

// Run the seed function
seedCars();
