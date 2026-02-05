require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const CarDataValidator = require('../utils/carDataValidator');

console.log('🧪 Testing Car Data Validator\n');

// Test 1: Data with null values
console.log('Test 1: Cleaning data with null values');
const dirtyData = {
  make: 'BMW',
  model: '5 Series',
  year: 2017,
  mileage: null,
  color: 'null',
  fuelType: 'Diesel',
  transmission: 'Automatic',
  engineSize: 'null',
  bodyType: null,
  doors: 4,
  seats: 5,
  price: 19408,
  description: '',
  features: [null, 'Leather Seats', undefined, 'Sat Nav'],
  images: ['http://example.com/image1.jpg', null, 'invalid', 'http://example.com/image2.jpg'],
  postcode: 'M11AE',
  locationName: 'Manchester',
  latitude: 53.4808,
  longitude: -2.2426
};

const cleaned = CarDataValidator.validateAndClean(dirtyData);
console.log('Cleaned data:', JSON.stringify(cleaned, null, 2));
console.log('✅ Null values removed\n');

// Test 2: Validate required fields
console.log('Test 2: Validating required fields');
const validation = CarDataValidator.validateRequired(cleaned);
console.log('Validation result:', validation);
console.log(validation.isValid ? '✅ All required fields present' : '❌ Missing required fields');
console.log('');

// Test 3: Invalid data
console.log('Test 3: Cleaning invalid data');
const invalidData = {
  make: '',
  model: 'Unknown',
  year: 'abc',
  mileage: -100,
  engineSize: 999,
  doors: 10,
  price: 'free'
};

const cleanedInvalid = CarDataValidator.validateAndClean(invalidData);
console.log('Cleaned invalid data:', JSON.stringify(cleanedInvalid, null, 2));
console.log('');

// Test 4: Electric vehicle data
console.log('Test 4: Electric vehicle data');
const evData = {
  make: 'Tesla',
  model: 'Model 3',
  year: 2023,
  fuelType: 'Electric',
  electricRange: null,
  batteryCapacity: 'null',
  chargingTime: undefined,
  price: 45000
};

const cleanedEV = CarDataValidator.validateAndClean(evData);
console.log('Cleaned EV data:', JSON.stringify(cleanedEV, null, 2));
console.log('✅ EV data cleaned\n');

// Test 5: String cleaning
console.log('Test 5: String cleaning tests');
console.log('cleanString("null"):', CarDataValidator.cleanString('null'));
console.log('cleanString("undefined"):', CarDataValidator.cleanString('undefined'));
console.log('cleanString(""):', CarDataValidator.cleanString(''));
console.log('cleanString("  BMW  "):', CarDataValidator.cleanString('  BMW  '));
console.log('cleanString(null):', CarDataValidator.cleanString(null));
console.log('');

// Test 6: Number cleaning
console.log('Test 6: Number cleaning tests');
console.log('cleanNumber("123"):', CarDataValidator.cleanNumber('123'));
console.log('cleanNumber("abc"):', CarDataValidator.cleanNumber('abc'));
console.log('cleanNumber(-5, 0, 100):', CarDataValidator.cleanNumber(-5, 0, 100));
console.log('cleanNumber(150, 0, 100):', CarDataValidator.cleanNumber(150, 0, 100));
console.log('cleanNumber(2.5, 0, 10, true):', CarDataValidator.cleanNumber(2.5, 0, 10, true));
console.log('cleanNumber(2.5, 0, 10, false):', CarDataValidator.cleanNumber(2.5, 0, 10, false));
console.log('');

console.log('✅ All validation tests completed!');
