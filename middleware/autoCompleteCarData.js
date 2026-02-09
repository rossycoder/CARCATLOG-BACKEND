/**
 * Auto Complete Car Data Middleware
 * DEPRECATED: This middleware is no longer used
 * Use universalAutoCompleteService instead
 */

/**
 * Deprecated middleware - does nothing
 * Kept for backward compatibility
 */
async function autoCompleteCarDataMiddleware(doc, next) {
  console.warn('⚠️  autoCompleteCarData middleware is deprecated. Use universalAutoCompleteService instead.');
  next();
}

module.exports = autoCompleteCarDataMiddleware;
