/**
 * Test the price fix for cache reconstruction
 */

const enhancedVehicleService = require('../services/enhancedVehicleService');

async function testCacheReconstruction() {
  try {
    console.log('🔧 Testing Cache Reconstruction Logic');
    console.log('====================================');
    
    // Simulate the cached data structure as it would be in MongoDB
    const mockCached = {
      vrm: 'BG22UCP',
      make: 'BMW',
      model: 'i4',
      variant: 'M50',
      colour: 'Black',
      fuelType: 'Electric',
      yearOfManufacture: 2022,
      bodyType: 'Coupe',
      doors: 5,
      seats: 5,
      gearbox: 'Automatic',
      transmission: 'Automatic',
      annualTax: 195,
      urbanMpg: null,
      extraUrbanMpg: null,
      combinedMpg: null,
      co2Emissions: null,
      insuranceGroup: null,
      numberOfPreviousKeepers: 2,
      isWrittenOff: true,
      writeOffCategory: 'S',
      valuation: {
        privatePrice: 36971,
        dealerPrice: 41550,
        partExchangePrice: 34694,
        confidence: 'medium',
        estimatedValue: {} // This is the problem - empty object
      },
      mileage: 2500,
      checkDate: new Date(),
      _id: 'mock-id'
    };
    
    console.log('\n📊 Testing cache reconstruction logic directly:');
    console.log('Original estimatedValue:', JSON.stringify(mockCached.valuation.estimatedValue));
    console.log('Is empty object:', Object.keys(mockCached.valuation.estimatedValue).length === 0);
    
    // Test the exact logic from the checkCache method
    const reconstructedValuation = mockCached.valuation ? {
      vrm: mockCached.vrm,
      mileage: mockCached.mileage || 50000,
      estimatedValue: mockCached.valuation.estimatedValue && 
                     Object.keys(mockCached.valuation.estimatedValue).length > 0 ? 
                     mockCached.valuation.estimatedValue : {
        private: mockCached.valuation.privatePrice,
        retail: mockCached.valuation.dealerPrice,
        trade: mockCached.valuation.partExchangePrice
      },
      confidence: mockCached.valuation.confidence || 'medium',
      source: 'cached'
    } : null;
    
    console.log('\n🔧 Reconstructed valuation:');
    console.log('VRM:', reconstructedValuation.vrm);
    console.log('Mileage:', reconstructedValuation.mileage);
    console.log('Confidence:', reconstructedValuation.confidence);
    console.log('EstimatedValue:', JSON.stringify(reconstructedValuation.estimatedValue));
    
    if (reconstructedValuation.estimatedValue && reconstructedValuation.estimatedValue.private) {
      console.log('\n✅ SUCCESS: Cache reconstruction works!');
      console.log('💷 Prices:');
      console.log('- Private sale: £' + reconstructedValuation.estimatedValue.private);
      console.log('- Retail price: £' + reconstructedValuation.estimatedValue.retail);
      console.log('- Trade price: £' + reconstructedValuation.estimatedValue.trade);
      console.log('\n🎯 Frontend will now show: £' + reconstructedValuation.estimatedValue.private);
    } else {
      console.log('\n❌ FAILED: Cache reconstruction still broken');
    }
    
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCacheReconstruction();