const axios = require('axios');

async function testDeployment() {
  const baseUrl = 'https://carcatlog-backend-1.onrender.com';
  
  console.log('🔍 Testing deployment endpoint...');
  
  try {
    const response = await axios.get(`${baseUrl}/api/payments/test-deployment`);
    console.log('✅ Deployment test successful!');
    console.log('📥 Response:', response.data);
    
    if (response.data.version === 'f9c7c72') {
      console.log('✅ Latest version is deployed!');
    } else {
      console.log('⚠️ Version mismatch - expected f9c7c72, got:', response.data.version);
    }
  } catch (error) {
    console.log('❌ Deployment test failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n⚠️ DEPLOYMENT NOT UPDATED!');
      console.log('The test endpoint is not found, which means Render has not deployed the latest code.');
      console.log('\n📋 ACTION REQUIRED:');
      console.log('1. Go to https://dashboard.render.com');
      console.log('2. Find your backend service');
      console.log('3. Click "Manual Deploy" button');
      console.log('4. Wait for deployment to complete');
      console.log('5. Run this test again');
    }
  }
}

testDeployment();
