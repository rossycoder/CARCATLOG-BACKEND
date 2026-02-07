/**
 * Auto Complete Car Data Middleware
 * Automatically fetches and populates missing car data after save
 * 
 * This middleware runs AFTER car is saved to database
 * It fetches complete data from CheckCarDetails API and updates the car
 */

const autoCompleteCarDataService = require('../services/autoCompleteCarDataService');

/**
 * Middleware to auto-complete car data after save
 * Usage: Add to Car model as post-save hook
 */
async function autoCompleteCarDataMiddleware(doc, next) {
  try {
    // Only run for active cars with registration number
    if (doc.status === 'active' && doc.registrationNumber) {
      // Check if car needs auto-completion
      if (autoCompleteCarDataService.needsAutoCompletion(doc)) {
        console.log(`\n🤖 Auto-completing data for ${doc.registrationNumber}...`);
        
        // Run auto-completion in background (don't block save)
        setImmediate(async () => {
          try {
            await autoCompleteCarDataService.autoCompleteCar(doc);
          } catch (error) {
            console.error(`Auto-completion failed for ${doc.registrationNumber}:`, error.message);
          }
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Auto-complete middleware error:', error);
    // Don't block save even if middleware fails
    next();
  }
}

module.exports = autoCompleteCarDataMiddleware;
