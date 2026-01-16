describe('CheckCarDetailsClient', () => {
  test('module loads correctly', () => {
    const client = require('../../clients/CheckCarDetailsClient');
    expect(client).toBeDefined();
    expect(client.timeout).toBe(10000);
  });

  test('extractNumber works', () => {
    const client = require('../../clients/CheckCarDetailsClient');
    expect(client.extractNumber(123)).toBe(123);
    expect(client.extractNumber('45.6')).toBe(45.6);
    expect(client.extractNumber(null)).toBeNull();
  });

  test('validateVRM rejects invalid input', () => {
    const client = require('../../clients/CheckCarDetailsClient');
    expect(() => client.validateVRM(null)).toThrow();
    expect(() => client.validateVRM('')).toThrow();
  });

  test('parseResponse handles data', () => {
    const client = require('../../clients/CheckCarDetailsClient');
    const result = client.parseResponse({
      Make: 'BMW',
      FuelConsumptionCombined: '45.8'
    });
    expect(result.make).toBe('BMW');
    expect(result.fuelEconomy.combined).toBe(45.8);
  });
});
