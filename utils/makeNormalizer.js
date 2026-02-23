/**
 * Make Normalizer - Normalize car makes to match AutoTrader format
 * Based on AutoTrader's official make list
 */

// AutoTrader official make names (exact format)
const AUTOTRADER_MAKES = {
  // Common variations → AutoTrader format
  'abarth': 'Abarth',
  'ac': 'AC',
  'ak': 'AK',
  'alfa romeo': 'Alfa Romeo',
  'alfa-romeo': 'Alfa Romeo',
  'alfaromeo': 'Alfa Romeo',
  'allard': 'Allard',
  'alpine': 'Alpine',
  'alvis': 'Alvis',
  'ariel': 'Ariel',
  'aston martin': 'Aston Martin',
  'aston-martin': 'Aston Martin',
  'astonmartin': 'Aston Martin',
  'audi': 'Audi',
  'austin': 'Austin',
  'bac': 'BAC',
  'beauford': 'Beauford',
  'bentley': 'Bentley',
  'blitzworld': 'Blitzworld',
  'bmw': 'BMW',
  'bugatti': 'Bugatti',
  'buick': 'Buick',
  'byd': 'BYD',
  'cadillac': 'Cadillac',
  'carbodies': 'Carbodies',
  'caterham': 'Caterham',
  'changan': 'Changan',
  'chery': 'Chery',
  'chesil': 'Chesil',
  'chevrolet': 'Chevrolet',
  'chrysler': 'Chrysler',
  'citroen': 'Citroen',
  'citroën': 'Citroen',
  'corbin': 'Corbin',
  'corvette': 'Corvette',
  'cupra': 'CUPRA',
  'dacia': 'Dacia',
  'daewoo': 'Daewoo',
  'daihatsu': 'Daihatsu',
  'daimler': 'Daimler',
  'david brown': 'David Brown',
  'dax': 'Dax',
  'de tomaso': 'De Tomaso',
  'dodge': 'Dodge',
  'ds': 'DS AUTOMOBILES',
  'ds automobiles': 'DS AUTOMOBILES',
  'ds-automobiles': 'DS AUTOMOBILES',
  'e-cobra': 'E-COBRA',
  'ferrari': 'Ferrari',
  'fiat': 'Fiat',
  'fisker': 'Fisker',
  'ford': 'Ford',
  'gardner douglas': 'Gardner Douglas',
  'geely': 'Geely',
  'genesis': 'Genesis',
  'gmc': 'GMC',
  'great wall': 'Great Wall',
  'gwm': 'GWM',
  'heathcliff': 'Heathcliff',
  'honda': 'Honda',
  'hummer': 'Hummer',
  'hyundai': 'Hyundai',
  'ineos': 'INEOS',
  'infiniti': 'Infiniti',
  'isuzu': 'Isuzu',
  'jaecoo': 'JAECOO',
  'jaguar': 'Jaguar',
  'jba': 'JBA',
  'jeep': 'Jeep',
  'jensen': 'Jensen',
  'kgm': 'KGM',
  'kia': 'Kia',
  'koenigsegg': 'Koenigsegg',
  'ktm': 'KTM',
  'lada': 'Lada',
  'lamborghini': 'Lamborghini',
  'lancia': 'Lancia',
  'land rover': 'Land Rover',
  'land-rover': 'Land Rover',
  'landrover': 'Land Rover',
  'ldv': 'LDV',
  'leapmotor': 'Leapmotor',
  'levc': 'LEVC',
  'lexus': 'Lexus',
  'leyland': 'Leyland',
  'lincoln': 'Lincoln',
  'lister': 'Lister',
  'london taxis international': 'London Taxis International',
  'lotus': 'Lotus',
  'mahindra': 'Mahindra',
  'maserati': 'Maserati',
  'maxus': 'MAXUS',
  'maybach': 'Maybach',
  'mazda': 'Mazda',
  'mclaren': 'McLaren',
  'mercedes': 'Mercedes-Benz',
  'mercedes-benz': 'Mercedes-Benz',
  'mercedes benz': 'Mercedes-Benz',
  'mercedesbenz': 'Mercedes-Benz',
  'mev': 'MEV',
  'mg': 'MG',
  'micro': 'Micro',
  'mills extreme vehicles (mev)': 'Mills Extreme Vehicles (MEV)',
  'mini': 'MINI',
  'mitsubishi': 'Mitsubishi',
  'moke': 'MOKE',
  'morgan': 'Morgan',
  'morris': 'Morris',
  'nardini': 'Nardini',
  'nissan': 'Nissan',
  'noble': 'Noble',
  'omoda': 'OMODA',
  'opel': 'Opel',
  'pagani': 'Pagani',
  'panther': 'Panther',
  'perodua': 'Perodua',
  'peugeot': 'Peugeot',
  'pilgrim': 'Pilgrim',
  'plymouth': 'Plymouth',
  'polestar': 'Polestar',
  'pontiac': 'Pontiac',
  'porsche': 'Porsche',
  'proton': 'Proton',
  'radical': 'Radical',
  'ram': 'Ram',
  'rbw': 'RBW',
  'reliant': 'Reliant',
  'renault': 'Renault',
  'rolls-royce': 'Rolls-Royce',
  'rolls royce': 'Rolls-Royce',
  'rollsroyce': 'Rolls-Royce',
  'rover': 'Rover',
  'ruf': 'RUF',
  'saab': 'Saab',
  'seat': 'SEAT',
  'shelby': 'Shelby',
  'skoda': 'Skoda',
  'škoda': 'Skoda',
  'skywell': 'Skywell',
  'smart': 'Smart',
  'ssangyong': 'SsangYong',
  'standard': 'Standard',
  'subaru': 'Subaru',
  'sunbeam': 'Sunbeam',
  'suzuki': 'Suzuki',
  'tesla': 'Tesla',
  'tiger': 'Tiger',
  'tornado': 'Tornado',
  'toyota': 'Toyota',
  'triumph': 'Triumph',
  'tvr': 'TVR',
  'ultima': 'Ultima',
  'vauxhall': 'Vauxhall',
  'volkswagen': 'Volkswagen',
  'vw': 'Volkswagen',
  'volvo': 'Volvo',
  'vrs': 'VRS',
  'westfield': 'Westfield',
  'xpeng': 'XPENG',
  'zenos': 'Zenos'
};

