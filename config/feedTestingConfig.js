/**
 * Feed Import Testing Configuration
 * 
 * Configure feed import behavior for testing vs. production
 */

module.exports = {
  // ═══════════════════════════════════════════════════════════════════════
  // 🧪 TESTING MODE SETTINGS
  // ═══════════════════════════════════════════════════════════════════════
  
  testing: {
    // Disable all API calls during testing (saves credits)
    disableAPIEnrichment: true,
    
    // Skip image downloading/processing during testing
    skipImageProcessing: false,
    
    // Auto-publish imported cars (true = active, false = draft)
    autoPublish: true,
    
    // Remove sold vehicles from feed
    removeSoldVehicles: true,
    
    // Use Unsplash fallback images if feed has no images
    useUnsplashFallback: false,
    
    // Maximum vehicles to import per feed (for testing with large feeds)
    maxVehiclesPerImport: null // null = no limit
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // 🚀 PRODUCTION MODE SETTINGS
  // ═══════════════════════════════════════════════════════════════════════
  
  production: {
    // Enable API enrichment (requires dealer opt-in)
    disableAPIEnrichment: false,
    
    // Process images in background
    skipImageProcessing: false,
    
    // Auto-publish imported cars
    autoPublish: true,
    
    // Remove sold vehicles
    removeSoldVehicles: true,
    
    // Use Unsplash fallback if no images
    useUnsplashFallback: true,
    
    // No limit in production
    maxVehiclesPerImport: null
  },
  
  // ═══════════════════════════════════════════════════════════════════════
  // 🎯 CURRENT MODE
  // ═══════════════════════════════════════════════════════════════════════
  
  // Set to 'testing' or 'production'
  currentMode: 'testing',
  
  // Get current configuration
  getCurrentConfig() {
    return this[this.currentMode];
  },
  
  // Check if in testing mode
  isTestingMode() {
    return this.currentMode === 'testing';
  },
  
  // Switch mode
  setMode(mode) {
    if (mode === 'testing' || mode === 'production') {
      this.currentMode = mode;
      console.log(`🔄 Feed Import Mode: ${mode.toUpperCase()}`);
      return true;
    }
    return false;
  }
};
