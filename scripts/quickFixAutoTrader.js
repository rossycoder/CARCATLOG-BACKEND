/**
 * Quick Fix - AutoTrader Compliance
 * Runs all necessary steps in sequence
 */

require('dotenv').config();
const { execSync } = require('child_process');

console.log('🚀 AutoTrader Data Normalization - Quick Fix');
console.log('='.repeat(60));

const steps = [
  {
    name: 'Remove Duplicates',
    script: 'removeDuplicateAdverts.js',
    description: 'Removing duplicate active adverts...'
  },
  {
    name: 'Add Unique Index',
    script: 'addUniqueRegistrationIndex.js',
    description: 'Creating unique registration index...'
  },
  {
    name: 'Migrate Data',
    script: 'migrateToAutoTraderFormat.js',
    description: 'Normalizing all vehicle data...'
  },
  {
    name: 'Test Compliance',
    script: 'testAutoTraderCompliance.js',
    description: 'Verifying AutoTrader compliance...'
  }
];

async function runQuickFix() {
  console.log('\n⚠️  WARNING: This will modify your database!');
  console.log('Make sure you have a backup before proceeding.\n');
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`\n[${ i + 1}/${steps.length}] ${step.name}`);
    console.log('-'.repeat(60));
    console.log(step.description);
    
    try {
      execSync(`node scripts/${step.script}`, { 
        stdio: 'inherit',
        cwd: __dirname + '/..'
      });
      console.log(`✅ ${step.name} completed`);
    } catch (error) {
      console.error(`❌ ${step.name} failed:`, error.message);
      console.log('\n⚠️  Fix failed. Please run scripts individually to debug.');
      process.exit(1);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL STEPS COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\n📋 Summary:');
  console.log('  ✅ Duplicates removed');
  console.log('  ✅ Unique index created');
  console.log('  ✅ Data normalized');
  console.log('  ✅ Compliance verified');
  console.log('\n🎉 Your database is now AutoTrader compliant!');
  console.log('\n📖 See AUTOTRADER_NORMALIZATION.md for details');
}

runQuickFix();
