/**
 * Unit tests for Enhanced Vehicle Service
 * Tests parallel API calls, caching, error handling, and data merging
 */

// Mock all dependencies before requiring
jest.mock('../../services/dvlaService', () => ({
  lookupVehicle: jest.fn()
}));

jest.mock('../../clients/CheckCarDetailsClient', () => ({
  getVehicleData: jest.fn()
}));

jest.mock('../../models/VehicleHistory', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn()
}));

jest.mock('../../utils/dataMerger', () => ({
  merge: jest.fn()
}));

const enhancedVehicleService = require('../../services/enhancedVehicleService');
const dvlaService = require('../../services/dvlaService');
const CheckCarDetailsClient = require('../../clients/CheckCarDetailsClient');
const VehicleHistory = require('../../models/VehicleHistory');
const dataMerger = require('../../utils/dataMerger');

describe('Enhanced Vehicle Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Parallel API Calls', () => {
    test('should call both APIs in parallel', async () => {
      const mockDvlaData = { make: 'BMW', model: '3 Series' };
      const mockCheckCarData = { fuelEconomy: { combined: 45.8 } };
      const mockMergedData = { make: { value: 'BMW', source: 'dvla' } };

      dvlaService.lookupVehicle = jest.fn().mockResolvedValue(mockDvlaData);
      CheckCarDetailsClient.getVehicleData = jest.fn().mockResolvedValue(mockCheckCarData);
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOne = jest.fn().mockResolvedValue(null);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', false);

      expect(dvlaService.lookupVehicle).toHaveBeenCalledWith('AB12CDE');
      expect(CheckCarDetailsClient.getVehicleData).toHaveBeenCalledWith('AB12CDE');
      expect(dataMerger.merge).toHaveBeenCalled();
    });

    test('should continue if one API fails', async () => {
      const mockCheckCarData = { fuelEconomy: { combined: 45.8 } };
      const mockMergedData = { make: { value: null, source: null } };

      dvlaService.lookupVehicle = jest.fn().mockRejectedValue(new Error('DVLA_ERROR'));
      CheckCarDetailsClient.getVehicleData = jest.fn().mockResolvedValue(mockCheckCarData);
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOne = jest.fn().mockResolvedValue(null);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      const result = await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', false);

      expect(result).toBeDefined();
      expect(dataMerger.merge).toHaveBeenCalledWith(null, mockCheckCarData);
    });

    test('should continue if both APIs fail', async () => {
      const mockMergedData = { make: { value: null, source: null } };

      dvlaService.lookupVehicle = jest.fn().mockRejectedValue(new Error('DVLA_ERROR'));
      CheckCarDetailsClient.getVehicleData = jest.fn().mockRejectedValue(new Error('CHECKCAR_ERROR'));
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOne = jest.fn().mockResolvedValue(null);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      const result = await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', false);

      expect(result).toBeDefined();
      expect(dataMerger.merge).toHaveBeenCalledWith(null, null);
    });
  });


  describe('Cache Hit/Miss Scenarios', () => {
    test('should return cached data when available and valid', async () => {
      const mockCachedData = {
        make: { value: 'BMW', source: 'dvla' },
        dataSources: { dvla: true, checkCarDetails: true }
      };

      VehicleHistory.findOne = jest.fn().mockResolvedValue({
        registration: 'AB12CDE',
        enhancedData: mockCachedData,
        lastUpdated: new Date()
      });

      const result = await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', true);

      expect(result).toEqual(mockCachedData);
      expect(dvlaService.lookupVehicle).not.toHaveBeenCalled();
      expect(CheckCarDetailsClient.getVehicleData).not.toHaveBeenCalled();
    });

    test('should call APIs when cache is expired', async () => {
      const expiredDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
      const mockMergedData = { make: { value: 'BMW', source: 'dvla' } };

      VehicleHistory.findOne = jest.fn().mockResolvedValue({
        registration: 'AB12CDE',
        enhancedData: mockMergedData,
        lastUpdated: expiredDate
      });

      dvlaService.lookupVehicle = jest.fn().mockResolvedValue({ make: 'BMW' });
      CheckCarDetailsClient.getVehicleData = jest.fn().mockResolvedValue({ fuelEconomy: {} });
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', true);

      expect(dvlaService.lookupVehicle).toHaveBeenCalled();
      expect(CheckCarDetailsClient.getVehicleData).toHaveBeenCalled();
    });

    test('should call APIs when cache is empty', async () => {
      const mockMergedData = { make: { value: 'BMW', source: 'dvla' } };

      VehicleHistory.findOne = jest.fn().mockResolvedValue(null);
      dvlaService.lookupVehicle = jest.fn().mockResolvedValue({ make: 'BMW' });
      CheckCarDetailsClient.getVehicleData = jest.fn().mockResolvedValue({ fuelEconomy: {} });
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', true);

      expect(dvlaService.lookupVehicle).toHaveBeenCalled();
      expect(CheckCarDetailsClient.getVehicleData).toHaveBeenCalled();
    });

    test('should bypass cache when useCache is false', async () => {
      const mockMergedData = { make: { value: 'BMW', source: 'dvla' } };

      dvlaService.lookupVehicle = jest.fn().mockResolvedValue({ make: 'BMW' });
      CheckCarDetailsClient.getVehicleData = jest.fn().mockResolvedValue({ fuelEconomy: {} });
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', false);

      expect(VehicleHistory.findOne).not.toHaveBeenCalled();
      expect(dvlaService.lookupVehicle).toHaveBeenCalled();
    });
  });


  describe('Error Handling', () => {
    test('should handle DVLA API failure gracefully', async () => {
      const mockCheckCarData = { fuelEconomy: { combined: 45.8 } };
      const mockMergedData = {
        make: { value: 'BMW', source: 'checkcardetails' },
        dataSources: { dvla: false, checkCarDetails: true }
      };

      dvlaService.lookupVehicle = jest.fn().mockRejectedValue(new Error('DVLA_ERROR'));
      CheckCarDetailsClient.getVehicleData = jest.fn().mockResolvedValue(mockCheckCarData);
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOne = jest.fn().mockResolvedValue(null);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      const result = await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', false);

      expect(result.dataSources.dvla).toBe(false);
      expect(result.dataSources.checkCarDetails).toBe(true);
    });

    test('should handle CheckCarDetails API failure gracefully', async () => {
      const mockDvlaData = { make: 'BMW', model: '3 Series' };
      const mockMergedData = {
        make: { value: 'BMW', source: 'dvla' },
        dataSources: { dvla: true, checkCarDetails: false }
      };

      dvlaService.lookupVehicle = jest.fn().mockResolvedValue(mockDvlaData);
      CheckCarDetailsClient.getVehicleData = jest.fn().mockRejectedValue(new Error('CHECKCAR_ERROR'));
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOne = jest.fn().mockResolvedValue(null);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      const result = await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', false);

      expect(result.dataSources.dvla).toBe(true);
      expect(result.dataSources.checkCarDetails).toBe(false);
    });

    test('should handle both APIs failing', async () => {
      const mockMergedData = {
        make: { value: null, source: null },
        dataSources: { dvla: false, checkCarDetails: false }
      };

      dvlaService.lookupVehicle = jest.fn().mockRejectedValue(new Error('DVLA_ERROR'));
      CheckCarDetailsClient.getVehicleData = jest.fn().mockRejectedValue(new Error('CHECKCAR_ERROR'));
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOne = jest.fn().mockResolvedValue(null);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      const result = await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', false);

      expect(result.dataSources.dvla).toBe(false);
      expect(result.dataSources.checkCarDetails).toBe(false);
    });

    test('should handle cache failure gracefully', async () => {
      const mockMergedData = { make: { value: 'BMW', source: 'dvla' } };

      VehicleHistory.findOne = jest.fn().mockRejectedValue(new Error('DB_ERROR'));
      dvlaService.lookupVehicle = jest.fn().mockResolvedValue({ make: 'BMW' });
      CheckCarDetailsClient.getVehicleData = jest.fn().mockResolvedValue({ fuelEconomy: {} });
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      const result = await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', true);

      expect(result).toBeDefined();
      expect(dvlaService.lookupVehicle).toHaveBeenCalled();
    });
  });


  describe('Data Merging Integration', () => {
    test('should pass correct data to data merger', async () => {
      const mockDvlaData = { make: 'BMW', model: '3 Series', year: 2020 };
      const mockCheckCarData = { fuelEconomy: { combined: 45.8 }, performance: { power: 184 } };
      const mockMergedData = { make: { value: 'BMW', source: 'dvla' } };

      dvlaService.lookupVehicle = jest.fn().mockResolvedValue(mockDvlaData);
      CheckCarDetailsClient.getVehicleData = jest.fn().mockResolvedValue(mockCheckCarData);
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOne = jest.fn().mockResolvedValue(null);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', false);

      expect(dataMerger.merge).toHaveBeenCalledWith(
        expect.objectContaining({ make: 'BMW', model: '3 Series' }),
        mockCheckCarData
      );
    });

    test('should add registration to merged data', async () => {
      const mockMergedData = { make: { value: 'BMW', source: 'dvla' } };

      dvlaService.lookupVehicle = jest.fn().mockResolvedValue({ make: 'BMW' });
      CheckCarDetailsClient.getVehicleData = jest.fn().mockResolvedValue({ fuelEconomy: {} });
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOne = jest.fn().mockResolvedValue(null);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      const result = await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', false);

      expect(result.registration).toBe('AB12CDE');
    });

    test('should cache merged data after successful lookup', async () => {
      const mockMergedData = { make: { value: 'BMW', source: 'dvla' } };

      dvlaService.lookupVehicle = jest.fn().mockResolvedValue({ make: 'BMW' });
      CheckCarDetailsClient.getVehicleData = jest.fn().mockResolvedValue({ fuelEconomy: {} });
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOne = jest.fn().mockResolvedValue(null);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      await enhancedVehicleService.getEnhancedVehicleData('AB12CDE', false);

      expect(VehicleHistory.findOneAndUpdate).toHaveBeenCalledWith(
        { registration: 'AB12CDE' },
        expect.objectContaining({
          registration: 'AB12CDE',
          enhancedData: expect.objectContaining({ registration: 'AB12CDE' })
        }),
        { upsert: true, new: true }
      );
    });
  });

  describe('Fallback Handling', () => {
    test('should return success with data when lookup succeeds', async () => {
      const mockMergedData = {
        make: { value: 'BMW', source: 'dvla' },
        dataSources: { dvla: true, checkCarDetails: true }
      };

      dvlaService.lookupVehicle = jest.fn().mockResolvedValue({ make: 'BMW' });
      CheckCarDetailsClient.getVehicleData = jest.fn().mockResolvedValue({ fuelEconomy: {} });
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOne = jest.fn().mockResolvedValue(null);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      const result = await enhancedVehicleService.getVehicleDataWithFallback('AB12CDE');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    test('should generate warnings when one API fails', async () => {
      const mockMergedData = {
        make: { value: 'BMW', source: 'dvla' },
        dataSources: { dvla: true, checkCarDetails: false }
      };

      dvlaService.lookupVehicle = jest.fn().mockResolvedValue({ make: 'BMW' });
      CheckCarDetailsClient.getVehicleData = jest.fn().mockRejectedValue(new Error('ERROR'));
      dataMerger.merge = jest.fn().mockReturnValue(mockMergedData);
      VehicleHistory.findOne = jest.fn().mockResolvedValue(null);
      VehicleHistory.findOneAndUpdate = jest.fn().mockResolvedValue({});

      const result = await enhancedVehicleService.getVehicleDataWithFallback('AB12CDE');

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('CheckCarDetails');
    });
  });
});
