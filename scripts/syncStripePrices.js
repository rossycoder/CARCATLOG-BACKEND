require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getAllPackagesForStripe } = require('../services/pricingService');

async function syncStripePrices() {
  console.log('🔄 Syncing Prices to Stripe');
  console.log('===========================\n');
  
  try {
    const allPackages = getAllPackagesForStripe();
    console.log(`📦 Found ${allPackages.length} packages to sync\n`);
    
    let created = 0;
    let existing = 0;
    let errors = 0;
    
    for (const pkg of allPackages) {
      try {
        console.log(`Processing: ${pkg.packageName} (${pkg.tierLabel}) - £${pkg.price}`);
        
        // Check if price already exists
        const existingPrices = await stripe.prices.list({
          lookup_keys: [pkg.stripePriceId],
          limit: 1
        });
        
        if (existingPrices.data.length > 0) {
          console.log(`  ✓ Already exists: ${pkg.stripePriceId}`);
          existing++;
          continue;
        }
        
        // Create product first (or get existing)
        let product;
        const productId = `${pkg.userType}_${pkg.packageId}`;
        
        try {
          product = await stripe.products.retrieve(productId);
          console.log(`  ✓ Product exists: ${productId}`);
        } catch (err) {
          // Product doesn't exist, create it
          product = await stripe.products.create({
            id: productId,
            name: pkg.packageName,
            description: `${pkg.duration} listing for ${pkg.tierLabel} vehicles`,
            metadata: {
              userType: pkg.userType,
              packageId: pkg.packageId,
              duration: pkg.duration,
              durationWeeks: pkg.durationWeeks?.toString() || 'unlimited'
            }
          });
          console.log(`  ✓ Created product: ${productId}`);
        }
        
        // Create price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(pkg.price * 100), // Convert to pence
          currency: 'gbp',
          lookup_key: pkg.stripePriceId,
          metadata: {
            userType: pkg.userType,
            packageId: pkg.packageId,
            tierLabel: pkg.tierLabel,
            tierIndex: pkg.tierIndex.toString(),
            duration: pkg.duration,
            durationWeeks: pkg.durationWeeks?.toString() || 'unlimited'
          }
        });
        
        console.log(`  ✅ Created price: ${pkg.stripePriceId} (${price.id})`);
        created++;
        
      } catch (error) {
        console.error(`  ❌ Error processing ${pkg.stripePriceId}:`, error.message);
        errors++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('\n📊 Summary:');
    console.log(`  ✅ Created: ${created}`);
    console.log(`  ✓ Already existed: ${existing}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log(`  📦 Total: ${allPackages.length}`);
    
    if (errors === 0) {
      console.log('\n🎉 All prices synced successfully!');
    } else {
      console.log('\n⚠️  Some prices failed to sync. Check errors above.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the sync
syncStripePrices();
