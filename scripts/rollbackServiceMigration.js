/**
 * Rollback Script: Restore Competing Services
 * 
 * This script rolls back the service migration if issues are detected.
 * Restores all services from backup and removes deprecation notices.
 * 
 * Requirements: 10.3
 */

const fs = require('fs').promises;
const path = require('path');

const BACKUP_DIR = 'backend/services/.migration-backup';
const STATE_FILE = 'backend/services/.migration-state.json';

class ServiceRollback {
  async run() {
    console.log('🔄 Starting service migration rollback...\n');

    try {
      // Step 1: Load migration state
      await this.loadMigrationState();

      // Step 2: Verify backup exists
      await this.verifyBackup();

      // Step 3: Restore services from backup
      await this.restoreServices();

      // Step 4: Clean up migration artifacts
      await this.cleanup();

      console.log('\n✅ Rollback completed successfully!');
      console.log('\n📋 Services have been restored to pre-migration state');
      console.log('   You can now investigate the issues that caused the rollback');

    } catch (error) {
      console.error('\n❌ Rollback failed:', error.message);
      console.log('\n⚠️  Manual intervention required!');
      console.log(`   Backup files are located at: ${BACKUP_DIR}`);
      console.log('   Please restore files manually from the backup directory');
      process.exit(1);
    }
  }

  async loadMigrationState() {
    console.log('📋 Step 1: Loading migration state...');

    const statePath = path.join(process.cwd(), STATE_FILE);
    
    try {
      const content = await fs.readFile(statePath, 'utf8');
      this.state = JSON.parse(content);
      
      if (!this.state.rollbackAvailable) {
        throw new Error('Rollback is not available for this migration');
      }

      console.log(`   ✓ Migration state loaded (from ${this.state.timestamp})`);
    } catch (error) {
      throw new Error(`Failed to load migration state: ${error.message}`);
    }
  }

  async verifyBackup() {
    console.log('\n📋 Step 2: Verifying backup...');

    const backupPath = path.join(process.cwd(), BACKUP_DIR);
    
    try {
      await fs.access(backupPath);
      const backupFiles = await fs.readdir(backupPath);
      
      if (backupFiles.length === 0) {
        throw new Error('Backup directory is empty');
      }

      console.log(`   ✓ Found ${backupFiles.length} backup file(s)`);
    } catch (error) {
      throw new Error(`Backup verification failed: ${error.message}`);
    }
  }

  async restoreServices() {
    console.log('\n📋 Step 3: Restoring services from backup...');

    const backupPath = path.join(process.cwd(), BACKUP_DIR);
    const backupFiles = await fs.readdir(backupPath);
    
    for (const file of backupFiles) {
      const backupFile = path.join(backupPath, file);
      const originalPath = path.join(process.cwd(), 'backend/services', file);
      
      try {
        const content = await fs.readFile(backupFile, 'utf8');
        await fs.writeFile(originalPath, content, 'utf8');
        console.log(`   ✓ Restored: ${file}`);
      } catch (error) {
        console.error(`   ✗ Failed to restore ${file}: ${error.message}`);
        throw error;
      }
    }
  }

  async cleanup() {
    console.log('\n📋 Step 4: Cleaning up migration artifacts...');

    // Remove migration state file
    const statePath = path.join(process.cwd(), STATE_FILE);
    try {
      await fs.unlink(statePath);
      console.log('   ✓ Removed migration state file');
    } catch (error) {
      console.log('   ⊘ Migration state file not found');
    }

    // Keep backup directory for safety
    console.log('   ℹ Backup directory preserved for safety');
    console.log(`     Location: ${BACKUP_DIR}`);
  }
}

// Run rollback if called directly
if (require.main === module) {
  const rollback = new ServiceRollback();
  rollback.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ServiceRollback;
