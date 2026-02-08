# API Deduplication Migration - Deployment Checklist

## Pre-Deployment

### Code Preparation
- [ ] All code changes committed to version control
- [ ] Branch created for migration: `feature/api-deduplication`
- [ ] Code reviewed by team
- [ ] All property tests passing
- [ ] All integration tests passing

### Database Preparation
- [ ] Database backup created
- [ ] Backup verified and downloadable
- [ ] Rollback procedure documented
- [ ] Database connection strings verified

### Environment Preparation
- [ ] Environment variables checked
- [ ] API credentials verified
- [ ] Monitoring tools configured
- [ ] Logging enabled and tested

## Deployment Steps

### Step 1: Run Migration Script
```bash
node backend/scripts/migrateToUniversalService.js
```

**Expected Output:**
- ✓ Universal service verified
- ✓ Backups created
- ✓ Deprecation notices added
- ✓ Migration state saved

**Verification:**
- [ ] Backup directory created: `backend/services/.migration-backup/`
- [ ] State file created: `backend/services/.migration-state.json`
- [ ] Deprecation notices visible in service files

### Step 2: Update Controller Imports
```bash
node backend/scripts/updateControllerImports.js
```

**Expected Output:**
- ✓ Controllers scanned
- ✓ Imports updated
- ✓ Methods updated
- ✓ Summary report generated

**Verification:**
- [ ] All controllers use `universalAutoCompleteService`
- [ ] No direct API client imports in controllers
- [ ] Method calls updated to `getCompleteVehicleData()`

### Step 3: Run Comprehensive Tests
```bash
node backend/scripts/runComprehensiveMigrationTests.js
```

**Expected Output:**
- ✓ Property tests passed
- ✓ Integration tests passed
- ✓ Race condition tests passed
- ✓ Vehicle type tests passed
- ✓ Performance tests passed

**Verification:**
- [ ] All tests passing (100% success rate)
- [ ] No race conditions detected
- [ ] All vehicle types working

### Step 4: Measure Impact
```bash
node backend/scripts/measureMigrationImpact.js
```

**Expected Metrics:**
- API call reduction: > 50%
- Data completeness: > 80%
- Cost savings: > $0/month

**Verification:**
- [ ] API call reduction achieved
- [ ] Data quality maintained or improved
- [ ] Cost savings calculated

### Step 5: Deploy to Staging
```bash
# Your deployment command
npm run deploy:staging
```

**Verification:**
- [ ] Staging deployment successful
- [ ] Application starts without errors
- [ ] Health checks passing

### Step 6: Test on Staging

**Manual Tests:**
- [ ] Create new car listing
- [ ] Create new bike listing
- [ ] Create new van listing
- [ ] Edit existing listing
- [ ] View vehicle details
- [ ] Check running costs display
- [ ] Verify MOT data display

**Automated Tests:**
```bash
npm test
```

**Verification:**
- [ ] All manual tests passed
- [ ] All automated tests passed
- [ ] No errors in logs

### Step 7: Monitor Staging (24 hours)

**Metrics to Watch:**
- [ ] Error rate: Should be normal or lower
- [ ] Response time: Should be same or better
- [ ] API call volume: Should be reduced
- [ ] Database operations: Should be atomic

**Log Checks:**
- [ ] No race condition warnings
- [ ] No duplicate API calls
- [ ] No data save failures
- [ ] Cache working correctly

### Step 8: Deploy to Production
```bash
# Your deployment command
npm run deploy:production
```

**Verification:**
- [ ] Production deployment successful
- [ ] Application starts without errors
- [ ] Health checks passing
- [ ] Rollback script ready

## Post-Deployment Monitoring

### Day 1-3: Intensive Monitoring

**Hourly Checks:**
- [ ] Error rates normal
- [ ] Response times acceptable
- [ ] API call volume reduced
- [ ] No user complaints

**Daily Checks:**
- [ ] Review error logs
- [ ] Check API provider dashboard
- [ ] Verify data consistency
- [ ] Monitor cost metrics

### Day 4-7: Regular Monitoring

**Daily Checks:**
- [ ] Error rates stable
- [ ] Performance metrics good
- [ ] Cost savings realized
- [ ] No data issues

### Week 2+: Validation Period

**Weekly Checks:**
- [ ] All metrics stable
- [ ] Cost savings confirmed
- [ ] No rollback needed
- [ ] Team feedback positive

## Finalization (After 7+ Days)

### Pre-Finalization Checks
- [ ] 7+ days of stable operation
- [ ] All metrics meeting targets
- [ ] No reported issues
- [ ] Team approval obtained

### Run Finalization
```bash
node backend/scripts/finalizeServiceMigration.js
```

**Type "FINALIZE" to confirm**

**Expected Output:**
- ✓ Migration state verified
- ✓ Final verification passed
- ✓ Deprecated services removed
- ✓ Backup cleaned up
- ✓ Completion record created

**Verification:**
- [ ] Deprecated services removed
- [ ] Backup directory cleaned
- [ ] Completion record exists: `backend/services/MIGRATION_COMPLETED.md`

## Rollback Procedure

### If Issues Detected

**Immediate Actions:**
1. Stop deployment if in progress
2. Document the issue
3. Notify team

**Run Rollback:**
```bash
node backend/scripts/rollbackServiceMigration.js
```

**Verification:**
- [ ] Services restored from backup
- [ ] Application working normally
- [ ] Issue documented for investigation

**Post-Rollback:**
- [ ] Investigate root cause
- [ ] Fix issues in universal service
- [ ] Re-test thoroughly
- [ ] Plan new migration attempt

## Success Criteria

### Technical Metrics
- ✅ API call reduction: > 50%
- ✅ Data completeness: > 80%
- ✅ Error rate: Same or lower
- ✅ Response time: Same or better
- ✅ Zero race conditions
- ✅ Zero data conflicts

### Business Metrics
- ✅ Cost savings achieved
- ✅ No user complaints
- ✅ No downtime
- ✅ Team satisfaction

### Code Quality
- ✅ All tests passing
- ✅ Code coverage maintained
- ✅ Documentation complete
- ✅ Technical debt reduced

## Communication Plan

### Before Deployment
- [ ] Notify team of deployment schedule
- [ ] Share deployment checklist
- [ ] Assign monitoring responsibilities
- [ ] Prepare rollback contacts

### During Deployment
- [ ] Update team on progress
- [ ] Report any issues immediately
- [ ] Keep stakeholders informed

### After Deployment
- [ ] Send deployment summary
- [ ] Share metrics and results
- [ ] Document lessons learned
- [ ] Celebrate success! 🎉

## Emergency Contacts

- **Technical Lead:** [Name/Contact]
- **DevOps:** [Name/Contact]
- **Database Admin:** [Name/Contact]
- **On-Call Engineer:** [Name/Contact]

## Additional Resources

- Migration Guide: `backend/services/MIGRATION_GUIDE.md`
- Scripts Documentation: `backend/scripts/MIGRATION_SCRIPTS_README.md`
- Spec: `.kiro/specs/api-deduplication-cleanup/`
- Universal Service: `backend/services/universalAutoCompleteService.js`

## Notes

- Keep this checklist updated during deployment
- Document any deviations from plan
- Save all logs and metrics
- Update team wiki after completion

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Finalization Date:** _______________
**Status:** ⬜ Pending | ⬜ In Progress | ⬜ Complete | ⬜ Rolled Back
