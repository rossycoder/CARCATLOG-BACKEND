// Centralized pricing configuration
// All prices are defined here and automatically synced to Stripe

const PRICING_CONFIG = {
  private: [
    {
      label: 'Under £1,000',
      minPrice: 0,
      maxPrice: 999,
      packages: [
        { id: 'bronze', name: 'Bronze', duration: '3 weeks', price: 7.99, durationWeeks: 3 },
        { id: 'silver', name: 'Silver', duration: '6 weeks', price: 13.99, durationWeeks: 6 },
        { id: 'gold', name: 'Gold', duration: 'Until sold', price: 16.99, durationWeeks: null }
      ]
    },
    {
      label: '£1,000 - £2,999',
      minPrice: 1000,
      maxPrice: 2999,
      packages: [
        { id: 'bronze', name: 'Bronze', duration: '3 weeks', price: 12.99, durationWeeks: 3 },
        { id: 'silver', name: 'Silver', duration: '6 weeks', price: 17.99, durationWeeks: 6 },
        { id: 'gold', name: 'Gold', duration: 'Until sold', price: 22.99, durationWeeks: null }
      ]
    },
    {
      label: '£3,000 - £4,999',
      minPrice: 3000,
      maxPrice: 4999,
      packages: [
        { id: 'bronze', name: 'Bronze', duration: '3 weeks', price: 15.99, durationWeeks: 3 },
        { id: 'silver', name: 'Silver', duration: '6 weeks', price: 21.99, durationWeeks: 6 },
        { id: 'gold', name: 'Gold', duration: 'Until sold', price: 28.99, durationWeeks: null }
      ]
    },
    {
      label: '£5,000 - £6,999',
      minPrice: 5000,
      maxPrice: 6999,
      packages: [
        { id: 'bronze', name: 'Bronze', duration: '3 weeks', price: 20.99, durationWeeks: 3 },
        { id: 'silver', name: 'Silver', duration: '6 weeks', price: 27.99, durationWeeks: 6 },
        { id: 'gold', name: 'Gold', duration: 'Until sold', price: 35.99, durationWeeks: null }
      ]
    },
    {
      label: '£7,000 - £9,999',
      minPrice: 7000,
      maxPrice: 9999,
      packages: [
        { id: 'bronze', name: 'Bronze', duration: '3 weeks', price: 25.99, durationWeeks: 3 },
        { id: 'silver', name: 'Silver', duration: '6 weeks', price: 32.99, durationWeeks: 6 },
        { id: 'gold', name: 'Gold', duration: 'Until sold', price: 42.99, durationWeeks: null }
      ]
    },
    {
      label: '£10,000 - £12,999',
      minPrice: 10000,
      maxPrice: 12999,
      packages: [
        { id: 'bronze', name: 'Bronze', duration: '3 weeks', price: 26.99, durationWeeks: 3 },
        { id: 'silver', name: 'Silver', duration: '6 weeks', price: 34.99, durationWeeks: 6 },
        { id: 'gold', name: 'Gold', duration: 'Until sold', price: 44.99, durationWeeks: null }
      ]
    },
    {
      label: '£13,000 - £16,999',
      minPrice: 13000,
      maxPrice: 16999,
      packages: [
        { id: 'bronze', name: 'Bronze', duration: '3 weeks', price: 27.99, durationWeeks: 3 },
        { id: 'silver', name: 'Silver', duration: '6 weeks', price: 36.99, durationWeeks: 6 },
        { id: 'gold', name: 'Gold', duration: 'Until sold', price: 46.99, durationWeeks: null }
      ]
    },
    {
      label: '£17,000 - £24,999',
      minPrice: 17000,
      maxPrice: 24999,
      packages: [
        { id: 'bronze', name: 'Bronze', duration: '3 weeks', price: 28.99, durationWeeks: 3 },
        { id: 'silver', name: 'Silver', duration: '6 weeks', price: 37.99, durationWeeks: 6 },
        { id: 'gold', name: 'Gold', duration: 'Until sold', price: 48.99, durationWeeks: null }
      ]
    },
    {
      label: 'Over £24,995',
      minPrice: 24995,
      maxPrice: null,
      packages: [
        { id: 'bronze', name: 'Bronze', duration: '3 weeks', price: 29.99, durationWeeks: 3 },
        { id: 'silver', name: 'Silver', duration: '6 weeks', price: 39.99, durationWeeks: 6 },
        { id: 'gold', name: 'Gold', duration: 'Until sold', price: 49.99, durationWeeks: null }
      ]
    }
  ],
  trade: [
    {
      label: 'Under £1,000',
      minPrice: 0,
      maxPrice: 1000,
      packages: [
        { id: 'bronze', name: 'TRADE BRONZE', duration: '3 weeks', price: 7.99, durationWeeks: 3 },
        { id: 'silver', name: 'TRADE SILVER', duration: '4 weeks', price: 9.99, durationWeeks: 4 },
        { id: 'gold', name: 'TRADE GOLD', duration: '6 weeks', price: 13.99, durationWeeks: 6 }
      ]
    },
    {
      label: '£1,001 - £2,000',
      minPrice: 1001,
      maxPrice: 2000,
      packages: [
        { id: 'bronze', name: 'TRADE BRONZE', duration: '3 weeks', price: 13.99, durationWeeks: 3 },
        { id: 'silver', name: 'TRADE SILVER', duration: '4 weeks', price: 16.99, durationWeeks: 4 },
        { id: 'gold', name: 'TRADE GOLD', duration: '6 weeks', price: 22.99, durationWeeks: 6 }
      ]
    },
    {
      label: '£2,001 - £3,000',
      minPrice: 2001,
      maxPrice: 3000,
      packages: [
        { id: 'bronze', name: 'TRADE BRONZE', duration: '3 weeks', price: 17.99, durationWeeks: 3 },
        { id: 'silver', name: 'TRADE SILVER', duration: '4 weeks', price: 22.99, durationWeeks: 4 },
        { id: 'gold', name: 'TRADE GOLD', duration: '6 weeks', price: 30.99, durationWeeks: 6 }
      ]
    },
    {
      label: '£3,001 - £5,000',
      minPrice: 3001,
      maxPrice: 5000,
      packages: [
        { id: 'bronze', name: 'TRADE BRONZE', duration: '3 weeks', price: 22.99, durationWeeks: 3 },
        { id: 'silver', name: 'TRADE SILVER', duration: '4 weeks', price: 28.99, durationWeeks: 4 },
        { id: 'gold', name: 'TRADE GOLD', duration: '6 weeks', price: 38.99, durationWeeks: 6 }
      ]
    },
    {
      label: '£5,001 - £7,000',
      minPrice: 5001,
      maxPrice: 7000,
      packages: [
        { id: 'bronze', name: 'TRADE BRONZE', duration: '3 weeks', price: 28.99, durationWeeks: 3 },
        { id: 'silver', name: 'TRADE SILVER', duration: '4 weeks', price: 36.99, durationWeeks: 4 },
        { id: 'gold', name: 'TRADE GOLD', duration: '6 weeks', price: 48.99, durationWeeks: 6 }
      ]
    },
    {
      label: '£7,001 - £10,000',
      minPrice: 7001,
      maxPrice: 10000,
      packages: [
        { id: 'bronze', name: 'TRADE BRONZE', duration: '3 weeks', price: 34.99, durationWeeks: 3 },
        { id: 'silver', name: 'TRADE SILVER', duration: '4 weeks', price: 43.99, durationWeeks: 4 },
        { id: 'gold', name: 'TRADE GOLD', duration: '6 weeks', price: 57.99, durationWeeks: 6 }
      ]
    },
    {
      label: '£10,001 - £17,000',
      minPrice: 10001,
      maxPrice: 17000,
      packages: [
        { id: 'bronze', name: 'TRADE BRONZE', duration: '3 weeks', price: 39.99, durationWeeks: 3 },
        { id: 'silver', name: 'TRADE SILVER', duration: '4 weeks', price: 50.99, durationWeeks: 4 },
        { id: 'gold', name: 'TRADE GOLD', duration: '6 weeks', price: 64.99, durationWeeks: 6 }
      ]
    },
    {
      label: 'Over £17,000',
      minPrice: 17001,
      maxPrice: null,
      packages: [
        { id: 'bronze', name: 'TRADE BRONZE', duration: '3 weeks', price: 41.99, durationWeeks: 3 },
        { id: 'silver', name: 'TRADE SILVER', duration: '4 weeks', price: 53.99, durationWeeks: 4 },
        { id: 'gold', name: 'TRADE GOLD', duration: '6 weeks', price: 67.99, durationWeeks: 6 }
      ]
    }
  ]
};

