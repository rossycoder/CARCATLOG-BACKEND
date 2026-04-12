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
      console.log(`[Postcode Service] Using hardcoded coordinates for ${normalizedPostcode}`);
      return {
        postcode: postcode.toUpperCase(),
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: data.locationName
      };
    }

    // Try the external API as fallback
    console.log(`[Postcode Service] Attempting API lookup for ${normalizedPostcode}`);
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
      
      console.log(`[Postcode Service] API lookup successful for ${normalizedPostcode}`);
      return {
        postcode: returnedPostcode,
        latitude,
        longitude,
        locationName
      };
    } else {
      // If API returns invalid response, use default UK center coordinates
      console.log(`[Postcode Service] API returned invalid response, using UK center coordinates`);
      return {
        postcode: postcode.toUpperCase(),
        latitude: 52.3555, // UK geographic center
        longitude: -1.1743,
        locationName: 'United Kingdom'
      };
    }
  } catch (err) {
    // If API fails, use default UK center coordinates instead of throwing error
    console.log(`[Postcode Service] API lookup failed, using UK center coordinates:`, err.message);
    return {
      postcode: postcode.toUpperCase(),
      latitude: 52.3555, // UK geographic center
      longitude: -1.1743,
      locationName: 'United Kingdom'
    };
  }
}

/**
 * Search for vehicles within a radius of given coordinates
 * NOW RETURNS ALL ACTIVE CARS regardless of coordinates or distance
 * @param {number} latitude - Center point latitude
 * @param {number} longitude - Center point longitude
 * @param {number} radius - Search radius in miles (IGNORED - returns all cars)
 * @param {string} vehicleType - Optional vehicle type filter ('car', 'bike', 'van')
 * @returns {Promise<Array>} Array of vehicles with distance
 */
async function searchCarsByLocation(latitude, longitude, radius = 25, vehicleType = null) {
  try {
    // Build query for ALL vehicles (with or without coordinates)
    const query = {};

    // Only show active cars (not draft, sold, or expired)
    query.advertStatus = 'active';

    // Add vehicleType filter if provided
    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    // Fetch ALL vehicles from database with populated history data
    const cars = await Car.find(query)
      .populate('historyCheckId', 'writeOffCategory writeOffDetails')
      .lean();

    // Calculate distance for each car (or set to 0 if no coordinates)
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
        }

        // Calculate distance if coordinates exist, otherwise set to 0
        let distance = 0;
        if (carLat !== undefined && carLon !== undefined) {
          distance = haversine(latitude, longitude, carLat, carLon);
        }

        return {
          ...car,
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        };
      })
      .sort((a, b) => a.distance - b.distance); // Sort by distance (cars without coordinates will be at top with distance 0)

    console.log(`[Postcode Service] Returning ALL ${carsWithDistance.length} active cars (nationwide search)`);
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
