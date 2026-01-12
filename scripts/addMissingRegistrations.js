/**
 * Script to add registration numbers to cars that don't have them
 * This will generate sample UK registration numbers for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

// Sample UK registration formats
const generateUKRegistration = (year) => {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ'; // Excluding I, O, Q
  const numbers = '0123456789';
  
  // Modern format: AB12 CDE (2001 onwards)
  if (year >= 2001) {
    const area = letters[Math.floor(Math.random() * letters.length)] + 
                 letters[Math.floor(Math.random() * letters.length)];
    
    // Age identifier (simplified)
    const ageId = String(year).slice(-2);
    
    const random = letters[Math.floor(Math.random() * letters.length)] +
                   letters[Math.floor(Math.random() * letters.length)] +
                   letters[Math.floor(Math.random() * letters.length)];
    
    return `${area}${ageId} ${random}`;
  }
  
  // Prefix format: A123 BCD (1983-2001)
  const prefix = letters[Math.floor(Math.random() * letters.length)];
  const nums = numbers[Math.floor(Math.random() * numbers.length)] +
               numbers[Math.floor(Math.random() * numbers.length)] +
               numbers[Math.floor(Math.random() * numbers.length)];
  const suffix = letters[Math.floor(Math.random() * letters.length)] +
                 letters[Math.floor(Math.random() * letters.length)] +
                 letters[Math.floor(Math.random() * letters.length)];
  
  return `${prefix}${nums} ${suffix}`;
};

async function addMissingRegistrations() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find cars without registration numbers
    const carsWithoutReg = await Car.find({
      $or: [
        { registrationNumber: { $exists: false } },
        { registrationNumber: null },
        { registrationNumber: '' }
      ]
    });

    console.log(`Found ${carsWithoutReg.length} cars without registration numbers\n`);

    if (carsWithoutReg.length === 0) {
      console.log('All cars already have registration numbers!');
      await mongoose.connection.close();
      return;
    }

    let updated = 0;
    for (const car of carsWithoutReg) {
      const registration = generateUKRegistration(car.year);
      car.registrationNumber = registration;
      await car.save();
      
      console.log(`✓ Added registration ${registration} to ${car.make} ${car.model} (${car.year})`);
      updated++;
    }

    console.log(`\n✓ Successfully added registration numbers to ${updated} cars`);
    
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addMissingRegistrations();
