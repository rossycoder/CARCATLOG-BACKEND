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
      
      // ── Step 2: Known wrapper keys try karo ───────────────────────────────
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
        'fuel_type', 'fueltype', 'fuel', 'engine_type'
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
          'derivative', 'variant', 'trim', 'version', 'description', 'variant_name'
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
        
        price: parseFloat(this.extractField(rawVehicle, [
          'price', 'asking_price', 'askingprice', 'retail_price', 'retailprice', 'price_eur'
        ])) || null,
        
        status: normalizedStatus,  // ✅ Use normalized status
        
        description: this.extractField(rawVehicle, [
          'description', 'comments', 'notes', 'details', 'advert_text'
        ]) || this.extractFromFeatures(rawVehicle, 'description') || this.extractFromFeatures(rawVehicle, 'notes'),
        
        images: this.extractImages(rawVehicle),
        
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
    if (!rawFuelType) return 'Petrol'; // Default
    
    const fuel = String(rawFuelType).toLowerCase().trim();
    
    // Map common variants to Car model enum values
    const fuelTypeMap = {
      'petrol': 'Petrol',
      'gasoline': 'Petrol',
      'gas': 'Petrol',
      'diesel': 'Diesel',
      'electric': 'Electric',
      'ev': 'Electric',
      'hybrid': 'Hybrid',
      'petrol hybrid': 'Petrol Hybrid',
      'gasoline hybrid': 'Petrol Hybrid',
      'diesel hybrid': 'Diesel Hybrid',
      'plug-in hybrid': 'Plug-in Hybrid',
      'plugin hybrid': 'Plug-in Hybrid',
      'phev': 'Plug-in Hybrid',
      'petrol plug-in hybrid': 'Petrol Plug-in Hybrid',
      'petrol plugin hybrid': 'Petrol Plug-in Hybrid',
      'diesel plug-in hybrid': 'Diesel Plug-in Hybrid',
      'diesel plugin hybrid': 'Diesel Plug-in Hybrid'
    };
    
    return fuelTypeMap[fuel] || 'Petrol'; // Default to Petrol if not found
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

    for (const key of keys) {
      if (key.toLowerCase() === lowerPath) {
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
      // Handle single image string
      else if (typeof value === 'string' && this.isValidImageUrl(value)) {
        images.push({ url: value, order: 0 });
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
   * Validate image URL
   */
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http')) return false;
    
    // Check for common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerUrl = trimmedUrl.toLowerCase();
    
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
      'staticflickr.com'
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
