/**
 * Refresh MOT History Route
 * Allows manual refresh of MOT history for any car
 */

const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');

/**
 * POST /api/refresh-mot/:carId
 * Refresh MOT history for a specific car
 */
router.post('/:carId', async (req, res) => {
  try {
    const { carId } = req.params;
    
    console.log(`🔄 Refreshing MOT history for car: ${carId}`);
    
    // Find the car
    const car = await Car.findById(carId);
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }
    
    if (!car.registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Car has no registration number'
      });
    }
    
    console.log(`   VRM: ${car.registrationNumber}`);
    console.log(`   Current MOT History: ${car.motHistory ? car.motHistory.length : 0} tests`);
    
    // Use Universal Service to fetch complete data including MOT history
    const universalService = new UniversalAutoCompleteService();
    const result = await universalService.completeCarData(car, true); // Force refresh
    
    console.log(`✅ MOT history refreshed!`);
    console.log(`   New MOT History: ${result.motHistory ? result.motHistory.length : 0} tests`);
    console.log(`   MOT Due: ${result.motDue}`);
    console.log(`   MOT Status: ${result.motStatus}`);
    
    res.json({
      success: true,
      message: 'MOT history refreshed successfully',
      data: {
        vrm: car.registrationNumber,
        motHistoryCount: result.motHistory ? result.motHistory.length : 0,
        motDue: result.motDue,
        motStatus: result.motStatus,
        motHistory: result.motHistory
      }
    });
    
  } catch (error) {
    console.error('❌ Error refreshing MOT history:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh MOT history',
      error: error.message
    });
  }
});

/**
 * POST /api/refresh-mot/vrm/:vrm
 * Refresh MOT history by VRM
 */
router.post('/vrm/:vrm', async (req, res) => {
  try {
    const { vrm } = req.params;
    
    console.log(`🔄 Refreshing MOT history for VRM: ${vrm}`);
    
    // Find the car by VRM
    const car = await Car.findOne({ registrationNumber: vrm.toUpperCase() });
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: `Car not found with VRM: ${vrm}`
      });
    }
    
    console.log(`   Car ID: ${car._id}`);
    console.log(`   Current MOT History: ${car.motHistory ? car.motHistory.length : 0} tests`);
    
    // Use Universal Service to fetch complete data including MOT history
    const universalService = new UniversalAutoCompleteService();
    const result = await universalService.completeCarData(car, true); // Force refresh
    
    console.log(`✅ MOT history refreshed!`);
    console.log(`   New MOT History: ${result.motHistory ? result.motHistory.length : 0} tests`);
    console.log(`   MOT Due: ${result.motDue}`);
    console.log(`   MOT Status: ${result.motStatus}`);
    
    res.json({
      success: true,
      message: 'MOT history refreshed successfully',
      data: {
        carId: car._id,
        vrm: car.registrationNumber,
        motHistoryCount: result.motHistory ? result.motHistory.length : 0,
        motDue: result.motDue,
        motStatus: result.motStatus,
        motHistory: result.motHistory
      }
    });
    
  } catch (error) {
    console.error('❌ Error refreshing MOT history:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh MOT history',
      error: error.message
    });
  }
});

module.exports = router;
