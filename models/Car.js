const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  make: {
    type: String,
    required: function() {
      return this.dataSource !== 'DVLA' || this.dataSources?.checkCarDetails === true;
    },
    trim: true
  },
  model: {
    type: String,
    required: function() {
      return this.dataSource !== 'DVLA' || this.dataSources?.checkCarDetails === true;
    },
    trim: true
  },
  submodel: { type: String, trim: true, index: true },
  variant: { type: String, trim: true, index: true },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1900, 'Year must be 1900 or later'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  price: {
    type: Number,
    required: function() { return this.dataSource !== 'DVLA'; },
    min: [0, 'Price must be positive']
  },
  estimatedValue: { type: Number, min: [0, 'Estimated value must be positive'] },
  mileage: {
    type: Number,
    required: [true, 'Mileage is required'],
    min: [0, 'Mileage must be positive']
  },
  color: {
    type: String,
    required: function() {
      return this.dataSource === 'manual' && !this.dataSources?.checkCarDetails;
    },
    trim: true
  },
  transmission: {
    type: String,
    required: function() {
      return this.dataSource === 'manual' && !this.dataSources?.checkCarDetails;
    },
    enum: ['automatic', 'manual', 'semi-automatic']
  },
  driveType: { type: String, trim: true, enum: ['FWD', 'RWD', 'AWD', '4WD', null] },
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Petrol Hybrid', 'Diesel Hybrid', 'Plug-in Hybrid', 'Petrol Plug-in Hybrid', 'Diesel Plug-in Hybrid']
  },
  description: {
    type: String,
    required: function() { return this.dataSource !== 'DVLA'; },
    trim: true
  },
  images: {
    type: [{ type: String, trim: true }],
    validate: {
      validator: function(images) { return images.length <= 100; },
      message: 'Maximum 100 images allowed per vehicle'
    }
  },
  postcode: {
    type: String,
    required: function() { return this.dataSource !== 'DVLA'; },
    trim: true,
    uppercase: true
  },
  locationName: { type: String, trim: true },
  latitude: { type: Number, min: -90, max: 90 },
  longitude: { type: Number, min: -180, max: 180 },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  condition: { type: String, enum: ['new', 'used'], default: 'used' },
  vehicleType: { type: String, enum: ['car', 'bike', 'van'], default: 'car', index: true },
  engineCC: { type: Number, min: 0 },
  bikeType: {
    type: String,
    enum: ['Sport', 'Cruiser', 'Adventure', 'Touring', 'Naked', 'Scooter', 'Off-road', 'Classic', 'Other'],
    trim: true
  },
  bodyType: { type: String, trim: true },
  doors: { type: Number, min: 2, max: 5 },
  seats: { type: Number, min: 2, max: 9 },
  engineSize: { type: Number, min: 0 },
  registrationNumber: { type: String, trim: true, uppercase: true, sparse: true },
  displayTitle: { type: String, trim: true },
  dataSource: { type: String, enum: ['DVLA', 'manual'], default: 'manual' },
  co2Emissions: { type: Number, min: 0 },
  emissionClass: { type: String, trim: true },
  taxStatus: { type: String, trim: true },
  motStatus: { type: String, trim: true },
  motDue: { type: Date },
  motExpiry: { type: Date },
  motHistory: [{
    testDate: { type: Date, required: true },
    expiryDate: { type: Date },
    testResult: { type: String, enum: ['PASSED', 'FAILED', 'REFUSED'], required: true },
    odometerValue: { type: Number, min: 0 },
    odometerUnit: { type: String, enum: ['mi', 'km'], default: 'mi' },
    testNumber: { type: String, trim: true },
    testCertificateNumber: { type: String, trim: true },
    defects: [{
      type: { type: String, enum: ['ADVISORY', 'MINOR', 'MAJOR', 'DANGEROUS', 'FAIL', 'PRS', 'USER ENTERED'] },
      text: String,
      dangerous: { type: Boolean, default: false }
    }],
    advisoryText: [String],
    testClass: { type: String, trim: true },
    testType: { type: String, trim: true },
    completedDate: { type: Date },
    testStation: { name: String, number: String, address: String, postcode: String }
  }],
  dvlaLastUpdated: { type: Date },
  historyCheckStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'not_required'],
    default: 'pending'
  },
  historyCheckDate: { type: Date },
  historyCheckId: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleHistory' },
  sellerContact: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      type: 'private',
      allowEmailContact: false,
      reviewCount: 0,
      stats: { carsInStock: 0, yearsInBusiness: 0 }
    }
  },
  advertisingPackage: {
    packageId: { type: String, enum: ['bronze', 'silver', 'gold'] },
    packageName: String,
    duration: String,
    price: Number,
    purchaseDate: Date,
    expiryDate: Date,
    stripeSessionId: String,
    stripePaymentIntentId: String
  },
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'TradeDealer', index: true },
  isDealerListing: { type: Boolean, default: false, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  viewCount: { type: Number, default: 0, min: 0 },
  uniqueViewCount: { type: Number, default: 0, min: 0 },
  lastViewedAt: { type: Date },
  inquiryCount: { type: Number, default: 0, min: 0 },
  lastInquiryAt: { type: Date },
  features: { type: [String], default: [] },
  serviceHistory: {
    type: String,
    enum: ['Contact seller', 'Full service history', 'Partial service history', 'No service history'],
    default: 'Contact seller'
  },
  runningCosts: {
    fuelEconomy: {
      urban: { type: Number, default: null },
      extraUrban: { type: Number, default: null },
      combined: { type: Number, default: null }
    },
    co2Emissions: { type: Number, default: null },
    insuranceGroup: { type: String, default: null },
    annualTax: { type: Number, default: null },
    electricRange: { type: Number, default: null },
    chargingTime: { type: Number, default: null },
    batteryCapacity: { type: Number, default: null },
    homeChargingSpeed: { type: Number, default: null },
    publicChargingSpeed: { type: Number, default: null },
    rapidChargingSpeed: { type: Number, default: null },
    chargingTime10to80: { type: Number, default: null },
    electricMotorPower: { type: Number, default: null },
    electricMotorTorque: { type: Number, default: null },
    chargingPortType: { type: String, default: null },
    fastChargingCapability: { type: String, default: null }
  },
  fuelEconomyUrban: { type: Number, default: null },
  fuelEconomyExtraUrban: { type: Number, default: null },
  fuelEconomyCombined: { type: Number, default: null },
  insuranceGroup: { type: String, default: null },
  annualTax: { type: Number, default: null },
  electricRange: { type: Number, default: null },
  chargingTime: { type: Number, default: null },
  batteryCapacity: { type: Number, default: null },
  homeChargingSpeed: { type: Number, default: null },
  publicChargingSpeed: { type: Number, default: null },
  rapidChargingSpeed: { type: Number, default: null },
  chargingTime10to80: { type: Number, default: null },
  electricMotorPower: { type: Number, default: null },
  electricMotorTorque: { type: Number, default: null },
  chargingPortType: { type: String, default: null },
  fastChargingCapability: { type: String, default: null },
  performance: {
    power: { type: Number, default: null },
    torque: { type: Number, default: null },
    acceleration: { type: Number, default: null },
    topSpeed: { type: Number, default: null }
  },
  valuation: {
    dealerPrice: { type: Number, default: null },
    privatePrice: { type: Number, default: null },
    partExchangePrice: { type: Number, default: null },
    valuationDate: { type: Date, default: null }
  },
  dataSources: {
    dvla: { type: Boolean, default: false },
    checkCarDetails: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now }
  },
  fieldSources: { type: mongoose.Schema.Types.Mixed, default: {} },
  videoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(v);
      },
      message: 'Please provide a valid YouTube URL'
    }
  },
  advertStatus: {
    type: String,
    enum: ['draft', 'incomplete', 'pending_payment', 'active', 'sold', 'expired', 'removed'],
    default: 'draft'
  },
  advertId: { type: String, unique: true, sparse: true },
  publishedAt: { type: Date },
  soldAt: { type: Date },
  userEditedFields: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ─── Indexes ────────────────────────────────────────────────────────────────
