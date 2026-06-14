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
    if (format === 'csv') {
      return data; // CSV is already an array of objects
    }

    if (format === 'json') {
      // Try common JSON structures
      return data.vehicles || data.stock || data.cars || data.items || data;
    }

    if (format === 'xml') {
      // Try common XML structures
      if (data.vehicles?.vehicle) return data.vehicles.vehicle;
      if (data.stock?.vehicle) return data.stock.vehicle;
      if (data.cars?.car) return data.cars.car;
      if (data.advertlist?.advert) return data.advertlist.advert;
      
      // Provider-specific
      if (provider === 'MotorDesk' && data.motordesk?.vehicle) {
        return data.motordesk.vehicle;
      }
      
      // Fallback: try to find any array-like structure
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
    }

    return [];
  }

  /**
   * Map single vehicle to internal schema
   */
  mapVehicle(rawVehicle, provider, index) {
    try {
      // Extract raw fuel type
      const rawFuelType = this.extractField(rawVehicle, [
        'fuel_type', 'fueltype', 'fuel', 'engine_type', 'fuel'
      ]);
      
      // Normalize fuel type to match Car model enum
      const fuelType = this.normalizeFuelType(rawFuelType);
      
      const mapped = {
        stock_id: this.extractField(rawVehicle, [
          'stock_id', 'stockid', 'stocknumber', 'stock_number', 'id', 'vehicle_id', 'vehicleid', 'vin'
        ]) || `AUTO_${Date.now()}_${index}`,
        
        registration: this.extractField(rawVehicle, [
          'registration', 'reg', 'vrm', 'regnumber', 'reg_number'
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
        ])) || null,
        
        fuel_type: fuelType,
        
        transmission: this.extractField(rawVehicle, [
          'transmission', 'gearbox', 'trans', 'transmission_type'
        ]),
        
        colour: this.extractField(rawVehicle, [
          'colour', 'color', 'exterior_colour', 'exteriorcolour'
        ]),
        
        price: parseFloat(this.extractField(rawVehicle, [
          'price', 'asking_price', 'askingprice', 'retail_price', 'retailprice', 'price_eur'
        ])) || null,
        
        description: this.extractField(rawVehicle, [
          'description', 'comments', 'notes', 'details', 'advert_text'
        ]),
        
        images: this.extractImages(rawVehicle),
        
        raw_data: rawVehicle
      };

      // Validate minimum required fields
      if (!mapped.stock_id || !mapped.make) {
        return null;
      }

      return mapped;

    } catch (error) {
      console.error('Error mapping vehicle:', error, rawVehicle);
      return null;
    }
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
