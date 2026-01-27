/**
 * Test script to parse RJ08PFA API response
 */

const { parseHistoryResponse } = require('../utils/historyResponseParser');

// Actual API response from CheckCarDetails
const apiResponse = {
  "VehicleRegistration": {
    "DateOfLastUpdate": "2024-05-15T05:48:57",
    "Colour": "SILVER",
    "VehicleClass": "Car",
    "CertificateOfDestructionIssued": false,
    "EngineNumber": "N22A23517028",
    "EngineCapacity": "2204",
    "TransmissionCode": "M",
    "Exported": false,
    "YearOfManufacture": "2008",
    "WheelPlan": "2 AXLE RIGID BODY",
    "DateExported": null,
    "Scrapped": false,
    "Transmission": "MANUAL 6 GEARS",
    "DateFirstRegisteredUk": "2008-05-01T00:00:00",
    "Model": "CIVIC TYPE-S GT I-CTDI",
    "GearCount": 6,
    "ImportNonEu": false,
    "PreviousVrmGb": null,
    "GrossWeight": 1890,
    "DoorPlanLiteral": "3 DOOR HATCHBACK",
    "MvrisModelCode": "AKX",
    "Vin": "SHHFN33608U002601",
    "Vrm": "RJ08PFA",
    "DateFirstRegistered": "2008-05-01T00:00:00",
    "DateScrapped": null,
    "DoorPlan": "13",
    "YearMonthFirstRegistered": "2008-05",
    "VinLast5": "02601",
    "VehicleUsedBeforeFirstRegistration": false,
    "MaxPermissibleMass": 1890,
    "Make": "HONDA",
    "MakeModel": "HONDA CIVIC TYPE-S GT I-CTDI",
    "TransmissionType": "Manual",
    "SeatingCapacity": 5,
    "FuelType": "DIESEL",
    "Co2Emissions": 138,
    "Imported": false,
    "MvrisMakeCode": "R0",
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
    "V5CCertificateCount": 3,
    "PlateChangeCount": 0,
    "NumberOfPreviousKeepers": 7,
    "V5CCertificateList": [
      {"CertificateDate": "2023-10-31T00:00:00"},
      {"CertificateDate": "2023-09-26T00:00:00"},
      {"CertificateDate": "2017-09-15T00:00:00"}
    ],
    "KeeperChangesCount": 3,
    "VicCount": 0,
    "ColourChangeCount": null,
    "ColourChangeList": null,
    "KeeperChangesList": [
      {
        "DateOfTransaction": "2023-10-31T00:00:00",
        "NumberOfPreviousKeepers": 7,
        "DateOfLastKeeperChange": "2023-10-31T00:00:00"
      },
      {
        "DateOfTransaction": "2023-09-24T00:00:00",
        "NumberOfPreviousKeepers": 6,
        "DateOfLastKeeperChange": "2023-09-24T00:00:00"
      },
      {
        "DateOfTransaction": "2017-08-16T00:00:00",
        "NumberOfPreviousKeepers": 5,
        "DateOfLastKeeperChange": "2017-08-16T00:00:00"
      }
    ],
    "PlateChangeList": [],
    "VicList": null,
    "ColourChangeDetails": {
      "CurrentColour": "SILVER",
      "NumberOfPreviousColours": 0,
      "OriginalColour": "SILVER",
      "LastColour": null,
      "DateOfLastColourChange": null
    }
  }
};

console.log('\n🔍 Testing History Response Parser');
console.log('='.repeat(80));

try {
  const parsed = parseHistoryResponse(apiResponse, false);
  
  console.log('\n✅ Parsed Result:');
  console.log(JSON.stringify(parsed, null, 2));
  
  console.log('\n📊 Key Fields:');
  console.log('  VRM:', parsed.vrm);
  console.log('  Number of Previous Keepers:', parsed.numberOfPreviousKeepers);
  console.log('  Previous Owners:', parsed.previousOwners);
  console.log('  Number of Owners:', parsed.numberOfOwners);
  console.log('  Has Accident History:', parsed.hasAccidentHistory);
  console.log('  Is Written Off:', parsed.isWrittenOff);
  console.log('  Is Stolen:', parsed.isStolen);
  console.log('  Has Outstanding Finance:', parsed.hasOutstandingFinance);
  console.log('  Is Scrapped:', parsed.isScrapped);
  console.log('  Is Imported:', parsed.isImported);
  console.log('  Is Exported:', parsed.isExported);
  
  console.log('\n' + '='.repeat(80));
  
  // Verify the key issue
  if (parsed.numberOfPreviousKeepers === 7) {
    console.log('✅ SUCCESS: numberOfPreviousKeepers correctly parsed as 7');
  } else {
    console.log(`❌ FAILED: numberOfPreviousKeepers is ${parsed.numberOfPreviousKeepers}, expected 7`);
  }
  
} catch (error) {
  console.error('\n❌ Error parsing response:', error);
  console.error(error.stack);
}