carSchema.index({ make: 1, model: 1 });
carSchema.index({ make: 1, model: 1, submodel: 1 });
carSchema.index({ year: 1 });
carSchema.index({ price: 1 });
carSchema.index({ location: '2dsphere' });
carSchema.index({ condition: 1 });
carSchema.index({ fuelType: 1 });
carSchema.index({ registrationNumber: 1 });
carSchema.index({ historyCheckStatus: 1 });
carSchema.index({ dealerId: 1, advertStatus: 1 });
carSchema.index({ isDealerListing: 1 });
carSchema.index({ vehicleType: 1 });
carSchema.index({ vehicleType: 1, condition: 1 });

// ─── Helper: build AutoTrader-style displayTitle ─────────────────────────────
function buildDisplayTitle(doc) {
  const parts = [];
  if (doc.engineSize) {
    const size = parseFloat(doc.engineSize);
    if (!isNaN(size) && size > 0) parts.push(size.toFixed(1));
  }
  if (doc.variant && doc.variant !== 'null' && doc.variant !== 'undefined' && doc.variant.trim() !== '') {
    parts.push(doc.variant.trim());
  } else if (doc.fuelType) {
    parts.push(doc.fuelType);
  }
  if (doc.emissionClass && doc.emissionClass.includes('Euro')) {
    parts.push(doc.emissionClass);
  }
  if (doc.doors && doc.doors >= 2 && doc.doors <= 5) {
    parts.push(`${doc.doors}dr`);
  } else if (doc.bodyType) {
    const bt = doc.bodyType.toLowerCase();
    if (bt.includes('estate')) parts.push('Estate');
    else if (bt.includes('saloon') || bt.includes('sedan')) parts.push('Saloon');
    else if (bt.includes('coupe')) parts.push('Coupe');
    else if (bt.includes('convertible') || bt.includes('cabriolet')) parts.push('Convertible');
    else if (bt.includes('suv')) parts.push('SUV');
    else if (bt.includes('mpv')) parts.push('MPV');
  }
  return parts.length > 0 ? parts.join(' ') : null;
}

