/**
 * Quick Import Updater
 * Run from backend directory: node scripts/updateImportsQuick.js
 */

const fs = require('fs').promises;
const path = require('path');

async function updateImports() {
  console.log('🔄 Updating Controller Imports\n');

  const controllersDir = path.join(__dirname, '../controllers');
  
  try {
    const files = await fs.readdir(controllersDir);
    const controllers = files.filter(f => f.endsWith('.js') && !f.endsWith('_CLEAN.js'));
    
    console.log(`📋 Found ${controllers.length} controllers\n`);

    let updated = 0;
    let skipped = 0;

    for (const file of controllers) {
      const filePath = path.join(controllersDir, file);
      let content = await fs.readFile(filePath, 'utf8');
      const original = content;

      // Replace deprecated service imports
      const replacements = {
        'autoCompleteCarDataService': 'universalAutoCompleteService',
        'comprehensiveVehicleService': 'universalAutoCompleteService',
        'enhancedVehicleService': 'universalAutoCompleteService',
        'lightweightBikeService': 'universalAutoCompleteService',
        'lightweightVanService': 'universalAutoCompleteService',
        'lightweightVehicleService': 'universalAutoCompleteService'
      };

      let changes = [];

      for (const [oldService, newService] of Object.entries(replacements)) {
        const regex = new RegExp(`require\\(['"].*/${oldService}(\\.js)?['"]\\)`, 'g');
        if (content.match(regex)) {
          content = content.replace(regex, `require('./../services/${newService}')`);
          changes.push(`${oldService} → ${newService}`);
        }
      }

      // Add universal service import if needed and not present
      if (changes.length > 0 && !content.includes('universalAutoCompleteService')) {
        const serviceImportRegex = /const\s+\w+\s*=\s*require\(['"]\.\.?\/services\/\w+['"]\);/;
        const match = content.match(serviceImportRegex);
        
        if (match) {
          const insertPos = content.indexOf(match[0]) + match[0].length;
          content = content.slice(0, insertPos) + 
                   '\nconst universalAutoCompleteService = require(\'./../services/universalAutoCompleteService\');' +
                   content.slice(insertPos);
          changes.push('Added universal service import');
        }
      }

      if (content !== original) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✓ ${file}`);
        changes.forEach(c => console.log(`  - ${c}`));
        updated++;
      } else {
        console.log(`⊘ ${file} - no changes needed`);
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${controllers.length}\n`);

    if (updated > 0) {
      console.log('✅ Controller imports updated successfully!\n');
      console.log('📋 Next step: Restart your server\n');
    }

  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    process.exit(1);
  }
}

updateImports();
