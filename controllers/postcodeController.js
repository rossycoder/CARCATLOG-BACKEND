const postcodeService = require('../services/postcodeService');

/**
 * Search for cars by postcode and radius
 * GET /api/postcode/search?postcode=SW1A1AA&radius=25&vehicleType=car
 */
async function searchByPostcode(req, res) {
  try {
    const { postcode, radius, vehicleType } = req.query;

    // Validate required parameter
    if (!postcode) {
      return res.status(400).json({
        success: false,
        error: 'Postcode parameter is required'
      });
    }

    // Validate radius if provided
    let searchRadius = 25; // Default radius
    if (radius) {
      searchRadius = parseFloat(radius);
      if (isNaN(searchRadius) || searchRadius <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Radius must be a positive number'
        });
      }
    }

    // Validate vehicleType if provided
    const validVehicleTypes = ['car', 'bike', 'van'];
    if (vehicleType && !validVehicleTypes.includes(vehicleType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vehicleType. Must be one of: car, bike, van'
      });
    }

    // Lookup postcode coordinates
    const postcodeData = await postcodeService.lookupPostcode(postcode);

    // Search for vehicles within radius with optional vehicleType filter
    const results = await postcodeService.searchCarsByLocation(
      postcodeData.latitude,
      postcodeData.longitude,
      searchRadius,
      vehicleType
    );

    // Return response
    return res.status(200).json({
      success: true,
      count: results.length,
      data: {
        postcode: postcodeData.postcode,
        coordinates: {
          latitude: postcodeData.latitude,
          longitude: postcodeData.longitude
        },
        radius: searchRadius,
        vehicleType: vehicleType || 'all',
        results
      }
    });
  } catch (err) {
    // Handle errors with appropriate status codes
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred';

    console.error('Postcode search error:', {
      message: err.message,
      statusCode,
      originalError: err.originalError
    });

    return res.status(statusCode).json({
      success: false,
      error: message
    });
  }
}

module.exports = {
  searchByPostcode
};
