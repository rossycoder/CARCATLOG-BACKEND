/**
 * Utility to normalize model and variant fields
 * Ensures model is short name and variant contains detailed specs
 *
 * RULE: model = short base name (e.g. "5 Series", "Golf", "A4")
 *       variant = detailed trim string (e.g. "530D XDRIVE M SPORT MHEV AUTO")
 *
 * The normalizer only SWAPS when the data is clearly backwards.
 * It must NEVER swap when the data is already correct.
 */

// Known short base model names that should ALWAYS be in the model field, not variant.
// If variant matches one of these, the fields are already correct — do NOT swap.
const KNOWN_BASE_MODELS = /^(\d\s*Series|[A-Z]-Class|XC\d{2}|V\d{2}|S\d{2}|C\d{2}|DB\d+|DBS|Vantage|Rapide|Vanquish|Virage|TT|R8|Golf|Polo|Passat|Tiguan|Touareg|Arteon|T-Roc|A[1-8]|Q[2-8]|Mustang|Focus|Fiesta|Mondeo|Kuga|Puma|Corsa|Astra|Insignia|Mokka|Yaris|Corolla|RAV4|Qashqai|Juke|Leaf|X-Trail|Clio|Megane|Captur|Kadjar|Ceed|Sportage|Stonic|Niro|Tucson|Santa Fe|i10|i20|i30|Ioniq|Kona|208|308|508|2008|3008|5008|Swift|Vitara|Jimny|Ignis|Zoe|Land Cruiser|Hilux)$/i;

// Common car model patterns (short names) — used when we need to EXTRACT the base model
const MODEL_PATTERNS = {
  volvo:          /\b(XC\d{2}|V\d{2}|S\d{2}|C\d{2})\b/i,
  bmw:            /\b([1-8]\s*Series|X[1-7]|Z[34]|i[348X])\b/i,
  mercedes:       /\b([ABCEGMS]-Class|GL[ABCES]|CL[AKS]|SL[CKR])\b/i,
  audi:           /\b([AQ][1-8]|TT|R8)\b/i,
  volkswagen:     /\b(Golf|Polo|Passat|Tiguan|Touareg|Arteon|T-Roc|Up)\b/i,
  'aston martin': /\b(DB\d+|DBS|Vantage|Rapide|Vanquish|Virage)\b/i,
  generic:        /^([A-Z0-9-]+(?:\s+[A-Z0-9-]+)?)\b/i,
};

/**
 * Extract short model name from a string.
 */
function extractShortModel(str, make) {
  if (!str || typeof str !== 'string') return null;

  const makeLower = make ? make.toLowerCase() : '';

  if (MODEL_PATTERNS[makeLower]) {
    const match = str.match(MODEL_PATTERNS[makeLower]);
    if (match) return match[1].trim();
  }

  const genericMatch = str.match(MODEL_PATTERNS.generic);
  if (genericMatch) {
    const extracted = genericMatch[1].trim();
    if (extracted.length <= 20) return extracted;
  }

  return null;
}

/**
 * Check if model and variant might be swapped.
 * Returns true ONLY when we are confident they are in the wrong order.
 */
function isLikelySwapped(model, variant, make) {
  if (!model) return false;

  const makeLower = make ? make.toLowerCase() : '';

  // ── GUARD 1: If variant is a known short base model name, fields are BACKWARDS ──
  // e.g. model="530D XDRIVE M SPORT MHEV AUTO", variant="5 Series"
  //   → variant IS the base model, model IS the trim → SWAP them
  if (variant && KNOWN_BASE_MODELS.test(variant.trim())) {
    return true; // variant is the base model → fields are swapped → swap them
  }

  // ── GUARD 2: If model itself is a known short base model name, already CORRECT ──
  // e.g. model="5 Series", variant="530D XDRIVE M SPORT MHEV AUTO" → correct, do NOT swap
  if (KNOWN_BASE_MODELS.test(model.trim())) {
    return false;
  }

  // ── Aston Martin: base models are DB9, DBS, Vantage, etc. ──
  if (makeLower === 'aston martin' || makeLower === 'aston-martin') {
    const astonBaseModels = /^(DB\d+|DBS|Vantage|Rapide|Vanquish|Virage)$/i;
    if (!astonBaseModels.test(model)) {
      return true;
    }
    return false;
  }

  const modelLength = model.length;
  const variantLength = variant ? variant.length : 0;

  // Model clearly too long (> 30 chars) with no known range match above — likely swapped
  if (modelLength > 30) return true;

  // Model moderately long AND variant is shorter — likely swapped
  if (modelLength >= 15 && variantLength > 0 && variantLength < modelLength) return true;

  // model starts with variant (e.g. model="FIESTA ZETEC CLIMATE", variant="Fiesta")
  if (variant && model.toUpperCase().startsWith(variant.toUpperCase() + ' ')) return true;

  return false;
}

/**
 * Normalize model and variant fields.
 * Only swaps when confident the data is backwards.
 */
function normalizeModelVariant(model, variant, make) {
  if (!model) {
    return { model, variant, wasSwapped: false };
  }

  if (isLikelySwapped(model, variant, make)) {
    // Case 1: variant is a known base model name → just swap directly
    if (variant && KNOWN_BASE_MODELS.test(variant.trim())) {
      return { model: variant, variant: model, wasSwapped: true };
    }

    // Case 2: model starts with variant (e.g. "FIESTA ZETEC CLIMATE" starts with "Fiesta")
    if (variant && model.toUpperCase().startsWith(variant.toUpperCase() + ' ')) {
      const trueVariant = model.substring(variant.length).trim();
      return { model: variant, variant: trueVariant, wasSwapped: true };
    }

    // Case 3: Try to extract short model name from the long model string
    const shortModel = extractShortModel(model, make);
    if (shortModel) {
      const newVariant = model.replace(shortModel, '').trim();
      return {
        model: shortModel,
        variant: newVariant || variant,
        wasSwapped: true,
      };
    }
  }

  return { model, variant, wasSwapped: false };
}

module.exports = {
  normalizeModelVariant,
  extractShortModel,
  isLikelySwapped,
};