// ─── Helper: normalize make/model/variant ────────────────────────────────────
function normalizeMakeModel(doc) {
  if (!doc.make || !doc.model) return;
  const makeUpper = doc.make.toUpperCase();

  // BMW i-series swap
  if (makeUpper === 'BMW') {
    const iSeriesPattern = /^I[0-9]/i;
    if (iSeriesPattern.test(doc.model) && doc.variant && iSeriesPattern.test(doc.variant)) {
      console.log(`🔄 [Normalize] BMW i-series swap: model="${doc.model}" ↔ variant="${doc.variant}"`);
      [doc.model, doc.variant] = [doc.variant, doc.model];
    }
    // BMW numeric series (320d → "3 Series", variant="320d")
    const modelStr = doc.model || '';
    const variantStr = doc.variant || '';
    const isElectric = /^i[X0-9]/i.test(modelStr) || /^i[X0-9]/i.test(variantStr);
    if (!isElectric) {
      const modelMatch = modelStr.match(/^([1-8])(\d{2})(.*)$/i);
      const variantMatch = variantStr.match(/^([1-8])(\d{2})(.*)$/i);
      const hit = modelMatch || variantMatch;
      if (hit) {
        const seriesModel = `${hit[1]} Series`;
        const fullVariant = (modelMatch ? modelStr : variantStr).trim();
        console.log(`🔄 [Normalize] BMW series: "${doc.model}" → "${seriesModel}", variant="${fullVariant}"`);
        doc.model = seriesModel;
        if (!doc.variant || doc.variant === modelStr || doc.variant === 'null') {
          doc.variant = fullVariant;
        }
      }
    }
  }

  // FIAT 500 swap
  if (makeUpper === 'FIAT') {
    const match = (doc.model || '').match(/^(500X?L?)\s+(.+)$/i);
    if (match && doc.variant && doc.variant.match(/^500X?L?$/i)) {
      console.log(`🔄 [Normalize] FIAT swap: "${doc.model}" → "${match[1]}", variant="${match[2]}"`);
      doc.model = match[1];
      doc.variant = match[2];
    }
  }

  // VW Golf / Polo
  if (makeUpper === 'VOLKSWAGEN') {
    for (const base of ['Golf', 'Polo']) {
      if (doc.model.startsWith(`${base} `) && doc.model !== base) {
        const variantPart = doc.model.replace(`${base} `, '').trim();
        console.log(`🔄 [Normalize] VW ${base}: "${doc.model}" → "${base}", variant="${variantPart}"`);
        doc.model = base;
        doc.variant = variantPart || doc.variant;
        break;
      }
    }
  }

  // Audi A1-A8 / Q2-Q8 / TT / R8
  if (makeUpper === 'AUDI') {
    const match = (doc.model || '').match(/^(A[1-8]|Q[2-8]|TT|R8)\s+(.+)$/i);
    if (match) {
      console.log(`🔄 [Normalize] Audi: "${doc.model}" → "${match[1]}", variant="${match[2]}"`);
      doc.model = match[1];
      doc.variant = match[2] || doc.variant;
    }
  }

  // Mercedes-Benz C/E/S/A/B/G/M class
  if (makeUpper === 'MERCEDES-BENZ' || makeUpper === 'MERCEDES') {
    if (!doc.model.includes('-Class')) {
      const match = (doc.model || '').match(/^([ABCEGMS])\s*(\d{3})/i);
      if (match) {
        const baseModel = `${match[1].toUpperCase()}-Class`;
        console.log(`🔄 [Normalize] Mercedes: "${doc.model}" → "${baseModel}"`);
        if (!doc.variant || doc.variant === doc.model) doc.variant = doc.model;
        doc.model = baseModel;
      }
    }
  }

  // Body type capitalization
  if (doc.bodyType) {
    doc.bodyType = doc.bodyType.charAt(0).toUpperCase() + doc.bodyType.slice(1).toLowerCase();
  }
}

