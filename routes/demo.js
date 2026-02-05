/**
 * Demo Routes
 * Demonstrates automatic electric vehicle enhancement
 */

const express = require('express');
const router = express.Router();
const Car = require('../models/Car');

/**
 * POST /api/demo/add-electric-vehicle
 * Demo endpoint to show automatic EV enhancement
 */
router.post('/add-electric-vehicle', async (req, res) => {
  try {
    const {
      make = 'BMW',
      model = 'i4',
      variant = 'M50',
      year = 2023,
      price = 45000,
      mileage = 1000,
      color = 'Storm Bay',
      registrationNumber = `EV${Date.now().toString().slice(-6)}`
    } = req.body;

    console.log(`🚗 Demo: Creating electric vehicle ${make} ${model} ${variant}...`);

    // Create a basic electric vehicle - the system will automatically enhance it
    const electricVehicle = new Car({
      make,
      model,
      variant,
      year,
      price,
      estimatedValue: price,
      mileage,
      color,
      transmission: 'automatic',
      fuelType: 'Electric', // This triggers automatic enhancement
      description: `${make} ${model} ${variant} - Automatically enhanced electric vehicle`,
      images: [`https://example.com/${make.toLowerCase()}-${model.toLowerCase()}.jpg`],
      condition: 'used',
      vehicleType: 'car',
      bodyType: 'Saloon',
      doors: 4,
      seats: 5,
      registrationNumber,
      dataSource: 'demo',
      historyCheckStatus: 'pending',
      sellerContact: {
        type: 'private',
        phoneNumber: '07123456789',
        email: 'demo@example.com',
        postcode: 'SW1A 1AA'
      },
      isDealerListing: false,
      postcode: 'SW1A 1AA',
      locationName: 'London',
      latitude: 51.5074,
      longitude: -0.1278,
      location: {
        type: 'Point',
        coordinates: [-0.1278, 51.5074]
      }
    });

    // Save the vehicle - this will trigger automatic enhancement
    await electricVehicle.save();

    // Return the enhanced vehicle data
    res.json({
      success: true,
      message: 'Electric vehicle created and automatically enhanced!',
      data: {
        vehicle: electricVehicle,
        enhancement: {
          electricRange: electricVehicle.electricRange || electricVehicle.runningCosts?.electricRange,
          batteryCapacity: electricVehicle.batteryCapacity || electricVehicle.runningCosts?.batteryCapacity,
          chargingTime: electricVehicle.chargingTime || electricVehicle.runningCosts?.chargingTime,
          rapidChargingSpeed: electricVehicle.rapidChargingSpeed || electricVehicle.runningCosts?.rapidChargingSpeed,
          chargingPortType: electricVehicle.chargingPortType || electricVehicle.runningCosts?.chargingPortType,
          featuresCount: electricVehicle.features?.length || 0,
          co2Emissions: electricVehicle.co2Emissions || electricVehicle.runningCosts?.co2Emissions,
          annualTax: electricVehicle.annualTax || electricVehicle.runningCosts?.annualTax
        }
      }
    });

  } catch (error) {
    console.error('❌ Demo error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DEMO_ERROR',
        message: 'Failed to create demo electric vehicle',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/demo/electric-vehicles
 * Get all demo electric vehicles
 */
router.get('/electric-vehicles', async (req, res) => {
  try {
    const demoEVs = await Car.find({ 
      fuelType: 'Electric',
      dataSource: 'demo'
    }).lean();

    res.json({
      success: true,
      message: `Found ${demoEVs.length} demo electric vehicles`,
      data: demoEVs.map(ev => ({
        id: ev._id,
        make: ev.make,
        model: ev.model,
        variant: ev.variant,
        registrationNumber: ev.registrationNumber,
        electricRange: ev.electricRange || ev.runningCosts?.electricRange,
        batteryCapacity: ev.batteryCapacity || ev.runningCosts?.batteryCapacity,
        rapidChargingSpeed: ev.rapidChargingSpeed || ev.runningCosts?.rapidChargingSpeed,
        chargingPortType: ev.chargingPortType || ev.runningCosts?.chargingPortType,
        features: ev.features,
        createdAt: ev.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Demo error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DEMO_ERROR',
        message: 'Failed to fetch demo electric vehicles'
      }
    });
  }
});

/**
 * DELETE /api/demo/cleanup
 * Clean up demo data
 */
router.delete('/cleanup', async (req, res) => {
  try {
    const result = await Car.deleteMany({ dataSource: 'demo' });
    
    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} demo vehicles`,
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('❌ Demo cleanup error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CLEANUP_ERROR',
        message: 'Failed to cleanup demo data'
      }
    });
  }
});

module.exports = router;