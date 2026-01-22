/**
 * Vehicle Data Normalizer
 * Utilities for normalizing vehicle data to AutoTrader-compliant format
 */

const vehicleFormatter = require('./vehicleFormatter');

/**
 * Normalize engine size to litres format
 * @param {number|string} engineSize - Raw engine size value
 * @returns {number|null} - Normalized engine size in litres (e.g., 2.0, 1.6)
 */
function normalizeEngineSize(engineSize) {
  if (!engineSize || engineSize === 0) return null;
  
  const size = parseFloat(engineSize);
  if (isNaN(size)) return null;
  
  // If value is very large (e.g., 2000cc), convert to litres
  if (size >= 100) {
    return parseFloat((size / 1000).toFixed(1));
  }
  
  // If value is already in litres format (0.8 - 10.0), keep it
  if (size >= 0.8 && size <= 10.0) {
    return parseFloat(size.toFixed(1));
  }
  
  // For edge cases, assume it's in litres
  return parseFloat(size.toFixed(1));
}

/**
 * Format engine size for display
 * @param {number} engineSize - Engine size in litres
 * @returns {string} - Formatted string (e.g., "2.0L")
 */
function formatEngineSize(engineSize) {
  if (!engineSize) return '';
  return `${engineSize.toFixed(1)}L`;
}

/**
 * Normalize complete vehicle record with variant generation
 * @param {object} vehicle - Raw vehicle data
 * @returns {object} - Normalized vehicle data
 */
function normalizeVehicleData(vehicle) {
  const normalized = { ...vehicle };
  
  // Normalize engine size
  if (vehicle.engineSize) {
    normalized.engineSize = normalizeEngineSize(vehicle.engineSize);
    normalized.engineSizeLitres = normalized.engineSize;
  }
  
  // Generate variant automatically if missing
  if (!normalized.variant || normalized.variant === 'null' || normalized.variant === 'undefined') {
    const variant = vehicleFormatter.formatVariant(normalized);
    if (variant) {
      normalized.variant = variant;
    }
  }
  
  return normalized;
}

module.exports = {
  normalizeEngineSize,
  formatEngineSize,
  normalizeVehicleData
};
