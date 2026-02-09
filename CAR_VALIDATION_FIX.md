# Car Validation Fix - CVT & Hybrid Support

## Problem
Car creation failing with validation errors:
1. `transmission: 'cvt'` not allowed (only `automatic`, `manual`, `semi-automatic`)
2. `fuelType: 'Petrol/Electric'` not allowed (only `Petrol`, `Diesel`, `Electric`, `Hybrid`)
3. `historyCheckId: ""` empty string causing cast error

## Solution

### File: `backend/controllers/paymentController.js`

#### 1. Transmission Mapping
```javascript
// Maps CVT, DSG, Tiptronic → automatic
// Maps Semi-Auto → semi-automatic
// Default → manual
```

**Supported Transmissions:**
- CVT → `automatic`
- Automatic/Auto → `automatic`
- DSG/Tiptronic → `semi-automatic`
- Semi-Auto → `semi-automatic`
- Manual → `manual`

#### 2. Fuel Type Mapping
```javascript
// Maps Petrol/Electric, Hybrid variants → Hybrid
// Validates against enum: Petrol, Diesel, Electric, Hybrid
```

**Supported Fuel Types:**
- Petrol/Electric → `Hybrid`
- Petrol/Hybrid → `Hybrid`
- Diesel/Electric → `Hybrid`
- Petrol → `Petrol`
- Diesel → `Diesel`
- Electric → `Electric`

#### 3. HistoryCheckId Fix
- Removed empty string assignment
- Only set when valid ObjectId available
- Prevents BSON cast errors

## Testing

### Test Case: Lexus IS 300h (Hybrid CVT)
**Input:**
- Transmission: "CVT"
- Fuel Type: "Petrol/Electric"

**Output:**
- Transmission: "automatic" ✅
- Fuel Type: "Hybrid" ✅
- Car created successfully ✅

## Benefits
✅ Supports CVT transmissions
✅ Supports hybrid vehicles
✅ Prevents validation errors
✅ Cars appear in My Listings

---
**Status**: ✅ Fixed
**Date**: 2026-02-10
