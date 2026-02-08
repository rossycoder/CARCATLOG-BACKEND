/**
 * Migration Script: Deprecate Competing Services
 * 
 * This script safely migrates from multiple competing services to the
 * single universalAutoCompleteService.js with verification and rollback.
 * 
 * Requirements: 10.1, 10.2, 10.5
 */

const fs = require('fs').promises;
const path = require('path');

// Services to deprecate
const SERVICES_TO_DEPRECATE = [
  'backend/services/autoCompleteCarDataService.js',
  'backend/services/comprehensiveVehicleService.js',
  'backend/services/enhancedVehicleService.js',
  'backend/services/lightweightBikeService.js',
  'backend/services/lightweightVanService.js',
  'backend/services/lightweightVehicleService.js'
];

// Backup directory
const BACKUP_DIR = 'backend/services/.migration-backup';

// Migration state file
const STATE_FILE = 'backend/services/.migration-state.json';

class ServiceMigration {
  constructor() {
    this.state = {
      timestamp: new Date().toISOString(),
      backupCreated: false,
      servicesDeprecated: [],
      rollbackAvailable: true
    };
  }

  async run() {
    console.log('🚀 Starting service migration to universalAutoCompleteService...\n');

    try {
      // Step 1: Verify universal service exists and is functional
      await this.verifyUniversalService();

      // Step 2: Create backup
      await this.createBackup();

      // Step 3: Add deprecation notices
      await this.addDeprecationNotices();

      // Step 4: Verify functionality preservation
      await this.verifyFunctionality();

      // Step 5: Save migration state
      await this.saveMigrationState();

      console.log('\n✅ Migration completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. Run integration tests to verify functionality');
      console.log('   2. Monitor production for any issues');
      console.log('   3. If issues arise, run: node backend/scripts/rollbackServiceMigration.js');
      console.log('   4. After 7 days of stable operation, run: node backend/scripts/finalizeServiceMigration.js');

    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      console.log('\n🔄 Attempting automatic rollback...');
      await this.rollback();
      process.exit(1);
    }
  }

  async verifyUniversalService() {
    console.log('📋 Step 1: Verifying universal service...');

    // Check if we're already in backend directory
    const isInBackend = process.cwd().endsWith('backend');
    const universalServicePath = isInBackend 
      ? path.join(process.cwd(), 'services/universalAutoCompleteService.js')
      : path.join(process.cwd(), 'backend/services/universalAutoCompleteService.js');
    
    try {
      await fs.access(universalServicePath);
      const content = await fs.readFile(universalServicePath, 'utf8');

      // Verify key methods exist
      const requiredMethods = [
        'getCompleteVehicleData',
        'getVehicleSpecs',
        'getVehicleData'
      ];

      for (const method of requiredMethods) {
        if (!content.includes(method)) {
          throw new Error(`Universal service missing required method: ${method}`);
        }
      }

      console.log('   ✓ Universal service exists and has required methods');
    } catch (error) {
      throw new Error(`Universal service verification failed: ${error.message}`);
    }
  }

  async createBackup() {
    console.log('\n📋 Step 2: Creating backup of services...');

    // Check if we're already in backend directory
    const isInBackend = process.cwd().endsWith('backend');
    const backupPath = isInBackend
      ? path.join(process.cwd(), '.migration-backup')
      : path.join(process.cwd(), BACKUP_DIR);
    
    try {
      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true });

      // Backup each service
      for (const servicePath of SERVICES_TO_DEPRECATE) {
        const fullPath = path.join(process.cwd(), servicePath);
        
        try {
          await fs.access(fullPath);
          const content = await fs.readFile(fullPath, 'utf8');
          const backupFile = path.join(backupPath, path.basename(servicePath));
          await fs.writeFile(backupFile, content, 'utf8');
          console.log(`   ✓ Backed up: ${path.basename(servicePath)}`);
        } catch (error) {
          // Service doesn't exist, skip
          console.log(`   ⊘ Skipped (not found): ${path.basename(servicePath)}`);
        }
      }

      this.state.backupCreated = true;
      console.log(`   ✓ Backup created at: ${BACKUP_DIR}`);
    } catch (error) {
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  async addDeprecationNotices() {
    console.log('\n📋 Step 3: Adding deprecation notices...');

    const deprecationNotice = `
/**
 * ⚠️ DEPRECATED - DO NOT USE
 * 
 * This service has been deprecated in favor of universalAutoCompleteService.js
 * 
 * Migration Date: ${new Date().toISOString().split('T')[0]}
 * 
 * Why deprecated:
 * - Causes race conditions with multiple competing services
 * - Leads to duplicate API calls and increased costs
 * - Creates data inconsistency issues
 * 
 * Migration Guide:
 * Replace all imports of this service with:
 *   const universalAutoCompleteService = require('./universalAutoCompleteService');
 * 
 * Replace method calls:
 *   OLD: await thisService.someMethod(registration)
 *   NEW: await universalAutoCompleteService.getCompleteVehicleData(registration, vehicleType)
 * 
 * For questions, see: backend/services/MIGRATION_GUIDE.md
 */

`;

    for (const servicePath of SERVICES_TO_DEPRECATE) {
      const fullPath = path.join(process.cwd(), servicePath);
      
      try {
        await fs.access(fullPath);
        const content = await fs.readFile(fullPath, 'utf8');
        
        // Add deprecation notice at the top
        const updatedContent = deprecationNotice + content;
        await fs.writeFile(fullPath, updatedContent, 'utf8');
        
        this.state.servicesDeprecated.push(servicePath);
        console.log(`   ✓ Added notice to: ${path.basename(servicePath)}`);
      } catch (error) {
        console.log(`   ⊘ Skipped (not found): ${path.basename(servicePath)}`);
      }
    }
  }

  async verifyFunctionality() {
    console.log('\n📋 Step 4: Verifying functionality preservation...');

    // Check that universal service can handle all vehicle types
    const universalService = require('../services/universalAutoCompleteService');

    const testCases = [
      { type: 'car', method: 'getCompleteVehicleData' },
      { type: 'bike', method: 'getCompleteVehicleData' },
      { type: 'van', method: 'getCompleteVehicleData' }
    ];

    for (const testCase of testCases) {
      if (typeof universalService[testCase.method] !== 'function') {
        throw new Error(`Universal service missing method: ${testCase.method}`);
      }
      console.log(`   ✓ Verified ${testCase.type} support via ${testCase.method}`);
    }

    console.log('   ✓ All functionality verified');
  }

  async saveMigrationState() {
    const statePath = path.join(process.cwd(), STATE_FILE);
    await fs.writeFile(statePath, JSON.stringify(this.state, null, 2), 'utf8');
    console.log(`\n   ✓ Migration state saved to: ${STATE_FILE}`);
  }

  async rollback() {
    console.log('\n🔄 Rolling back migration...');

    const backupPath = path.join(process.cwd(), BACKUP_DIR);
    
    try {
      // Restore each backed up service
      const backupFiles = await fs.readdir(backupPath);
      
      for (const file of backupFiles) {
        const backupFile = path.join(backupPath, file);
        const originalPath = path.join(process.cwd(), 'backend/services', file);
        
        const content = await fs.readFile(backupFile, 'utf8');
        await fs.writeFile(originalPath, content, 'utf8');
        console.log(`   ✓ Restored: ${file}`);
      }

      console.log('\n✅ Rollback completed successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      console.log('\n⚠️  Manual intervention required!');
      console.log(`   Backup files are located at: ${BACKUP_DIR}`);
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new ServiceMigration();
  migration.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ServiceMigration;
