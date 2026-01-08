const { v4: uuidv4 } = require('uuid');
const Car = require('../models/Car');

/**
 * Create a new advert and save to database immediately
 */
const createAdvert = async (req, res) => {
  try {
    const { vehicleData } = req.body;
    
    if (!vehicleData) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle data is required'
      });
    }
    
    const advertId = uuidv4();
    
    // Log vehicle data to debug registration number
    console.log('📝 Creating advert with vehicle data:', {
      registration: vehicleData.registration,
      registrationNumber: vehicleData.registrationNumber,
      make: vehicleData.make,
      model: vehicleData.model
    });
    
    // Helper function to parse CO2 emissions (removes "g/km" suffix)
    const parseCO2 = (value) => {
      if (!value) return undefined;
      if (typeof value === 'number') return value;
      // Extract number from strings like "143g/km" or "143 g/km"
      const match = value.toString().match(/(\d+)/);
      return match ? parseInt(match[1]) : undefined;
    };

    // Helper function to normalize transmission
    const normalizeTransmission = (value) => {
      if (!value) return 'manual';
      const lower = value.toString().toLowerCase();
      // Map common variations to valid enum values
      if (lower.includes('auto')) return 'automatic';
      if (lower.includes('manual')) return 'manual';
      if (lower.includes('semi')) return 'semi-automatic';
      return 'manual'; // default
    };

    // Create car document in database immediately
    const car = new Car({
      advertId: advertId,
      make: vehicleData.make || 'Unknown',
      model: vehicleData.model || 'Unknown',
      year: vehicleData.year || new Date().getFullYear(),
      mileage: vehicleData.mileage || 0,
      color: vehicleData.color || 'Not specified',
      fuelType: vehicleData.fuelType || 'Petrol',
      transmission: normalizeTransmission(vehicleData.transmission),
      price: vehicleData.estimatedValue || 0,
      description: '',
      images: [],
      registrationNumber: vehicleData.registration || vehicleData.registrationNumber || null,
      engineSize: vehicleData.engineSize ? parseFloat(vehicleData.engineSize) : undefined,
      bodyType: vehicleData.bodyType,
      doors: vehicleData.doors ? parseInt(vehicleData.doors) : undefined,
      seats: vehicleData.seats ? parseInt(vehicleData.seats) : undefined,
      co2Emissions: parseCO2(vehicleData.co2Emissions),
      taxStatus: vehicleData.taxDue,
      motStatus: vehicleData.motDue,
      dataSource: vehicleData.registration ? 'DVLA' : 'manual',
      advertStatus: 'incomplete',
      condition: 'used'
    });
    
    await car.save();
    console.log(`✅ Created car advert in database: ${advertId}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
    
    // Return advert data in expected format
    const advert = {
      id: advertId,
      vehicleData: {
        ...vehicleData,
        estimatedValue: vehicleData.estimatedValue || calculateEstimatedValue(vehicleData)
      },
      advertData: {
        price: vehicleData.estimatedValue || '',
        description: '',
        photos: [],
        contactPhone: '',
        contactEmail: '',
        location: ''
      },
      status: 'incomplete',
      createdAt: car.createdAt
    };
    
    res.status(201).json({
      success: true,
      data: advert
    });
  } catch (error) {
    console.error('Error creating advert:', error);
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
    
    // Find car by advertId
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Advert not found'
      });
    }
    
    // Format response to match expected structure
    const advert = {
      id: car.advertId,
      vehicleData: {
        make: car.make,
        model: car.model,
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
        estimatedValue: car.price,
        motDue: car.motStatus,
        co2Emissions: car.co2Emissions,
        taxStatus: car.taxStatus
      },
      advertData: {
        price: car.price,
        description: car.description,
        photos: car.images.map((url, index) => ({
          id: `photo-${index}`,
          url: url,
          publicId: url.split('/').pop().split('.')[0]
        })),
        contactPhone: car.sellerContact?.phoneNumber || '',
        contactEmail: car.sellerContact?.email || '',
        location: car.sellerContact?.postcode || car.postcode || ''
      },
      status: car.advertStatus,
      createdAt: car.createdAt
    };
    
    res.json({
      success: true,
      data: advert
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
 * Update advert (saves photos and other data to database)
 */
const updateAdvert = async (req, res) => {
  try {
    const { advertId } = req.params;
    const { advertData, vehicleData, contactDetails } = req.body;
    
    console.log(`📝 Updating advert data: ${advertId}`);
    
    // Find car by advertId
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Advert not found'
      });
    }
    
    // Update vehicle data if provided
    if (vehicleData) {
      if (vehicleData.make) car.make = vehicleData.make;
      if (vehicleData.model) car.model = vehicleData.model;
      if (vehicleData.year) car.year = vehicleData.year;
      if (vehicleData.mileage) car.mileage = vehicleData.mileage;
      if (vehicleData.color) car.color = vehicleData.color;
      if (vehicleData.fuelType) car.fuelType = vehicleData.fuelType;
      if (vehicleData.transmission) car.transmission = vehicleData.transmission;
      if (vehicleData.bodyType) car.bodyType = vehicleData.bodyType;
      if (vehicleData.doors) car.doors = vehicleData.doors;
      if (vehicleData.seats) car.seats = vehicleData.seats;
      if (vehicleData.engineSize) car.engineSize = vehicleData.engineSize;
    }
    
    // Update advert data if provided
    if (advertData) {
      if (advertData.price !== undefined) car.price = advertData.price;
      if (advertData.description !== undefined) car.description = advertData.description;
      
      // Update photos - save Cloudinary URLs to database
      if (advertData.photos && Array.isArray(advertData.photos)) {
        console.log(`📸 Saving ${advertData.photos.length} photos to database`);
        car.images = advertData.photos.map(photo => photo.url || photo);
      }
    }
    
    // Update contact details if provided
    if (contactDetails) {
      car.sellerContact = {
        phoneNumber: contactDetails.phoneNumber || car.sellerContact?.phoneNumber,
        email: contactDetails.email || car.sellerContact?.email,
        postcode: contactDetails.postcode || car.sellerContact?.postcode,
        allowEmailContact: contactDetails.allowEmailContact !== undefined 
          ? contactDetails.allowEmailContact 
          : car.sellerContact?.allowEmailContact
      };
      
      // Also update postcode at root level for location searches
      if (contactDetails.postcode) {
        car.postcode = contactDetails.postcode;
      }
    }
    
    // Auto-activate advert if it has all required fields
    const hasImages = car.images && car.images.length > 0;
    const hasContactInfo = car.sellerContact && car.sellerContact.phoneNumber && car.sellerContact.email;
    const hasPrice = car.price && car.price > 0;
    
    if (hasImages && hasContactInfo && hasPrice && car.advertStatus === 'incomplete') {
      car.advertStatus = 'active';
      car.publishedAt = new Date();
      console.log(`✅ Auto-activating advert ${advertId} - all required fields complete`);
    }
    
    await car.save();
    console.log(`✅ Updated advert ${advertId} in database`);
    console.log(`   Photos saved: ${car.images.length}`);
    console.log(`   Status: ${car.advertStatus}`);
    
    // Return updated advert
    const advert = {
      id: advertId,
      vehicleData: vehicleData || {},
      advertData: {
        ...advertData,
        photos: car.images.map((url, index) => ({
          id: `photo-${index}`,
          url: url,
          publicId: url.split('/').pop().split('.')[0]
        }))
      },
      contactDetails: contactDetails || {},
      status: car.advertStatus,
      updatedAt: car.updatedAt
    };
    
    res.json({
      success: true,
      data: advert,
      message: 'Advert updated successfully'
    });
  } catch (error) {
    console.error('Error updating advert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update advert',
      error: error.message
    });
  }
};

/**
 * Publish advert (after payment)
 */
const publishAdvert = async (req, res) => {
  try {
    const { advertId } = req.params;
    const { packageDetails, stripeSessionId, stripePaymentIntentId } = req.body;
    
    // Find car by advertId
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Advert not found'
      });
    }
    
    // Update advertising package details
    if (packageDetails) {
      car.advertisingPackage = {
        packageId: packageDetails.packageId,
        packageName: packageDetails.packageName,
        duration: packageDetails.duration,
        price: packageDetails.price,
        purchaseDate: new Date(),
        expiryDate: calculateExpiryDate(packageDetails.duration),
        stripeSessionId: stripeSessionId,
        stripePaymentIntentId: stripePaymentIntentId
      };
    }
    
    // Update status to active
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
 * Calculate expiry date based on package duration
 */
const calculateExpiryDate = (duration) => {
  const now = new Date();
  
  if (duration.includes('Until sold')) {
    // Set expiry to 1 year from now for "until sold" packages
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }
  
  // Extract weeks from duration string (e.g., "3 weeks" -> 3)
  const weeks = parseInt(duration.match(/\d+/)?.[0] || 4);
  return new Date(now.setDate(now.getDate() + (weeks * 7)));
};

/**
 * Calculate estimated value based on vehicle data
 */
const calculateEstimatedValue = (vehicleData) => {
  // Simple estimation logic (replace with actual valuation API)
  const baseValue = 15000;
  const yearFactor = vehicleData.year ? (2024 - parseInt(vehicleData.year)) * 500 : 0;
  const mileageFactor = vehicleData.mileage ? Math.floor(parseInt(vehicleData.mileage) / 10000) * 300 : 0;
  
  return Math.max(baseValue - yearFactor - mileageFactor, 2000);
};

module.exports = {
  createAdvert,
  getAdvert,
  updateAdvert,
  publishAdvert
};
