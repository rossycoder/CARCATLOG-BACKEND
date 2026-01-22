const mongoose = require('mongoose');
const Car = require('../models/Car');
require('dotenv').config();

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carsales';
mongoose.connect(mongoURI)
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch(err => {
    console.error('✗ MongoDB connection error:', err);
    process.exit(1);
  });

// Enhanced submodel generation with realistic variants
const generateRealisticSubmodel = (car) => {
  const make = car.make || '';
  const model = car.model || '';
  const fuelType = car.fuelType || '';
  const transmission = car.transmission || '';
  
  // If submodel already exists and is not empty, keep it
  if (car.submodel && car.submodel.trim() !== '') {
    return car.submodel.trim();
  }
  
  // Brand-specific variant patterns
  const variantMap = {
    'BMW': {
      '3 Series': ['320i M Sport', '330i M Sport', '335i M Sport', '320d SE', '330d M Sport'],
      '5 Series': ['520d SE', '530i M Sport', '540i M Sport', '520i SE'],
      'X5': ['xDrive30d M Sport', 'xDrive40i M Sport', 'xDrive25d SE']
    },
    'Audi': {
      'A3': ['1.4 TFSI Sport', '2.0 TDI S Line', '1.6 TDI SE', '2.0 TFSI Quattro'],
      'A4': ['2.0 TFSI S Line', '1.4 TFSI Sport', '2.0 TDI S Line', '3.0 TDI Quattro'],
      'Q5': ['2.0 TDI Quattro S Line', '3.0 TDI Quattro', '2.0 TFSI Quattro']
    },
    'Mercedes': {
      'C-Class': ['C220 AMG Line', 'C250 Sport', 'C350 AMG', 'C200 SE', 'C300 AMG Line'],
      'E-Class': ['E220 AMG Line', 'E350 Sport', 'E200 SE', 'E300 AMG Line'],
      'A-Class': ['A180 AMG Line', 'A200 Sport', 'A250 AMG Line']
    },
    'Ford': {
      'Focus': ['1.6 Zetec', '2.0 ST', '1.0 EcoBoost Titanium', '1.5 TDCi Zetec', '2.3 RS'],
      'Fiesta': ['1.0 EcoBoost Zetec', '1.25 Zetec', '1.0 EcoBoost ST-Line', '1.5 TDCi Titanium'],
      'Mondeo': ['2.0 TDCi Titanium', '1.5 EcoBoost Zetec', '2.0 TDCi ST-Line']
    },
    'Volkswagen': {
      'Golf': ['1.4 TSI GTI', '2.0 TDI GT', '1.6 TDI SE', '2.0 GTI Performance', '1.0 TSI SE'],
      'Polo': ['1.0 TSI SE', '1.2 TSI Match', '1.4 TDI SE', '1.0 TSI R-Line'],
      'Passat': ['2.0 TDI SE', '1.4 TSI GT', '2.0 TDI R-Line', '1.6 TDI SE']
    },
    'Toyota': {
      'Corolla': ['1.8 Hybrid Design', '2.0 Hybrid GR Sport', '1.2 Turbo Icon', '1.8 Hybrid Excel'],
      'Yaris': ['1.5 Hybrid Icon', '1.0 VVT-i Icon', '1.5 Hybrid Design', '1.5 Hybrid Excel'],
      'RAV4': ['2.5 Hybrid Design', '2.5 Hybrid Excel', '2.0 VVT-i Icon']
    },
    'Honda': {
      'Civic': ['1.0 VTEC Turbo SE', '1.5 VTEC Turbo Sport', '2.0 VTEC Turbo Type R', '1.6 i-DTEC EX'],
      'CR-V': ['1.5 VTEC Turbo SE', '2.0 i-VTEC SE', '1.6 i-DTEC EX', '2.0 i-MMD Hybrid SR'],
      'Jazz': ['1.3 i-VTEC SE', '1.5 i-VTEC Sport', '1.3 i-VTEC EX']
    },
    'Vauxhall': {
      'Astra': ['1.4T 16v Limited Edition', '1.6 CDTi SRi', '1.4T 16v Elite', '1.6 CDTi Tech Line'],
      'Corsa': ['1.2 SE', '1.4 SRi', '1.0 Turbo SE', '1.3 CDTi ecoFLEX'],
      'Insignia': ['2.0 CDTi SRi', '1.6 CDTi Tech Line', '2.0 Turbo Elite']
    }
  };
  
  // Get variants for this make/model
  const variants = variantMap[make]?.[model];
  if (variants && variants.length > 0) {
    // Pick a variant based on fuel type if possible
    if (fuelType.toLowerCase().includes('diesel')) {
      const dieselVariants = variants.filter(v => 
        v.toLowerCase().includes('tdi') || 
        v.toLowerCase().includes('dtec') || 
        v.toLowerCase().includes('cdti') ||
        v.toLowerCase().includes('d ')
      );
      if (dieselVariants.length > 0) {
        return dieselVariants[Math.floor(Math.random() * dieselVariants.length)];
      }
    }
    
    if (fuelType.toLowerCase().includes('hybrid')) {
      const hybridVariants = variants.filter(v => v.toLowerCase().includes('hybrid'));
      if (hybridVariants.length > 0) {
        return hybridVariants[Math.floor(Math.random() * hybridVariants.length)];
      }
    }
    
    // Default: pick a random variant
    return variants[Math.floor(Math.random() * variants.length)];
  }
  
  // Fallback: use fuel type + transmission
  return `${fuelType} ${transmission}`;
};

// Main population function
const populateSubmodelData = async () => {
  try {
    console.log('\n🚀 Starting submodel data population...\n');
    
    // Get all cars
    const cars = await Car.find({});
    console.log(`📊 Found ${cars.length} cars to process\n`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const car of cars) {
      try {
        const originalSubmodel = car.submodel;
        const newSubmodel = generateRealisticSubmodel(car);
        
        // Only update if submodel is different
        if (originalSubmodel !== newSubmodel) {
          await Car.updateOne(
            { _id: car._id },
            { $set: { submodel: newSubmodel } }
          );
          
          console.log(`✓ Updated: ${car.make} ${car.model} → "${newSubmodel}"`);
          updated++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`✗ Error updating car ${car._id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('📈 Migration Summary:');
    console.log(`${'='.repeat(60)}`);
    console.log(`✓ Updated:  ${updated} cars`);
    console.log(`⊘ Skipped:  ${skipped} cars (already had submodel)`);
    console.log(`✗ Errors:   ${errors} cars`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Show submodel distribution
    const stats = await Car.aggregate([
      {
        $group: {
          _id: { make: '$make', model: '$model' },
          submodels: { $addToSet: '$submodel' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.make': 1, '_id.model': 1 } }
    ]);
    
    console.log('📊 Submodel Distribution by Make/Model:\n');
    stats.forEach(stat => {
      console.log(`${stat._id.make} ${stat._id.model} (${stat.count} cars):`);
      stat.submodels.forEach(submodel => {
        console.log(`  • ${submodel}`);
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('✗ Fatal error during migration:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
};

// Run the migration
populateSubmodelData();
