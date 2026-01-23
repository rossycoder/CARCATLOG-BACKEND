# AutoTrader Data Normalization

## Overview

This implementation fixes data quality issues to achieve AutoTrader-style compliance:

1. ✅ **Engine Size Normalization** - Always stored in litres (2.0L, 1.6L)
2. ✅ **Submodel Cleanup** - Only trim levels, no fuel/transmission
3. ✅ **Variant Field** - Proper derivative storage
4. ✅ **Duplicate Prevention** - One active advert per registration
5. ✅ **Description Sanitization** - No garbage data
6. ✅ **Display Title Generation** - AutoTrader format

## Files Created/Modified

### New Files
- `backend/scripts/migrateToAutoTraderFormat.js` - Migration script for existing data
- `backend/scripts/removeDuplicateAdverts.js` - Remove duplicate active adverts
- `backend/scripts/addUniqueRegistrationIndex.js` - Add unique index
- `backend/scripts/testAutoTraderCompliance.js` - Test compliance
- `backend/middleware/vehicleValidation.js` - Validation middleware

### Modified Files
- `backend/models/Car.js` - Added displayTitle field, duplicate check in pre-save hook
- `backend/routes/vehicleRoutes.js` - Added validation middleware
- `backend/utils/vehicleDataNormalizer.js` - Already existed, ready to use

## Step-by-Step Implementation

### Step 1: Remove Duplicates (IMPORTANT - Do this first!)

```bash
cd backend
node scripts/removeDuplicateAdverts.js
```

This will:
- Find all registration numbers with multiple active adverts
- Keep the most recent one
- Mark others as 'removed'

### Step 2: Add Unique Index

```bash
node scripts/addUniqueRegistrationIndex.js
```

This creates a partial unique index that:
- Prevents duplicate active adverts with same registration
- Allows multiple inactive/sold/removed adverts

### Step 3: Migrate Existing Data

```bash
node scripts/migrateToAutoTraderFormat.js
```

This will:
- Normalize engine sizes to litres
- Extract trim from submodel
- Create variant field
- Sanitize descriptions
- Generate display titles

**Expected output:**
```
✅ Connected to MongoDB
📊 Found 150 vehicles to process

✅ Updated BMW 3 Series (EK14TWX)
   - engineSize: 2 → 2.0
   - submodel: "Petrol manual" → null
   - variant: "null" → "320d M Sport"
   - displayTitle: → "BMW 3 Series 2.0L 320d M Sport Manual"

📈 Progress: 50/150 processed, 45 updated
...

📊 MIGRATION SUMMARY
Total vehicles: 150
Processed: 150
Updated: 142
Errors: 0

✅ Migration complete!
```

### Step 4: Test Compliance

```bash
node scripts/testAutoTraderCompliance.js
```

This verifies:
- Engine size normalization
- Submodel extraction
- Description sanitization
- Display title generation
- No duplicates remain
- Validation functions work

### Step 5: Restart Backend

The middleware is now active and will:
- Validate all new vehicle submissions
- Normalize data automatically
- Prevent duplicate registrations
- Generate display titles

```bash
npm start
```

## How It Works

### Automatic Normalization (Pre-Save Hook)

Every time a Car document is saved:

```javascript
// In Car model pre-save hook
const normalized = normalizeVehicleData(this.toObject());
this.engineSize = normalized.engineSize;
this.submodel = normalized.submodel;
this.variant = normalized.variant;
this.description = normalized.description;
this.displayTitle = normalized.displayTitle;
```

### Duplicate Prevention

```javascript
// In Car model pre-save hook
if (this.registrationNumber && this.advertStatus === 'active') {
  const duplicate = await this.constructor.findOne({
    registrationNumber: this.registrationNumber,
    advertStatus: 'active',
    _id: { $ne: this._id }
  });
  
  if (duplicate) {
    throw new Error('Active advert already exists');
  }
}
```

### API Validation Middleware

```javascript
// In routes
router.post('/lookup',
  checkDuplicateRegistration,
  validateAndNormalizeVehicle,
  vehicleController.lookupAndCreateVehicle
);
```

## Display Title Format

**Format:** `Make Model EngineSize Variant Transmission`

**Examples:**
- `BMW 3 Series 2.0L 320d M Sport Manual`
- `Audi A4 1.6L SE TDI Automatic`
- `Ford Focus 1.6L Zetec Manual`

## Frontend Integration

The backend now sends `displayTitle` in all vehicle responses:

```javascript
{
  "_id": "...",
  "make": "BMW",
  "model": "3 Series",
  "engineSize": 2.0,
  "variant": "320d M Sport",
  "transmission": "manual",
  "displayTitle": "BMW 3 Series 2.0L 320d M Sport Manual",
  ...
}
```

Frontend can use it directly:

```javascript
// Instead of building title manually
<h2>{car.displayTitle}</h2>

// Or fallback to manual if needed
<h2>{car.displayTitle || `${car.make} ${car.model}`}</h2>
```

## Validation Rules

### Engine Size
- Must be between 0.8L and 10.0L
- Automatically converted from cc to litres if needed
- Formatted with 1 decimal place

### Submodel
- Only trim level names allowed
- Fuel type and transmission removed automatically
- Examples: "M Sport", "SE", "Sport"

### Description
- Max 2000 characters
- No JSON or object data
- No sensitive information (passwords, tokens)
- Automatically sanitized

### Registration Number
- Only ONE active advert per registration
- Multiple inactive/sold adverts allowed
- Case insensitive (stored uppercase)

## Troubleshooting

### "Duplicate registration" error
This is working correctly! It prevents multiple active adverts for the same car.

**Solution:** Mark the old advert as 'sold' or 'removed' before creating a new one.

### Engine size showing as 0.0 or wrong value
Run the migration script to fix existing data:
```bash
node scripts/migrateToAutoTraderFormat.js
```

### Submodel contains "Petrol manual"
Run the migration script to clean up:
```bash
node scripts/migrateToAutoTraderFormat.js
```

### Description contains garbage
Run the migration script to sanitize:
```bash
node scripts/migrateToAutoTraderFormat.js
```

## Monitoring

Check compliance regularly:
```bash
node scripts/testAutoTraderCompliance.js
```

This will show:
- ✅ Compliant records
- ❌ Records with issues
- Statistics on data quality

## Next Steps

1. ✅ Run all migration scripts
2. ✅ Test with sample data
3. ✅ Update frontend to use displayTitle
4. ✅ Monitor for any issues
5. ✅ Consider adding more validation rules as needed

## Support

If you encounter issues:
1. Check the test script output
2. Review error messages in console
3. Verify database indexes are created
4. Ensure middleware is properly applied to routes
