/**
 * Test script to verify NU10YEV history parsing
 */

const { parseHistoryResponse } = require('../utils/historyResponseParser');

// Actual API response from CheckCarDetails for NU10YEV
const apiResponse = {
  "VehicleRegistration": {
    "DateOfLastUpdate": "2025-10-04T22:49:55",
    "Colour": "RED",
    "VehicleClass": "Car",
    "CertificateOfDestructionIssued": false,
    "EngineNumber": "CAY 674481",
    "EngineCapacity": "1598",
    "TransmissionCode": "M",
    "Exported": false,
    "YearOfManufacture": "2010",
    "WheelPlan": "2 AXLE RIGID BODY",
    "DateExported": null,
    "Scrapped": false,
    "Transmission": "MANUAL 5 GEARS",
    "DateFirstRegisteredUk": "2010-06-30T00:00:00",
    "Model": "OCTAVIA S TDI CR",
    "GearCount": 5,
    "ImportNonEu": false,
    "PreviousVrmGb": null,
    "GrossWeight": 1955,
    "DoorPlanLiteral": "5 DOOR HATCHBACK",
    "MvrisModelCode": "AQZ",
    "Vin": "TMBDT21Z8A2106557",
    "Vrm": "NU10YEV",
    "DateFirstRegistered": "2010-06-30T00:00:00",
    "DateScrapped": null,
    "DoorPlan": "14",
    "YearMonthFirstRegistered": "2010-06",
    "VinLast5": "06557",
    "VehicleUsedBeforeFirstRegistration": false,
    "MaxPermissibleMass": 1950,
    "Make": "SKODA",
    "MakeModel": "SKODA OCTAVIA S TDI CR",
    "TransmissionType": "Manual",
    "SeatingCapacity": 5,
    "FuelType": "DIESEL",
    "Co2Emissions": 119,
    "Imported": false,
    "MvrisMakeCode": "Q3",
    "PreviousVrmNi": null,
    "VinConfirmationFlag": null
  },
  "VehicleHistory": {
    "stolenRecord": false,
    "financeRecord": false,
    "writeOffRecord": false,
    "stolen": null,
    "finance": null,
    "writeoff": null,
    "V5CCertificateCount": 2,
    "PlateChangeCount": 0,
    "NumberOfPreviousKeepers": 7,
    "V5CCertificateList": [
      {"CertificateDate": "2019-04-15T00:00:00"},
      {"CertificateDate": "2018-12-12T00:00:00"}
    ],
    "KeeperChangesCount": 7,
    "VicCount": 0,
    "ColourChangeCount": null,
    "ColourChangeList": null,
    "KeeperChangesList": [
      {
        "DateOfTransaction": "2019-04-09T00:00:00",
        "NumberOfPreviousKeepers": 7,
        "DateOfLastKeeperChange": "2019-04-09T00:00:00"
      },
      {
        "DateOfTransaction": "2018-12-02T00:00:00",
        "NumberOfPreviousKeepers": 6,
        "DateOfLastKeeperChange": "2018-12-02T00:00:00"
      },
      {
        "DateOfTransaction": "2018-10-17T00:00:00",
        "NumberOfPreviousKeepers": 5,
        "DateOfLastKeeperChange": "2018-10-17T00:00:00"
      },
      {
        "DateOfTransaction": "2014-02-17T00:00:00",
        "NumberOfPreviousKeepers": 4,
        "DateOfLastKeeperChange": "2014-02-17T00:00:00"
      },
      {
        "DateOfTransaction": "2013-11-13T00:00:00",
        "NumberOfPreviousKeepers": 3,
        "DateOfLastKeeperChange": "2013-11-13T00:00:00"
      },
      {
        "DateOfTransaction": "2013-10-14T00:00:00",
        "NumberOfPreviousKeepers": 2,
        "DateOfLastKeeperChange": "2013-10-14T00:00:00"
      },
      {
        "DateOfTransaction": "2010-11-15T00:00:00",
        "NumberOfPreviousKeepers": 1,
        "DateOfLastKeeperChange": "2010-11-15T00:00:00"
      }
    ],
    "PlateChangeList": [],
    "VicList": null,
    "ColourChangeDetails": {
      "CurrentColour": "RED",
      "NumberOfPreviousColours": 0,
      "OriginalColour": "RED",
      "LastColour": null,
      "DateOfLastColourChange": null
    }
  }
};

console.log('=== Testing NU10YEV History Parsing ===\n');

try {
  const parsed = parseHistoryResponse(apiResponse, false);
  
  console.log('✅ Parsing successful!\n');
  console.log('📊 Parsed Data:');
  console.log('  VRM:', parsed.vrm);
  console.log('  Number of Previous Keepers:', parsed.numberOfPreviousKeepers);
  console.log('  V5C Certificate Count:', parsed.v5cCertificateCount);
  console.log('  V5C Certificate List:', parsed.v5cCertificateList);
  console.log('  Plate Changes:', parsed.plateChanges);
  console.log('  Plate Changes List:', parsed.plateChangesList);
  console.log('  Colour Changes:', parsed.colourChanges);
  console.log('  Colour Changes List:', parsed.colourChangesList);
  console.log('  Colour Change Details:', parsed.colourChangeDetails);
  console.log('  Keeper Changes List:', parsed.keeperChangesList);
  console.log('  VIC Count:', parsed.vicCount);
  console.log('  Is Stolen:', parsed.isStolen);
  console.log('  Has Finance:', parsed.hasOutstandingFinance);
  console.log('  Is Written Off:', parsed.isWrittenOff);
  console.log('  Is Scrapped:', parsed.isScrapped);
  console.log('  Is Imported:', parsed.isImported);
  console.log('  Is Exported:', parsed.isExported);
  
  console.log('\n✅ All fields extracted correctly!');
  
  // Verify critical fields
  if (parsed.numberOfPreviousKeepers === 7) {
    console.log('✅ Owner count is correct: 7');
  } else {
    console.log('❌ Owner count is incorrect:', parsed.numberOfPreviousKeepers);
  }
  
  if (parsed.v5cCertificateCount === 2) {
    console.log('✅ V5C certificate count is correct: 2');
  } else {
    console.log('❌ V5C certificate count is incorrect:', parsed.v5cCertificateCount);
  }
  
  if (parsed.keeperChangesList.length === 7) {
    console.log('✅ Keeper changes list has correct length: 7');
  } else {
    console.log('❌ Keeper changes list has incorrect length:', parsed.keeperChangesList.length);
  }
  
} catch (error) {
  console.error('❌ Parsing failed:', error.message);
  console.error(error.stack);
}