// ─── Helper: clear EV fields from non-EV vehicles ───────────────────────────
function clearEVFieldsIfNeeded(doc) {
  const isRegularHybrid = ['Hybrid', 'Petrol Hybrid', 'Diesel Hybrid'].includes(doc.fuelType);
  const isPluginHybrid = doc.fuelType && (
    doc.fuelType.includes('Plug-in') ||
    doc.fuelType.toLowerCase().includes('phev') ||
    (doc.model || '').toUpperCase().includes('PHEV')
  );

  if (isRegularHybrid && !isPluginHybrid) {
    const evFields = ['electricRange', 'batteryCapacity', 'chargingTime', 'homeChargingSpeed',
      'publicChargingSpeed', 'rapidChargingSpeed', 'chargingTime10to80',
      'electricMotorPower', 'electricMotorTorque', 'chargingPortType', 'fastChargingCapability'];
    let cleared = false;
    evFields.forEach(f => {
      if (doc[f]) { doc[f] = null; cleared = true; }
      if (doc.runningCosts && doc.runningCosts[f]) { doc.runningCosts[f] = null; cleared = true; }
    });
    if (cleared) console.log(`✅ [EV Cleanup] Removed EV fields from regular hybrid (${doc.fuelType})`);
  }

  const isPureICE = doc.fuelType === 'Petrol' || doc.fuelType === 'Diesel';
  if (isPureICE && (doc.batteryCapacity || doc.electricRange)) {
    ['batteryCapacity', 'electricRange', 'homeChargingSpeed', 'rapidChargingSpeed',
      'chargingPortType', 'electricMotorPower', 'electricMotorTorque'].forEach(f => { doc[f] = null; });
    console.log(`✅ [EV Cleanup] Removed EV fields from pure ${doc.fuelType}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SINGLE PRE-SAVE HOOK — all logic in one place, with loop guard at the top
// ════════════════════════════════════════════════════════════════════════════
carSchema.pre('save', async function(next) {

  // ── LOOP GUARD ────────────────────────────────────────────────────────────
  // If this save was triggered by code INSIDE this hook (e.g. a service that
  // calls car.save() internally), skip all hook logic to prevent infinite loops.
  if (this.$locals.inPreSaveHook) {
    console.log(`⏭️  [Pre-Save] Loop guard triggered — skipping hook for ${this.registrationNumber || 'no-reg'}`);
    return next();
  }
  // Set the guard immediately — before ANY await
  this.$locals.inPreSaveHook = true;

  const reg = this.registrationNumber;
  console.log(`🔧 [Pre-Save] START — ${this.make} ${this.model} (${reg || 'no-reg'})`);

  try {

    // ── STEP 1: Validate status ─────────────────────────────────────────────
    if (this.advertStatus === 'incomplete') {
      const err = new Error('Cannot save cars with "incomplete" status. Use "draft" or "active".');
      err.code = 'INVALID_STATUS';
      return next(err);
    }

    // ── STEP 2: Duplicate active advert check ──────────────────────────────
    if (reg && this.advertStatus === 'active') {
      const duplicate = await this.constructor.findOne({
        registrationNumber: reg,
        advertStatus: 'active',
        _id: { $ne: this._id }
      });
      if (duplicate) {
        const err = new Error(`Active advert already exists for registration ${reg}`);
        err.code = 'DUPLICATE_REGISTRATION';
        return next(err);
      }
    }

    // ── STEP 3: Make/model/variant normalization ────────────────────────────
    normalizeMakeModel(this);

    // ── STEP 4: Postcode → coordinates (new cars only, or when missing) ─────
    const needsCoords = this.postcode && (!this.latitude || !this.longitude || !this.locationName);
    if (needsCoords) {
      try {
        console.log(`📍 [Pre-Save] Fetching coordinates for: ${this.postcode}`);
        const postcodeService = require('../services/postcodeService');
        const postcodeData = await postcodeService.lookupPostcode(this.postcode);
        if (postcodeData) {
          this.latitude    = postcodeData.latitude;
          this.longitude   = postcodeData.longitude;
          this.locationName = postcodeData.locationName;
          this.location    = { type: 'Point', coordinates: [postcodeData.longitude, postcodeData.latitude] };
          if (this.sellerContact && !this.sellerContact.city) {
            this.sellerContact.city = postcodeData.locationName;
          }
          console.log(`✅ [Pre-Save] Coordinates set: ${this.latitude}, ${this.longitude} — ${this.locationName}`);
        } else if (!this.locationName) {
          const areaMap = { SW:'London',SE:'London',NW:'London',NE:'London',E:'London',W:'London',
            N:'London',EC:'London',WC:'London',M:'Manchester',B:'Birmingham',L:'Liverpool',
            LS:'Leeds',S:'Sheffield',BS:'Bristol',G:'Glasgow',EH:'Edinburgh',CF:'Cardiff',SS:'Essex' };
          this.locationName = areaMap[this.postcode.substring(0, 2).toUpperCase()] || 'UK';
        }
      } catch (err) {
        console.warn(`⚠️  [Pre-Save] Postcode lookup failed: ${err.message}`);
        if (!this.locationName) this.locationName = 'UK';
      }
    }

    // ── STEP 5: DVLA — color, MOT expiry, tax status ────────────────────────
    // Only called when specific fields are genuinely missing.
    // NEVER saves the document inside — just sets fields on `this`.
    // SKIP if this is a RELIST (car already existed and has data)
    const isRelist = !this.isNew && 
                     this.isModified('advertStatus') && 
                     (this.advertStatus === 'active' || this.advertStatus === 'pending_payment');
    
    if (reg && !this.$locals.skipPreSave && !isRelist) {
      const needsColor = !this.color || this.color === 'null';
      const needsTax   = !this.taxStatus;
      const hasMOTHistory = this.motHistory && this.motHistory.length > 0;
      const motSuspicious = this.motDue && new Date(this.motDue) > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const needsMOT = !hasMOTHistory && (this.isNew || !this.motDue || motSuspicious || this.isModified('motDue'));

      if (needsColor || needsTax || needsMOT) {
        try {
          const axios = require('axios');
          const dvlaApiKey = process.env.DVLA_API_KEY;
          if (dvlaApiKey) {
            console.log(`🔍 [Pre-Save] DVLA fetch for ${reg} (color=${needsColor}, tax=${needsTax}, mot=${needsMOT})`);
            const { data } = await axios.post(
              'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
              { registrationNumber: reg },
              { headers: { 'x-api-key': dvlaApiKey, 'Content-Type': 'application/json' }, timeout: 5000 }
            );
            if (needsColor && data.colour) {
              const { formatColor } = require('../utils/colorFormatter');
              this.color = formatColor(data.colour);
              console.log(`✅ [DVLA] Color: ${this.color}`);
            }
            if (needsMOT && data.motExpiryDate) {
              const motDate = new Date(data.motExpiryDate);
              this.motDue    = motDate;
              this.motExpiry = motDate;
              this.motStatus = data.motStatus || 'Valid';
              console.log(`✅ [DVLA] MOT expiry: ${motDate.toDateString()}, status: ${this.motStatus}`);
            }
            if (needsTax && data.taxStatus) {
              this.taxStatus = data.taxStatus;
              if (data.taxDueDate) this.taxDueDate = new Date(data.taxDueDate);
              console.log(`✅ [DVLA] Tax status: ${this.taxStatus}`);
            }
          }
        } catch (err) {
          console.warn(`⚠️  [Pre-Save] DVLA fetch failed: ${err.message}`);
        }
      }
    }

    // ── STEP 6: Color formatting ────────────────────────────────────────────
    if (this.color && typeof this.color === 'string') {
      const { formatColor } = require('../utils/colorFormatter');
      const formatted = formatColor(this.color);
      if (formatted) this.color = formatted;
    }

    // ── STEP 7: Variant fetch (only when missing) ───────────────────────────
    // Uses updateOne() pattern internally — no nested save() calls.
    // SKIP if this is a RELIST (car already existed and has data)
    if (reg && (!this.variant || this.variant === 'null' || this.variant === 'undefined' || this.variant.trim() === '') && !isRelist) {
      try {
        console.log(`🔍 [Pre-Save] Variant missing — fetching for ${reg}`);
        const variantOnlyService = require('../services/variantOnlyService');

        // CRITICAL: Tell the service NOT to call car.save() internally.
        // Pass { noSave: true } so it only returns data, never persists.
        const vehicleData = await variantOnlyService.getVariantOnly(reg, true, { noSave: true });

        let extractedVariant = null;
        if (vehicleData.variant) {
          extractedVariant = typeof vehicleData.variant === 'object'
            ? vehicleData.variant.value
            : vehicleData.variant;
        }

        if (extractedVariant && extractedVariant !== 'null' && extractedVariant.trim() !== '') {
          // Strip trailing transmission words
          this.variant = extractedVariant.trim()
            .replace(/\s*(semi-auto|semi auto|automatic|manual|auto|cvt|dsg|tiptronic|powershift)\s*$/gi, '')
            .trim();
          console.log(`✅ [Pre-Save] Variant set: "${this.variant}"`);
        } else {
          // Fallback variant from local data
          this.variant = this.engineSize && this.fuelType
            ? `${this.engineSize}L ${this.fuelType}`
            : (this.fuelType || 'Standard');
          console.log(`✅ [Pre-Save] Fallback variant: "${this.variant}"`);
        }

        // Link history if available (just set the reference — no extra save)
        if (vehicleData.historyCheckId && !this.historyCheckId) {
          this.historyCheckId = vehicleData.historyCheckId;
          this.historyCheckStatus = 'verified';
          this.historyCheckDate   = new Date();
        }

        // Engine size from API if missing
        if (!this.engineSize && vehicleData.engineSize) {
          const es = typeof vehicleData.engineSize === 'object' ? vehicleData.engineSize.value : vehicleData.engineSize;
          if (es) this.engineSize = parseFloat(es);
        }

      } catch (err) {
        console.error(`❌ [Pre-Save] Variant fetch failed: ${err.message}`);
        this.variant = this.engineSize && this.fuelType
          ? `${this.engineSize}L ${this.fuelType}`
          : (this.fuelType || 'Standard');
        console.log(`🚨 [Pre-Save] Emergency variant: "${this.variant}"`);
      }
    } else if (!this.variant && !reg) {
      // No registration and no variant — generate from specs
      this.variant = this.engineSize && this.fuelType
        ? `${this.engineSize}L ${this.fuelType}`
        : (this.fuelType || 'Standard');
      console.log(`✅ [Pre-Save] No-reg variant: "${this.variant}"`);
    }

    // ── STEP 8: Re-run normalization now that variant is populated ───────────
    normalizeMakeModel(this);

    // ── STEP 9: displayTitle ────────────────────────────────────────────────
    if (!this.displayTitle) {
      this.displayTitle = buildDisplayTitle(this);
      if (this.displayTitle) console.log(`🎯 [Pre-Save] displayTitle: "${this.displayTitle}"`);
    }

    // ── STEP 10: EV / hybrid field cleanup ──────────────────────────────────
    clearEVFieldsIfNeeded(this);

    // ── STEP 11: EV enhancement (new/fuelType changed only) ─────────────────
    const isEVorPHEV = ['Electric', 'Plug-in Hybrid', 'Petrol Plug-in Hybrid', 'Diesel Plug-in Hybrid'].includes(this.fuelType);
    if (isEVorPHEV && (this.isNew || this.isModified('fuelType'))) {
      try {
        const ElectricVehicleEnhancementService = require('../services/electricVehicleEnhancementService');
        const AutoDataPopulationService         = require('../services/autoDataPopulationService');
        const enhanced  = ElectricVehicleEnhancementService.enhanceWithEVData(this.toObject());
        const populated = AutoDataPopulationService.populateMissingData(enhanced);
        Object.keys(populated).forEach(k => { if (k !== '_id' && k !== '__v') this[k] = populated[k]; });
        console.log(`✅ [Pre-Save] EV enhanced: ${this.electricRange}mi, ${this.batteryCapacity}kWh`);
      } catch (err) {
        console.error(`❌ [Pre-Save] EV enhancement failed: ${err.message}`);
      }
    }

    // ── STEP 12 & 13: REMOVED ────────────────────────────────────────────────
    // History (£1.82) aur MOT (£0.02) API calls REMOVED from Car.js pre-save hook.
    // 
    // WHY REMOVED:
    // - Payment controller already calls fetchVehicleAPIs() which fetches history/MOT
    // - Duplicate API calls waste money (£1.84 per car)
    // - VehicleHistory cache handles reuse across multiple cars
    // 
    // NEW FLOW:
    // 1. Draft car save → Car.js → NO history/MOT API (saves £1.84)
    // 2. Payment complete → fetchVehicleAPIs() → VehicleHistory save
    // 3. car.advertStatus = 'active' → car.save() → Car.js → DVLA/variant only
    // 
    // RESULT: History/MOT fetched once per registration, reused via VehicleHistory cache

    // ── STEP 12: MOT due date sync from motHistory ──────────────────────────
    if (this.motHistory && this.motHistory.length > 0) {
      const latest = this.motHistory[0];
      if (latest.expiryDate) {
        if (!this.motDue)    this.motDue    = latest.expiryDate;
        if (!this.motExpiry) this.motExpiry = latest.expiryDate;
        if (!this.motStatus) this.motStatus = latest.testResult === 'PASSED' ? 'Valid' : 'Invalid';
      }
    }

    // ── STEP 13: Valuation (new listings only) ──────────────────────────────
    // SKIP if this is a RELIST (car already existed and has valuation data)
    if (this.isNew && reg && this.mileage && !isRelist) {
      const needsVal = !this.valuation?.privatePrice || !this.price || this.price === 0;
      if (needsVal) {
        try {
          const ValuationService = require('../services/valuationService');
          const valuationService = new ValuationService();
          console.log(`💰 [Pre-Save] Fetching valuation for ${reg}`);
          const val = await valuationService.getValuation(reg, this.mileage);
          this.valuation = {
            privatePrice:     val.estimatedValue.private,
            dealerPrice:      val.estimatedValue.retail,
            partExchangePrice: val.estimatedValue.trade,
            confidence:       val.confidence,
            valuationDate:    new Date()
          };
          this.price          = val.estimatedValue.private;
          this.estimatedValue = val.estimatedValue.private;
          console.log(`✅ [Pre-Save] Price set to £${this.price} (private valuation)`);
        } catch (err) {
          console.warn(`⚠️  [Pre-Save] Valuation fetch failed: ${err.message}`);
        }
      }
    }

    // ── STEP 16: userId from sellerContact email ────────────────────────────
    if (!this.userId && this.sellerContact?.email) {
      try {
        const User = require('./User');
        const user = await User.findOne({ email: this.sellerContact.email });
        if (user) {
          this.userId = user._id;
          console.log(`✅ [Pre-Save] userId set: ${this.userId}`);
        } else {
          console.warn(`⚠️  [Pre-Save] No user found for ${this.sellerContact.email} — car won't appear in My Listings`);
        }
      } catch (err) {
        console.warn(`⚠️  [Pre-Save] userId lookup failed: ${err.message}`);
      }
    } else if (!this.userId) {
      console.warn(`⚠️  [Pre-Save] No userId and no email — car won't appear in My Listings (id=${this._id})`);
    }

    // ── STEP 17: sellerContact defaults ────────────────────────────────────
    if (this.sellerContact && !this.sellerContact.type) {
      this.sellerContact.type = 'private';
    }

    // ── STEP 18: publishedAt for new active listings ────────────────────────
    if (this.isNew && this.advertStatus === 'active' && !this.publishedAt) {
      this.publishedAt = new Date();
      console.log(`✅ [Pre-Save] publishedAt: ${this.publishedAt}`);
    }

  } catch (err) {
    // Catch-all — never let a hook error silently prevent saving
    console.error(`❌ [Pre-Save] Unhandled error: ${err.message}`, err);
  }

  console.log(`✅ [Pre-Save] DONE — ${this.make} ${this.model} (${reg || 'no-reg'})`);
  next();
});