/**
 * Normalize make to AutoTrader format
 * @param {string} make - Raw make name
 * @returns {string} Normalized make name
 */
function normalizeMake(make) {
  if (!make || typeof make !== 'string') {
    return make;
  }
  
  // Convert to lowercase for lookup
  const makeLower = make.toLowerCase().trim();
  
  // Check if we have a mapping
  if (AUTOTRADER_MAKES[makeLower]) {
    const normalized = AUTOTRADER_MAKES[makeLower];
    if (normalized !== make) {
      console.log(`🔧 Make normalized: "${make}" → "${normalized}"`);
    }
    return normalized;
  }
  
  // If no mapping found, use title case as fallback
  const titleCase = make
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  if (titleCase !== make) {
    console.log(`⚠️  Make not in AutoTrader list, using title case: "${make}" → "${titleCase}"`);
  }
  
  return titleCase;
}

/**
 * Check if make is valid AutoTrader make
 * @param {string} make - Make name to check
 * @returns {boolean} True if valid
 */
function isValidAutoTraderMake(make) {
  if (!make || typeof make !== 'string') {
    return false;
  }
  
  const makeLower = make.toLowerCase().trim();
  return AUTOTRADER_MAKES.hasOwnProperty(makeLower);
}

/**
 * Get all valid AutoTrader makes
 * @returns {Array<string>} Array of valid make names
 */
function getAllAutoTraderMakes() {
  // Get unique values (normalized makes)
  const uniqueMakes = [...new Set(Object.values(AUTOTRADER_MAKES))];
  return uniqueMakes.sort();
}

module.exports = {
  normalizeMake,
  isValidAutoTraderMake,
  getAllAutoTraderMakes,
  AUTOTRADER_MAKES
};
