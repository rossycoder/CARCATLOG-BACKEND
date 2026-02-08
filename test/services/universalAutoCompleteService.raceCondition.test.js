/**
 * Property-Based Test for Race Condition Prevention
 * Feature: api-deduplication-cleanup
 * Property 3: Race condition prevention
 * 
 * **Validates: Requirements 1.5, 3.3**
 */

const fc = require('fast-check');

// Mock all external dependencies before importing the service
jest.mock('../../models/VehicleHistory', () => ({
  findOne: jest.fn(),
  deleteMany: jest.fn(),
  prototype: {
    save: jest.fn()
  }
}));

jest.mock('../../services/electricVehicleEnhancementService', () => ({
  enhanceWithEVData: jest.fn().mockReturnValue({})
}));

jest.mock('../../models/Car', () => ({
  findOne: jest.fn()
}));

jest.mock('../../models/Bike', () => ({
  findOne: jest.fn()
}));

jest.mock('../../models/Van', () => ({
  findOne: jest.fn()
}));

jest.mock('axios');

const UniversalAutoCompleteService = require('../../services/universalAutoCompleteService');

describe('Universal Auto Complete Service - Race Condition Prevention', () => {
  let universalService;
  
  beforeEach(() => {
    universalService = new UniversalAutoCompleteService();
    jest.clearAllMocks();
  });

  /**
   * Property 3: Race condition prevention
   * For any vehicle registration, when multiple requests occur simultaneously,
   * only one service instance should process the vehicle data fetching at a time
   * **Validates: Requirements 1.5, 3.3**
   */
  test('Property 3: Race condition prevention for concurrent requests', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 3, maxLength: 8 }).map(s => s.toUpperCase().replace(/[^A-Z0-9]/g, 'X')),
      fc.integer({ min: 2, max: 5 }), // Number of concurrent requests
      async (vrm, concurrentRequests) => {
        // Skip empty VRMs
        if (!vrm || vrm.length === 0) return;
        
        const mockVehicle = {
          registrationNumber: vrm,
          constructor: { modelName: 'Car' },
          save: jest.fn().mockResolvedValue(true),
          toObject: jest.fn().mockReturnValue({})
        };

        // Track actual processing (not just lock acquisition)
        let activeProcessingCount = 0;
        let maxConcurrentProcessing = 0;
        const processingEvents = [];

        // Mock the actual processing methods to track concurrency
        const originalFetchAllAPIData = universalService.fetchAllAPIData;
        universalService.fetchAllAPIData = jest.fn().mockImplementation(async (vrm) => {
          activeProcessingCount++;
          maxConcurrentProcessing = Math.max(maxConcurrentProcessing, activeProcessingCount);
          processingEvents.push({ vrm, action: 'start', timestamp: Date.now() });
          
          // Simulate API processing time
          await new Promise(resolve => setTimeout(resolve, 50));
          
          activeProcessingCount--;
          processingEvents.push({ vrm, action: 'end', timestamp: Date.now() });
          
          return {
            vehicleSpecs: null,
            vehicleHistory: null,
            motHistory: null,
            valuation: null
          };
        });

        // Mock other methods to prevent actual processing
        universalService.getCachedData = jest.fn().mockResolvedValue(null);
        universalService.parseAllAPIData = jest.fn().mockReturnValue({});
        universalService.saveToVehicleHistory = jest.fn().mockResolvedValue(null);
        universalService.updateVehicleWithCompleteData = jest.fn().mockResolvedValue(mockVehicle);
        universalService.applyVehicleSpecificEnhancements = jest.fn().mockResolvedValue();

        // Create multiple concurrent requests for the same VRM
        const requests = Array(concurrentRequests).fill().map(() => 
          universalService.completeCarData({ ...mockVehicle }, true)
        );

        const results = await Promise.all(requests);

        // Property: For the same VRM, only one request should process API calls at a time
        expect(maxConcurrentProcessing).toBeLessThanOrEqual(1);
        
        // All requests should complete successfully
        expect(results).toHaveLength(concurrentRequests);
        results.forEach(result => {
          expect(result).toBeDefined();
          expect(result.save).toHaveBeenCalled();
        });
        
        // Should have exactly one API processing session for the VRM
        const startEvents = processingEvents.filter(e => e.action === 'start');
        const endEvents = processingEvents.filter(e => e.action === 'end');
        
        expect(startEvents).toHaveLength(1);
        expect(endEvents).toHaveLength(1);
        expect(startEvents[0].vrm).toBe(vrm);
        expect(endEvents[0].vrm).toBe(vrm);
      }
    ), { numRuns: 30 });
  });

  /**
   * Property 3b: Queue processing order
   * When multiple requests are queued for the same vehicle, they should be processed
   * in order and all should receive the same result
   */
  test('Property 3b: Queued requests receive consistent results', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 3, maxLength: 8 }).map(s => s.toUpperCase().replace(/[^A-Z0-9]/g, 'X')),
      fc.integer({ min: 3, max: 6 }), // Number of concurrent requests
      async (vrm, concurrentRequests) => {
        // Skip empty VRMs
        if (!vrm || vrm.length === 0) return;
        
        const mockVehicle = {
          registrationNumber: vrm,
          constructor: { modelName: 'Car' },
          save: jest.fn().mockResolvedValue(true),
          toObject: jest.fn().mockReturnValue({})
        };

        // Create a unique result for this VRM
        const uniqueResult = { ...mockVehicle, uniqueId: `${vrm}-${Date.now()}` };

        // Mock methods to return consistent results
        universalService.getCachedData = jest.fn().mockResolvedValue(null);
        universalService.fetchAllAPIData = jest.fn().mockResolvedValue({});
        universalService.parseAllAPIData = jest.fn().mockReturnValue({});
        universalService.saveToVehicleHistory = jest.fn().mockResolvedValue(null);
        universalService.updateVehicleWithCompleteData = jest.fn().mockResolvedValue(uniqueResult);
        universalService.applyVehicleSpecificEnhancements = jest.fn().mockResolvedValue();

        // Create multiple concurrent requests for the same VRM
        const requests = Array(concurrentRequests).fill().map(() => 
          universalService.completeCarData({ ...mockVehicle }, true)
        );

        const results = await Promise.all(requests);

        // Property: All requests for the same VRM should receive the same result
        expect(results).toHaveLength(concurrentRequests);
        
        // All results should be identical (same object reference or same unique ID)
        const firstResult = results[0];
        results.forEach(result => {
          expect(result.uniqueId).toBe(firstResult.uniqueId);
        });
        
        // API should only be called once despite multiple requests
        expect(universalService.fetchAllAPIData).toHaveBeenCalledTimes(1);
        expect(universalService.updateVehicleWithCompleteData).toHaveBeenCalledTimes(1);
      }
    ), { numRuns: 25 });
  });

  /**
   * Property 3c: Lock timeout handling
   * When a processing operation times out, subsequent requests should not be blocked
   */
  test('Property 3c: Lock timeout does not block subsequent requests', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 3, maxLength: 8 }).map(s => s.toUpperCase().replace(/[^A-Z0-9]/g, 'X')),
      async (vrm) => {
        // Skip empty VRMs
        if (!vrm || vrm.length === 0) return;
        
        const mockVehicle = {
          registrationNumber: vrm,
          constructor: { modelName: 'Car' },
          save: jest.fn().mockResolvedValue(true),
          toObject: jest.fn().mockReturnValue({})
        };

        // Set a very short timeout for testing
        universalService.lockTimeout = 100;

        // Mock first request to timeout
        let firstRequestCalled = false;
        universalService.fetchAllAPIData = jest.fn().mockImplementation(async () => {
          if (!firstRequestCalled) {
            firstRequestCalled = true;
            // Simulate timeout by taking longer than lockTimeout
            await new Promise(resolve => setTimeout(resolve, 200));
            throw new Error('Operation timeout');
          } else {
            // Second request should succeed quickly
            return {};
          }
        });

        universalService.getCachedData = jest.fn().mockResolvedValue(null);
        universalService.parseAllAPIData = jest.fn().mockReturnValue({});
        universalService.saveToVehicleHistory = jest.fn().mockResolvedValue(null);
        universalService.updateVehicleWithCompleteData = jest.fn().mockResolvedValue(mockVehicle);
        universalService.applyVehicleSpecificEnhancements = jest.fn().mockResolvedValue();

        // First request should timeout
        await expect(
          universalService.completeCarData({ ...mockVehicle }, true)
        ).rejects.toThrow();

        // Second request should succeed (not blocked by first request's timeout)
        const secondResult = await universalService.completeCarData({ ...mockVehicle }, true);
        
        // Property: Second request should succeed despite first request timeout
        expect(secondResult).toBeDefined();
        expect(secondResult.save).toHaveBeenCalled();
        
        // Reset timeout
        universalService.lockTimeout = 30000;
      }
    ), { numRuns: 15 });
  });
});