/**
 * Get pricing tier based on vehicle price and user type
 */
function getPricingTier(vehiclePrice, userType = 'private') {
  const tiers = PRICING_CONFIG[userType] || PRICING_CONFIG.private;
  
  for (const tier of tiers) {
    if (tier.maxPrice === null && vehiclePrice >= tier.minPrice) {
      return tier;
    }
    if (vehiclePrice >= tier.minPrice && vehiclePrice <= tier.maxPrice) {
      return tier;
    }
  }
  
  // Default to first tier if no match
  return tiers[0];
}

/**
 * Get all pricing tiers for a user type
 */
function getAllPricingTiers(userType = 'private') {
  return PRICING_CONFIG[userType] || PRICING_CONFIG.private;
}

/**
 * Generate Stripe Price ID from package details
 */
function generateStripePriceId(userType, packageId, tierIndex) {
  // Format: private_bronze_tier0, trade_silver_tier3, etc.
  return `${userType}_${packageId}_tier${tierIndex}`;
}

/**
 * Get all packages that need Stripe Price IDs
 */
function getAllPackagesForStripe() {
  const allPackages = [];
  
  ['private', 'trade'].forEach(userType => {
    const tiers = PRICING_CONFIG[userType];
    tiers.forEach((tier, tierIndex) => {
      tier.packages.forEach(pkg => {
        allPackages.push({
          userType,
          tierIndex,
          tierLabel: tier.label,
          packageId: pkg.id,
          packageName: pkg.name,
          price: pkg.price,
          duration: pkg.duration,
          durationWeeks: pkg.durationWeeks,
          stripePriceId: generateStripePriceId(userType, pkg.id, tierIndex)
        });
      });
    });
  });
  
  return allPackages;
}

module.exports = {
  PRICING_CONFIG,
  getPricingTier,
  getAllPricingTiers,
  generateStripePriceId,
  getAllPackagesForStripe
};
