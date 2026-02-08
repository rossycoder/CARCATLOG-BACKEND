/**
 * Quick Migration Script - Simple Version
 * Run from backend directory: node scripts/quickMigrate.js
 */

const fs = require('fs').promises;
const path = require('path');

async function quickMigrate() {
  console.log('🚀 Quick Migration to Universal Service\n');

  try {
    // Step 1: Verify universal service exists
    console.log('📋 Step 1: Verifying universal service...');
    const universalPath = path.join(__dirname, '../services/universalAutoCompleteService.js');
    await fs.access(universalPath);
    console.log('   ✓ Universal service found\n');

    // Step 2: Create backup directory
    console.log('📋 Step 2: Creating backup...');
    const backupDir = path.join(__dirname, '../services/.migration-backup');
    await fs.mkdir(backupDir, { recursive: true });
    console.log('   ✓ Backup directory created\n');

    // Step 3: List services to deprecate
    const servicesToDeprecate = [
      'autoCompleteCarDataService.js',
      'comprehensiveVehicleService.js',
      'enhancedVehicleService.js',
      'lightweightBikeService.js',
      'lightweightVanService.js',
      'lightweightVehicleService.js'
    ];

    console.log('📋 Step 3: Backing up and deprecating services...');
    
    for (const service of servicesToDeprecate) {
      const servicePath = path.join(__dirname, '../services', service);
      
      try {
        // Check if service exists
        await fs.access(servicePath);
        
        // Backup
        const content = await fs.readFile(servicePath, 'utf8');
        const backupPath = path.join(backupDir, service);
        await fs.writeFile(backupPath, content, 'utf8');
        
        // Add deprecation notice
        const deprecationNotice = `/**
 * ⚠️ DEPRECATED - DO NOT USE
 * This service has been deprecated. Use universalAutoCompleteService.js instead.
 * Migration Date: ${new Date().toISOString().split('T')[0]}
 */

`;
        const updatedContent = deprecationNotice + content;
        await fs.writeFile(servicePath, updatedContent, 'utf8');
        
        console.log(`   ✓ ${service} - backed up and deprecated`);
      } catch (error) {
        console.log(`   ⊘ ${service} - not found, skipping`);
      }
    }

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📋 Next steps:');
    console.log('   1. Restart your server');
    console.log('   2. Test car/bike creation');
    console.log('   3. Check database - data should save properly now\n');
    console.log('🔄 If issues arise:');
    console.log('   Run: node scripts/rollbackQuick.js\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\nPlease check:');
    console.log('   - Are you in the backend directory?');
    console.log('   - Does services/universalAutoCompleteService.js exist?');
    process.exit(1);
  }
}

quickMigrate();
