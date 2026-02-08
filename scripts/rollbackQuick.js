/**
 * Quick Rollback Script
 * Run from backend directory: node scripts/rollbackQuick.js
 */

const fs = require('fs').promises;
const path = require('path');

async function quickRollback() {
  console.log('🔄 Quick Rollback\n');

  try {
    const backupDir = path.join(__dirname, '../services/.migration-backup');
    
    // Check if backup exists
    await fs.access(backupDir);
    
    console.log('📋 Restoring services from backup...');
    
    const backupFiles = await fs.readdir(backupDir);
    
    for (const file of backupFiles) {
      const backupPath = path.join(backupDir, file);
      const originalPath = path.join(__dirname, '../services', file);
      
      const content = await fs.readFile(backupPath, 'utf8');
      await fs.writeFile(originalPath, content, 'utf8');
      
      console.log(`   ✓ Restored: ${file}`);
    }

    console.log('\n✅ Rollback completed successfully!');
    console.log('   All services restored to original state\n');

  } catch (error) {
    console.error('\n❌ Rollback failed:', error.message);
    console.log('\nBackup location: backend/services/.migration-backup/');
    console.log('Please restore files manually if needed.');
    process.exit(1);
  }
}

quickRollback();
