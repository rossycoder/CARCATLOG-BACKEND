const axios = require('axios');
const Car = require('../models/Car');
const haversine = require('../utils/haversine');

/**
 * Validate UK postcode format
 * @param {string} postcode - Postcode to validate
 * @returns {boolean} True if valid format
 */
function isValidUKPostcode(postcode) {
  // UK postcode regex pattern - allows optional space
  const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/i;
  return postcodeRegex.test(postcode.trim());
}

/**
 * Lookup postcode coordinates using Postcodes.io API with hardcoded fallback
 * @param {string} postcode - UK postcode to lookup
 * @returns {Promise<Object>} Object containing postcode, coordinates, and location name
 * @throws {Error} If postcode is invalid or lookup fails
 */
async function lookupPostcode(postcode) {
  // Validate format before making API call
  if (!isValidUKPostcode(postcode)) {
    const error = new Error('Invalid UK postcode format');
    error.statusCode = 400;
    throw error;
  }

  // Hardcoded postcodes for testing (you can expand this list)
  const hardcodedPostcodes = {
    'L11AA': { latitude: 53.4084, longitude: -2.9916, locationName: 'Liverpool' },
    'M11AA': { latitude: 53.4808, longitude: -2.2426, locationName: 'Manchester' },
    'B11AA': { latitude: 52.4862, longitude: -1.8904, locationName: 'Birmingham' },
    'LS11AA': { latitude: 53.8008, longitude: -1.5491, locationName: 'Leeds' },
    'S11AA': { latitude: 53.3811, longitude: -1.4701, locationName: 'Sheffield' },
    'NE11AA': { latitude: 54.9783, longitude: -1.6178, locationName: 'Newcastle' },
    'SW1A1AA': { latitude: 51.5014, longitude: -0.1419, locationName: 'London Westminster' },
    'E11AA': { latitude: 51.5149, longitude: -0.0550, locationName: 'London East' },
    'W11AA': { latitude: 51.5074, longitude: -0.1901, locationName: 'London West' },
    'N11AA': { latitude: 51.5290, longitude: -0.1255, locationName: 'London North' }
  };

  try {
    const normalizedPostcode = postcode.trim().replace(/\s+/g, '').toUpperCase();
    
    // Check if we have hardcoded coordinates
    if (hardcodedPostcodes[normalizedPostcode]) {
      const data = hardcodedPostcodes[normalizedPostcode];
      return {
        postcode: postcode.toUpperCase(),
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: data.locationName
      };
    }

    // Try the external API as fallback
    const response = await axios.get(
      `https://api.postcodes.io/postcodes/${normalizedPostcode}`,
      { timeout: 5000 }
    );

    if (response.data && response.data.status === 200 && response.data.result) {
      const { 
        postcode: returnedPostcode, 
        latitude, 
        longitude,
        admin_district,
        parish,
        admin_ward
      } = response.data.result;
      
      // Use parish if available, otherwise admin_ward, otherwise admin_district
      let locationName = parish || admin_ward || admin_district || 'Unknown';
      
      // Clean up location name - extract only town/city name
      // Remove "unparished area" and similar descriptors
      locationName = locationName
        .replace(/,?\s*unparished area/gi, '')
        .replace(/,?\s*\(unparished area\)/gi, '')
        .trim();
      
      // If location contains comma, take the first part (usually the town name)
      if (locationName.includes(',')) {
        locationName = locationName.split(',')[0].trim();
      }
      
      // Remove any postcode patterns from the location name
      locationName = locationName.replace(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/gi, '').trim();
      
      return {
        postcode: returnedPostcode,
        latitude,
        longitude,
        locationName
      };
    } else {
      const error = new Error('Postcode not found');
      error.statusCode = 404;
      throw error;
    }
  } catch (err) {
    if (err.response && err.response.status === 404) {
      const error = new Error('Postcode not found');
      error.statusCode = 404;
      throw error;
    }
    
    if (err.statusCode) {
      throw err;
    }

    const error = new Error('Unable to lookup postcode. Please try again later');
    error.statusCode = 502;
    throw error;
  }
}

/**
 * Search for vehicles within a radius of given coordinates
 * @param {number} latitude - Center point latitude
 * @param {number} longitude - Center point longitude
 * @param {number} radius - Search radius in miles (default: 25)
 * @param {string} vehicleType - Optional vehicle type filter ('car', 'bike', 'van')
 * @returns {Promise<Array>} Array of vehicles with distance
 */
async function searchCarsByLocation(latitude, longitude, radius = 25, vehicleType = null) {
  try {
    // Build query for vehicles with coordinates
    const query = {
      $or: [
        {
          latitude: { $exists: true, $ne: null },
          longitude: { $exists: true, $ne: null }
        },
        {
          'location.coordinates': { $exists: true, $ne: null }
        }
      ]
    };

    // Add advertStatus filter based on environment
    if (process.env.SHOW_DRAFT_CARS === 'true') {
      query.advertStatus = { $in: ['active', 'draft'] };
      console.log('[Postcode Service] TEST MODE: Including draft cars in search');
    } else {
      query.advertStatus = 'active';
    }

    // Add vehicleType filter if provided
    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    // Fetch vehicles from database with populated history data
    const cars = await Car.find(query)
      .populate('historyCheckId', 'writeOffCategory writeOffDetails')
      .lean();

    // Calculate distance for each car and filter by radius
    const carsWithDistance = cars
      .map(car => {
        // Extract coordinates - handle both formats
        let carLat, carLon;
        
        if (car.latitude !== undefined && car.longitude !== undefined) {
          // Use top-level coordinates
          carLat = car.latitude;
          carLon = car.longitude;
        } else if (car.location && car.location.coordinates && car.location.coordinates.length === 2) {
          // Use GeoJSON coordinates [longitude, latitude]
          carLon = car.location.coordinates[0];
          carLat = car.location.coordinates[1];
        } else {
          // Skip cars without valid coordinates
          return null;
        }

        const distance = haversine(latitude, longitude, carLat, carLon);
        return {
          ...car,
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        };
      })
      .filter(car => car !== null && car.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return carsWithDistance;
  } catch (err) {
    const error = new Error('An error occurred while searching for cars');
    error.statusCode = 500;
    error.originalError = err;
    throw error;
  }
}

module.exports = {
  lookupPostcode,
  searchCarsByLocation,
  isValidUKPostcode
};
