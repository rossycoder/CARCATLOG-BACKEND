const { v4: uuidv4 } = require('uuid');
const Car = require('../models/Car');
const CarDataNormalizer = require('../utils/carDataNormalizer'); // Add this import
const DataProtection = require('../utils/dataProtection'); // Add data protection

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
      const trans = normalizedTransmission.toLowerCase().trim();
      // Map common variations to valid enum values
      if (trans.includes('cvt') || trans.includes('automatic') || trans === 'auto') {
        normalizedTransmission = 'automatic';
      } else if (trans.includes('semi') || trans.includes('dsg') || trans.includes('tiptronic')) {
        normalizedTransmission = 'semi-automatic';
      } else if (trans.includes('manual')) {
        normalizedTransmission = 'manual';
      } else {
        normalizedTransmission = 'manual'; // default
      }
    }
    
    // Normalize vehicle data before creating car
    const normalizedVehicleData = CarDataNormalizer.normalizeCarData(vehicleData);
    
    // Create car with enhanced variant handling
    const car = new Car({
      advertId,
      make: normalizedVehicleData.make || 'Unknown',
      model: normalizedVehicleData.model || 'Unknown',
      variant: normalizedVehicleData.variant || null, // Will be auto-fetched in pre-save hook if missing
      year: parseInt(normalizedVehicleData.year) || new Date().getFullYear(),
      mileage: parseInt(normalizedVehicleData.mileage) || 0,
      color: normalizedVehicleData.color || null, // Leave null so API can populate it, frontend will handle display
      fuelType: normalizedVehicleData.fuelType || 'Petrol',
      transmission: normalizedTransmission,
      price: estimatedPrice,
      estimatedValue: estimatedPrice,
      description: '',
      images: [],
      registrationNumber: normalizedVehicleData.registration || normalizedVehicleData.registrationNumber || null,
      engineSize: parseFloat(normalizedVehicleData.engineSize) || undefined,
      bodyType: normalizedVehicleData.bodyType || undefined,
      doors: parseInt(normalizedVehicleData.doors) || undefined,
      seats: parseInt(normalizedVehicleData.seats) || undefined,
      dataSource: normalizedVehicleData.registration ? 'DVLA' : 'manual',
      advertStatus: 'active',
      publishedAt: new Date(),
      condition: 'used',
      postcode: normalizedVehicleData.postcode || undefined
    });
    
    console.log(`🚗 Creating car with registration: ${car.registrationNumber}`);
    console.log(`   Initial variant: ${car.variant || 'NOT SET - will be fetched from API'}`);
    
    await car.save(); // Pre-save hook will automatically fetch variant if missing
    
    console.log(`✅ Car saved with final variant: "${car.variant}"`);
    console.log(`✅ Car saved with displayTitle: "${car.displayTitle}"`);
    console.log(`✅ Car saved: ${advertId}`);
    
    // CRITICAL: Sync MOT data from VehicleHistory to Car model after car is saved
    if (car.registrationNumber) {
      try {
        const VehicleHistory = require('../models/VehicleHistory');
        const history = await VehicleHistory.findOne({ 
          vrm: car.registrationNumber.toUpperCase() 
        }).sort({ checkDate: -1 });
        
        if (history && history.motHistory && history.motHistory.length > 0) {
          console.log(`🔄 Syncing MOT data from VehicleHistory for ${car.registrationNumber}`);
          
          // Normalize MOT history
          const normalizedMotHistory = history.motHistory.map(test => ({
            testDate: test.testDate || test.completedDate || test.date,
            expiryDate: test.expiryDate,
            testResult: test.testResult || test.result || 'PASSED',
            odometerValue: test.odometerValue || test.mileage,
            odometerUnit: (test.odometerUnit || 'MI').toLowerCase(),
            testNumber: test.testNumber,
            testCertificateNumber: test.testCertificateNumber,
            defects: test.defects || [],
            advisoryText: test.advisoryText || [],
            testClass: test.testClass,
            testType: test.testType,
            completedDate: test.completedDate || test.testDate,
            testStation: test.testStation
          })).filter(test => test.testDate);
          
          car.motHistory = normalizedMotHistory;
          
          if (history.motStatus) {
            car.motStatus = history.motStatus;
          }
          
          if (history.motExpiryDate) {
            car.motDue = history.motExpiryDate;
            car.motExpiry = history.motExpiryDate;
          }
          
          car.$locals.skipPreSave = true;
          await car.save();
          
          console.log(`✅ MOT data synced: ${normalizedMotHistory.length} tests, Due: ${car.motDue ? new Date(car.motDue).toDateString() : 'NOT SET'}`);
        } else {
          console.log(`⚠️  No MOT history found in VehicleHistory for ${car.registrationNumber}`);
        }
      } catch (syncError) {
        console.error(`❌ Failed to sync MOT data:`, syncError.message);
        // Don't fail the request - continue without MOT data
      }
    }
    
    res.status(201).json({
      success: true,
      data: {
        id: advertId,
        vehicleData: { 
          ...vehicleData, 
          estimatedValue: estimatedPrice,
          // CRITICAL: Include valuation structure for frontend
          valuation: car.valuation ? {
            privatePrice: car.valuation.privatePrice,
            dealerPrice: car.valuation.dealerPrice,
            partExchangePrice: car.valuation.partExchangePrice
          } : null,
          allValuations: car.valuation ? {
            private: car.valuation.privatePrice,
            retail: car.valuation.dealerPrice,
            trade: car.valuation.partExchangePrice
          } : null,
          // CRITICAL: Include MOT data for frontend
          motDue: car.motDue,
          motExpiry: car.motExpiry,
          motStatus: car.motStatus,
          motHistory: car.motHistory
        },
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
          estimatedValue: privatePrice,
          // CRITICAL: Include MOT data for frontend display
          motDue: car.motDue,
          motExpiry: car.motExpiry,
          motStatus: car.motStatus,
          motHistory: car.motHistory,
          // CRITICAL: Include valuation structure for frontend
          valuation: car.valuation ? {
            privatePrice: car.valuation.privatePrice,
            dealerPrice: car.valuation.dealerPrice,
            partExchangePrice: car.valuation.partExchangePrice
          } : null,
          allValuations: car.valuation ? {
            private: car.valuation.privatePrice,
            retail: car.valuation.dealerPrice,
            trade: car.valuation.partExchangePrice
          } : null
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
          
          // CRITICAL FIX: Handle estimatedValue conversion from object to number
          if (cleanVehicleData.estimatedValue && typeof cleanVehicleData.estimatedValue === 'object') {
            // If estimatedValue is an object, extract the private price
            if (cleanVehicleData.estimatedValue.private) {
              cleanVehicleData.estimatedValue = cleanVehicleData.estimatedValue.private;
              console.log('🔧 [updateAdvert] Converted estimatedValue object to number:', cleanVehicleData.estimatedValue);
            } else if (cleanVehicleData.estimatedValue.retail) {
              cleanVehicleData.estimatedValue = cleanVehicleData.estimatedValue.retail;
              console.log('🔧 [updateAdvert] Converted estimatedValue object to number (retail):', cleanVehicleData.estimatedValue);
            } else {
              // If object is empty or has no valid prices, remove it
              delete cleanVehicleData.estimatedValue;
              console.log('🔧 [updateAdvert] Removed empty estimatedValue object');
            }
          }
          
          // CRITICAL FIX: Handle allValuations - this should not be saved to Car model
          if (cleanVehicleData.allValuations) {
            delete cleanVehicleData.allValuations;
            console.log('🔧 [updateAdvert] Removed allValuations (not part of Car schema)');
          }
          
          // Handle MOT date updates
          if (cleanVehicleData.motDue) {
            updateObj.motDue = new Date(cleanVehicleData.motDue);
            updateObj.motExpiry = new Date(cleanVehicleData.motDue);
            console.log('📝 [updateAdvert] Updating MOT date:', cleanVehicleData.motDue);
            
            // Mark as user-edited
            DataProtection.markAsUserEdited(car, 'motDue');
            DataProtection.markAsUserEdited(car, 'motExpiry');
            if (!updateObj.userEditedFields) updateObj.userEditedFields = car.userEditedFields || [];
            if (!updateObj.userEditedFields.includes('motDue')) updateObj.userEditedFields.push('motDue');
            if (!updateObj.userEditedFields.includes('motExpiry')) updateObj.userEditedFields.push('motExpiry');
          }
          
          // Handle seats updates
          if (cleanVehicleData.seats) {
            updateObj.seats = parseInt(cleanVehicleData.seats);
            console.log('📝 [updateAdvert] Updating seats:', cleanVehicleData.seats);
            
            // Mark as user-edited
            DataProtection.markAsUserEdited(car, 'seats');
            if (!updateObj.userEditedFields) updateObj.userEditedFields = car.userEditedFields || [];
            if (!updateObj.userEditedFields.includes('seats')) updateObj.userEditedFields.push('seats');
          }
          
          // Handle service history updates
          if (cleanVehicleData.serviceHistory) {
            updateObj.serviceHistory = cleanVehicleData.serviceHistory;
            console.log('📝 [updateAdvert] Updating serviceHistory from vehicleData:', cleanVehicleData.serviceHistory);
            
            // Mark as user-edited
            DataProtection.markAsUserEdited(car, 'serviceHistory');
            if (!updateObj.userEditedFields) updateObj.userEditedFields = car.userEditedFields || [];
            if (!updateObj.userEditedFields.includes('serviceHistory')) updateObj.userEditedFields.push('serviceHistory');
          }
          
          // Handle fuel type updates
          if (cleanVehicleData.fuelType) {
            updateObj.fuelType = cleanVehicleData.fuelType;
            console.log('📝 [updateAdvert] Updating fuelType:', cleanVehicleData.fuelType);
            
            // Mark as user-edited
            DataProtection.markAsUserEdited(car, 'fuelType');
            if (!updateObj.userEditedFields) updateObj.userEditedFields = car.userEditedFields || [];
            if (!updateObj.userEditedFields.includes('fuelType')) updateObj.userEditedFields.push('fuelType');
          }
          
          // Handle color updates
          if (cleanVehicleData.color) {
            updateObj.color = cleanVehicleData.color;
            console.log('📝 [updateAdvert] Updating color:', cleanVehicleData.color);
            
            // Mark as user-edited
            DataProtection.markAsUserEdited(car, 'color');
            if (!updateObj.userEditedFields) updateObj.userEditedFields = car.userEditedFields || [];
            if (!updateObj.userEditedFields.includes('color')) updateObj.userEditedFields.push('color');
          }
          
          Object.assign(updateObj, cleanVehicleData);
        }
        
        // Update advert data
        if (advertData) {
          console.log('📝 [updateAdvert] Updating advert data');
          if (advertData.price) {
            const priceValue = parseFloat(advertData.price);
            if (!isNaN(priceValue) && priceValue > 0) {
              updateObj.price = priceValue;
              console.log('📝 [updateAdvert] Updating price:', priceValue);
            } else {
              console.log('⚠️ [updateAdvert] Invalid price value, skipping:', advertData.price);
            }
          }
          if (advertData.hasOwnProperty('description')) {
            // CRITICAL FIX: Handle description based on dataSource
            let description = advertData.description || '';
            
            // Check if description is required (non-DVLA cars require description)
            const isDescriptionRequired = car.dataSource !== 'DVLA';
            
            if (!description.trim() && isDescriptionRequired) {
              // For non-DVLA cars, description is required - use default
              description = 'No description provided.';
              console.log('📝 [updateAdvert] Empty description for non-DVLA car, using default');
            } else if (!description.trim() && !isDescriptionRequired) {
              // For DVLA cars, description is optional - but Mongoose validation might fail with empty string
              // So we use a minimal description instead
              description = 'Contact seller for more details.';
              console.log('📝 [updateAdvert] Empty description for DVLA car, using minimal default');
            }
            
            updateObj.description = description;
            console.log('📝 [updateAdvert] Updating description:', `"${description.substring(0, 50)}..."`);
          }
          if (advertData.photos) updateObj.images = advertData.photos.map(p => p.url || p);
          if (advertData.features) {
            console.log('📝 [updateAdvert] Updating features:', advertData.features);
            updateObj.features = advertData.features;
          }
          if (advertData.hasOwnProperty('videoUrl')) {
            updateObj.videoUrl = advertData.videoUrl || '';
            console.log('📝 [updateAdvert] Updating videoUrl:', advertData.videoUrl);
          }
          if (advertData.hasOwnProperty('serviceHistory')) {
            updateObj.serviceHistory = advertData.serviceHistory;
            console.log('📝 [updateAdvert] Updating serviceHistory:', advertData.serviceHistory);
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
        
        // CRITICAL: Also update VehicleHistory if it exists and we're updating service history, MOT, or seats
        if (car.historyCheckId && (updateObj.serviceHistory || updateObj.motDue || updateObj.seats || updateObj.fuelType)) {
          try {
            const VehicleHistory = require('../models/VehicleHistory');
            const historyUpdate = {};
            
            if (updateObj.serviceHistory) {
              historyUpdate.serviceHistory = updateObj.serviceHistory;
              console.log('📝 [updateAdvert] Updating VehicleHistory serviceHistory:', updateObj.serviceHistory);
            }
            
            if (updateObj.motDue) {
              historyUpdate.motExpiryDate = updateObj.motDue;
              console.log('📝 [updateAdvert] Updating VehicleHistory motExpiryDate:', updateObj.motDue);
            }
            
            if (updateObj.seats) {
              historyUpdate.seats = updateObj.seats;
              console.log('📝 [updateAdvert] Updating VehicleHistory seats:', updateObj.seats);
            }
            
            if (updateObj.fuelType) {
              historyUpdate.fuelType = updateObj.fuelType;
              console.log('📝 [updateAdvert] Updating VehicleHistory fuelType:', updateObj.fuelType);
            }
            
            await VehicleHistory.findByIdAndUpdate(
              car.historyCheckId,
              { $set: historyUpdate },
              { runValidators: true }
            );
            
            console.log('✅ [updateAdvert] VehicleHistory updated successfully');
          } catch (historyError) {
            console.error('⚠️ [updateAdvert] Failed to update VehicleHistory:', historyError.message);
            // Don't fail the whole operation if VehicleHistory update fails
          }
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
