const { v4: uuidv4 } = require('uuid');
const Car = require('../models/Car');

/**
 * Create a new advert - SIMPLIFIED VERSION
 */
const createAdvert = async (req, res) => {
  try {
    console.log('📝 [createAdvert] Request received');
    
    const { vehicleData } = req.body;
    
    if (!vehicleData) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle data is required'
      });
    }
    
    const advertId = uuidv4();
    console.log(`📝 Creating advert: ${advertId}`);
    
    // Calculate price with fallback
    let estimatedPrice = 10000;
    
    if (vehicleData.privatePrice) {
      estimatedPrice = vehicleData.privatePrice;
    } else if (vehicleData.estimatedValue) {
      if (typeof vehicleData.estimatedValue === 'object') {
        estimatedPrice = vehicleData.estimatedValue.private || 
                        vehicleData.estimatedValue.retail || 
                        vehicleData.estimatedValue.trade || 10000;
      } else {
        estimatedPrice = vehicleData.estimatedValue;
      }
    }
    
    // Normalize transmission value to match enum
    let normalizedTransmission = vehicleData.transmission || 'manual';
    if (normalizedTransmission) {
      normalizedTransmission = normalizedTransmission.toLowerCase().replace(/\s+/g, '-');
      // Map common variations
      if (normalizedTransmission === 'semi-automatic' || normalizedTransmission === 'semiautomatic') {
        normalizedTransmission = 'semi-automatic';
      } else if (normalizedTransmission === 'auto') {
        normalizedTransmission = 'automatic';
      }
    }
    
    // Create car with enhanced variant handling
    const car = new Car({
      advertId,
      make: vehicleData.make || 'Unknown',
      model: vehicleData.model || 'Unknown',
      variant: vehicleData.variant || null, // Will be auto-fetched in pre-save hook if missing
      year: parseInt(vehicleData.year) || new Date().getFullYear(),
      mileage: parseInt(vehicleData.mileage) || 0,
      color: vehicleData.color || 'Not specified',
      fuelType: vehicleData.fuelType || 'Petrol',
      transmission: normalizedTransmission,
      price: estimatedPrice,
      estimatedValue: estimatedPrice,
      description: '',
      images: [],
      registrationNumber: vehicleData.registration || vehicleData.registrationNumber || null,
      engineSize: parseFloat(vehicleData.engineSize) || undefined,
      bodyType: vehicleData.bodyType || undefined,
      doors: parseInt(vehicleData.doors) || undefined,
      seats: parseInt(vehicleData.seats) || undefined,
      dataSource: vehicleData.registration ? 'DVLA' : 'manual',
      advertStatus: 'active',
      publishedAt: new Date(),
      condition: 'used',
      postcode: vehicleData.postcode || undefined
    });
    
    console.log(`🚗 Creating car with registration: ${car.registrationNumber}`);
    console.log(`   Initial variant: ${car.variant || 'NOT SET - will be fetched from API'}`);
    
    await car.save(); // Pre-save hook will automatically fetch variant if missing
    
    console.log(`✅ Car saved with final variant: "${car.variant}"`);
    console.log(`✅ Car saved with displayTitle: "${car.displayTitle}"`);
    console.log(`✅ Car saved: ${advertId}`);
    
    res.status(201).json({
      success: true,
      data: {
        id: advertId,
        vehicleData: { ...vehicleData, estimatedValue: estimatedPrice },
        advertData: {
          price: estimatedPrice,
          description: '',
          photos: [],
          contactPhone: '',
          contactEmail: '',
          location: ''
        },
        status: 'incomplete',
        createdAt: car.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create advert',
      error: error.message
    });
  }
};

/**
 * Get advert by ID
 */
const getAdvert = async (req, res) => {
  try {
    const { advertId } = req.params;
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Advert not found'
      });
    }
    
    const privatePrice = car.valuation?.privatePrice || car.price || car.estimatedValue || 0;
    
    res.json({
      success: true,
      data: {
        id: car.advertId,
        vehicleData: {
          make: car.make,
          model: car.model,
          variant: car.variant,
          year: car.year,
          mileage: car.mileage,
          color: car.color,
          fuelType: car.fuelType,
          transmission: car.transmission,
          registrationNumber: car.registrationNumber,
          engineSize: car.engineSize,
          bodyType: car.bodyType,
          doors: car.doors,
          seats: car.seats,
          estimatedValue: privatePrice
        },
        advertData: {
          price: privatePrice,
          description: car.description,
          photos: car.images.map((url, index) => ({
            id: `photo-${index}`,
            url: url
          })),
          contactPhone: car.sellerContact?.phoneNumber || '',
          contactEmail: car.sellerContact?.email || '',
          location: car.postcode || ''
        },
        status: car.advertStatus,
        createdAt: car.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching advert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advert'
    });
  }
};

