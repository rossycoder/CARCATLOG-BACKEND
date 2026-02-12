/**
 * Color Formatter Utility
 * Formats color strings to proper case (Title Case)
 */

/**
 * Format color to proper case (Title Case)
 * Converts "GREY" to "Grey", "BLUE" to "Blue", etc.
 * Handles multi-word colors like "DARK BLUE" to "Dark Blue"
 * 
 * @param {string} color - Color string from API or user input
 * @returns {string|null} - Formatted color in proper case, or null if invalid
 */
function formatColor(color) {
  // Handle null, undefined, empty, or invalid values
  if (!color || 
      color === 'null' || 
      color === 'undefined' || 
      typeof color !== 'string' ||
      color.trim() === '') {
    return null;
  }
  
  // Convert to proper case (Title Case)
  const formatted = color
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return formatted;
}

/**
 * Clean and format color for database storage
 * @param {string} color - Raw color string
 * @returns {string|null} - Cleaned and formatted color
 */
function cleanColor(color) {
  const formatted = formatColor(color);
  
  // Return null for invalid colors
  if (!formatted) {
    return null;
  }
  
  // Return formatted color
  return formatted;
}

module.exports = {
  formatColor,
  cleanColor
};
