/**
 * Universal Feed Mapper
 * Maps various feed formats to CarCatalog internal schema
 */
class FeedMapper {

  /**
   * Map vehicles from parsed feed to internal schema
   */
  mapVehicles(parsedData, format, provider) {
    try {
      // Extract vehicles array based on format
      let rawVehicles = this.extractVehiclesArray(parsedData, format, provider);
      
      if (!rawVehicles || rawVehicles.length === 0) {
        return [];
      }

      // Ensure it's an array
      if (!Array.isArray(rawVehicles)) {
        rawVehicles = [rawVehicles];
      }

      // Map each vehicle to internal schema
      return rawVehicles.map((rawVehicle, index) => {
        return this.mapVehicle(rawVehicle, provider, index);
      }).filter(v => v !== null);

    } catch (error) {
      console.error('Error mapping vehicles:', error);
      return [];
    }
  }

  /**
   * Extract vehicles array from parsed data
   */
  extractVehiclesArray(data, format, provider) {
    console.log('🔍 [extractVehiclesArray] Input data structure:', {
      format,
      provider,
      dataKeys: typeof data === 'object' && data ? Object.keys(data) : 'not an object',
      dataType: typeof data,
      isArray: Array.isArray(data)
    });

    if (format === 'csv') {
      return data; // CSV is already an array of objects
    }

    if (format === 'json') {
      // ── Step 1: Seedha array ho to wahi use karo ──────────────────────────
      if (Array.isArray(data)) {
        console.log(`✅ [JSON] Root is array, count: ${data.length}`);
        return data;
      }
      
      // ── Step 2: Single object that looks like a vehicle — wrap it ────────
      // If the root is an object with vehicle-like fields (make, model, etc.)
      if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
        const vehicleKeys = ['make', 'model', 'registration', 'reg', 'vrm', 'stock_id', 'stockid', 'price'];
        const dataKeys = Object.keys(data).map(k => k.toLowerCase());
        const looksLikeVehicle = vehicleKeys.filter(k => dataKeys.includes(k)).length >= 2;
        if (looksLikeVehicle) {
          console.log('✅ [JSON] Root object looks like a single vehicle — wrapping in array');
          return [data];
        }
      }

      // ── Step 3: Known wrapper keys try karo ───────────────────────────────
      const knownKeys = [
        'vehicles', 'vehicle', 'testData', 'stock', 'cars', 'car',
        'items', 'item', 'listings', 'listing', 'inventory',
        'data', 'results', 'records', 'feed', 'adverts', 'advert'
      ];
      
      for (const key of knownKeys) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          console.log(`✅ [JSON] Found vehicles at key: "${key}", count: ${data[key].length}`);
          return data[key];
        }
      }
      
      // ── Step 3: Last resort - koi bhi array dhoondo ────────────────────────
      console.log(`🔍 [JSON] Known keys not found, searching all keys...`);
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          const sample = data[key][0];
          // Check if array contains objects (not primitives)
          if (sample && typeof sample === 'object' && !Array.isArray(sample)) {
            console.log(`✅ [JSON] Found array at key: "${key}", count: ${data[key].length}`);
            return data[key];
          }
        }
      }
      
      console.warn(`⚠️  [JSON] No vehicle arrays found in data`);
      return [];
    }

    if (format === 'xml') {
      console.log('🔍 [extractVehiclesArray] XML data structure:', JSON.stringify(data, null, 2).substring(0, 500));
      
      // Handle nested feed structure: { feed: { vehicles: {...} } }
      if (data.feed && data.feed.vehicles) {
        console.log('✅ Found data.feed.vehicles structure');
        const vehicles = data.feed.vehicles;
        // If it's a single vehicle object, wrap it in an array
        if (!Array.isArray(vehicles)) {
          console.log('✅ Converting single vehicle to array');
          return [vehicles];
        }
        return vehicles;
      }
      
      // Try common XML structures
      if (data.vehicles?.vehicle) {
        console.log('✅ Found data.vehicles.vehicle, count:', Array.isArray(data.vehicles.vehicle) ? data.vehicles.vehicle.length : 1);
        return data.vehicles.vehicle;
      }
      
      // Check for direct vehicles array (your XML structure)
      if (data.vehicles && Array.isArray(data.vehicles)) {
        console.log('✅ Found data.vehicles as array, count:', data.vehicles.length);
        return data.vehicles;
      }
      
      if (data.stock?.vehicle) return data.stock.vehicle;
      if (data.cars?.car) return data.cars.car;
      if (data.advertlist?.advert) return data.advertlist.advert;
      
      // Provider-specific
      if (provider === 'MotorDesk' && data.motordesk?.vehicle) {
        return data.motordesk.vehicle;
      }
      
      // Fallback: try to find any array-like structure (2 levels deep)
      const keys = Object.keys(data);
      for (const key of keys) {
        if (Array.isArray(data[key])) {
          return data[key];
        }
        if (data[key] && typeof data[key] === 'object') {
          const subKeys = Object.keys(data[key]);
          for (const subKey of subKeys) {
            if (Array.isArray(data[key][subKey])) {
              return data[key][subKey];
            }
          }
        }
      }
      
      // Last resort: recursively search the whole structure for the
      // array that looks most like a vehicle list, no matter how nested
      const deepFallback = this.findBestVehicleArray(data);
      if (deepFallback) {
        console.log('✅ [extractVehiclesArray] Found vehicles via deep recursive search, count:', deepFallback.length);
        return deepFallback;
      }
    }

    return [];
  }

  /**
   * Last-resort recursive search: finds the array anywhere in the parsed
   * structure that looks most like a vehicle list (most items + most
   * vehicle-like field names), regardless of how deeply it's nested.
   */
  findBestVehicleArray(data, maxDepth = 8) {
    const vehicleKeyHints = ['make', 'model', 'price', 'stock', 'registration', 'reg', 'mileage', 'vin'];
    let best = null;
    let bestScore = 0;
    
    const scoreArray = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return 0;
      const sample = arr[0];
      if (!sample || typeof sample !== 'object') return 0;
      const keys = Object.keys(sample).map(k => k.toLowerCase());
      const hits = vehicleKeyHints.filter(hint => keys.some(k => k.includes(hint))).length;
      return hits * arr.length;
    };
    
    const visit = (node, depth) => {
      if (depth > maxDepth || !node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        const score = scoreArray(node);
        if (score > bestScore) { bestScore = score; best = node; }
        node.forEach(item => visit(item, depth + 1));
        return;
      }
      for (const key of Object.keys(node)) visit(node[key], depth + 1);
    };
    
    visit(data, 0);
    return bestScore > 0 ? best : null;
  }

  /**
   * Map single vehicle to internal schema
   */
  mapVehicle(rawVehicle, provider, index) {
    try {
      // ✅ Extract stock_id - vrm bhi try karo
      const stockId = this.extractField(rawVehicle, [
        'stock_id', 'stockid', 'stocknumber', 'stock_number',
        'id', 'vehicle_id', 'vehicleid', 'vin', 'vrm', 'reg'
      ]);
      
      // ✅ Extract and NORMALIZE status
      const rawStatus = this.extractField(rawVehicle, [
        'status', 'state', 'availability', 'advert_status', 'advertstatus', 'stock_status'
      ]);
      const normalizedStatus = this.normalizeStatus(rawStatus);
      
      // Extract raw fuel type - check both direct and features
      const rawFuelType = this.extractField(rawVehicle, [
        'fuel_type',        // fuel_type (underscore)
        'fueltype',         // fueltype (no separator)
        'fuel type',        // fuel type (space)
        'fuel',             // fuel
        'fuelType',         // fuelType (camelCase)
        'FuelType',         // FuelType (PascalCase)
        'Fuel Type',        // Fuel Type
        'Fuel_Type',        // Fuel_Type
        'FUEL_TYPE',        // FUEL_TYPE (uppercase)
        'FUEL TYPE',        // FUEL TYPE
        'FUELTYPE',         // FUELTYPE
        'engine_type',      // engine_type
        'enginetype',       // enginetype
        'engine type',      // engine type
        'propulsion',       // propulsion
        'fuel_description', // fuel_description
        'energy_type'       // energy_type
      ]) || this.extractFromFeatures(rawVehicle, 'fuelType') || this.extractFromFeatures(rawVehicle, 'fuel_type');
      
      // Normalize fuel type to match Car model enum
      const fuelType = this.normalizeFuelType(rawFuelType);
      
      const mapped = {
        stock_id: stockId || `AUTO_${Date.now()}_${index}`,
        
        // Registration — vrm common field hai
        registration: this.extractField(rawVehicle, [
          'registration', 'reg', 'vrm', 'regnumber', 'reg_number',
          'plate', 'number_plate', 'licence_plate', 'license_plate'
        ]),
        
        vin: this.extractField(rawVehicle, [
          'vin', 'chassis', 'chassisnumber', 'chassis_number'
        ]),
        
        make: this.extractField(rawVehicle, [
          'make', 'manufacturer', 'brand', 'marque'
        ]),
        
        model: this.extractField(rawVehicle, [
          'model', 'modelname', 'model_name'
        ]),
        
        derivative: this.extractField(rawVehicle, [
          'derivative', 'variant', 'trim', 'version', 'variant_name'
          // ❌ REMOVED 'description' - description should NOT be used as variant!
        ]),
        
        year: parseInt(this.extractField(rawVehicle, [
          'year', 'reg_year', 'regyear', 'yearofmanufacture', 'year_of_manufacture', 'registration_year'
        ])) || null,
        
        mileage: parseInt(this.extractField(rawVehicle, [
          'mileage', 'miles', 'odometer', 'current_mileage'
        ]) || this.extractFromFeatures(rawVehicle, 'mileage')) || null,
        
        fuel_type: fuelType,
        
        transmission: this.extractField(rawVehicle, [
          'transmission', 'gearbox', 'trans', 'transmission_type'
        ]) || this.extractFromFeatures(rawVehicle, 'transmission'),
        
        colour: this.extractField(rawVehicle, [
          'colour', 'color', 'exterior_colour', 'exteriorcolour'
        ]) || this.extractFromFeatures(rawVehicle, 'color') || this.extractFromFeatures(rawVehicle, 'colour'),
        
        body_type: this.extractField(rawVehicle, [
          'body_type', 'bodytype', 'body_style', 'bodystyle', 'type'
        ]) || this.extractFromFeatures(rawVehicle, 'bodyStyle') || this.extractFromFeatures(rawVehicle, 'body_type'),
        
        doors: parseInt(this.extractField(rawVehicle, [
          'doors', 'door_count', 'num_doors', 'number_of_doors'
        ])) || null,
        
        seats: parseInt(this.extractField(rawVehicle, [
          'seats', 'seat_count', 'num_seats', 'number_of_seats', 'seating_capacity'
        ])) || null,
        
        engine_size: parseFloat(this.extractField(rawVehicle, [
          'engine_size', 'enginesize', 'engine_capacity', 'cc', 'capacity'
        ])) || null,
        
        // ── Electric Vehicle Fields ─────────────────────────────────────────
        electric_range: parseFloat(this.extractField(rawVehicle, [
          'electric_range', 'electricrange', 'range', 'ev_range', 'evrange',
          'battery_range', 'batteryrange', 'wltp_range', 'wltprange'
        ])) || null,
        
        battery_capacity: parseFloat(this.extractField(rawVehicle, [
          'battery_capacity', 'batterycapacity', 'battery_size', 'batterysize',
          'battery', 'kwh', 'battery_kwh'
        ])) || null,
        
        charging_time: parseFloat(this.extractField(rawVehicle, [
          'charging_time', 'chargingtime', 'charge_time', 'chargetime',
          'home_charging_time', 'homechargingtime'
        ])) || null,
        
        home_charging_speed: parseFloat(this.extractField(rawVehicle, [
          'home_charging_speed', 'homechargingspeed', 'home_charge_speed',
          'ac_charging', 'accharging', 'slow_charging'
        ])) || null,
        
        rapid_charging_speed: parseFloat(this.extractField(rawVehicle, [
          'rapid_charging_speed', 'rapidchargingspeed', 'rapid_charge_speed',
          'dc_charging', 'dccharging', 'fast_charging', 'fastcharging',
          'quick_charge', 'quickcharge'
        ])) || null,
        
        charging_time_10_to_80: parseFloat(this.extractField(rawVehicle, [
          'charging_time_10_to_80', 'chargingtime10to80', 'rapid_charge_time',
          'fast_charge_time', 'dc_charge_time', '10_80_charge_time'
        ])) || null,
        
        electric_motor_power: parseFloat(this.extractField(rawVehicle, [
          'electric_motor_power', 'electricmotorpower', 'motor_power', 'motorpower',
          'ev_power', 'evpower', 'electric_power'
        ])) || null,
        
        electric_motor_torque: parseFloat(this.extractField(rawVehicle, [
          'electric_motor_torque', 'electricmotortorque', 'motor_torque', 'motortorque',
          'ev_torque', 'evtorque', 'electric_torque'
        ])) || null,
        
        charging_port_type: this.extractField(rawVehicle, [
          'charging_port_type', 'chargingporttype', 'charge_port', 'chargeport',
          'connector_type', 'connectortype', 'plug_type', 'plugtype'
        ]),
        
        fast_charging_capability: this.extractField(rawVehicle, [
          'fast_charging_capability', 'fastchargingcapability', 'fast_charge_capable',
          'dc_fast_charge', 'rapid_charge_capable'
        ]),
        
        price: parseFloat(this.extractField(rawVehicle, [
          'price', 'asking_price', 'askingprice', 'retail_price', 'retailprice', 'price_eur'
        ])) || null,
        
        status: normalizedStatus,  // ✅ Use normalized status
        
        description: this.extractField(rawVehicle, [
          'description', 'comments', 'notes', 'details', 'advert_text'
        ]) || this.extractFromFeatures(rawVehicle, 'description') || this.extractFromFeatures(rawVehicle, 'notes'),
        
        images: this.extractImages(rawVehicle),
        
        // ── Seller contact information (for dealer feeds) ────────────────────
        seller_name: this.extractField(rawVehicle, [
          'seller_name', 'sellername', 'dealer_name', 'dealername', 'business_name'
        ]),
        
        seller_contact: this.extractField(rawVehicle, [
          'seller_contact', 'sellercontact', 'contact', 'phone', 'telephone', 'mobile'
        ]),
        
        seller_email: this.extractField(rawVehicle, [
          'seller_email', 'selleremail', 'email', 'contact_email'
        ]),
        
        seller_location: this.extractField(rawVehicle, [
          'seller_location', 'sellerlocation', 'location', 'address', 'city'
        ]),
        
        // ── Features (comma-separated string or array) ───────────────────────
        features: this.extractFeatures(rawVehicle),
        
        raw_data: rawVehicle
      };

      // ✅ Enhanced logging for debugging
      console.log(`🔍 [mapVehicle] Vehicle #${index}:`, {
        stock_id: mapped.stock_id,
        registration: mapped.registration,
        vrm: rawVehicle.vrm,
        make: mapped.make,
        model: mapped.model,
        year: mapped.year,
        mileage: mapped.mileage,
        fuel_type: mapped.fuel_type,
        transmission: mapped.transmission,
        colour: mapped.colour,
        body_type: mapped.body_type,
        rawStatus: rawStatus,
        normalizedStatus: mapped.status,
        rawVehicleKeys: Object.keys(rawVehicle),
        hasFeatures: !!rawVehicle.features,
        featuresKeys: rawVehicle.features ? Object.keys(rawVehicle.features) : []
      });

      // Validate minimum required fields
      if (!mapped.make) {
        console.warn(`⚠️  [mapVehicle] Skipping vehicle #${index} - missing make field`);
        console.warn(`   Available fields:`, Object.keys(rawVehicle));
        console.warn(`   Raw vehicle:`, JSON.stringify(rawVehicle, null, 2).substring(0, 500));
        return null;
      }

      return mapped;

    } catch (error) {
      console.error(`❌ [mapVehicle] Error mapping vehicle #${index}:`, error);
      console.error(`   Raw vehicle:`, rawVehicle);
      return null;
    }
  }

  /**
   * Normalize status to match standard values
   */
  normalizeStatus(rawStatus) {
    if (!rawStatus) return 'active'; // Default to active
    
    const status = String(rawStatus).toLowerCase().trim();
    
    // Map various status values to standard ones
    const statusMap = {
      'sold': 'sold',
      'sold out': 'sold',
      'sold_out': 'sold',
      'soldout': 'sold',
      'sale': 'sold',
      'active': 'active',
      'available': 'active',
      'in stock': 'active',
      'instock': 'active',
      'in_stock': 'active',
      'for sale': 'active',
      'forsale': 'active',
      'draft': 'draft',
      'pending': 'draft',
      'archived': 'archived',
      'deleted': 'archived'
    };
    
    const normalized = statusMap[status] || 'active';
    
    console.log(`🔄 [normalizeStatus] "${rawStatus}" → "${normalized}"`);
    
    return normalized;
  }

  /**
   * Normalize fuel type to match Car model enum
   */
  normalizeFuelType(rawFuelType) {
    if (!rawFuelType) return null; // Let API fill missing fuel type

    const fuel = String(rawFuelType).toLowerCase().trim()
      .replace(/[\s_-]+/g, ' '); // normalize spaces/underscores/hyphens

    const fuelTypeMap = {
      // ── Petrol ──────────────────────────────────
      'petrol': 'Petrol',
      'gasoline': 'Petrol',
      'gas': 'Petrol',
      'unleaded': 'Petrol',
      'unl': 'Petrol',

      // ── Diesel ──────────────────────────────────
      'diesel': 'Diesel',
      'derv': 'Diesel',

      // ── Electric ────────────────────────────────
      'electric': 'Electric',
      'ev': 'Electric',
      'bev': 'Electric',
      'battery electric': 'Electric',
      'battery electric vehicle': 'Electric',
      'pure electric': 'Electric',
      'fully electric': 'Electric',
      'all electric': 'Electric',
      'zero emission': 'Electric',
      'zero emissions': 'Electric',
      'electric vehicle': 'Electric',
      'electricity': 'Electric',         // ✅ DVLA value

      // ── Hybrid ──────────────────────────────────
      'hybrid': 'Hybrid',
      'full hybrid': 'Hybrid',
      'self charging hybrid': 'Hybrid',
      'hybrid electric': 'Petrol Hybrid', // ✅ DVLA value
      'electric hybrid': 'Petrol Hybrid',

      // ── Petrol Hybrid ───────────────────────────
      'petrol hybrid': 'Petrol Hybrid',
      'gasoline hybrid': 'Petrol Hybrid',
      'petrol/electric': 'Petrol Hybrid',
      'petrol electric': 'Petrol Hybrid',
      'mhev petrol': 'Petrol Hybrid',
      'petrol mhev': 'Petrol Hybrid',
      'mild hybrid petrol': 'Petrol Hybrid',

      // ── Diesel Hybrid ───────────────────────────
      'diesel hybrid': 'Diesel Hybrid',
      'diesel/electric': 'Diesel Hybrid',
      'diesel electric': 'Diesel Hybrid',
      'mhev diesel': 'Diesel Hybrid',
      'diesel mhev': 'Diesel Hybrid',
      'mild hybrid diesel': 'Diesel Hybrid',

      // ── Plug-in Hybrid ──────────────────────────
      'plug in hybrid': 'Plug-in Hybrid',
      'plugin hybrid': 'Plug-in Hybrid',
      'plug-in hybrid': 'Plug-in Hybrid',
      'phev': 'Plug-in Hybrid',

      // ── Petrol Plug-in Hybrid ───────────────────
      'petrol plug in hybrid': 'Petrol Plug-in Hybrid',
      'petrol plugin hybrid': 'Petrol Plug-in Hybrid',
      'petrol plug-in hybrid': 'Petrol Plug-in Hybrid',
      'petrol phev': 'Petrol Plug-in Hybrid',
      'plug in hybrid petrol': 'Petrol Plug-in Hybrid',
      'phev petrol': 'Petrol Plug-in Hybrid',
      'petrol/electric plug in': 'Petrol Plug-in Hybrid',

      // ── Diesel Plug-in Hybrid ───────────────────
      'diesel plug in hybrid': 'Diesel Plug-in Hybrid',
      'diesel plugin hybrid': 'Diesel Plug-in Hybrid',
      'diesel plug-in hybrid': 'Diesel Plug-in Hybrid',
      'diesel phev': 'Diesel Plug-in Hybrid',
      'plug in hybrid diesel': 'Diesel Plug-in Hybrid',
      'phev diesel': 'Diesel Plug-in Hybrid',
      'diesel/electric plug in': 'Diesel Plug-in Hybrid',

      // ── Hydrogen ────────────────────────────────
      'hydrogen': 'Hydrogen',
      'fuel cell': 'Hydrogen',
      'fcev': 'Hydrogen',
    };

    // Direct map match
    if (fuelTypeMap[fuel]) return fuelTypeMap[fuel];

    // Partial match — covers edge cases like "Petrol (Mild Hybrid)" etc.
    if (fuel.includes('electric') && fuel.includes('diesel')) return 'Diesel Plug-in Hybrid';
    if (fuel.includes('electric') && fuel.includes('petrol')) return 'Petrol Plug-in Hybrid';
    if (fuel.includes('electric') || fuel.includes('electricity')) return 'Electric';
    if (fuel.includes('phev') && fuel.includes('diesel')) return 'Diesel Plug-in Hybrid';
    if (fuel.includes('phev') && fuel.includes('petrol')) return 'Petrol Plug-in Hybrid';
    if (fuel.includes('phev')) return 'Plug-in Hybrid';
    if (fuel.includes('hybrid') && fuel.includes('diesel')) return 'Diesel Hybrid';
    if (fuel.includes('hybrid') && fuel.includes('petrol')) return 'Petrol Hybrid';
    if (fuel.includes('hybrid')) return 'Hybrid';
    if (fuel.includes('diesel')) return 'Diesel';
    if (fuel.includes('petrol') || fuel.includes('gasoline')) return 'Petrol';
    if (fuel.includes('hydrogen') || fuel.includes('fuel cell')) return 'Hydrogen';

    // 🚫 REMOVED DEFAULT "Petrol" - if fuel type is unknown, return null instead
    console.log(`⚠️  [normalizeFuelType] Unknown fuel type: "${rawFuelType}" — returning null (no default)`);
    return null;
  }

  /**
   * Extract field from vehicle using multiple possible field names
   */
  extractField(vehicle, fieldNames) {
    for (const fieldName of fieldNames) {
      const value = this.getNestedProperty(vehicle, fieldName);
      if (value !== undefined && value !== null && value !== '') {
        return String(value).trim();
      }
    }
    return null;
  }

  /**
   * Get nested property (case-insensitive)
   */
  getNestedProperty(obj, path) {
    if (!obj || typeof obj !== 'object') return undefined;

    const keys = Object.keys(obj);
    const lowerPath = path.toLowerCase();
    // Normalize: remove spaces and underscores for flexible matching
    const normalizedPath = lowerPath.replace(/[\s_]/g, '');

    for (const key of keys) {
      // ✅ Exact match (case insensitive)
      if (key.toLowerCase() === lowerPath) {
        return obj[key];
      }
      // ✅ Match ignoring spaces and underscores
      // "fuel type" → "fueltype", "fuel_type" → "fueltype", "FuelType" → "fueltype"
      const normalizedKey = key.toLowerCase().replace(/[\s_]/g, '');
      if (normalizedKey === normalizedPath) {
        return obj[key];
      }
    }

    return undefined;
  }

  /**
   * Extract field from features object (for flexible JSON formats like Gist)
   * Example: { features: { mileage: 18500, color: "White" } }
   */
  extractFromFeatures(vehicle, fieldName) {
    if (!vehicle || !vehicle.features || typeof vehicle.features !== 'object') {
      return null;
    }
    
    const value = this.getNestedProperty(vehicle.features, fieldName);
    if (value !== undefined && value !== null && value !== '') {
      return String(value).trim();
    }
    
    return null;
  }

  /**
   * Extract images from vehicle
   */
  extractImages(vehicle) {
    const images = [];

    // Try common image field structures
    const possibleImageFields = [
      'images', 'image', 'photos', 'photo', 'pictures', 'picture',
      'image_list', 'imagelist', 'media'
    ];

    for (const field of possibleImageFields) {
      const value = this.getNestedProperty(vehicle, field);
      
      if (!value) continue;

      // Handle array of images
      if (Array.isArray(value)) {
        value.forEach((img, index) => {
          const url = typeof img === 'string' ? img : (img.url || img.href || img.src);
          if (url && this.isValidImageUrl(url)) {
            images.push({ url, order: index });
          }
        });
      }
      // Handle nested structure like { image: [...] } or { photo: [...] }
      else if (typeof value === 'object') {
        // Check for nested arrays (common in XML parsing)
        const nestedFields = ['image', 'photo', 'picture', 'url'];
        for (const nestedField of nestedFields) {
          const nestedValue = this.getNestedProperty(value, nestedField);
          if (nestedValue && Array.isArray(nestedValue)) {
            nestedValue.forEach((img, index) => {
              const url = typeof img === 'string' ? img : (img.url || img.href || img.src);
              if (url && this.isValidImageUrl(url)) {
                images.push({ url, order: index });
              }
            });
          } else if (nestedValue && typeof nestedValue === 'string' && this.isValidImageUrl(nestedValue)) {
            images.push({ url: nestedValue, order: 0 });
          }
        }
        
        // If we found images in nested structure, break
        if (images.length > 0) break;
        
        // Check if object has url property directly
        if (value.url && this.isValidImageUrl(value.url)) {
          images.push({ url: value.url, order: 0 });
        }
      }
      // Handle single image string OR comma/semicolon-separated images
      else if (typeof value === 'string') {
        // Check if it's a delimited list of images (comma or semicolon separated)
        if (value.includes(',') || value.includes(';')) {
          // Split by comma or semicolon, trim whitespace
          const delimiter = value.includes(';') ? ';' : ',';
          const urlList = value.split(delimiter).map(url => url.trim()).filter(url => url);
          
          urlList.forEach((url, index) => {
            if (this.isValidImageUrl(url)) {
              images.push({ url, order: index });
            }
          });
        }
        // Single image URL
        else if (this.isValidImageUrl(value)) {
          images.push({ url: value, order: 0 });
        }
      }
      
      // If we found images, stop looking
      if (images.length > 0) break;
    }

    // CSV-specific image handling: look for image_url_1, image_url_2, etc.
    if (images.length === 0) {
      for (let i = 1; i <= 10; i++) {
        const imageUrl = this.getNestedProperty(vehicle, `image_url_${i}`);
        const imageOrder = this.getNestedProperty(vehicle, `image_order_${i}`) || (i - 1);
        
        if (imageUrl && this.isValidImageUrl(imageUrl)) {
          images.push({ url: imageUrl, order: parseInt(imageOrder) });
        }
      }
      
      // Also check for single image_url field
      const singleImageUrl = this.getNestedProperty(vehicle, 'image_url');
      if (singleImageUrl && this.isValidImageUrl(singleImageUrl)) {
        images.push({ url: singleImageUrl, order: 0 });
      }
    }

    // Return null instead of empty array if no images found
    return images.length > 0 ? images : null;
  }

  /**
   * Extract features from vehicle
   */
  extractFeatures(vehicle) {
    // Try common feature field names
    const possibleFeatureFields = [
      'features', 'feature', 'equipment', 'options', 'extras', 'specifications'
    ];

    for (const field of possibleFeatureFields) {
      const value = this.getNestedProperty(vehicle, field);
      
      if (!value) continue;

      // Handle array of features
      if (Array.isArray(value)) {
        return value.filter(f => f && typeof f === 'string' && f.trim() !== '');
      }
      
      // Handle comma-separated string
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) continue;
        
        // Split by comma and clean up
        return trimmed
          .split(',')
          .map(f => f.trim())
          .filter(f => f !== '');
      }
    }

    return null;
  }

  /**
   * Validate image URL
   */
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http')) return false;
    
    const lowerUrl = trimmedUrl.toLowerCase();
    
    // ✅ GOOGLE DRIVE SUPPORT - Accept Drive links (will be converted to direct URLs later)
    if (lowerUrl.includes('drive.google.com/file/d/')) {
      return true;
    }
    
    // Check for common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    
    // Check if URL has image extension
    if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
      return true;
    }
    
    // Check if URL path contains image/photo keywords
    if (lowerUrl.includes('/image') || lowerUrl.includes('/photo')) {
      return true;
    }
    
    // Check for known image hosting domains (Unsplash, Imgur, Cloudinary, etc)
    const imageHosts = [
      'images.unsplash.com',
      'unsplash.com',
      'imgur.com',
      'i.imgur.com',
      'cloudinary.com',
      'res.cloudinary.com',
      'imagekit.io',
      'images.pexels.com',
      'pixabay.com',
      'flickr.com',
      'staticflickr.com',
      'dropbox.com',  // Dropbox shared links
      'amazonaws.com' // AWS S3 links
    ];
    
    if (imageHosts.some(host => lowerUrl.includes(host))) {
      return true;
    }
    
    return false;
  }

  /**
   * Get vehicle count from parsed data
   */
  getVehicleCount(parsedData, format, provider) {
    const vehicles = this.extractVehiclesArray(parsedData, format, provider);
    if (!vehicles) return 0;
    return Array.isArray(vehicles) ? vehicles.length : 1;
  }
}

module.exports = new FeedMapper();
