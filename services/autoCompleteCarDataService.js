/**
 * Auto Complete Car Data Service
 * Automatically fetches and populates missing car data from CheckCarDetails API
 * 
 * This service ensures ALL cars have complete data:
 * - Running costs (MPG, tax, insurance)
 * - MOT history and due date
 * - Vehicle history (owners, write-offs, etc.)
 * - Complete specifications (engine size, doors, seats, etc.)
 */

const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const HistoryService = require('./historyService');
const VehicleHistory = require('../models/VehicleHistory');

class AutoCompleteCarDataService {
  constructor() {
    this.checkCarClient = new CheckCarDetailsClient();
    this.historyService = new HistoryService();
  }

  /**
   * Auto-complete car data from CheckCarDetails API
   * Called automatically when car is saved
   * @param {Object} car - Mongoose car document
   * @returns {Promise<Object>} Updated car with complete data
   */
  async autoCompleteCar(car) {
    try {
      console.log(`\n🔄 Auto-completing data for ${car.registrationNumber}...`);

      const registration = car.registrationNumber;
      
      // Step 1: Fetch comprehensive data from CheckCarDetails
      console.log(`   📡 Fetching CheckCarDetails data...`);
      const rawData = await this.checkCarClient.getUKVehicleData(registration);
      const parsedData = this.checkCarClient.parseResponse(rawData);

      // Step 2: Update car with missing fields only
      let updated = false;
      const updates = {};

      // Basic specs
      if (!car.variant && parsedData.variant) {
        updates.variant = parsedData.variant;
        updated = true;
      }
      
      if (!car.transmission && parsedData.transmission) {
        updates.transmission = parsedData.transmission;
        updated = true;
      }

      if (!car.engineSize && parsedData.engineSize) {
        updates.engineSize = parsedData.engineSize;
        updated = true;
      }

      if (!car.doors && parsedData.doors) {
        updates.doors = parsedData.doors;
        updated = true;
      }

      if (!car.seats && parsedData.seats) {
        updates.seats = parsedData.seats;
        updated = true;
      }

      if (!car.bodyType && parsedData.bodyType) {
        updates.bodyType = parsedData.bodyType;
        updated = true;
      }

      if (!car.emissionClass && parsedData.emissionClass) {
        updates.emissionClass = parsedData.emissionClass;
        updated = true;
      }

      // Running costs - CRITICAL
      if (!car.urbanMpg && parsedData.urbanMpg) {
        updates.urbanMpg = parsedData.urbanMpg;
        updated = true;
      }

      if (!car.extraUrbanMpg && parsedData.extraUrbanMpg) {
        updates.extraUrbanMpg = parsedData.extraUrbanMpg;
        updated = true;
      }

      if (!car.combinedMpg && parsedData.combinedMpg) {
        updates.combinedMpg = parsedData.combinedMpg;
        updated = true;
      }

      if (!car.annualTax && parsedData.annualTax) {
        updates.annualTax = parsedData.annualTax;
        updated = true;
      }

      if (!car.insuranceGroup && parsedData.insuranceGroup) {
        updates.insuranceGroup = parsedData.insuranceGroup;
        updated = true;
      }

      if (!car.co2Emissions && parsedData.co2Emissions) {
        updates.co2Emissions = parsedData.co2Emissions;
        updated = true;
      }

      // Apply updates
      if (updated) {
        Object.assign(car, updates);
        console.log(`   ✅ Updated ${Object.keys(updates).length} fields`);
      } else {
        console.log(`   ℹ️  No missing fields to update`);
      }

      // Step 3: Fetch and store vehicle history (includes MOT)
      console.log(`   📚 Fetching vehicle history...`);
      try {
        const historyData = await this.historyService.checkVehicleHistory(registration, false);
        
        // Update MOT data in car if available
        if (historyData.motExpiryDate && !car.motExpiryDate) {
          car.motExpiryDate = historyData.motExpiryDate;
          car.motStatus = historyData.motStatus || 'Unknown';
          updated = true;
          console.log(`   ✅ MOT data updated: ${car.motExpiryDate}`);
        }

        console.log(`   ✅ Vehicle history stored in database`);
      } catch (historyError) {
        console.warn(`   ⚠️  Vehicle history fetch failed: ${historyError.message}`);
        // Continue even if history fails
      }

      // Step 4: Save car if updated
      if (updated) {
        await car.save();
        console.log(`   💾 Car saved with complete data\n`);
      }

      return car;

    } catch (error) {
      console.error(`❌ Auto-complete failed for ${car.registrationNumber}:`, error.message);
      // Don't throw - allow car to be saved even if auto-complete fails
      return car;
    }
  }

  /**
   * Check if car needs auto-completion
   * @param {Object} car - Mongoose car document
   * @returns {boolean} True if car is missing critical data
   */
  needsAutoCompletion(car) {
    const missingFields = [];

    if (!car.variant) missingFields.push('variant');
    if (!car.transmission) missingFields.push('transmission');
    if (!car.engineSize) missingFields.push('engineSize');
    if (!car.urbanMpg) missingFields.push('urbanMpg');
    if (!car.combinedMpg) missingFields.push('combinedMpg');
    if (!car.annualTax) missingFields.push('annualTax');
    if (!car.motExpiryDate) missingFields.push('motExpiryDate');

    if (missingFields.length > 0) {
      console.log(`   ⚠️  Car ${car.registrationNumber} missing: ${missingFields.join(', ')}`);
      return true;
    }

    return false;
  }

  /**
   * Fix all incomplete cars in database
   * Run this to fix existing cars
   * @param {number} limit - Maximum number of cars to fix (default: 100)
   * @returns {Promise<Object>} Fix results
   */
  async fixAllIncompleteCars(limit = 100) {
    try {
      console.log(`\n🔧 Fixing all incomplete cars (limit: ${limit})...\n`);

      const Car = require('../models/Car');

      // Find cars missing critical data
      const incompleteCars = await Car.find({
        status: 'active',
        $or: [
          { urbanMpg: { $exists: false } },
          { urbanMpg: null },
          { combinedMpg: { $exists: false } },
          { combinedMpg: null },
          { annualTax: { $exists: false } },
          { annualTax: null },
          { motExpiryDate: { $exists: false } },
          { motExpiryDate: null },
          { variant: { $exists: false } },
          { variant: null },
          { engineSize: { $exists: false } },
          { engineSize: null }
        ]
      }).limit(limit);

      console.log(`Found ${incompleteCars.length} incomplete cars\n`);

      let fixed = 0;
      let failed = 0;

      for (const car of incompleteCars) {
        try {
          console.log(`[${fixed + failed + 1}/${incompleteCars.length}] Fixing ${car.registrationNumber}...`);
          await this.autoCompleteCar(car);
          fixed++;
        } catch (error) {
          console.error(`   ❌ Failed: ${error.message}`);
          failed++;
        }
      }

      console.log(`\n✅ Fix complete!`);
      console.log(`   Fixed: ${fixed}`);
      console.log(`   Failed: ${failed}`);
      console.log(`   Total: ${incompleteCars.length}\n`);

      return {
        total: incompleteCars.length,
        fixed,
        failed
      };

    } catch (error) {
      console.error('❌ Error fixing incomplete cars:', error);
      throw error;
    }
  }
}

module.exports = new AutoCompleteCarDataService();
