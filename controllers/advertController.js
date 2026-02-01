const { v4: uuidv4 } = require('uuid');
const Car = require('../models/Car');

/**
 * Create a new advert - SIMPLIFIED VERSION
 */
const createAdvert = async (req, res) => {
  try {
    console.log('📝 [createAdvert] Request received');
    
    const { vehicleData } = req.body;
    const user = req.user; // From authentication middleware
    const dealer = req.dealer; // From trade dealer auth middleware
    
    console.log('👤 User:', user ? user.email : 'Not authenticated');
    console.log('🏢 Dealer:', dealer ? dealer.businessName : 'Not a dealer');
    
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
    
    // Create car
    const car = new Car({
      advertId,
      make: vehicleData.make || 'Unknown',
      model: vehicleData.model || 'Unknown',
      variant: vehicleData.variant || null,
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
      postcode: vehicleData.postcode || undefined,
      // Set user/dealer information
      userId: user ? user._id : undefined,
      dealerId: dealer ? dealer._id : undefined,
      isDealerListing: !!dealer,
      // Set seller contact information
      sellerContact: {
        type: dealer ? 'trade' : 'private',
        email: user ? user.email : undefined,
        phoneNumber: user ? user.phoneNumber : undefined,
        postcode: vehicleData.postcode || undefined,
        // Trade dealer specific fields
        businessName: dealer ? dealer.businessName : undefined,
        tradingName: dealer ? dealer.tradingName : undefined,
        city: dealer ? dealer.city : undefined,
        logo: dealer ? dealer.logo : undefined
      }
    });
    
    await car.save();
    console.log(`✅ Car saved: ${advertId}`);
    console.log(`   User ID: ${car.userId || 'NOT SET'}`);
    console.log(`   Dealer ID: ${car.dealerId || 'NOT SET'}`);
    console.log(`   Seller Email: ${car.sellerContact?.email || 'NOT SET'}`);
    
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
    const { advertId } = req.params;
    const { advertData, vehicleData, contactDetails } = req.body;
    
    let car;
    if (/^[0-9a-fA-F]{24}$/.test(advertId)) {
      car = await Car.findById(advertId);
    } else {
      car = await Car.findOne({ advertId });
    }
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Advert not found'
      });
    }
    
    // Update vehicle data
    if (vehicleData) {
      Object.assign(car, vehicleData);
    }
    
    // Update advert data
    if (advertData) {
      if (advertData.price) car.price = parseFloat(advertData.price);
      if (advertData.description) car.description = advertData.description;
      if (advertData.photos) car.images = advertData.photos.map(p => p.url || p);
      if (advertData.features) car.features = advertData.features;
    }
    
    // Update contact details
    if (contactDetails) {
      car.sellerContact = {
        phoneNumber: contactDetails.phoneNumber,
        email: contactDetails.email,
        postcode: contactDetails.postcode,
        allowEmailContact: contactDetails.allowEmailContact
      };
      if (contactDetails.postcode) car.postcode = contactDetails.postcode;
    }
    
    // Auto-activate if complete
    const hasImages = car.images && car.images.length > 0;
    const hasContact = car.sellerContact?.phoneNumber && car.sellerContact?.email;
    const hasPrice = car.price > 0;
    
    if (hasImages && hasContact && hasPrice && car.advertStatus === 'incomplete') {
      car.advertStatus = 'active';
      car.publishedAt = new Date();
    }
    
    await car.save();
    
    res.json({
      success: true,
      data: {
        id: advertId,
        status: car.advertStatus
      },
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

module.exports = {
  createAdvert,
  getAdvert,
  updateAdvert,
  publishAdvert
};
