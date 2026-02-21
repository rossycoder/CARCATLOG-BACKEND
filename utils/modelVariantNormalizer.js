/**
 * Utility to normalize model and variant fields
 * Ensures model is short name and variant contains detailed specs
 */

// Common car model patterns (short names)
const MODEL_PATTERNS = {
  // Volvo: XC90, XC60, V60, S90, etc.
  volvo: /\b(XC\d{2}|V\d{2}|S\d{2}|C\d{2})\b/i,
  
  // BMW: 1 Series, 3 Series, X5, etc.
  bmw: /\b([1-8]\s*Series|X[1-7]|Z[34]|i[348X])\b/i,
  
  // Mercedes: A-Class, C-Class, E-Class, GLA, GLC, etc.
  mercedes: /\b([ABCEGMS]-Class|GL[ABCES]|CL[AKS]|SL[CKR])\b/i,
  
  // Audi: A3, A4, Q5, Q7, etc.
  audi: /\b([AQ][1-8]|TT|R8)\b/i,
  
  // VW: Golf, Polo, Passat, Tiguan, etc.
  volkswagen: /\b(Golf|Polo|Passat|Tiguan|Touareg|Arteon|T-Roc|Up)\b/i,
  
  // Generic pattern for most cars (captures first word/code)
  generic: /^([A-Z0-9-]+(?:\s+[A-Z0-9-]+)?)\b/i
};

/**
 * Extract short model name from a string
 * @param {string} str - String that might contain model name
 * @param {string} make - Car make/brand
 * @returns {string|null} Short model name or null
 */
function extractShortModel(str, make) {
  if (!str || typeof str !== 'string') return null;
  
  const makeLower = make ? make.toLowerCase() : '';
  
  // Try brand-specific pattern first
  if (MODEL_PATTERNS[makeLower]) {
    const match = str.match(MODEL_PATTERNS[makeLower]);
    if (match) return match[1].trim();
  }
  
  // Try generic pattern
  const genericMatch = str.match(MODEL_PATTERNS.generic);
  if (genericMatch) {
    const extracted = genericMatch[1].trim();
    // Only return if it's reasonably short (not the whole variant)
    if (extracted.length <= 20) {
      return extracted;
    }
  }
  
  return null;
}

/**
 * Check if model and variant might be swapped
 * @param {string} model - Current model value
 * @param {string} variant - Current variant value
 * @returns {boolean} True if likely swapped
 */
function isLikelySwapped(model, variant) {
  if (!model) return false;
  
  const modelLength = model.length;
  const variantLength = variant ? variant.length : 0;
  
  // Model is suspiciously long (> 30 chars) - definitely swapped
  if (modelLength > 30) return true;
  
  // Model is moderately long (> 20 chars) AND variant is very short (< 8 chars) - likely swapped
  if (modelLength > 20 && variantLength > 0 && variantLength < 8) return true;
  
  return false;
}

/**
 * Normalize model and variant fields
 * @param {string} model - Current model value
 * @param {string} variant - Current variant value
 * @param {string} make - Car make/brand
 * @returns {Object} { model, variant, wasSwapped }
 */
function normalizeModelVariant(model, variant, make) {
  // If no model, return as-is
  if (!model) {
    return { model, variant, wasSwapped: false };
  }
  
  // Check if likely swapped
  if (isLikelySwapped(model, variant)) {
    // Try to extract short model from the long model string
    const shortModel = extractShortModel(model, make);
    
    if (shortModel) {
      // Swap: short model becomes model, long model becomes variant
      const newVariant = model.replace(shortModel, '').trim();
      
      console.log(`[Model/Variant Normalizer] Detected swap:`);
      console.log(`  Old: Model="${model}", Variant="${variant}"`);
      console.log(`  New: Model="${shortModel}", Variant="${newVariant}"`);
      
      return {
        model: shortModel,
        variant: newVariant || variant,
        wasSwapped: true
      };
    }
  }
  
  // No swap needed
  return { model, variant, wasSwapped: false };
}

module.exports = {
  normalizeModelVariant,
  extractShortModel,
  isLikelySwapped
};
