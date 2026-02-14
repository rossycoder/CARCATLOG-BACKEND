/**
 * UK Vehicle Tax Calculator
 * Calculate annual road tax based on CO2 emissions and registration date
 * 
 * Tax bands: https://www.gov.uk/vehicle-tax-rate-tables
 */

/**
 * Calculate annual tax for vehicles registered after April 2017
 * @param {number} co2 - CO2 emissions in g/km
 * @param {number} listPrice - Original list price (for expensive car supplement)
 * @returns {number} Annual tax in GBP
 */
function calculatePost2017Tax(co2, listPrice = 0) {
  // Standard rate for petrol/diesel (after first year)
  const standardRate = 190; // 2024/25 rate
  
  // Expensive car supplement (over £40,000)
  const expensiveCarSupplement = listPrice > 40000 ? 410 : 0;
  
  // Zero emission vehicles
  if (co2 === 0) {
    return 0;
  }
  
  // Standard rate + expensive car supplement (if applicable)
  return standardRate + expensiveCarSupplement;
}

/**
 * Calculate annual tax for vehicles registered between March 2001 and March 2017
 * @param {number} co2 - CO2 emissions in g/km
 * @returns {number} Annual tax in GBP
 */
function calculate2001to2017Tax(co2) {
  // Tax bands for 2024/25
  const bands = [
    { max: 100, tax: 0 },
    { max: 110, tax: 20 },
    { max: 120, tax: 35 },
    { max: 130, tax: 150 },
    { max: 140, tax: 180 },
    { max: 150, tax: 210 },
    { max: 165, tax: 255 },
    { max: 175, tax: 295 },
    { max: 185, tax: 340 },
    { max: 200, tax: 395 },
    { max: 225, tax: 650 },
    { max: 255, tax: 1030 },
    { max: Infinity, tax: 1385 }
  ];
  
  for (const band of bands) {
    if (co2 <= band.max) {
      return band.tax;
    }
  }
  
  return bands[bands.length - 1].tax;
}

/**
 * Calculate annual tax for vehicles registered before March 2001
 * @param {number} engineSize - Engine size in litres
 * @returns {number} Annual tax in GBP
 */
function calculatePre2001Tax(engineSize) {
  // Simple bands based on engine size
  if (engineSize <= 1.549) {
    return 200; // Up to 1549cc
  } else {
    return 325; // Over 1549cc
  }
}

/**
 * Main function to calculate annual tax
 * @param {Object} vehicle - Vehicle data
 * @param {number} vehicle.year - Registration year
 * @param {number} vehicle.co2Emissions - CO2 emissions in g/km
 * @param {number} vehicle.engineSize - Engine size in litres
 * @param {number} vehicle.price - Vehicle price (for expensive car supplement)
 * @param {string} vehicle.fuelType - Fuel type
 * @returns {number|null} Annual tax in GBP or null if cannot calculate
 */
function calculateAnnualTax(vehicle) {
  const { year, co2Emissions, engineSize, price, fuelType } = vehicle;
  
  if (!year) {
    return null;
  }
  
  // Electric vehicles - zero tax
  if (fuelType === 'Electric') {
    return 0;
  }
  
  // Vehicles registered after April 2017
  if (year >= 2017) {
    if (co2Emissions !== null && co2Emissions !== undefined) {
      return calculatePost2017Tax(co2Emissions, price);
    }
    // Default standard rate if CO2 not available
    return 190;
  }
  
  // Vehicles registered between March 2001 and March 2017
  if (year >= 2001 && year < 2017) {
    if (co2Emissions !== null && co2Emissions !== undefined) {
      return calculate2001to2017Tax(co2Emissions);
    }
    return null; // Cannot calculate without CO2
  }
  
  // Vehicles registered before March 2001
  if (year < 2001) {
    if (engineSize) {
      return calculatePre2001Tax(engineSize);
    }
    return null; // Cannot calculate without engine size
  }
  
  return null;
}

module.exports = {
  calculateAnnualTax,
  calculatePost2017Tax,
  calculate2001to2017Tax,
  calculatePre2001Tax
};
