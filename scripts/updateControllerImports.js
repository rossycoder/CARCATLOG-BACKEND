/**
 * Controller Import Update Script
 * 
 * Automatically updates all controller imports to use universalAutoCompleteService
 * instead of deprecated competing services.
 * 
 * Requirements: 10.4
 */

const fs = require('fs').promises;
const path = require('path');

// Import mappings: old service -> new service
const IMPORT_REPLACEMENTS = {
  // Deprecated services
  'autoCompleteCarDataService': 'universalAutoCompleteService',
  'comprehensiveVehicleService': 'universalAutoCompleteService',
  'enhancedVehicleService': 'universalAutoCompleteService',
  'lightweightBikeService': 'universalAutoCompleteService',
  'lightweightVanService': 'universalAutoCompleteService',
  'lightweightVehicleService': 'universalAutoCompleteService',
  
  // Direct API client imports (should not be in controllers)
  'CheckCarDetailsClient': null, // Remove - should use service
  'HistoryAPIClient': null, // Keep only in historyService
  'ValuationAPIClient': null // Keep only in valuationService
};

// Method mappings: old method -> new method
const METHOD_REPLACEMENTS = {
  'autoCompleteCarData': 'getCompleteVehicleData',
  'getEnhancedVehicleData': 'getCompleteVehicleData',
  'fetchVehicleData': 'getCompleteVehicleData',
  'getVehicleInfo': 'getCompleteVehicleData'
};

class ControllerImportUpdater {
  constructor() {
    this.controllersDir = path.join(process.cwd(), 'backend/controllers');
    this.updatedFiles = [];
    this.errors = [];
  }

  async run() {
    console.log('🔄 Updating controller imports...\n');

    try {
      // Step 1: Scan all controllers
      const controllers = await this.scanControllers();

      // Step 2: Update each controller
      for (const controller of controllers) {
        await this.updateController(controller);
      }

      // Step 3: Report results
      this.reportResults();

      if (this.errors.length > 0) {
        console.log('\n⚠️  Some files had errors. Please review manually.');
        process.exit(1);
      } else {
        console.log('\n✅ All controllers updated successfully!');
      }

    } catch (error) {
      console.error('\n❌ Update failed:', error.message);
      process.exit(1);
    }
  }

  async scanControllers() {
    console.log('📋 Step 1: Scanning controllers...');

    try {
      const files = await fs.readdir(this.controllersDir);
      const controllers = files.filter(f => f.endsWith('.js') && !f.endsWith('_CLEAN.js'));
      
      console.log(`   ✓ Found ${controllers.length} controller(s)\n`);
      return controllers;
    } catch (error) {
      throw new Error(`Failed to scan controllers: ${error.message}`);
    }
  }

  async updateController(filename) {
    console.log(`📝 Updating: ${filename}`);

    const filePath = path.join(this.controllersDir, filename);
    
    try {
      // Read file
      let content = await fs.readFile(filePath, 'utf8');
      const originalContent = content;
      let changes = [];

      // Update imports
      for (const [oldImport, newImport] of Object.entries(IMPORT_REPLACEMENTS)) {
        const importRegex = new RegExp(
          `require\\(['"].*/${oldImport}(\\.js)?['"]\\)`,
          'g'
        );

        if (content.match(importRegex)) {
          if (newImport === null) {
            // Remove this import (API clients shouldn't be in controllers)
            const lineRegex = new RegExp(
              `const\\s+\\w+\\s*=\\s*require\\(['"].*/${oldImport}(\\.js)?['"]\\);?\\s*\\n?`,
              'g'
            );
            content = content.replace(lineRegex, '');
            changes.push(`Removed direct import: ${oldImport}`);
          } else {
            // Replace with new service
            content = content.replace(
              importRegex,
              `require('./../services/${newImport}')`
            );
            changes.push(`${oldImport} → ${newImport}`);
          }
        }
      }

      // Update method calls
      for (const [oldMethod, newMethod] of Object.entries(METHOD_REPLACEMENTS)) {
        const methodRegex = new RegExp(`\\.${oldMethod}\\(`, 'g');
        if (content.match(methodRegex)) {
          content = content.replace(methodRegex, `.${newMethod}(`);
          changes.push(`Method: ${oldMethod}() → ${newMethod}()`);
        }
      }

      // Check if universal service import exists, add if needed
      if (changes.length > 0 && !content.includes('universalAutoCompleteService')) {
        // Add import at the top of the file after other service imports
        const serviceImportRegex = /const\s+\w+\s*=\s*require\(['"]\.\.?\/services\/\w+['"]\);/;
        const match = content.match(serviceImportRegex);
        
        if (match) {
          const insertPosition = content.indexOf(match[0]) + match[0].length;
          content = content.slice(0, insertPosition) + 
                   '\nconst universalAutoCompleteService = require(\'./../services/universalAutoCompleteService\');' +
                   content.slice(insertPosition);
          changes.push('Added universalAutoCompleteService import');
        }
      }

      // Write back if changes were made
      if (content !== originalContent) {
        await fs.writeFile(filePath, content, 'utf8');
        this.updatedFiles.push({ filename, changes });
        console.log(`   ✓ Updated (${changes.length} change(s))`);
        changes.forEach(change => console.log(`     - ${change}`));
      } else {
        console.log(`   ⊘ No changes needed`);
      }

    } catch (error) {
      this.errors.push({ filename, error: error.message });
      console.error(`   ✗ Error: ${error.message}`);
    }

    console.log('');
  }

  reportResults() {
    console.log('\n📊 Update Summary\n');
    console.log(`Files scanned: ${this.updatedFiles.length + this.errors.length}`);
    console.log(`Files updated: ${this.updatedFiles.length}`);
    console.log(`Errors: ${this.errors.length}`);

    if (this.updatedFiles.length > 0) {
      console.log('\n✅ Updated files:');
      this.updatedFiles.forEach(({ filename, changes }) => {
        console.log(`   - ${filename} (${changes.length} change(s))`);
      });
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(({ filename, error }) => {
        console.log(`   - ${filename}: ${error}`);
      });
    }
  }
}

// Run updater if called directly
if (require.main === module) {
  const updater = new ControllerImportUpdater();
  updater.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ControllerImportUpdater;
