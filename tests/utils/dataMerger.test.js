/**
 * Unit tests for Data Merger utility
 * Tests priority rules, fallback logic, source tracking, and null handling
 */

const dataMerger = require('../../utils/dataMerger');

describe('Data Merger', () => {
  describe('Priority Rules', () => {
    test('should prioritize DVLA for basic vehicle info', () => {
      const dvlaData = {
        make: 'BMW',
        model: '3 Series',
        year: 2020
      };
      
      const checkCarData = {
        make: 'BMW',
        model: '320d',
        year: 2020
      };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      expect(result.make.value).toBe('BMW');
      expect(result.make.source).toBe('dvla');
      expect(result.model.value).toBe('3 Series');
      expect(result.model.source).toBe('dvla');
    });

    test('should prioritize CheckCarDetails for running costs', () => {
      const dvlaData = {
        make: 'Ford',
        co2Emissions: 130,
        annualTax: 160
      };
      
      const checkCarData = {
        co2Emissions: 125,
        annualTax: 150,
        insuranceGroup: '25E',
        fuelEconomy: {
          urban: 35.5,
          combined: 45.8
        }
      };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      expect(result.runningCosts.co2Emissions.value).toBe(125);
      expect(result.runningCosts.co2Emissions.source).toBe('checkcardetails');
      expect(result.runningCosts.annualTax.value).toBe(150);
      expect(result.runningCosts.annualTax.source).toBe('checkcardetails');
    });

    test('should use CheckCarDetails only for performance data', () => {
      const dvlaData = { make: 'BMW' };
      
      const checkCarData = {
        performance: {
          power: 184,
          torque: 290,
          acceleration: 7.1,
          topSpeed: 146
        }
      };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      expect(result.performance.power.value).toBe(184);
      expect(result.performance.power.source).toBe('checkcardetails');
      expect(result.performance.torque.value).toBe(290);
      expect(result.performance.torque.source).toBe('checkcardetails');
    });
  });

  describe('Fallback Logic', () => {
    test('should fall back to CheckCarDetails when DVLA data missing', () => {
      const dvlaData = { year: 2020 };
      const checkCarData = {
        make: 'BMW',
        model: '320d',
        fuelType: 'Diesel'
      };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      expect(result.make.value).toBe('BMW');
      expect(result.make.source).toBe('checkcardetails');
      expect(result.model.value).toBe('320d');
      expect(result.model.source).toBe('checkcardetails');
    });

    test('should fall back to DVLA when CheckCarDetails data missing', () => {
      const dvlaData = {
        make: 'Ford',
        co2Emissions: 130,
        annualTax: 160
      };
      const checkCarData = { fuelEconomy: { combined: 50.2 } };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      expect(result.runningCosts.co2Emissions.value).toBe(130);
      expect(result.runningCosts.co2Emissions.source).toBe('dvla');
      expect(result.runningCosts.annualTax.value).toBe(160);
      expect(result.runningCosts.annualTax.source).toBe('dvla');
    });

    test('should handle only DVLA data available', () => {
      const dvlaData = {
        make: 'BMW',
        model: '3 Series',
        year: 2020
      };
      
      const result = dataMerger.merge(dvlaData, null);
      
      expect(result.make.value).toBe('BMW');
      expect(result.make.source).toBe('dvla');
      expect(result.runningCosts.fuelEconomy.combined.value).toBeNull();
      expect(result.performance.power.value).toBeNull();
      expect(result.dataSources.dvla).toBe(true);
      expect(result.dataSources.checkCarDetails).toBe(false);
    });

    test('should handle only CheckCarDetails data available', () => {
      const checkCarData = {
        make: 'BMW',
        fuelEconomy: { combined: 45.8 },
        performance: { power: 184 }
      };
      
      const result = dataMerger.merge(null, checkCarData);
      
      expect(result.make.value).toBe('BMW');
      expect(result.make.source).toBe('checkcardetails');
      expect(result.runningCosts.fuelEconomy.combined.value).toBe(45.8);
      expect(result.performance.power.value).toBe(184);
      expect(result.dataSources.dvla).toBe(false);
      expect(result.dataSources.checkCarDetails).toBe(true);
    });
  });

  describe('Source Tracking', () => {
    test('should track source for each field', () => {
      const dvlaData = { make: 'BMW', model: '3 Series' };
      const checkCarData = {
        fuelEconomy: { combined: 45.8 },
        performance: { power: 184 }
      };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      expect(result.fieldSources.make).toBe('dvla');
      expect(result.fieldSources.model).toBe('dvla');
      expect(result.fieldSources.runningCosts.fuelEconomy.combined).toBe('checkcardetails');
      expect(result.fieldSources.performance.power).toBe('checkcardetails');
    });

    test('should include timestamp in data sources', () => {
      const dvlaData = { make: 'BMW' };
      const checkCarData = { fuelEconomy: { combined: 45.8 } };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      expect(result.dataSources.timestamp).toBeDefined();
      expect(typeof result.dataSources.timestamp).toBe('string');
    });
  });


  describe('Null/Undefined Handling', () => {
    test('should handle null values gracefully', () => {
      const dvlaData = { make: null, model: 'Focus' };
      const checkCarData = { make: 'Ford', fuelEconomy: { combined: null } };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      expect(result.make.value).toBe('Ford');
      expect(result.make.source).toBe('checkcardetails');
      expect(result.model.value).toBe('Focus');
      expect(result.runningCosts.fuelEconomy.combined.value).toBeNull();
    });

    test('should handle undefined values gracefully', () => {
      const dvlaData = { make: 'BMW', model: undefined };
      const checkCarData = { model: '320d' };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      expect(result.model.value).toBe('320d');
      expect(result.model.source).toBe('checkcardetails');
    });

    test('should handle empty strings as invalid', () => {
      const dvlaData = { make: '', model: 'Focus' };
      const checkCarData = { make: 'Ford' };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      expect(result.make.value).toBe('Ford');
      expect(result.make.source).toBe('checkcardetails');
    });

    test('should handle whitespace-only strings as invalid', () => {
      const dvlaData = { make: '   ', model: 'Focus' };
      const checkCarData = { make: 'Ford' };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      expect(result.make.value).toBe('Ford');
      expect(result.make.source).toBe('checkcardetails');
    });

    test('should return empty structure when both APIs provide no data', () => {
      const result = dataMerger.merge(null, null);
      
      expect(result.make.value).toBeNull();
      expect(result.model.value).toBeNull();
      expect(result.runningCosts.fuelEconomy.combined.value).toBeNull();
      expect(result.performance.power.value).toBeNull();
      expect(result.dataSources.dvla).toBe(false);
      expect(result.dataSources.checkCarDetails).toBe(false);
    });
  });


  describe('Field Source Mapping', () => {
    test('should create complete field source mapping', () => {
      const dvlaData = {
        make: 'BMW',
        model: '3 Series',
        year: 2020,
        color: 'Black',
        fuelType: 'Diesel',
        transmission: 'Automatic',
        engineSize: 1995
      };
      
      const checkCarData = {
        fuelEconomy: {
          urban: 35.5,
          extraUrban: 55.2,
          combined: 45.8
        },
        co2Emissions: 125,
        insuranceGroup: '25E',
        annualTax: 150,
        performance: {
          power: 184,
          torque: 290,
          acceleration: 7.1,
          topSpeed: 146
        }
      };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      // Check basic fields
      expect(result.fieldSources.make).toBe('dvla');
      expect(result.fieldSources.model).toBe('dvla');
      expect(result.fieldSources.year).toBe('dvla');
      
      // Check running costs
      expect(result.fieldSources.runningCosts.fuelEconomy.urban).toBe('checkcardetails');
      expect(result.fieldSources.runningCosts.fuelEconomy.combined).toBe('checkcardetails');
      expect(result.fieldSources.runningCosts.co2Emissions).toBe('checkcardetails');
      expect(result.fieldSources.runningCosts.insuranceGroup).toBe('checkcardetails');
      
      // Check performance
      expect(result.fieldSources.performance.power).toBe('checkcardetails');
      expect(result.fieldSources.performance.torque).toBe('checkcardetails');
    });

    test('should handle partial field source mapping', () => {
      const dvlaData = { make: 'Ford' };
      const checkCarData = { fuelEconomy: { combined: 50.2 } };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      expect(result.fieldSources.make).toBe('dvla');
      expect(result.fieldSources.runningCosts.fuelEconomy.combined).toBe('checkcardetails');
      expect(result.fieldSources.model).toBeUndefined();
    });
  });


  describe('Complex Scenarios', () => {
    test('should handle partial data from both APIs', () => {
      const dvlaData = {
        make: 'Ford',
        model: 'Focus',
        year: 2019
      };
      
      const checkCarData = {
        fuelEconomy: { combined: 50.2 },
        co2Emissions: 110
      };
      
      const result = dataMerger.merge(dvlaData, checkCarData);
      
      expect(result.make.value).toBe('Ford');
      expect(result.make.source).toBe('dvla');
      expect(result.model.value).toBe('Focus');
      expect(result.runningCosts.fuelEconomy.combined.value).toBe(50.2);
      expect(result.runningCosts.co2Emissions.value).toBe(110);
      expect(result.performance.power.value).toBeNull();
    });

    test('should handle nested fuel economy data', () => {
      const checkCarData = {
        fuelEconomy: {
          urban: 35.5,
          extraUrban: 55.2,
          combined: 45.8
        }
      };
      
      const result = dataMerger.merge(null, checkCarData);
      
      expect(result.runningCosts.fuelEconomy.urban.value).toBe(35.5);
      expect(result.runningCosts.fuelEconomy.extraUrban.value).toBe(55.2);
      expect(result.runningCosts.fuelEconomy.combined.value).toBe(45.8);
      expect(result.runningCosts.fuelEconomy.urban.source).toBe('checkcardetails');
    });

    test('should handle nested performance data', () => {
      const checkCarData = {
        performance: {
          power: 184,
          torque: 290,
          acceleration: 7.1,
          topSpeed: 146
        }
      };
      
      const result = dataMerger.merge(null, checkCarData);
      
      expect(result.performance.power.value).toBe(184);
      expect(result.performance.torque.value).toBe(290);
      expect(result.performance.acceleration.value).toBe(7.1);
      expect(result.performance.topSpeed.value).toBe(146);
      expect(result.performance.power.source).toBe('checkcardetails');
    });
  });
});
