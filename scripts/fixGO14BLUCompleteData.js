const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const axios = require('axios');

async function fixGO14BLUCompleteData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    const carId = '69879bb9d4a7f60f5dfb4083';
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found');
      return;
    }

    console.log('=== CURRENT CAR DATA ===');
    console.log(`Registration: ${car.registrationNumber}`);
    console.log(`Make/Model: ${car.make} ${car.model}`);
    console.log(`Missing fields: Engine Size, Color, CO2, Insurance Group, MPG data\n`);

    // Get fresh API data
    const baseURL = process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk';
    const apiKey = process.env.CHECKCARD_API_KEY;
    const vrm = car.registrationNumber;

    console.log('=== FETCHING FRESH API DATA ===\n');

    // Get vehicle specs
    const specsResponse = await axios.get(`${baseURL}/vehicledata/Vehiclespecs`, {
      params: { apikey: apiKey, vrm: vrm }
    });

    // Get valuation
    const valuationResponse = await axios.get(`${baseURL}/vehicledata/vehiclevaluation`, {
      params: { apikey: apiKey, vrm: vrm, mileage: car.mileage || 41030 }
    });

    // Get MOT history
    const motResponse = await axios.get(`${baseURL}/vehicledata/mot`, {
      params: { apikey: apiKey, vrm: vrm }
    });

    // Get vehicle history
    const historyResponse = await axios.get(`${baseURL}/vehicledata/carhistorycheck`, {
      params: { apikey: apiKey, vrm: vrm }
    });

    console.log('✅ All API calls successful\n');

    // Extract data from API responses
    const specs = specsResponse.data;
    const valuation = valuationResponse.data;
    const mot = motResponse.data;
    const history = historyResponse.data;

    console.log('=== UPDATING CAR WITH COMPLETE DATA ===\n');

    // Update basic vehicle info
    car.make = specs.ModelData?.Make || car.make;
    car.model = specs.ModelData?.Model || car.model;
    car.variant = specs.ModelData?.ModelVariant || specs.SmmtDetails?.ModelVariant || car.variant;
    car.year = specs.VehicleIdentification?.YearOfManufacture || car.year;
    
    // Update missing fields from API
    car.color = history.VehicleRegistration?.Colour || 'Grey';
    car.engineSize = null; // Electric vehicle - no engine
    car.bodyType = specs.BodyDetails?.BodyStyle || specs.SmmtDetails?.BodyStyle || car.bodyType;
    car.doors = specs.BodyDetails?.NumberOfDoors || specs.SmmtDetails?.NumberOfDoors || car.doors;
    car.seats = specs.BodyDetails?.NumberOfSeats || specs.SmmtDetails?.NumberOfSeats || car.seats;
    
    // CO2 and emissions
    car.co2Emissions = specs.Emissions?.ManufacturerCo2 || history.VehicleRegistration?.Co2Emissions || 0;
    
    // Tax information
    car.annualTax = specs.VehicleExciseDutyDetails?.VedRate?.Standard?.TwelveMonths || 
                   history.vedRate?.Standard?.TwelveMonth || 
                   car.annualTax;
    
    // Electric vehicle specific data
    if (specs.PowerSource?.ElectricDetails) {
      const evData = specs.PowerSource.ElectricDetails;
      
      // Range data
      if (evData.RangeFigures?.RangeTestCycles?.[0]) {
        car.electricRange = evData.RangeFigures.RangeTestCycles[0].CombinedRangeMiles;
      }
      
      // Battery data
      if (evData.BatteryDetailsList?.[0]) {
        car.batteryCapacity = evData.BatteryDetailsList[0].CapacityKwh;
      }
      
      // Charging data
      if (evData.ChargePortDetailsList?.[0]) {
        car.chargingTime = evData.ChargePortDetailsList[0].ChargeTimes?.AverageChargeTimes10To80Percent?.[1]?.TimeInMinutes;
        if (car.chargingTime) {
          car.chargingTime = Math.round(car.chargingTime / 60 * 10) / 10; // Convert to hours
        }
      }
    }
    
    // Performance data
    if (specs.Performance) {
      car.power = specs.Performance.Power?.Bhp;
      car.torque = specs.Performance.Torque?.Nm;
      car.acceleration = specs.Performance.Statistics?.ZeroToSixtyMph;
      car.topSpeed = specs.Performance.Statistics?.MaxSpeedMph;
    }
    
    // MPG data (will be null for electric vehicles)
    car.urbanMpg = null;
    car.extraUrbanMpg = null;
    car.combinedMpg = null;
    
    // Insurance group (not available in API for this vehicle)
    car.insuranceGroup = null;
    
    // Update valuation data
    if (valuation.ValuationList) {
      car.estimatedValue = parseInt(valuation.ValuationList.PrivateClean);
      car.privatePrice = parseInt(valuation.ValuationList.PrivateClean);
      car.dealerPrice = parseInt(valuation.ValuationList.DealerForecourt);
      car.partExchangePrice = parseInt(valuation.ValuationList.PartExchange);
    }
    
    // Update MOT data
    if (mot.mot) {
      car.motStatus = mot.mot.motStatus;
      car.motDue = new Date(mot.mot.motDueDate);
      car.motExpiry = new Date(mot.mot.motDueDate);
    }
    
    // Update MOT history
    if (mot.motHistory && mot.motHistory.length > 0) {
      car.motHistory = mot.motHistory.map(test => ({
        testDate: new Date(test.completedDate),
        expiryDate: new Date(test.expiryDate),
        testResult: test.testResult,
        odometerValue: parseInt(test.odometerValue),
        odometerUnit: test.odometerUnit.toLowerCase(),
        testNumber: test.motTestNumber,
        defects: test.defects || [],
        testClass: '4', // Standard car class
        testType: 'Normal Test'
      }));
    }
    
    // Update running costs
    car.runningCosts = {
      annualTax: car.annualTax,
      insuranceGroup: car.insuranceGroup,
      combinedMpg: car.combinedMpg,
      urbanMpg: car.urbanMpg,
      extraUrbanMpg: car.extraUrbanMpg,
      co2Emissions: car.co2Emissions,
      electricRange: car.electricRange,
      batteryCapacity: car.batteryCapacity,
      chargingTime: car.chargingTime
    };
    
    // Update vehicle history if needed
    let vehicleHistory = await VehicleHistory.findOne({ vrm: vrm });
    if (!vehicleHistory) {
      vehicleHistory = new VehicleHistory({
        vrm: vrm,
        make: car.make,
        model: car.model,
        colour: car.color,
        fuelType: car.fuelType,
        yearOfManufacture: car.year,
        numberOfPreviousKeepers: history.VehicleHistory?.NumberOfPreviousKeepers || 0,
        exported: history.VehicleHistory?.stolenRecord === false,
        scrapped: history.VehicleHistory?.financeRecord === false,
        writeOffCategory: 'none',
        motStatus: car.motStatus,
        motExpiryDate: car.motExpiry,
        motTests: car.motHistory || [],
        checkDate: new Date()
      });
      await vehicleHistory.save();
      car.historyCheckId = vehicleHistory._id;
    }
    
    // Save the updated car
    await car.save();
    
    console.log('✅ Car updated successfully!\n');
    
    console.log('=== UPDATED CAR DATA ===');
    console.log(`Make/Model: ${car.make} ${car.model} ${car.variant}`);
    console.log(`Color: ${car.color}`);
    console.log(`Year: ${car.year}`);
    console.log(`Doors/Seats: ${car.doors}dr / ${car.seats} seats`);
    console.log(`CO2 Emissions: ${car.co2Emissions}g/km`);
    console.log(`Annual Tax: £${car.annualTax}`);
    console.log(`Electric Range: ${car.electricRange} miles`);
    console.log(`Battery Capacity: ${car.batteryCapacity} kWh`);
    console.log(`Charging Time: ${car.chargingTime} hours`);
    console.log(`Power: ${car.power} BHP`);
    console.log(`Torque: ${car.torque} Nm`);
    console.log(`0-60 mph: ${car.acceleration} seconds`);
    console.log(`Top Speed: ${car.topSpeed} mph`);
    console.log(`MOT Status: ${car.motStatus}`);
    console.log(`MOT Due: ${car.motDue ? car.motDue.toLocaleDateString('en-GB') : 'N/A'}`);
    console.log(`MOT History: ${car.motHistory ? car.motHistory.length : 0} tests`);
    console.log(`Estimated Value: £${car.estimatedValue?.toLocaleString()}`);
    console.log(`Private Price: £${car.privatePrice?.toLocaleString()}`);
    console.log(`Dealer Price: £${car.dealerPrice?.toLocaleString()}`);
    console.log(`Part Exchange: £${car.partExchangePrice?.toLocaleString()}`);
    
    console.log('\n🎉 GO14BLU car data is now complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

fixGO14BLUCompleteData();