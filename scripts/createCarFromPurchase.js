require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function createCar() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await User.findOne({ email: 'rozeena031@gmail.com' });
  
  const car = new Car({
    advertId: '75e4acac-3789-4dd0-b656-c89a4915c30a',
    userId: user._id,
    make: 'HONDA',
    model: 'Civic',
    year: 2008,
    mileage: 5000,
    color: 'SILVER',
    fuelType: 'Diesel',
    transmission: 'manual',
    registrationNumber: 'RJ08PFA',
    engineSize: 2.2,
    bodyType: '3 DOOR HATCHBACK',
    doors: 3,
    seats: 5,
    co2Emissions: 138,
    dataSource: 'DVLA',
    condition: 'used',
    price: 2222,
    description: 'Description\nYou have not added a description yet.',
    images: [
      'https://res.cloudinary.com/dexgkptpg/image/upload/v1769530937/car-adverts/75e4acac-3789-4dd0-b656-c89a4915c30a/pxpoghufuhfd0cedzlmt.png',
      'https://res.cloudinary.com/dexgkptpg/image/upload/v1769530947/car-adverts/75e4acac-3789-4dd0-b656-c89a4915c30a/a26rwsgeh89rq3djv2gh.png'
    ],
    postcode: 'M11AE',
    locationName: 'Manchester',
    latitude: 53.483487,
    longitude: -2.231182,
    location: {
      type: 'Point',
      coordinates: [-2.231182, 53.483487]
    },
    sellerContact: {
      phoneNumber: '+44 7446 975601',
      email: 'rozeena031@gmail.com',
      allowEmailContact: false,
      postcode: 'M11AE'
    },
    features: ['Adaptive Cruise Control', 'Keyless Entry', 'Blind Spot Monitor'],
    videoUrl: 'https://youtu.be/GHwcgyJLKZQ?si=6Yhpju8ksnQnGRHQ',
    advertisingPackage: {
      packageId: 'gold',
      packageName: 'Gold',
      duration: '4 weeks',
      price: 2299,
      purchaseDate: new Date(),
      expiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      stripeSessionId: 'test_session',
      stripePaymentIntentId: 'test_payment'
    },
    advertStatus: 'active',
    publishedAt: new Date()
  });
  
  await car.save();
  console.log('Car created:', car._id);
  
  await mongoose.disconnect();
}

createCar().catch(console.error);