/**
 * Update advert
 */
const updateAdvert = async (req, res) => {
  try {
    console.log('📝 [updateAdvert] Request received');
    console.log('📝 [updateAdvert] Params:', req.params);
    console.log('📝 [updateAdvert] Body keys:', Object.keys(req.body));
    
    const { advertId } = req.params;
    const { advertData, vehicleData, contactDetails } = req.body;
    
    // Use findOneAndUpdate with retry logic to handle version conflicts
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        // Refresh car document for each attempt to get latest version
        let car;
        if (/^[0-9a-fA-F]{24}$/.test(advertId)) {
          car = await Car.findById(advertId);
        } else {
          car = await Car.findOne({ advertId });
        }
        
        if (!car) {
          console.log('❌ [updateAdvert] Car not found:', advertId);
          return res.status(404).json({
            success: false,
            message: 'Advert not found'
          });
        }
        
        console.log(`✅ [updateAdvert] Car found (attempt ${attempt + 1}):`, car.advertId);
        console.log(`📊 [updateAdvert] Current car version: ${car.__v}`);
        console.log(`📊 [updateAdvert] Request data:`, {
          hasAdvertData: !!advertData,
          hasVehicleData: !!vehicleData,
          hasContactDetails: !!contactDetails,
          advertDataKeys: advertData ? Object.keys(advertData) : [],
          vehicleDataKeys: vehicleData ? Object.keys(vehicleData) : [],
          contactDetailsKeys: contactDetails ? Object.keys(contactDetails) : []
        });
        
        // Build update object instead of modifying the document directly
        const updateObj = {};
        
        // Update vehicle data (exclude version field to avoid conflicts)
        if (vehicleData) {
          console.log('📝 [updateAdvert] Updating vehicle data');
          const { __v, _id, createdAt, updatedAt, ...cleanVehicleData } = vehicleData;
          Object.assign(updateObj, cleanVehicleData);
        }
        
        // Update advert data
        if (advertData) {
          console.log('📝 [updateAdvert] Updating advert data');
          if (advertData.price) updateObj.price = parseFloat(advertData.price);
          if (advertData.hasOwnProperty('description')) {
            // Handle description explicitly, including empty strings
            // If description is empty and car requires description, provide a default
            let description = advertData.description || '';
            if (!description && car.dataSource !== 'DVLA') {
              description = 'No description provided.';
              console.log('📝 [updateAdvert] Empty description provided for non-DVLA car, using default');
            }
            updateObj.description = description;
            console.log('📝 [updateAdvert] Updating description:', `"${description}"`);
          }
          if (advertData.photos) updateObj.images = advertData.photos.map(p => p.url || p);
          if (advertData.features) {
            console.log('📝 [updateAdvert] Updating features:', advertData.features);
            updateObj.features = advertData.features;
          }
        }
        
        // Update contact details
        if (contactDetails) {
          console.log('📝 [updateAdvert] Updating contact details');
          updateObj.sellerContact = {
            phoneNumber: contactDetails.phoneNumber,
            email: contactDetails.email,
            postcode: contactDetails.postcode,
            allowEmailContact: contactDetails.allowEmailContact
          };
          if (contactDetails.postcode) updateObj.postcode = contactDetails.postcode;
        }
        
        // Auto-activate if complete
        const hasImages = (updateObj.images || car.images) && (updateObj.images || car.images).length > 0;
        const hasContact = (updateObj.sellerContact || car.sellerContact)?.phoneNumber && 
                          (updateObj.sellerContact || car.sellerContact)?.email;
        const hasPrice = (updateObj.price || car.price) > 0;
        
        if (hasImages && hasContact && hasPrice && car.advertStatus === 'incomplete') {
          updateObj.advertStatus = 'active';
          updateObj.publishedAt = new Date();
        }
        
        console.log('💾 [updateAdvert] Using findOneAndUpdate to avoid version conflicts...');
        
        // Remove any MongoDB internal fields that might cause conflicts
        const mongoInternalFields = ['__v', '_id', 'createdAt', 'updatedAt'];
        mongoInternalFields.forEach(field => {
          if (updateObj.hasOwnProperty(field)) {
            console.log(`⚠️ [updateAdvert] Removing internal field: ${field}`);
            delete updateObj[field];
          }
        });
        
        console.log('💾 [updateAdvert] Update object keys:', Object.keys(updateObj));
        console.log('💾 [updateAdvert] Query:', { _id: car._id, __v: car.__v });
        
        // Use findOneAndUpdate with the current version to handle concurrency
        const updatedCar = await Car.findOneAndUpdate(
          { 
            _id: car._id,
            __v: car.__v  // Include version in query to handle optimistic concurrency
          },
          { 
            $set: updateObj,
            $inc: { __v: 1 }  // Increment version
          },
          { 
            new: true,  // Return updated document
            runValidators: true,  // Run schema validators
            context: 'query'  // Set validation context to 'query' for proper 'this' binding
          }
        );
        
        console.log('💾 [updateAdvert] findOneAndUpdate result:', !!updatedCar);
        
        if (!updatedCar) {
          // Document was modified by another process, retry
          console.log(`⚠️ [updateAdvert] Version conflict on attempt ${attempt + 1}, retrying...`);
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
          continue;
        }
        
        console.log('✅ [updateAdvert] Car updated successfully');
        
        return res.json({
          success: true,
          data: {
            id: advertId,
            status: updatedCar.advertStatus
          },
          message: 'Advert updated successfully'
        });
        
      } catch (error) {
        console.error(`❌ [updateAdvert] Error on attempt ${attempt + 1}:`, error.message);
        
        if (error.name === 'VersionError' && attempt < maxRetries - 1) {
          console.log(`⚠️ [updateAdvert] Version error on attempt ${attempt + 1}, retrying...`);
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
          continue;
        }
        
        if (error.name === 'MongoServerError' && error.code === 11000 && attempt < maxRetries - 1) {
          console.log(`⚠️ [updateAdvert] Duplicate key error on attempt ${attempt + 1}, retrying...`);
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
          continue;
        }
        
        if (error.message && error.message.includes('version') && attempt < maxRetries - 1) {
          console.log(`⚠️ [updateAdvert] Version-related error on attempt ${attempt + 1}, retrying...`);
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
          continue;
        }
        
        throw error; // Re-throw if not a retryable error or max retries reached
      }
    }
    
    // If we get here, all retries failed
    throw new Error('Failed to update after multiple attempts due to concurrent modifications');
    
  } catch (error) {
    console.error('❌ [updateAdvert] Error updating advert:', error);
    console.error('❌ [updateAdvert] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update advert',
      error: error.message
    });
  }
};

