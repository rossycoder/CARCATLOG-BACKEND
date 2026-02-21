/**
 * Utility to normalize vehicle make (brand) names to consistent capitalization
 * This ensures filter dropdowns don't show duplicate entries like "VOLVO" and "Volvo"
 */

// Brands that should be ALL CAPS
const ALL_CAPS_BRANDS = ['BMW', 'MG', 'MINI', 'SEAT', 'FIAT', 'KIA'];

// Brands with special capitalization (hyphenated or multi-word)
const SPECIAL_BRANDS = {
  'mercedes-benz': 'Mercedes-Benz',
  'alfa romeo': 'Alfa Romeo',
  'land rover': 'Land Rover',
  'rolls-royce': 'Rolls-Royce',
  'aston martin': 'Aston Martin'
};

/**
 * Normalize make to proper capitalization
 * @param {string} make - Vehicle make/brand name
 * @returns {string} Properly capitalized make
 * 
 * Examples:
 * - "VOLVO" → "Volvo"
 * - "bmw" → "BMW"
 * - "MERCEDES-BENZ" → "Mercedes-Benz"
 * - "kia" → "KIA"
 */
function normalizeMake(make) {
  if (!make || typeof make !== 'string') {
    return make;
  }
  
  const trimmedMake = make.trim();
  if (!trimmedMake) {
    return make;
  }
  
  const upperMake = trimmedMake.toUpperCase();
  
  // Check if it's an all-caps brand (BMW, KIA, etc.)
  if (ALL_CAPS_BRANDS.includes(upperMake)) {
    return upperMake;
  }
  
  // Convert to title case first
  const titleCase = trimmedMake
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Check for special brands (Mercedes-Benz, Land Rover, etc.)
  const lowerKey = titleCase.toLowerCase();
  if (SPECIAL_BRANDS[lowerKey]) {
    return SPECIAL_BRANDS[lowerKey];
  }
  
  return titleCase;
}

module.exports = {
  normalizeMake,
  ALL_CAPS_BRANDS,
  SPECIAL_BRANDS
};
