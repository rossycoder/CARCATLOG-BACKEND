const express = require('express');
const router = express.Router();
const dvlaService = require('../services/dvlaService');

/**
 * POST /api/dvla/lookup
 * Lookup vehicle details by registration number
 */
router.post('/lookup', async (req, res) => {
  try {
    const { registrationNumber } = req.body;
    
    if (!registrationNumber) {
      return res.status(400).json({
        success: false,
        error: 'Registration number is required',
      });
    }

    console.log(`DVLA lookup request for: ${registrationNumber}`);
    
    // Call DVLA service
    const vehicleData = await dvlaService.lookupVehicle(registrationNumber);
    
    console.log('DVLA lookup successful:', vehicleData);
    
    res.json({
      success: true,
      data: vehicleData,
    });
  } catch (error) {
    console.error('DVLA lookup error:', error.message);
    
    // Handle specific error types
    let statusCode = 500;
    let errorMessage = 'Failed to lookup vehicle';
    
    if (error.message === 'INVALID_REGISTRATION') {
      statusCode = 400;
      errorMessage = 'Invalid registration number format';
    } else if (error.message === 'VEHICLE_NOT_FOUND') {
      statusCode = 404;
      errorMessage = 'Vehicle not found in DVLA database';
    } else if (error.message === 'AUTH_ERROR') {
      statusCode = 401;
      errorMessage = 'DVLA API authentication failed';
    } else if (error.message === 'RATE_LIMIT') {
      statusCode = 429;
      errorMessage = 'DVLA API rate limit exceeded';
    } else if (error.message === 'NETWORK_ERROR') {
      statusCode = 503;
      errorMessage = 'Unable to connect to DVLA API';
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message,
    });
  }
});

module.exports = router;
