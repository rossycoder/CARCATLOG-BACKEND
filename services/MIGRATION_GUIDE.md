# Service Migration Guide

## Overview

This guide documents the migration from multiple competing services to the single `universalAutoCompleteService.js`. This migration eliminates race conditions, reduces API costs, and ensures data consistency.

## Why This Migration?

### Problems with Old Architecture

1. **Race Conditions**: Multiple services calling APIs simultaneously for the same vehicle
2. **Duplicate API Calls**: Same data fetched multiple times, increasing costs
3. **Data Inconsistency**: Different services returning different data for same vehicle
4. **Maintenance Burden**: 20+ services doing similar things in different ways

### Benefits of New Architecture

1. **Single Source of Truth**: One service handles all vehicle data fetching
2. **Cost Reduction**: Eliminates duplicate API calls through caching and deduplication
3. **Data Consistency**: All data flows through one validated path
4. **Race Condition Prevention**: Built-in concurrency control
5. **Easier Maintenance**: One service to debug and enhance

## Migration Steps

### For Developers

#### Step 1: Update Imports

**Old:**
```javascript
const autoCompleteCarDataService = require('./services/autoCompleteCarDataService');
const comprehensiveVehicleService = require('./services/comprehensiveVehicleService');
const lightweightBikeService = require('./services/lightweightBikeService');
```

**New:**
```javascript
const universalAutoCompleteService = require('./services/universalAutoCompleteService');
```

#### Step 2: Update Method Calls

**Old:**
```javascript
// Various old methods
const data = await autoCompleteCarDataService.autoCompleteCarData(registration);
const data = await comprehensiveVehicleService.getEnhancedVehicleData(registration);
const data = await lightweightBikeService.fetchVehicleData(registration);
```

**New:**
```javascript
// Single unified method for all vehicle types
const data = await universalAutoCompleteService.getCompleteVehicleData(
  registration,
  vehicleType // 'car', 'bike', or 'van'
);
```

#### Step 3: Remove Direct API Client Imports

**❌ Don't do this in controllers:**
```javascript
const CheckCarDetailsClient = require('./clients/CheckCarDetailsClient');
const apiData = await CheckCarDetailsClient.getVehicleData(registration);
```

**✅ Do this instead:**
```javascript
const universalAutoCompleteService = require('./services/universalAutoCompleteService');
const vehicleData = await universalAutoCompleteService.getCompleteVehicleData(
  registration,
  vehicleType
);
```

### Automated Migration

Use the provided scripts to automate the migration:

```bash
# Step 1: Run migration (adds deprecation notices, creates backups)
node backend/scripts/migrateToUniversalService.js

# Step 2: Update controller imports automatically
node backend/scripts/updateControllerImports.js

# Step 3: Run tests to verify functionality
npm test

# Step 4: Monitor production for 7+ days

# Step 5: If issues arise, rollback
node backend/scripts/rollbackServiceMigration.js

# Step 6: After successful validation, finalize
node backend/scripts/finalizeServiceMigration.js
```

## API Reference

### universalAutoCompleteService

#### getCompleteVehicleData(registration, vehicleType, options)

Fetches complete vehicle data from APIs and saves to database.

**Parameters:**
- `registration` (string): Vehicle registration number
- `vehicleType` (string): Type of vehicle - 'car', 'bike', or 'van'
- `options` (object, optional):
  - `skipCache` (boolean): Force fresh API call
  - `userId` (string): User ID for ownership
  - `sellerType` (string): 'private' or 'trade'

**Returns:** Promise<Object> - Complete vehicle data

**Example:**
```javascript
const vehicleData = await universalAutoCompleteService.getCompleteVehicleData(
  'AB12CDE',
  'car',
  { userId: '507f1f77bcf86cd799439011' }
);
```

#### getVehicleSpecs(registration, vehicleType)

Fetches vehicle specifications only (lighter weight).

**Parameters:**
- `registration` (string): Vehicle registration number
- `vehicleType` (string): Type of vehicle

**Returns:** Promise<Object> - Vehicle specifications

**Example:**
```javascript
const specs = await universalAutoCompleteService.getVehicleSpecs('AB12CDE', 'car');
```

#### getVehicleData(registration, vehicleType)

Alias for getCompleteVehicleData for backward compatibility.

## Deprecated Services

The following services are deprecated and will be removed:

