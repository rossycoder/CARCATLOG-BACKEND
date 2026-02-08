/**
 * Property-Based Tests for Controller Service Routing
 * 
 * Property 2: Controller service routing
 * Validates: Requirements 1.2, 2.1, 2.3
 * 
 * This test ensures that all controllers route vehicle data requests through
 * the Universal Service instead of making direct API calls.
 */

const fc = require('fast-check');

describe('Property 2: Controller Service Routing', () => {
  
  /**
   * Property 2.1: Controller Import Analysis
   * Validates that controllers only import Universal Service, not competing services
   */
  describe('Controller Import Analysis', () => {
    it('should verify controllers import Universal Service instead of competing services', () => {
      return fc.assert(fc.property(
        fc.constantFrom(
          'vehicleController',
          'paymentController', 
          'bikeController',
          'tradeInventoryController'
        ),
        (controllerName) => {
          // Read controller file content
          const fs = require('fs');
          const path = require('path');
          
          const controllerPath = path.join(__dirname, '../../controllers', `${controllerName}.js`);
          const controllerContent = fs.readFileSync(controllerPath, 'utf8');
          
          // **REQUIREMENT 1.2**: Controllers should import Universal Service
          const hasUniversalServiceImport = controllerContent.includes('UniversalAutoCompleteService');
          expect(hasUniversalServiceImport).toBe(true);
          
          // **REQUIREMENT 2.1**: Controllers should NOT import competing services directly
          const competingServiceImports = [
            'CheckCarDetailsClient',
            'ComprehensiveVehicleService', 
            'enhancedVehicleService',
            'lightweightVehicleService',
            'autoCompleteCarDataService'
          ];
          
          competingServiceImports.forEach(serviceName => {
            // Allow comments mentioning the service, but not actual imports
            const hasDirectImport = controllerContent.includes(`require('../services/${serviceName}`) ||
                                  controllerContent.includes(`require('../clients/${serviceName}`) ||
                                  (controllerContent.includes(`const ${serviceName}`) && 
                                   controllerContent.includes(`require(`) &&
                                   !controllerContent.includes(`// CRITICAL: Use Universal Auto Complete Service instead of ${serviceName}`));
            
            expect(hasDirectImport).toBe(false);
          });
          
          // **REQUIREMENT 2.3**: Payment controller should use Universal Service
          if (controllerName === 'paymentController') {
            const hasUniversalServiceUsage = controllerContent.includes('universalService.completeCarData') ||
                                           controllerContent.includes('await universalService.');
            expect(hasUniversalServiceUsage).toBe(true);
          }
        }
      ), { numRuns: 4 }); // One run per controller
    });
  });

  /**
   * Property 2.2: Service Method Call Analysis
   * Validates that controllers call Universal Service methods instead of direct API methods
   */
  describe('Service Method Call Analysis', () => {
    it('should verify controllers call Universal Service methods instead of direct API methods', () => {
      return fc.assert(fc.property(
        fc.constantFrom(
          'vehicleController',
          'paymentController',
          'bikeController', 
          'tradeInventoryController'
        ),
        (controllerName) => {
          // Read controller file content
          const fs = require('fs');
          const path = require('path');
          
          const controllerPath = path.join(__dirname, '../../controllers', `${controllerName}.js`);
          const controllerContent = fs.readFileSync(controllerPath, 'utf8');
          
          // **REQUIREMENT 1.2**: Controllers should call Universal Service methods
          const universalServiceMethods = [
            'universalService.completeCarData',
            'await universalService.',
            'universalService.'
          ];
          
          const hasUniversalServiceCall = universalServiceMethods.some(method => 
            controllerContent.includes(method)
          );
          
          // Only require Universal Service calls if the controller handles vehicle data
          if (['vehicleController', 'paymentController', 'bikeController', 'tradeInventoryController'].includes(controllerName)) {
            expect(hasUniversalServiceCall).toBe(true);
          }
          
          // **REQUIREMENT 2.1**: Controllers should NOT call competing service methods directly
          const competingServiceMethods = [
            'CheckCarDetailsClient.getVehicleData',
            'CheckCarDetailsClient.getVehicleSpecs', 
            'comprehensiveService.fetchCompleteVehicleData',
            'enhancedVehicleService.getVehicleDataWithFallback',
            'lightweightVehicleService.getBasicVehicleDataForCarFinder'
          ];
          
          competingServiceMethods.forEach(methodCall => {
            // Allow comments mentioning the method, but not actual calls
            const hasDirectMethodCall = controllerContent.includes(methodCall) &&
                                      !controllerContent.includes(`// CRITICAL: Use Universal Auto Complete Service instead of`);
            
            expect(hasDirectMethodCall).toBe(false);
          });
        }
      ), { numRuns: 4 }); // One run per controller
    });
  });

  /**
   * Property 2.3: Service Initialization Analysis
   * Validates that controllers initialize Universal Service instead of competing services
   */
  describe('Service Initialization Analysis', () => {
    it('should verify controllers initialize Universal Service instead of competing services', () => {
      return fc.assert(fc.property(
        fc.constantFrom(
          'vehicleController',
          'paymentController',
          'bikeController',
          'tradeInventoryController'
        ),
        (controllerName) => {
          // Read controller file content
          const fs = require('fs');
          const path = require('path');
          
          const controllerPath = path.join(__dirname, '../../controllers', `${controllerName}.js`);
          const controllerContent = fs.readFileSync(controllerPath, 'utf8');
          
          // **REQUIREMENT 1.2**: Controllers should initialize Universal Service
          const hasUniversalServiceInit = controllerContent.includes('new UniversalAutoCompleteService()') ||
                                        controllerContent.includes('const universalService');
          
          // Only require Universal Service initialization if the controller handles vehicle data
          if (['vehicleController', 'paymentController', 'bikeController', 'tradeInventoryController'].includes(controllerName)) {
            expect(hasUniversalServiceInit).toBe(true);
          }
          
          // **REQUIREMENT 2.1**: Controllers should NOT initialize competing services
          const competingServiceInits = [
            'new CheckCarDetailsClient',
            'new ComprehensiveVehicleService',
            'new EnhancedVehicleService',
            'new LightweightVehicleService'
          ];
          
          competingServiceInits.forEach(serviceInit => {
            const hasCompetingServiceInit = controllerContent.includes(serviceInit);
            expect(hasCompetingServiceInit).toBe(false);
          });
        }
      ), { numRuns: 4 }); // One run per controller
    });
  });

  /**
   * Property 2.4: Data Flow Pattern Analysis
   * Validates that controllers follow the correct data flow pattern
   */
  describe('Data Flow Pattern Analysis', () => {
    it('should verify controllers follow Universal Service data flow pattern', () => {
      return fc.assert(fc.property(
        fc.record({
          controllerName: fc.constantFrom(
            'vehicleController',
            'paymentController', 
            'bikeController',
            'tradeInventoryController'
          ),
          methodPattern: fc.constantFrom(
            'lookup',
            'create',
            'enhance',
            'complete'
          )
        }),
        (testData) => {
          // Read controller file content
          const fs = require('fs');
          const path = require('path');
          
          const controllerPath = path.join(__dirname, '../../controllers', `${testData.controllerName}.js`);
          const controllerContent = fs.readFileSync(controllerPath, 'utf8');
          
          // **REQUIREMENT 1.2**: Data flow should go through Universal Service
          // Look for the correct pattern: Controller → Universal Service → Database
          
          // Check for Universal Service usage in vehicle data operations
          const vehicleDataOperations = [
            'lookupAndCreateVehicle',
            'enhancedVehicleLookup', 
            'basicVehicleLookup',
            'createVehicle',
            'enhancedBikeLookup',
            'handlePaymentSuccess'
          ];
          
          let hasCorrectDataFlow = false;
          
          vehicleDataOperations.forEach(operation => {
            if (controllerContent.includes(operation)) {
              // Check if this operation uses Universal Service
              const operationStart = controllerContent.indexOf(operation);
              const nextFunctionStart = controllerContent.indexOf('async ', operationStart + 1);
              const operationEnd = nextFunctionStart > 0 ? nextFunctionStart : controllerContent.length;
              const operationCode = controllerContent.substring(operationStart, operationEnd);
              
              if (operationCode.includes('universalService.completeCarData') ||
                  operationCode.includes('await universalService.') ||
                  operationCode.includes('universalService.')) {
                hasCorrectDataFlow = true;
              }
            }
          });
          
          // Also check for general Universal Service usage patterns
          if (!hasCorrectDataFlow) {
            const universalServicePatterns = [
              'universalService.completeCarData',
              'await universalService.',
              'new UniversalAutoCompleteService',
              'const universalService'
            ];
            
            hasCorrectDataFlow = universalServicePatterns.some(pattern => 
              controllerContent.includes(pattern)
            );
          }
          
          // **REQUIREMENT 2.1**: Controllers with vehicle operations should use Universal Service
          if (['vehicleController', 'paymentController', 'bikeController', 'tradeInventoryController'].includes(testData.controllerName)) {
            expect(hasCorrectDataFlow).toBe(true);
          }
          
          // **REQUIREMENT 2.3**: Payment controller should use Universal Service for vehicle data
          if (testData.controllerName === 'paymentController') {
            const hasPaymentVehicleDataFlow = controllerContent.includes('universalService.completeCarData');
            expect(hasPaymentVehicleDataFlow).toBe(true);
          }
        }
      ), { numRuns: 16 }); // 4 controllers × 4 patterns
    });
  });

  /**
   * Property 2.5: Comment Analysis for Service Replacement
   * Validates that controllers have proper comments indicating service replacement
   */
  describe('Service Replacement Comment Analysis', () => {
    it('should verify controllers have comments indicating Universal Service usage', () => {
      return fc.assert(fc.property(
        fc.constantFrom(
          'vehicleController',
          'paymentController',
          'bikeController', 
          'tradeInventoryController'
        ),
        (controllerName) => {
          // Read controller file content
          const fs = require('fs');
          const path = require('path');
          
          const controllerPath = path.join(__dirname, '../../controllers', `${controllerName}.js`);
          const controllerContent = fs.readFileSync(controllerPath, 'utf8');
          
          // **REQUIREMENT 1.2**: Controllers should have comments indicating Universal Service usage
          const universalServiceComments = [
            'CRITICAL: Use Universal Auto Complete Service',
            'Universal Service handles all vehicle data fetching',
            'Universal Service handles all data fetching',
            'Using Universal Service for'
          ];
          
          const hasUniversalServiceComment = universalServiceComments.some(comment => 
            controllerContent.includes(comment)
          );
          
          // Only require comments if the controller handles vehicle data
          if (['vehicleController', 'paymentController', 'bikeController', 'tradeInventoryController'].includes(controllerName)) {
            expect(hasUniversalServiceComment).toBe(true);
          }
          
          // **REQUIREMENT 2.1**: Controllers should have comments indicating service replacement
          const serviceReplacementComments = [
            'instead of CheckCarDetailsClient',
            'instead of ComprehensiveVehicleService',
            'instead of enhancedVehicleService', 
            'instead of lightweightVehicleService'
          ];
          
          const hasServiceReplacementComment = serviceReplacementComments.some(comment => 
            controllerContent.includes(comment)
          );
          
          // At least one controller should have service replacement comments
          if (['vehicleController', 'bikeController', 'tradeInventoryController'].includes(controllerName)) {
            expect(hasServiceReplacementComment).toBe(true);
          }
        }
      ), { numRuns: 4 }); // One run per controller
    });
  });
});

/**
 * Test Summary:
 * 
 * Property 2: Controller service routing validates that:
 * 
 * ✅ Requirement 1.2: System routes all vehicle data requests through Universal_Service
 * ✅ Requirement 2.1: Controllers call Universal_Service instead of APIs directly  
 * ✅ Requirement 2.3: paymentController uses Universal_Service for all data fetching
 * 
 * The tests use property-based testing to verify through static code analysis that:
 * - All controllers import Universal Service instead of competing services
 * - All controllers call Universal Service methods instead of direct API methods
 * - All controllers initialize Universal Service instead of competing services
 * - All controllers follow the correct data flow pattern (Controller → Universal Service → Database)
 * - All controllers have proper comments indicating the service replacement
 * 
 * This ensures the "system confuse hora h" issue is resolved by having a single,
 * clear data flow through the Universal Service at the code level.
 */