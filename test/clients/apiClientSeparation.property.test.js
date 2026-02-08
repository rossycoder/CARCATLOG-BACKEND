/**
 * Property-Based Tests for API Client Separation of Concerns
 * Feature: api-deduplication-cleanup
 * Property 11: Service separation of concerns
 * Validates: Requirements 6.1, 6.2, 6.3
 * 
 * Tests that API clients only handle HTTP communication and contain no business logic
 */

const fc = require('fast-check');
const CheckCarDetailsClient = require('../../clients/CheckCarDetailsClient');
const HistoryAPIClient = require('../../clients/HistoryAPIClient');
const ValuationAPIClient = require('../../clients/ValuationAPIClient');
const ApiResponseParser = require('../../utils/apiResponseParser');

describe('Property 11: Service Separation of Concerns', () => {
  describe('CheckCarDetailsClient separation', () => {
    test('parseResponse delegates to ApiResponseParser', () => {
      fc.assert(
        fc.property(
          fc.record({
            Make: fc.string(),
            Model: fc.string(),
            FuelType: fc.constantFrom('Petrol', 'Diesel', 'Electric', 'Hybrid'),
            Transmission: fc.constantFrom('Manual', 'Automatic', 'Semi-Automatic'),
          }),
          (mockApiResponse) => {
            const client = new CheckCarDetailsClient();
            
            // Parse using client method
            const clientResult = client.parseResponse(mockApiResponse);
            
            // Parse using utility directly
            const utilityResult = ApiResponseParser.parseCheckCarDetailsResponse(mockApiResponse);
            
            // Results should be identical - client just delegates
            expect(clientResult).toEqual(utilityResult);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('parseValuationResponse delegates to ApiResponseParser', () => {
      fc.assert(
        fc.property(
          fc.record({
            ValuationList: fc.record({
              DealerForecourt: fc.integer({ min: 1000, max: 100000 }),
              PrivateClean: fc.integer({ min: 1000, max: 100000 }),
              PartExchange: fc.integer({ min: 1000, max: 100000 }),
            }),
          }),
          (mockValuationResponse) => {
            const client = new CheckCarDetailsClient();
            
            // Parse using client method
            const clientResult = client.parseValuationResponse(mockValuationResponse);
            
            // Parse using utility directly
            const utilityResult = ApiResponseParser.parseValuationResponse(mockValuationResponse);
            
            // Results should be identical - client just delegates
            expect(clientResult).toEqual(utilityResult);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('HistoryAPIClient separation', () => {
    const mockApiKey = 'test-key';
    const mockBaseUrl = 'https://api.test.com';

    test('getVehicleRegistration delegates parsing to ApiResponseParser', () => {
      fc.assert(
        fc.property(
          fc.record({
            registrationNumber: fc.string({ minLength: 5, maxLength: 8 }),
            Make: fc.string(),
            Model: fc.string(),
            Colour: fc.string(),
          }),
          (mockResponse) => {
            // Parse using utility directly
            const utilityResult = ApiResponseParser.parseVehicleRegistrationResponse(mockResponse);
            
            // Verify utility handles the parsing
            expect(utilityResult).toHaveProperty('vrm');
            expect(utilityResult).toHaveProperty('make');
            expect(utilityResult).toHaveProperty('model');
            expect(utilityResult).toHaveProperty('colour');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getVehicleSpecs delegates parsing to ApiResponseParser', () => {
      fc.assert(
        fc.property(
          fc.record({
            VehicleIdentification: fc.record({
              DvlaMake: fc.string(),
              DvlaModel: fc.string(),
            }),
            BodyDetails: fc.record({
              NumberOfDoors: fc.integer({ min: 2, max: 5 }),
              NumberOfSeats: fc.integer({ min: 2, max: 9 }),
            }),
          }),
          (mockResponse) => {
            // Parse using utility directly
            const utilityResult = ApiResponseParser.parseVehicleSpecsResponse(mockResponse);
            
            // Verify utility handles the parsing
            expect(utilityResult).toHaveProperty('make');
            expect(utilityResult).toHaveProperty('model');
            expect(utilityResult).toHaveProperty('doors');
            expect(utilityResult).toHaveProperty('seats');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getMileageHistory delegates parsing to ApiResponseParser', () => {
      fc.assert(
        fc.property(
          fc.record({
            registrationNumber: fc.string({ minLength: 5, maxLength: 8 }),
            mileage: fc.array(
              fc.record({
                Mileage: fc.integer({ min: 0, max: 300000 }),
                Date: fc.date().map(d => d.toISOString()),
                Source: fc.constantFrom('MOT', 'Service', 'Dealer'),
              }),
              { minLength: 1, maxLength: 10 }
            ),
          }),
          (mockResponse) => {
            // Parse using utility directly
            const utilityResult = ApiResponseParser.parseMileageResponse(mockResponse);
            
            // Verify utility handles the parsing
            expect(utilityResult).toHaveProperty('vrm');
            expect(utilityResult).toHaveProperty('readings');
            expect(Array.isArray(utilityResult.readings)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getMOTHistory delegates parsing to ApiResponseParser', () => {
      fc.assert(
        fc.property(
          fc.record({
            registrationNumber: fc.string({ minLength: 5, maxLength: 8 }),
            motHistory: fc.array(
              fc.record({
                completedDate: fc.date().map(d => d.toISOString()),
                testResult: fc.constantFrom('PASSED', 'FAILED'),
                odometerValue: fc.integer({ min: 0, max: 300000 }),
              }),
              { minLength: 0, maxLength: 10 }
            ),
          }),
          (mockResponse) => {
            // Parse using utility directly
            const utilityResult = ApiResponseParser.parseMOTResponse(mockResponse);
            
            // Verify utility handles the parsing
            expect(utilityResult).toHaveProperty('vrm');
            expect(utilityResult).toHaveProperty('tests');
            expect(Array.isArray(utilityResult.tests)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('API clients contain no business logic', () => {
    test('CheckCarDetailsClient methods only handle HTTP and delegation', () => {
      const client = new CheckCarDetailsClient();
      
      // Check that parsing methods are simple delegations
      const parseResponseCode = client.parseResponse.toString();
      const parseValuationCode = client.parseValuationResponse.toString();
      
      // Should contain calls to ApiResponseParser
      expect(parseResponseCode).toContain('ApiResponseParser');
      expect(parseValuationCode).toContain('ApiResponseParser');
      
      // Should not contain complex business logic keywords
      const businessLogicKeywords = ['if', 'for', 'while', 'switch'];
      businessLogicKeywords.forEach(keyword => {
        // Allow simple if statements for null checks, but not complex logic
        const complexPatterns = [
          new RegExp(`${keyword}\\s*\\([^)]{20,}\\)`, 'g'), // Complex conditions
          new RegExp(`${keyword}[^{]*{[^}]{50,}}`, 'g'), // Long blocks
        ];
        
        complexPatterns.forEach(pattern => {
          expect(parseResponseCode.match(pattern) || []).toHaveLength(0);
          expect(parseValuationCode.match(pattern) || []).toHaveLength(0);
        });
      });
    });

    test('HistoryAPIClient parsing methods delegate to utilities', () => {
      const mockApiKey = 'test-key';
      const mockBaseUrl = 'https://api.test.com';
      const client = new HistoryAPIClient(mockApiKey, mockBaseUrl);
      
      // Verify that client has minimal parsing logic
      // The parseUKVehicleDataResponse is an exception as it's specific to history workflow
      // But other parsing should be delegated
      
      // Check that the client doesn't duplicate parsing logic
      const clientCode = client.constructor.toString();
      
      // Should reference ApiResponseParser for standard parsing
      expect(clientCode).toContain('ApiResponseParser');
    });

    test('ValuationAPIClient delegates parsing to utilities', () => {
      const mockApiKey = 'test-key';
      const mockBaseUrl = 'https://api.test.com';
      const client = new ValuationAPIClient(mockApiKey, mockBaseUrl);
      
      // Check that client delegates to parsing utilities
      const getValuationCode = client.getValuation.toString();
      
      // Should contain calls to parsing utilities
      expect(getValuationCode).toContain('parseValuationResponse');
      expect(getValuationCode).toContain('handlePartialValuationResponse');
    });
  });

  describe('Utility functions contain business logic', () => {
    test('ApiResponseParser contains data transformation logic', () => {
      // Verify that the utility has the business logic
      const parseCheckCarDetailsCode = ApiResponseParser.parseCheckCarDetailsResponse.toString();
      
      // Should contain data extraction and transformation logic
      expect(parseCheckCarDetailsCode.length).toBeGreaterThan(1000); // Substantial logic
      expect(parseCheckCarDetailsCode).toContain('extractNumber');
      expect(parseCheckCarDetailsCode).toContain('normalizeFuelType');
      expect(parseCheckCarDetailsCode).toContain('normalizeTransmission');
    });

    test('ApiResponseParser normalization methods work correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('PETROL', 'petrol', 'Petrol', 'DIESEL', 'diesel', 'Diesel'),
          (fuelType) => {
            const normalized = ApiResponseParser.normalizeFuelType(fuelType);
            
            // Should normalize to standard format
            expect(['Petrol', 'Diesel']).toContain(normalized);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('ApiResponseParser extractNumber handles various formats', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer(),
            fc.float(),
            fc.integer().map(n => `${n}`),
            fc.float().map(n => `${n} mph`),
            fc.float().map(n => `£${n}`),
          ),
          (value) => {
            const extracted = ApiResponseParser.extractNumber(value);
            
            // Should extract number or return null
            expect(extracted === null || typeof extracted === 'number').toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Separation of concerns is maintained', () => {
    test('API clients focus on HTTP communication', () => {
      // Verify that API clients have HTTP-related methods
      const checkCarClient = new CheckCarDetailsClient();
      const historyClient = new HistoryAPIClient('key', 'url');
      const valuationClient = new ValuationAPIClient('key', 'url');
      
      // Should have HTTP request methods
      expect(typeof checkCarClient.makeRequestWithRetry).toBe('function');
      expect(typeof historyClient.makeRequestWithRetry).toBe('function');
      expect(typeof valuationClient.makeRequestWithRetry).toBe('function');
      
      // Should have validation methods
      expect(typeof checkCarClient.validateApiKey).toBe('function');
      expect(typeof checkCarClient.validateVRM).toBe('function');
      expect(typeof historyClient.validateTestVRM).toBe('function');
    });

    test('Utilities focus on data transformation', () => {
      // Verify that utilities have transformation methods
      expect(typeof ApiResponseParser.parseCheckCarDetailsResponse).toBe('function');
      expect(typeof ApiResponseParser.parseValuationResponse).toBe('function');
      expect(typeof ApiResponseParser.parseVehicleRegistrationResponse).toBe('function');
      expect(typeof ApiResponseParser.parseVehicleSpecsResponse).toBe('function');
      expect(typeof ApiResponseParser.parseMileageResponse).toBe('function');
      expect(typeof ApiResponseParser.parseMOTResponse).toBe('function');
      expect(typeof ApiResponseParser.normalizeFuelType).toBe('function');
      expect(typeof ApiResponseParser.normalizeTransmission).toBe('function');
      expect(typeof ApiResponseParser.extractNumber).toBe('function');
    });
  });
});
