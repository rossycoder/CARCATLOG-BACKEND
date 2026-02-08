/**
 * Finalization Script: Complete Service Migration
 * 
 * This script finalizes the migration after successful production validation.
 * Removes deprecated services and cleans up backup files.
 * 
 * ⚠️  WARNING: This action is irreversible!
 * Only run after 7+ days of stable production operation.
 * 
 * Requirements: 10.2, 10.5
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const BACKUP_DIR = 'backend/services/.migration-backup';
const STATE_FILE = 'backend/services/.migration-state.json';

const SERVICES_TO_REMOVE = [
  'backend/services/autoCompleteCarDataService.js',
  'backend/services/comprehensiveVehicleService.js',
  'backend/services/enhancedVehicleService.js',
  'backend/services/lightweightBikeService.js',
  'backend/services/lightweightVanService.js',
  'backend/services/lightweightVehicleService.js'
];

class ServiceFinalization {
  async run() {
    console.log('🏁 Service Migration Finalization\n');
    console.log('⚠️  WARNING: This will permanently remove deprecated services!');
    console.log('   This action cannot be undone.\n');

    // Require explicit confirmation
    const confirmed = await this.confirmFinalization();
    if (!confirmed) {
      console.log('\n❌ Finalization cancelled by user');
      process.exit(0);
    }

    try {
      // Step 1: Verify migration state
      await this.verifyMigrationState();

      // Step 2: Run final verification tests
      await this.runFinalVerification();

      // Step 3: Remove deprecated services
      await this.removeDeprecatedServices();

      // Step 4: Clean up backup and state files
      await this.cleanupMigrationArtifacts();

      // Step 5: Create migration completion record
      await this.createCompletionRecord();

      console.log('\n✅ Migration finalized successfully!');
      console.log('\n📋 Summary:');
      console.log('   - Deprecated services removed');
      console.log('   - Backup files cleaned up');
      console.log('   - System now uses universalAutoCompleteService exclusively');
      console.log('\n   Migration completion record: backend/services/MIGRATION_COMPLETED.md');

    } catch (error) {
      console.error('\n❌ Finalization failed:', error.message);
      console.log('\n⚠️  Services have NOT been removed');
      console.log('   Please investigate the issue before retrying');
      process.exit(1);
    }
  }

  async confirmFinalization() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Type "FINALIZE" to confirm permanent removal of deprecated services: ', (answer) => {
        rl.close();
        resolve(answer.trim() === 'FINALIZE');
      });
    });
  }

  async verifyMigrationState() {
    console.log('\n📋 Step 1: Verifying migration state...');

    const statePath = path.join(process.cwd(), STATE_FILE);
    
    try {
      const content = await fs.readFile(statePath, 'utf8');
      this.state = JSON.parse(content);
      
      // Check migration age
      const migrationDate = new Date(this.state.timestamp);
      const daysSinceMigration = (Date.now() - migrationDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceMigration < 7) {
        console.log(`   ⚠️  Warning: Only ${Math.floor(daysSinceMigration)} days since migration`);
        console.log('   Recommended: Wait at least 7 days before finalizing');
        
        const proceed = await this.confirmProceed();
        if (!proceed) {
          throw new Error('Finalization cancelled - insufficient validation period');
        }
      }

      console.log(`   ✓ Migration state verified (${Math.floor(daysSinceMigration)} days old)`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Migration state not found. Has migration been run?');
      }
      throw error;
    }
  }

  async confirmProceed() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Proceed anyway? (yes/no): ', (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() === 'yes');
      });
    });
  }

  async runFinalVerification() {
    console.log('\n📋 Step 2: Running final verification...');

    // Verify universal service is working
    try {
      const universalService = require('../services/universalAutoCompleteService');
      
      const requiredMethods = [
        'getCompleteVehicleData',
        'getVehicleSpecs',
        'getVehicleData'
      ];

      for (const method of requiredMethods) {
        if (typeof universalService[method] !== 'function') {
          throw new Error(`Universal service missing method: ${method}`);
        }
      }

      console.log('   ✓ Universal service verified');
    } catch (error) {
      throw new Error(`Universal service verification failed: ${error.message}`);
    }
  }

  async removeDeprecatedServices() {
    console.log('\n📋 Step 3: Removing deprecated services...');

    for (const servicePath of SERVICES_TO_REMOVE) {
      const fullPath = path.join(process.cwd(), servicePath);
      
      try {
        await fs.access(fullPath);
        await fs.unlink(fullPath);
        console.log(`   ✓ Removed: ${path.basename(servicePath)}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`   ⊘ Already removed: ${path.basename(servicePath)}`);
        } else {
          throw new Error(`Failed to remove ${servicePath}: ${error.message}`);
        }
      }
    }
  }

  async cleanupMigrationArtifacts() {
    console.log('\n📋 Step 4: Cleaning up migration artifacts...');

    // Remove backup directory
    const backupPath = path.join(process.cwd(), BACKUP_DIR);
    try {
      await fs.rm(backupPath, { recursive: true, force: true });
      console.log('   ✓ Removed backup directory');
    } catch (error) {
      console.log('   ⊘ Backup directory not found');
    }

    // Remove state file
    const statePath = path.join(process.cwd(), STATE_FILE);
    try {
      await fs.unlink(statePath);
      console.log('   ✓ Removed migration state file');
    } catch (error) {
      console.log('   ⊘ State file not found');
    }
  }

  async createCompletionRecord() {
    console.log('\n📋 Step 5: Creating completion record...');

    const record = `# Service Migration Completed

## Migration Details

- **Completion Date**: ${new Date().toISOString()}
- **Original Migration Date**: ${this.state.timestamp}
- **Services Removed**: ${SERVICES_TO_REMOVE.length}

## Removed Services

${SERVICES_TO_REMOVE.map(s => `- ${path.basename(s)}`).join('\n')}

## Current Architecture

All vehicle data fetching now flows through a single service:

\`\`\`
universalAutoCompleteService.js
\`\`\`

### Benefits Achieved

1. **No Race Conditions**: Single service prevents concurrent API calls
2. **Cost Reduction**: Eliminated duplicate API calls
3. **Data Consistency**: All data flows through one validated path
4. **Maintainability**: Single service to maintain and debug

### Usage

\`\`\`javascript
const universalAutoCompleteService = require('./services/universalAutoCompleteService');

// For all vehicle types (car, bike, van)
const vehicleData = await universalAutoCompleteService.getCompleteVehicleData(
  registration,
  vehicleType
);
\`\`\`

## Rollback

⚠️  Rollback is no longer available as deprecated services have been permanently removed.

If issues arise, the system must be debugged and fixed within the universal service.

## Support

For questions or issues, refer to:
- \`backend/services/universalAutoCompleteService.js\` - Main service implementation
- \`.kiro/specs/api-deduplication-cleanup/\` - Original specification and design
`;

    const recordPath = path.join(process.cwd(), 'backend/services/MIGRATION_COMPLETED.md');
    await fs.writeFile(recordPath, record, 'utf8');
    console.log('   ✓ Completion record created');
  }
}

// Run finalization if called directly
if (require.main === module) {
  const finalization = new ServiceFinalization();
  finalization.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ServiceFinalization;
