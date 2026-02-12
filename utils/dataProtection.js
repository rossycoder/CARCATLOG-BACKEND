/**
 * Data Protection Utility
 * Prevents overwriting user-edited data with API data
 */

class DataProtection {
  /**
   * Check if a field has been manually edited by user
   * @param {Object} car - Car document
   * @param {string} fieldName - Field name to check
   * @returns {boolean} - True if field was manually edited
   */
  static isUserEdited(car, fieldName) {
    // Check if car has userEditedFields array
    if (!car.userEditedFields || !Array.isArray(car.userEditedFields)) {
      return false;
    }
    
    return car.userEditedFields.includes(fieldName);
  }

  /**
   * Mark a field as user-edited
   * @param {Object} car - Car document
   * @param {string} fieldName - Field name to mark
   */
  static markAsUserEdited(car, fieldName) {
    if (!car.userEditedFields) {
      car.userEditedFields = [];
    }
    
    if (!car.userEditedFields.includes(fieldName)) {
      car.userEditedFields.push(fieldName);
    }
  }

  /**
   * Merge API data with existing car data, protecting user-edited fields
   * @param {Object} existingCar - Existing car document
   * @param {Object} apiData - New data from API
   * @param {Array} protectedFields - Fields to protect from overwriting
   * @returns {Object} - Merged data
   */
  static mergeWithProtection(existingCar, apiData, protectedFields = []) {
    const mergedData = { ...apiData };
    
    // Default protected fields (always protect these)
    const defaultProtectedFields = [
      'motDue',
      'motExpiry',
      'color',
      'seats',
      'serviceHistory',
      'fuelType'
    ];
    
    const allProtectedFields = [...new Set([...defaultProtectedFields, ...protectedFields])];
    
    // Protect user-edited fields
    allProtectedFields.forEach(field => {
      if (this.isUserEdited(existingCar, field)) {
        // Keep existing value, don't overwrite with API data
        mergedData[field] = existingCar[field];
        console.log(`🛡️ Protected user-edited field: ${field} = ${existingCar[field]}`);
      } else if (existingCar[field] && !apiData[field]) {
        // If existing car has value but API doesn't, keep existing
        mergedData[field] = existingCar[field];
        console.log(`🛡️ Preserved existing field: ${field} = ${existingCar[field]}`);
      }
    });
    
    return mergedData;
  }

  /**
   * Should update field from API?
   * @param {Object} car - Car document
   * @param {string} fieldName - Field name
   * @param {*} existingValue - Current value
   * @param {*} apiValue - New value from API
   * @returns {boolean} - True if should update
   */
  static shouldUpdateFromAPI(car, fieldName, existingValue, apiValue) {
    // Don't update if user has edited this field
    if (this.isUserEdited(car, fieldName)) {
      console.log(`🛡️ Skipping API update for user-edited field: ${fieldName}`);
      return false;
    }
    
    // Don't update if existing value is valid and API value is null/undefined
    if (existingValue && !apiValue) {
      console.log(`🛡️ Skipping API update - existing value is better: ${fieldName}`);
      return false;
    }
    
    // Update if API has better data
    return true;
  }
}

module.exports = DataProtection;
