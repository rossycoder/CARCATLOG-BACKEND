/**
 * Debug the parser to see what's happening
 */

const data = {
  VehicleIdentification: {
    DvlaMake: "BMW",
    DvlaModel: "520D XDRIVE M SPORT AUTO",
    YearOfManufacture: 2017,
    DvlaBodyType: "4 DOOR SALOON",
    DvlaFuelType: "HEAVY OIL",
    DvlaCo2: 124
  },
  ModelData: {
    Make: "BMW",
    Range: "5 Series",
    FuelType: "Diesel"
  },
  BodyDetails: {
    BodyStyle: "Saloon",
    NumberOfDoors: 4,
    NumberOfSeats: 5
  },
  DvlaTechnicalDetails: {
    EngineCapacityCc: 1995,
    SeatCountIncludingDriver: 5
  },
  Transmission: {
    TransmissionType: "Automatic"
  },
  Performance: {
    FuelEconomy: {
      UrbanColdMpg: 54.3,
      ExtraUrbanMpg: 64.2,
      CombinedMpg: 60.1
    },
    Power: {
      Bhp: 188
    },
    Torque: {
      Nm: 400
    },
    Statistics: {
      ZeroToOneHundredKph: 7.3,
      MaxSpeedMph: 145
    }
  },
  Emissions: {
    ManufacturerCo2: 124
  }
};

function extractNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function normalizeFuelType(fuelType) {
  if (!fuelType || typeof fuelType !== 'string') {
    return 'Unknown';
  }
  
  const normalized = fuelType.toLowerCase().trim();
  
  if (normalized.includes('diesel')) {
    return 'Diesel';
  }
  if (normalized.includes('petrol')) {
    return 'Petrol';
  }
  
  return fuelType;
}

function normalizeTransmission(transmission) {
  if (!transmission || typeof transmission !== 'string') {
    return 'Unknown';
  }
  
  const normalized = transmission.toLowerCase().trim();
  
  if (normalized.includes('automatic')) {
    return 'Automatic';
  }
  if (normalized.includes('manual')) {
    return 'Manual';
  }
  
  return transmission;
}

console.log('Testing parser logic...\n');

const vehicleId = data.VehicleIdentification || {};
const bodyDetails = data.BodyDetails || {};
const performance = data.Performance || {};
const fuelEconomy = performance.FuelEconomy || {};
const modelData = data.ModelData || {};
const transmission = data.Transmission || {};
const dvlaTech = data.DvlaTechnicalDetails || {};
const emissions = data.Emissions || {};

console.log('vehicleId:', vehicleId);
console.log('modelData:', modelData);
console.log('fuelEconomy:', fuelEconomy);
console.log('dvlaTech:', dvlaTech);
console.log('emissions:', emissions);

const result = {
  make: vehicleId.DvlaMake || modelData.Make || null,
  model: vehicleId.DvlaModel || modelData.Model || null,
  variant: modelData.Range || null,
  year: extractNumber(vehicleId.YearOfManufacture),
  fuelType: normalizeFuelType(modelData.FuelType || vehicleId.DvlaFuelType),
  transmission: normalizeTransmission(transmission.TransmissionType),
  bodyType: bodyDetails.BodyStyle || vehicleId.DvlaBodyType || null,
  doors: extractNumber(bodyDetails.NumberOfDoors),
  seats: extractNumber(bodyDetails.NumberOfSeats || dvlaTech.SeatCountIncludingDriver),
  engineSize: extractNumber(dvlaTech.EngineCapacityCc) / 1000,
  
  // Running costs
  urbanMpg: extractNumber(fuelEconomy.UrbanColdMpg),
  extraUrbanMpg: extractNumber(fuelEconomy.ExtraUrbanMpg),
  combinedMpg: extractNumber(fuelEconomy.CombinedMpg),
  co2Emissions: extractNumber(emissions.ManufacturerCo2 || vehicleId.DvlaCo2),
  
  // Performance
  power: extractNumber(performance.Power?.Bhp),
  torque: extractNumber(performance.Torque?.Nm),
  acceleration: extractNumber(performance.Statistics?.ZeroToOneHundredKph),
  topSpeed: extractNumber(performance.Statistics?.MaxSpeedMph),
};

console.log('\n✅ Parsed Result:');
console.log(JSON.stringify(result, null, 2));
