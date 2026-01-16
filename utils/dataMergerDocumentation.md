# Data Merger Utility Documentation

## Overview

The Data Merger utility intelligently combines vehicle data from multiple API sources (DVLA and CheckCarDetails) with configurable priority rules and comprehensive source tracking.

## Test Results

✅ **All tests passed!**

### Test 1: Both APIs Provide Data
- **DVLA priority fields** (make, model, year): Correctly uses DVLA data
- **CheckCarDetails priority fields** (fuel economy, insurance, performance): Correctly uses CheckCarDetails data
- **Fallback logic**: CO2 and tax prefer CheckCarDetails but fall back to DVLA if unavailable
- **Source tracking**: All fields correctly tagged with their data source

### Test 2: Only DVLA Data Available
- Basic vehicle info populated from DVLA
- Running costs and performance fields return null (no data available)
- Data sources correctly indicate DVLA=true, CheckCarDetails=false

### Test 3: Only CheckCarDetails Data Available
- Falls back to CheckCarDetails for all available fields
- Source tracking correctly shows checkcardetails as source
- Gracefully handles missing DVLA data

### Test 4: Partial Data from Both APIs
- Correctly merges partial data sets
- Applies priority rules appropriately
- No errors with missing fields

## Priority Rules

### DVLA Priority (Official Registration Data)
- `make` - Vehicle manufacturer
- `model` - Vehicle model
- `year` - Manufacturing year
- `color` - Vehicle color
- `fuelType` - Fuel type
- `transmission` - Transmission type
- `engineSize` - Engine capacity

### CheckCarDetails Priority (Comprehensive Running Costs)
- `fuelEconomy.urban` - Urban fuel consumption (mpg)
- `fuelEconomy.extraUrban` - Extra urban fuel consumption (mpg)
- `fuelEconomy.combined` - Combined fuel consumption (mpg)
- `co2Emissions` - CO2 emissions (g/km) *with DVLA fallback*
- `insuranceGroup` - Insurance group
- `annualTax` - Annual road tax (£) *with DVLA fallback*

### CheckCarDetails Only (Performance Data)
- `performance.power` - Engine power (bhp)
- `performance.torque` - Engine torque (Nm)
- `performance.acceleration` - 0-60mph time (seconds)
- `performance.topSpeed` - Maximum speed (mph)

## Usage

```javascript
const dataMerger = require('../utils/dataMerger');

// Merge data from both APIs
const mergedData = dataMerger.merge(dvlaData, checkCarDetailsData);

// Access merged values with source tracking
console.log(mergedData.make.value);        // 'BMW'
console.log(mergedData.make.source);       // 'dvla'

console.log(mergedData.runningCosts.fuelEconomy.combined.value);  // 45.8
console.log(mergedData.runningCosts.fuelEconomy.combined.source); // 'checkcardetails'

// Check which APIs provided data
console.log(mergedData.dataSources.dvla);           // true
console.log(mergedData.dataSources.checkCarDetails); // true
console.log(mergedData.dataSources.timestamp);      // ISO timestamp

// Get field source mapping for frontend display
console.log(mergedData.fieldSources);
```

## Output Structure

```javascript
{
  // Basic vehicle info
  make: { value: 'BMW', source: 'dvla' },
  model: { value: '3 Series', source: 'dvla' },
  year: { value: 2020, source: 'dvla' },
  color: { value: 'Black', source: 'dvla' },
  fuelType: { value: 'Diesel', source: 'dvla' },
  transmission: { value: 'Automatic', source: 'dvla' },
  engineSize: { value: 1995, source: 'dvla' },
  
  // Running costs
  runningCosts: {
    fuelEconomy: {
      urban: { value: 35.5, source: 'checkcardetails' },
      extraUrban: { value: 55.2, source: 'checkcardetails' },
      combined: { value: 45.8, source: 'checkcardetails' }
    },
    co2Emissions: { value: 125, source: 'checkcardetails' },
    insuranceGroup: { value: '25E', source: 'checkcardetails' },
    annualTax: { value: 150, source: 'checkcardetails' }
  },
  
  // Performance data
  performance: {
    power: { value: 184, source: 'checkcardetails' },
    torque: { value: 290, source: 'checkcardetails' },
    acceleration: { value: 7.1, source: 'checkcardetails' },
    topSpeed: { value: 146, source: 'checkcardetails' }
  },
  
  // Source tracking
  dataSources: {
    dvla: true,
    checkCarDetails: true,
    timestamp: '2026-01-13T20:23:39.862Z'
  },
  
  // Field source mapping
  fieldSources: {
    make: 'dvla',
    model: 'dvla',
    runningCosts: {
      fuelEconomy: {
        urban: 'checkcardetails',
        combined: 'checkcardetails'
      },
      co2Emissions: 'checkcardetails'
    },
    performance: {
      power: 'checkcardetails',
      torque: 'checkcardetails'
    }
  }
}
```

## Key Features

✅ **Intelligent Priority Rules** - DVLA for official data, CheckCarDetails for running costs  
✅ **Fallback Logic** - Uses secondary source if primary unavailable  
✅ **Source Tracking** - Every field tagged with its data source  
✅ **Validation** - Checks data validity before merging  
✅ **Graceful Degradation** - Works with partial data from either API  
✅ **Empty Data Handling** - Returns structured null data if both APIs fail  

## Next Steps

The Data Merger is ready for integration into the Enhanced Vehicle Service for parallel API calls!
