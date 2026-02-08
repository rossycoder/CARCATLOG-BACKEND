/**
 * Deployment Starter Script
 * 
 * This script guides you through the deployment process step by step.
 * It's an interactive wrapper around the migration scripts.
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  console.log(`   Command: ${command}\n`);
  
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    return true;
  } catch (error) {
    console.error(`\n❌ Failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   API Deduplication Migration - Deployment Assistant      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('This script will guide you through the deployment process.\n');
  console.log('⚠️  Important Notes:');
  console.log('   - Ensure all code is committed to version control');
  console.log('   - Create a database backup before proceeding');
  console.log('   - Have the rollback script ready if needed');
  console.log('   - Monitor closely during and after deployment\n');

  const proceed = await question('Ready to proceed? (yes/no): ');
  if (proceed.toLowerCase() !== 'yes') {
    console.log('\n❌ Deployment cancelled by user');
    rl.close();
    process.exit(0);
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: PRE-DEPLOYMENT CHECKS');
  console.log('='.repeat(60));

  // Check if we're in the right directory
  const universalServicePath = path.join(process.cwd(), 'backend/services/universalAutoCompleteService.js');
  if (!fs.existsSync(universalServicePath)) {
    console.error('\n❌ Error: Not in project root directory');
    console.log('   Please run this script from the project root');
    rl.close();
    process.exit(1);
  }

  console.log('\n✓ Project structure verified');

  const backupConfirm = await question('\nHave you created a database backup? (yes/no): ');
  if (backupConfirm.toLowerCase() !== 'yes') {
    console.log('\n⚠️  Please create a database backup before proceeding');
    console.log('   Deployment cancelled for safety');
    rl.close();
    process.exit(0);
  }

  const commitConfirm = await question('Is all code committed to version control? (yes/no): ');
  if (commitConfirm.toLowerCase() !== 'yes') {
    console.log('\n⚠️  Please commit all changes before proceeding');
    console.log('   Deployment cancelled for safety');
    rl.close();
    process.exit(0);
  }

  console.log('\n✓ Pre-deployment checks passed');

  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: RUN MIGRATION SCRIPT');
  console.log('='.repeat(60));

  const runMigration = await question('\nRun migration script? (yes/no): ');
  if (runMigration.toLowerCase() === 'yes') {
    const success = runCommand(
      'node backend/scripts/migrateToUniversalService.js',
      'Running migration script'
    );

    if (!success) {
      console.log('\n❌ Migration failed. Deployment stopped.');
      rl.close();
      process.exit(1);
    }

    console.log('\n✓ Migration completed successfully');
  } else {
    console.log('\n⊘ Migration skipped');
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: UPDATE CONTROLLER IMPORTS');
  console.log('='.repeat(60));

  const updateImports = await question('\nUpdate controller imports? (yes/no): ');
  if (updateImports.toLowerCase() === 'yes') {
    const success = runCommand(
      'node backend/scripts/updateControllerImports.js',
      'Updating controller imports'
    );

    if (!success) {
      console.log('\n❌ Import update failed. Consider rollback.');
      const rollback = await question('Run rollback? (yes/no): ');
      if (rollback.toLowerCase() === 'yes') {
        runCommand('node backend/scripts/rollbackServiceMigration.js', 'Rolling back');
      }
      rl.close();
      process.exit(1);
    }

    console.log('\n✓ Controller imports updated successfully');
  } else {
    console.log('\n⊘ Import update skipped');
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: RUN COMPREHENSIVE TESTS');
  console.log('='.repeat(60));

  const runTests = await question('\nRun comprehensive tests? (yes/no): ');
  if (runTests.toLowerCase() === 'yes') {
    const success = runCommand(
      'node backend/scripts/runComprehensiveMigrationTests.js',
      'Running comprehensive tests'
    );

    if (!success) {
      console.log('\n❌ Tests failed. Consider rollback.');
      const rollback = await question('Run rollback? (yes/no): ');
      if (rollback.toLowerCase() === 'yes') {
        runCommand('node backend/scripts/rollbackServiceMigration.js', 'Rolling back');
      }
      rl.close();
      process.exit(1);
    }

    console.log('\n✓ All tests passed successfully');
  } else {
    console.log('\n⊘ Tests skipped');
  }

  console.log('\n' + '='.repeat(60));
  console.log('STEP 5: MEASURE IMPACT');
  console.log('='.repeat(60));

  const measureImpact = await question('\nMeasure migration impact? (yes/no): ');
  if (measureImpact.toLowerCase() === 'yes') {
    runCommand(
      'node backend/scripts/measureMigrationImpact.js',
      'Measuring migration impact'
    );
  } else {
    console.log('\n⊘ Impact measurement skipped');
  }

  console.log('\n' + '='.repeat(60));
  console.log('DEPLOYMENT PREPARATION COMPLETE');
  console.log('='.repeat(60));

  console.log('\n✅ All pre-deployment steps completed successfully!\n');
  console.log('📋 Next Steps:\n');
  console.log('   1. Review the changes made');
  console.log('   2. Deploy to staging environment first (recommended)');
  console.log('   3. Test thoroughly on staging');
  console.log('   4. Deploy to production');
  console.log('   5. Monitor closely for 7+ days');
  console.log('   6. Run finalization script after validation\n');
  
  console.log('🔄 If Issues Arise:\n');
  console.log('   Run: node backend/scripts/rollbackServiceMigration.js\n');
  
  console.log('📚 Documentation:\n');
  console.log('   - Migration Guide: backend/services/MIGRATION_GUIDE.md');
  console.log('   - Deployment Checklist: backend/scripts/DEPLOYMENT_CHECKLIST.md');
  console.log('   - Full Spec: .kiro/specs/api-deduplication-cleanup/\n');

  console.log('🎉 Good luck with the deployment!\n');

  rl.close();
}

// Run the deployment assistant
main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
