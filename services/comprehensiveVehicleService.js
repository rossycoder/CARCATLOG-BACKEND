const HistoryService = require('./historyService');
const MOTHistoryService = require('./motHistoryService');
const ValuationService = require('./valuationService');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

/**
 * Comprehensive Vehicle Service
 * Fetches and saves ALL vehicle data in one go:
 * - Vehicle History (CheckCarDetails)
 * - MOT History (CheckCarDetails MOT endpoint)
 * - Valuation (CheckCarDetails valuation endpoint)
 */
class ComprehensiveVehicleService {
  constructor() {
    this.historyService = new HistoryService();
    this.motHistoryService = new MOTHistoryService();
    this.valuationService = new ValuationService();
  }

  /**
   * Fetch and save ALL vehicle data in one comprehensive call
   * @param {string} vrm - Vehicle registration mark
   * @param {number} mileage - Vehicle mileage for valuation
   * @param {boolean} forceRefresh - Force fresh API calls
   * @returns {Promise<Object>} Complete vehicle data result
   */
  async fetchCompleteVehicleData(vrm, mileage, forceRefresh = false) {
    try {
      console.log(`\n🚀 [ComprehensiveService] Starting complete data fetch for: ${vrm}`);
      console.log(`📊 Mileage: ${mileage}, Force Refresh: ${forceRefresh}`);
      
      const results = {
        vrm: vrm.toUpperCase(),
        success: true,
        data: {},
        errors: [],
        apiCalls: 0,
        totalCost: 0
      };

      // CRITICAL: Check if data already exists in cache to prevent duplicate API calls
      if (!forceRefresh) {
        console.log('\n🔍 Checking existing cache to prevent duplicate API calls...');
        
        const VehicleHistory = require('../models/VehicleHistory');
        const existingHistory = await VehicleHistory.findOne({
          vrm: vrm.toUpperCase().replace(/\s/g, '')
        });
        
        if (existingHistory) {
          // Check cache age (30 days TTL)
          const cacheAge = Date.now() - new Date(existingHistory.checkDate).getTime();
          const cacheTTL = 30 * 24 * 60 * 60 * 1000; // 30 days
          
          if (cacheAge < cacheTTL) {
            console.log(`✅ CACHE HIT - Using existing data (age: ${Math.round(cacheAge / (60 * 60 * 1000))} hours)`);
            console.log(`💰 COST SAVED: £1.96 by using cache instead of fresh API calls`);
            
            results.data.vehicleHistory = existingHistory;
            results.data.cached = true;
            results.apiCalls = 0;
            results.totalCost = 0;
            
            // Still update car document with cached data
            await this.updateCarWithCompleteData(vrm, results.data);
            
            return results;
          } else {
            console.log(`⏰ Cache expired (age: ${Math.round(cacheAge / (24 * 60 * 60 * 1000))} days) - Making fresh API calls`);
          }
        } else {
          console.log(`❌ No cache found - Making fresh API calls`);
        }
      } else {
        console.log(`🔄 Force refresh requested - Making fresh API calls`);
      }

      // Step 1: Vehicle History Check (£1.82)
      console.log('\n1️⃣ Fetching Vehicle History...');
      try {
        const historyResult = await this.historyService.checkVehicleHistory(vrm, forceRefresh);
        results.data.vehicleHistory = historyResult;
        results.apiCalls++;
        results.totalCost += 1.82;
        console.log(`✅ Vehicle History: ${historyResult.checkStatus} (ID: ${historyResult._id})`);
      } catch (error) {
        console.error(`❌ Vehicle History failed: ${error.message}`);
        results.errors.push({ service: 'vehicleHistory', error: error.message });
      }

      // Step 1.5: Vehicle Specs (£0.05) - Get make, model, variant, running costs
      console.log('\n1.5️⃣ Fetching Vehicle Specs...');
      try {
        const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
        const specsData = await CheckCarDetailsClient.getVehicleSpecs(vrm);
        
        if (specsData) {
          // Parse the specs response
          const parsedSpecs = CheckCarDetailsClient.parseResponse(specsData);
          
          // Update VehicleHistory with specs data
          const VehicleHistory = require('../models/VehicleHistory');
          const history = await VehicleHistory.findOne({ vrm: vrm.toUpperCase().replace(/\s/g, '') });
          
          if (history) {
            // Update make, model, variant
            if (parsedSpecs.make) history.make = parsedSpecs.make;
            if (parsedSpecs.model) history.model = parsedSpecs.model;
            if (parsedSpecs.variant || parsedSpecs.modelVariant) {
              history.variant = parsedSpecs.variant || parsedSpecs.modelVariant;
            }
            if (parsedSpecs.year) history.yearOfManufacture = parsedSpecs.year;
            
            // Update running costs
            if (parsedSpecs.urbanMpg) history.urbanMpg = parsedSpecs.urbanMpg;
            if (parsedSpecs.extraUrbanMpg) history.extraUrbanMpg = parsedSpecs.extraUrbanMpg;
            if (parsedSpecs.combinedMpg) history.combinedMpg = parsedSpecs.combinedMpg;
            if (parsedSpecs.co2Emissions) history.co2Emissions = parsedSpecs.co2Emissions;
            if (parsedSpecs.insuranceGroup) history.insuranceGroup = parsedSpecs.insuranceGroup;
            if (parsedSpecs.annualTax || parsedSpecs.roadTax) {
              history.annualTax = parsedSpecs.annualTax || parsedSpecs.roadTax;
            }
            
            await history.save();
            console.log(`✅ Vehicle Specs: ${parsedSpecs.make} ${parsedSpecs.model} ${parsedSpecs.variant || ''}`);
            console.log(`   Running Costs: MPG ${parsedSpecs.combinedMpg || 'N/A'}, CO2 ${parsedSpecs.co2Emissions || 'N/A'}g/km`);
            
            // Add to results
            results.data.vehicleSpecs = parsedSpecs;
          }
        }
        
        results.apiCalls++;
        results.totalCost += 0.05;
      } catch (error) {
        console.error(`❌ Vehicle Specs failed: ${error.message}`);
        results.errors.push({ service: 'vehicleSpecs', error: error.message });
      }

      // Step 2: MOT History (£0.02)
      console.log('\n2️⃣ Fetching MOT History...');
      try {
        const motResult = await this.motHistoryService.fetchAndSaveMOTHistory(vrm, forceRefresh);
        results.data.motHistory = motResult;
        results.apiCalls++;
        results.totalCost += 0.02;
        console.log(`✅ MOT History: ${motResult.count} tests (Source: ${motResult.source})`);
      } catch (error) {
        console.error(`❌ MOT History failed: ${error.message}`);
        results.errors.push({ service: 'motHistory', error: error.message });
      }

      // Step 3: Valuation (£0.12)
      console.log('\n3️⃣ Fetching Valuation...');
      try {
        const valuationResult = await this.valuationService.getValuation(vrm, mileage);
        results.data.valuation = valuationResult;
        results.apiCalls++;
        results.totalCost += 0.12;
        console.log(`✅ Valuation: Private £${valuationResult.estimatedValue.private}, Trade £${valuationResult.estimatedValue.trade}`);
      } catch (error) {
        console.error(`❌ Valuation failed: ${error.message}`);
        results.errors.push({ service: 'valuation', error: error.message });
      }

      // Step 4: Update Car document with all data
      console.log('\n4️⃣ Updating Car document...');
      try {
        await this.updateCarWithCompleteData(vrm, results.data);
        console.log(`✅ Car document updated with all data`);
      } catch (error) {
        console.error(`❌ Car update failed: ${error.message}`);
        results.errors.push({ service: 'carUpdate', error: error.message });
      }

      // Summary
      console.log(`\n📊 Complete Data Fetch Summary:`);
      console.log(`   VRM: ${results.vrm}`);
      console.log(`   API Calls: ${results.apiCalls}`);
      console.log(`   Total Cost: £${results.totalCost.toFixed(2)}`);
      console.log(`   Errors: ${results.errors.length}`);
      
      if (results.errors.length > 0) {
        console.log(`   Failed Services: ${results.errors.map(e => e.service).join(', ')}`);
      }

      return results;

    } catch (error) {
      console.error(`❌ [ComprehensiveService] Fatal error:`, error);
      throw error;
    }
  }

