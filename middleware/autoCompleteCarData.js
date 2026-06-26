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
  next();
}

module.exports = autoCompleteCarDataMiddleware;