// ─── Pre-remove: cleanup VehicleHistory ─────────────────────────────────────
carSchema.pre(['deleteOne', 'findOneAndDelete', 'findByIdAndDelete'], async function() {
  try {
    const car = await this.model.findOne(this.getQuery());
    if (car && car.historyCheckId) {
      const VehicleHistory = require('./VehicleHistory');
      await VehicleHistory.findByIdAndDelete(car.historyCheckId);
      console.log(`🗑️  [Delete] Removed VehicleHistory ${car.historyCheckId}`);
    }
  } catch (err) {
    console.error('❌ [Delete] Cleanup error:', err);
  }
});

// ─── Post-save: EV logging only ─────────────────────────────────────────────
carSchema.post('save', function(doc) {
  if (doc.fuelType === 'Electric') {
    console.log(`🎉 [Post-Save] EV saved: ${doc.make} ${doc.model} (${doc.registrationNumber})`);
    console.log(`   Range: ${doc.electricRange || doc.runningCosts?.electricRange || 'N/A'}mi`);
    console.log(`   Battery: ${doc.batteryCapacity || doc.runningCosts?.batteryCapacity || 'N/A'}kWh`);
    console.log(`   Features: ${doc.features?.length || 0}`);
  }
});

// ─── Post-save: auto-complete DISABLED (infinite loop risk) ─────────────────
// To safely re-enable: use Car.updateOne({_id: doc._id}, {$set: fields})
// instead of doc.save() inside universalAutoCompleteService.
// updateOne() bypasses mongoose hooks entirely and breaks the loop.
//
// carSchema.post('save', async function(doc) { ... });

// ─── Static: safe delete with cleanup ───────────────────────────────────────
carSchema.statics.deleteCarWithCleanup = async function(carId) {
  try {
    const car = await this.findById(carId);
    if (!car) throw new Error('Car not found');
    if (car.historyCheckId) {
      const VehicleHistory = require('./VehicleHistory');
      await VehicleHistory.findByIdAndDelete(car.historyCheckId);
    }
    await this.findByIdAndDelete(carId);
    return { success: true, message: 'Car and associated data deleted successfully' };
  } catch (err) {
    console.error('❌ [deleteCarWithCleanup]', err);
    return { success: false, error: err.message };
  }
};

module.exports = mongoose.model('Car', carSchema);