  /**
   * Update Car document with all fetched data
   * @param {string} vrm - Vehicle registration mark
   * @param {Object} data - Complete vehicle data
   */
  async updateCarWithCompleteData(vrm, data) {
    try {
      const car = await Car.findOne({ registrationNumber: vrm.toUpperCase() });
      
      if (!car) {
        console.warn(`⚠️  Car not found for VRM: ${vrm}`);
        return;
      }

      // Update vehicle history reference
      if (data.vehicleHistory && data.vehicleHistory._id) {
        car.historyCheckId = data.vehicleHistory._id;
        car.historyCheckStatus = 'verified';
        car.historyCheckDate = new Date();
        
        // CRITICAL FIX: Extract running costs directly from VehicleHistory fields
        const vh = data.vehicleHistory;
        
        // Check if any running costs data exists
        const hasRunningCosts = vh.urbanMpg || vh.extraUrbanMpg || vh.combinedMpg || 
                                vh.co2Emissions || vh.insuranceGroup || vh.annualTax;
        
        if (hasRunningCosts) {
          console.log('💰 Saving running costs to database...');
          
          // Save to runningCosts object
          car.runningCosts = {
            fuelEconomy: {
              urban: vh.urbanMpg || null,
              extraUrban: vh.extraUrbanMpg || null,
              combined: vh.combinedMpg || null
            },
            co2Emissions: vh.co2Emissions || null,
            insuranceGroup: vh.insuranceGroup || null,
            annualTax: vh.annualTax || null
          };
          
          // Also save to individual fields for backward compatibility
          car.fuelEconomyUrban = vh.urbanMpg || null;
          car.fuelEconomyExtraUrban = vh.extraUrbanMpg || null;
          car.fuelEconomyCombined = vh.combinedMpg || null;
          car.co2Emissions = vh.co2Emissions || null;
          car.insuranceGroup = vh.insuranceGroup || null;
          car.annualTax = vh.annualTax || null;
          
          console.log('✅ Running costs saved:');
          console.log(`   MPG Urban: ${car.fuelEconomyUrban || 'N/A'}`);
          console.log(`   MPG Extra Urban: ${car.fuelEconomyExtraUrban || 'N/A'}`);
          console.log(`   MPG Combined: ${car.fuelEconomyCombined || 'N/A'}`);
          console.log(`   CO2: ${car.co2Emissions || 'N/A'} g/km`);
          console.log(`   Insurance Group: ${car.insuranceGroup || 'N/A'}`);
          console.log(`   Annual Tax: £${car.annualTax || 'N/A'}`);
        } else {
          console.log('⚠️  No running costs data found in VehicleHistory');
        }
        
        // Also update make, model, variant if they exist in VehicleHistory
        if (vh.make && (!car.make || car.make === 'Unknown')) {
          car.make = vh.make;
          console.log(`   Updated make: ${vh.make}`);
        }
        if (vh.model && (!car.model || car.model === 'Unknown')) {
          car.model = vh.model;
          console.log(`   Updated model: ${vh.model}`);
        }
        if (vh.variant && (!car.variant || car.variant === 'Unknown')) {
          car.variant = vh.variant;
          console.log(`   Updated variant: ${vh.variant}`);
        }
      }

      // Update valuation data
      if (data.valuation && data.valuation.estimatedValue) {
        car.valuation = {
          privatePrice: data.valuation.estimatedValue.private,
          dealerPrice: data.valuation.estimatedValue.retail,
          partExchangePrice: data.valuation.estimatedValue.trade,
          confidence: data.valuation.confidence,
          valuationDate: new Date()
        };
        
        // Update price to private sale price
        car.price = data.valuation.estimatedValue.private;
        car.estimatedValue = data.valuation.estimatedValue.private;
      }

      // MOT history is already saved by MOTHistoryService
      // But update MOT status fields from latest test
      if (data.motHistory && data.motHistory.data && data.motHistory.data.length > 0) {
        const latestTest = data.motHistory.data[0]; // Most recent test
        if (latestTest && latestTest.expiryDate) {
          car.motStatus = latestTest.testResult === 'PASSED' ? 'Valid' : 'Invalid';
          car.motExpiry = latestTest.expiryDate;
          car.motDue = latestTest.expiryDate;
          console.log(`✅ MOT data saved: ${car.motStatus}, Due: ${new Date(car.motDue).toLocaleDateString('en-GB')}`);
        }
      } else {
        console.log('⚠️  No MOT history data found');
      }

      await car.save();
      console.log(`✅ Car ${vrm} updated with complete data`);

    } catch (error) {
      console.error(`❌ Error updating car ${vrm}:`, error);
      throw error;
    }
  }