- ❌ `autoCompleteCarDataService.js`
- ❌ `comprehensiveVehicleService.js`
- ❌ `enhancedVehicleService.js`
- ❌ `lightweightBikeService.js`
- ❌ `lightweightVanService.js`
- ❌ `lightweightVehicleService.js`

## Specialized Services (Keep)

These services remain but should NOT make direct API calls:

- ✅ `historyService.js` - MOT and vehicle history (uses HistoryAPIClient)
- ✅ `valuationService.js` - Vehicle valuations (uses ValuationAPIClient)
- ✅ `postcodeService.js` - Location data
- ✅ `electricVehicleEnhancementService.js` - EV-specific enhancements

## Data Flow Architecture

### Old (Problematic)
```
Controller → Multiple Services → Multiple API Calls → Race Conditions
     ↓            ↓                    ↓
  Service A   Service B           Service C
     ↓            ↓                    ↓
  API Call    API Call             API Call
     ↓            ↓                    ↓
  Database    Database             Database
  (conflict)  (conflict)           (conflict)
```

### New (Clean)
```
Controller → Universal Service → Single API Call → Database
                    ↓
              Cache Check
                    ↓
         Concurrency Control
                    ↓
              API Client
                    ↓
         Response Parsing
                    ↓
         Data Validation
                    ↓
         Atomic Save
```

## Testing

### Unit Tests
```bash
npm test -- backend/test/services/universalAutoCompleteService.property.test.js
```

### Integration Tests
```bash
node backend/scripts/testUniversalServiceAllVehicleTypes.js
```

### Property Tests
```bash
npm test -- backend/test/services/universalAutoCompleteService.raceCondition.test.js
```

## Rollback Procedures

### If Issues Detected

1. **Immediate Rollback:**
   ```bash
   node backend/scripts/rollbackServiceMigration.js
   ```

2. **Verify Rollback:**
   - Check that deprecated services are restored
   - Run integration tests
   - Monitor error logs

3. **Investigate Issues:**
   - Review error logs
   - Check API call patterns
   - Verify data consistency

4. **Fix and Retry:**
   - Fix identified issues in universal service
   - Re-run migration
   - Monitor more carefully

### After Finalization

⚠️ **Warning:** After running `finalizeServiceMigration.js`, rollback is no longer possible. Deprecated services are permanently removed.

If issues arise after finalization:
1. Debug and fix within `universalAutoCompleteService.js`
2. Deploy hotfix
3. Monitor production

## Monitoring

### Key Metrics to Watch

1. **API Call Volume**: Should decrease by 50-70%
2. **Response Times**: Should improve or stay same
3. **Error Rates**: Should decrease
4. **Data Consistency**: No more conflicting records

### Logging

The universal service logs:
- All API calls with timestamps
- Cache hits/misses
- Concurrency control events
- Data validation failures
- Save operations

Check logs at: `backend/logs/universal-service.log`

## Troubleshooting

### Common Issues

#### Issue: "Method not found"
**Cause:** Using old method names
**Solution:** Update to `getCompleteVehicleData()`

#### Issue: "Service not found"
**Cause:** Using old service names
**Solution:** Import `universalAutoCompleteService`

#### Issue: "Data not saving"
**Cause:** Missing vehicleType parameter
**Solution:** Always provide vehicleType ('car', 'bike', or 'van')

#### Issue: "Race condition detected"
**Cause:** Multiple simultaneous calls for same vehicle
**Solution:** Universal service handles this automatically - check logs

## Support

For questions or issues:

1. Check this guide first
2. Review the spec: `.kiro/specs/api-deduplication-cleanup/`
3. Check the service code: `backend/services/universalAutoCompleteService.js`
4. Review test cases: `backend/test/services/`

## Timeline

- **Day 0**: Run migration script
- **Day 0-7**: Monitor production closely
- **Day 7+**: If stable, run finalization script
- **Day 7+**: Remove deprecated services permanently

## Checklist

Before finalizing migration:

- [ ] All controllers updated to use universal service
- [ ] All tests passing
- [ ] No direct API client imports in controllers
- [ ] Production monitoring shows no issues for 7+ days
- [ ] API call volume reduced as expected
- [ ] No data consistency issues reported
- [ ] Error rates normal or improved
- [ ] Team trained on new architecture

## Version History

- **v1.0** (2024): Initial migration guide
- Migration completed: TBD
