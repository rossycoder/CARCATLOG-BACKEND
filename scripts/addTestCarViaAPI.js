/**
 * Add Test Car via API
 * This calls the production API to add a test car
 */

const axios = require('axios');

const API_URL = 'https://carcatlog-backend-1.onrender.com';

async function addTestCar() {
  try {
    console.log('🚀 Adding test car to production via API...\n');
    
    // Step 1: Create advert
    console.log('📝 Step 1: Creating advert...');
    const advertResponse = await axios.post(`${API_URL}/api/adverts`, {
      vehicleData: {
        make: 'BMW',
        model: '3 Series',
        variant: '320d M Sport',
        year: 2020,
        mileage: 25000,
        color: 'Black',
        fuelType: 'Diesel',
        transmission: 'automatic',
        registration: 'TEST' + Date.now().toString().slice(-6),
        engineSize: 2.0,
        bodyType: 'Saloon',
        doors: 4,
        seats: 5,
        estimatedValue: 25000,
        postcode: 'M1 1AA'
      }
    });
    
    const advertId = advertResponse.data.data.id;
    console.log(`✅ Advert created: ${advertId}\n`);
    
    // Step 2: Simulate payment completion
    console.log('💳 Step 2: Simulating payment...');
    
    // Create a test purchase record
    const purchaseData = {
      advertId: advertId,
      packageId: 'test-premium',
      packageName: 'Premium Package',
      price: 4995,
      duration: '4 weeks',
      sellerType: 'private',
      vehicleValue: 'over-24995',
      advertData: {
        price: 25000,
        description: 'Test car added via API. Beautiful BMW 3 Series.',
        photos: [
          { url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' }
        ]
      },
      vehicleData: {
        make: 'BMW',
        model: '3 Series',
        variant: '320d M Sport',
        year: 2020,
        mileage: 25000,
        color: 'Black',
        fuelType: 'Diesel',
        transmission: 'automatic',
        registrationNumber: 'TEST' + Date.now().toString().slice(-6),
        engineSize: 2.0,
        bodyType: 'Saloon',
        doors: 4,
        seats: 5,
        estimatedValue: 25000
      },
      contactDetails: {
        phoneNumber: '07700900000',
        email: 'test@example.com',
        postcode: 'M1 1AA',
        allowEmailContact: true
      }
    };
    
    // Create checkout session
    const checkoutResponse = await axios.post(
      `${API_URL}/api/payments/create-advert-checkout-session`,
      purchaseData
    );
    
    const purchaseId = checkoutResponse.data.data.purchaseId;
    console.log(`✅ Purchase created: ${purchaseId}\n`);
    
    // Step 3: Complete the purchase (simulate webhook)
    console.log('✅ Step 3: Completing payment...');
    const completeResponse = await axios.post(
      `${API_URL}/api/payments/test-complete-purchase`,
      { purchaseId: purchaseId }
    );
    
    console.log('✅ SUCCESS! Car added to production!\n');
    console.log('📊 Details:');
    console.log(`   Advert ID: ${advertId}`);
    console.log(`   Purchase ID: ${purchaseId}`);
    console.log(`   Vehicle ID: ${completeResponse.data.vehicleId || 'Check database'}\n`);
    
    console.log('🌐 Check your website:');
    console.log('   Frontend: https://carcatlog.vercel.app');
    console.log('   API: https://carcatlog-backend-1.onrender.com/api/vehicles\n');
    
    // Verify
    console.log('🔍 Verifying...');
    const carsResponse = await axios.get(`${API_URL}/api/vehicles/count`);
    console.log(`   Total cars: ${carsResponse.data.count}\n`);
    
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

addTestCar();