  /**
   * Clean up orphaned VehicleHistory documents
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOrphanedVehicleHistory() {
    try {
      console.log('\n🧹 Cleaning up orphaned VehicleHistory documents...');
      
      // Get all car history IDs
      const cars = await Car.find({}, { historyCheckId: 1 });
      const linkedHistoryIds = cars.map(car => car.historyCheckId).filter(Boolean);
      
      console.log(`📊 Cars with linked history: ${linkedHistoryIds.length}`);
      
      // Find orphaned documents
      const orphanedHistories = await VehicleHistory.find({
        _id: { $nin: linkedHistoryIds }
      });
      
      console.log(`📊 Orphaned VehicleHistory documents: ${orphanedHistories.length}`);
      
      if (orphanedHistories.length > 0) {
        console.log('\n📋 Orphaned documents to be deleted:');
        orphanedHistories.forEach((vh, index) => {
          console.log(`${index + 1}. ${vh.vrm} - ${vh._id} (Created: ${vh.createdAt})`);
        });
        
        // Delete orphaned documents
        const deleteResult = await VehicleHistory.deleteMany({
          _id: { $nin: linkedHistoryIds }
        });
        
        console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned VehicleHistory documents`);
        
        return {
          success: true,
          deletedCount: deleteResult.deletedCount,
          orphanedIds: orphanedHistories.map(vh => vh._id)
        };
      } else {
        console.log('✅ No orphaned documents found');
        return {
          success: true,
          deletedCount: 0,
          orphanedIds: []
        };
      }
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Fix specific car by fetching all missing data
   * @param {string} carId - Car ObjectId
   * @returns {Promise<Object>} Fix result
   */
  async fixSpecificCar(carId) {
    try {
      console.log(`\n🔧 Fixing specific car: ${carId}`);
      
      const car = await Car.findById(carId);
      if (!car) {
        throw new Error(`Car not found with ID: ${carId}`);
      }
      
      console.log(`📋 Car: ${car.registrationNumber} - ${car.make} ${car.model}`);
      
      // Check what's missing
      const missing = {
        vehicleHistory: !car.historyCheckId,
        motHistory: !car.motHistory || car.motHistory.length === 0,
        valuation: !car.valuation
      };
      
      console.log('📊 Missing data:', missing);
      
      if (!missing.vehicleHistory && !missing.motHistory && !missing.valuation) {
        console.log('✅ Car already has all data');
        return { success: true, message: 'Car already complete' };
      }
      
      // Fetch complete data
      const result = await this.fetchCompleteVehicleData(
        car.registrationNumber, 
        car.mileage, 
        true // Force refresh
      );
      
      return {
        success: true,
        carId: carId,
        vrm: car.registrationNumber,
        result: result
      };
      
    } catch (error) {
      console.error(`❌ Fix failed for car ${carId}:`, error);
      throw error;
    }
  }
}

module.exports = ComprehensiveVehicleService;