/**
 * Publish advert
 */
const publishAdvert = async (req, res) => {
  try {
    const { advertId } = req.params;
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Advert not found'
      });
    }
    
    car.advertStatus = 'active';
    car.publishedAt = new Date();
    await car.save();
    
    res.json({
      success: true,
      data: {
        id: car.advertId,
        status: car.advertStatus,
        publishedAt: car.publishedAt
      },
      message: 'Advert published successfully'
    });
  } catch (error) {
    console.error('Error publishing advert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish advert'
    });
  }
};

/**
 * Delete an advert with automatic cleanup of Vehicle History
 */
const deleteAdvert = async (req, res) => {
  try {
    console.log('🗑️ [deleteAdvert] Request received');
    
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Car ID is required'
      });
    }
    
    console.log(`🗑️ [deleteAdvert] Deleting car: ${id}`);
    
    // Use the safe delete method from Car model
    const result = await Car.deleteCarWithCleanup(id);
    
    if (result.success) {
      console.log('✅ [deleteAdvert] Car and associated data deleted successfully');
      
      return res.status(200).json({
        success: true,
        message: 'Car and associated data deleted successfully',
        data: {
          deletedCarId: id,
          deletedCar: result.deletedCar
        }
      });
    } else {
      console.error('❌ [deleteAdvert] Delete failed:', result.error);
      
      return res.status(404).json({
        success: false,
        message: result.error || 'Car not found'
      });
    }
    
  } catch (error) {
    console.error('❌ [deleteAdvert] Error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to delete advert'
    });
  }
};

module.exports = {
  createAdvert,
  getAdvert,
  updateAdvert,
  publishAdvert,
  deleteAdvert
};
