# Migration Scripts Documentation

## Overview

These scripts manage the safe migration from multiple competing services to the single `universalAutoCompleteService.js`.

## Scripts

### 1. migrateToUniversalService.js

**Purpose:** Initiates the migration by adding deprecation notices and creating backups.

**Usage:**
```bash
node backend/scripts/migrateToUniversalService.js
```

**What it does:**
1. Verifies universal service exists and is functional
2. Creates backup of all services to be deprecated
3. Adds deprecation notices to competing services
4. Verifies functionality preservation
5. Saves migration state for rollback

**Output:**
- Backup directory: `backend/services/.migration-backup/`
- State file: `backend/services/.migration-state.json`

**Safe to run:** ✅ Yes - Creates backups and can be rolled back

---

### 2. updateControllerImports.js

**Purpose:** Automatically updates controller imports to use universal service.

**Usage:**
```bash
node backend/scripts/updateControllerImports.js
```

**What it does:**
1. Scans all controllers in `backend/controllers/`
2. Replaces deprecated service imports with universal service
3. Updates method calls to use new API
4. Removes direct API client imports from controllers
5. Reports all changes made

**Changes made:**
- `autoCompleteCarDataService` → `universalAutoCompleteService`
- `comprehensiveVehicleService` → `universalAutoCompleteService`
- `lightweightBikeService` → `universalAutoCompleteService`
- Removes direct `CheckCarDetailsClient` imports
- Updates method names to `getCompleteVehicleData()`

**Safe to run:** ✅ Yes - Only updates imports, doesn't delete files

---

### 3. rollbackServiceMigration.js

**Purpose:** Rolls back the migration if issues are detected.

**Usage:**
```bash
node backend/scripts/rollbackServiceMigration.js
```

**What it does:**
1. Loads migration state
2. Verifies backup exists
3. Restores all services from backup
4. Removes migration state file
5. Preserves backup directory for safety

**When to use:**
- Issues detected in production after migration
- Tests failing after migration
- Data inconsistencies observed
- Need to revert to old architecture

**Safe to run:** ✅ Yes - Restores original state

---

### 4. finalizeServiceMigration.js

**Purpose:** Permanently removes deprecated services after successful validation.

**Usage:**
```bash
node backend/scripts/finalizeServiceMigration.js
```

**What it does:**
1. Requires explicit confirmation (type "FINALIZE")
2. Verifies migration has been stable for 7+ days
3. Runs final verification tests
4. Permanently removes deprecated services
5. Cleans up backup and state files
6. Creates completion record

**⚠️ WARNING:** This action is IRREVERSIBLE!

**When to use:**
- After 7+ days of stable production operation
- All tests passing
- No issues reported
- Team confident in new architecture

**Safe to run:** ❌ No - Permanently deletes files

---

## Migration Workflow

### Standard Migration Path

```
1. Run Migration
   ↓
   node backend/scripts/migrateToUniversalService.js
   ↓
2. Update Controllers
   ↓
   node backend/scripts/updateControllerImports.js
   ↓
3. Run Tests
   ↓
   npm test
   ↓
4. Deploy to Production
   ↓
5. Monitor for 7+ Days
   ↓
6. Finalize Migration
   ↓
   node backend/scripts/finalizeServiceMigration.js
```

### Rollback Path (If Issues Detected)

```
1. Issues Detected
   ↓
2. Run Rollback
   ↓
   node backend/scripts/rollbackServiceMigration.js
   ↓
3. Investigate Issues
   ↓
4. Fix Problems
   ↓
5. Retry Migration
```

## Files Created/Modified

### Created by Migration
- `backend/services/.migration-backup/` - Backup directory
- `backend/services/.migration-state.json` - Migration state
- Deprecation notices in service files

### Created by Finalization
- `backend/services/MIGRATION_COMPLETED.md` - Completion record

### Modified by Controller Update
- All files in `backend/controllers/` (imports updated)

## Safety Features

### Backups
- All services backed up before modification
- Backup preserved until finalization
- Can restore from backup at any time

### Verification
- Universal service verified before migration
- Functionality checked after migration
- Tests must pass before finalization

### Rollback
- One-command rollback available
- Automatic rollback on migration failure
- State preserved for manual recovery

### Confirmation
- Finalization requires explicit "FINALIZE" confirmation
- Warns if less than 7 days since migration
- Requires second confirmation if proceeding early

## Monitoring

### During Migration Period

Monitor these metrics:

1. **API Call Volume**
   - Should decrease by 50-70%
   - Check API provider dashboard

2. **Error Rates**
   - Should stay same or decrease
   - Check application logs

3. **Response Times**
   - Should improve or stay same
   - Check performance monitoring

4. **Data Consistency**
   - No duplicate records
   - No conflicting data
   - Check database integrity

### Log Files

- Universal service logs: `backend/logs/universal-service.log`
- Application logs: Check your logging system
- API call logs: Check API provider dashboard

## Troubleshooting

### Migration Script Fails

**Error:** "Universal service verification failed"
- **Cause:** Universal service missing or incomplete
- **Solution:** Ensure `universalAutoCompleteService.js` exists and has required methods

**Error:** "Backup creation failed"
- **Cause:** Permission issues or disk space
- **Solution:** Check file permissions and available disk space

### Controller Update Fails

**Error:** "Failed to scan controllers"
- **Cause:** Controllers directory not found
- **Solution:** Run from project root directory

**Error:** "Failed to update [filename]"
- **Cause:** File locked or permission issue
- **Solution:** Close file in editor, check permissions

### Rollback Fails

**Error:** "Backup directory not found"
- **Cause:** Backup was deleted or migration not run
- **Solution:** Manual restoration required from version control

**Error:** "Failed to restore [filename]"
- **Cause:** File locked or permission issue
- **Solution:** Close file in editor, restore manually from backup

## Best Practices

### Before Migration
1. ✅ Run all tests and ensure they pass
2. ✅ Commit all changes to version control
3. ✅ Create database backup
4. ✅ Notify team of migration
5. ✅ Schedule during low-traffic period

### During Migration
1. ✅ Monitor logs continuously
2. ✅ Watch error rates
3. ✅ Check API call volume
4. ✅ Verify data consistency
5. ✅ Keep rollback script ready

### After Migration
1. ✅ Monitor for at least 7 days
2. ✅ Run daily health checks
3. ✅ Review API costs
4. ✅ Check for any anomalies
5. ✅ Document any issues

### Before Finalization
1. ✅ Confirm 7+ days of stable operation
2. ✅ All tests passing
3. ✅ No reported issues
4. ✅ Team approval
5. ✅ Final backup created

## Support

For issues or questions:

1. Check `backend/services/MIGRATION_GUIDE.md`
2. Review spec: `.kiro/specs/api-deduplication-cleanup/`
3. Check service code: `backend/services/universalAutoCompleteService.js`
4. Review test cases: `backend/test/services/`

## Quick Reference

| Script | Purpose | Reversible | Requires Confirmation |
|--------|---------|------------|----------------------|
| migrateToUniversalService.js | Start migration | ✅ Yes | ❌ No |
| updateControllerImports.js | Update imports | ✅ Yes | ❌ No |
| rollbackServiceMigration.js | Undo migration | ✅ Yes | ❌ No |
| finalizeServiceMigration.js | Complete migration | ❌ No | ✅ Yes |

## Version History

- **v1.0** (2024): Initial migration scripts created
