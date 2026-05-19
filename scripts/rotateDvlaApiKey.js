const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');
const fs = require('fs');

/**
 * DVLA API Key Rotation Script
 * 
 * This script rotates your DVLA API key using the official DVLA method.
 * No need to create a new account - just call the rotation endpoint!
 * 
 * Requirements:
 * - Current valid x-api-key
 * - Valid JWT (ID token) from DVLA authentication
 * 
 * Usage:
 *   node backend/scripts/rotateDvlaApiKey.js
 * 
 * The script will:
 * 1. Call the DVLA key rotation endpoint
 * 2. Receive a new API key
 * 3. Automatically invalidate the old key
 * 4. Update your .env file with the new key
 */

const DVLA_AUTH_URL = 'https://driver-vehicle-licensing.api.gov.uk/thirdparty-access/v1/authenticate';
const DVLA_KEY_ROTATION_URL = 'https://driver-vehicle-licensing.api.gov.uk/thirdparty-access/v1/new-api-key';

/**
 * Authenticate with DVLA to get JWT token
 */
async function authenticateWithDVLA(username, password) {
  try {
    console.log('🔐 Authenticating with DVLA...');
    
    const response = await axios.post(
      DVLA_AUTH_URL,
      {
        userName: username,
        password: password
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    if (response.data && response.data['id-token']) {
      console.log('✅ Authentication successful!');
      return response.data['id-token'];
    } else {
      throw new Error('Invalid response format from DVLA authentication');
    }

  } catch (error) {
    console.error('\n❌ Authentication failed:');
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      console.error(`   Status: ${status}`);
      console.error(`   Message: ${data[0]?.detail || data.message || 'Unknown error'}`);
      
      if (status === 401) {
        console.log('\n💡 Possible reasons:');
        console.log('   - Incorrect username or password');
        console.log('   - Too many incorrect attempts');
        console.log('   - Temporary password not changed yet');
        console.log('\n📝 Solution:');
        console.log('   - Verify your DVLA_USERNAME and DVLA_PASSWORD in .env');
        console.log('   - If using temporary password, change it first');
        console.log('   - Contact DVLASecureAccess@dvla.gov.uk if account is locked');
      }
    } else {
      console.error(`   ${error.message}`);
    }
    
    throw error;
  }
}

async function rotateDvlaApiKey() {
  console.log('🔄 Starting DVLA API Key Rotation...\n');

  // Get current API key from environment
  const currentApiKey = process.env.DVLA_API_KEY;
  
  if (!currentApiKey) {
    console.error('❌ Error: DVLA_API_KEY not found in .env file');
    console.log('Please ensure your .env file contains DVLA_API_KEY');
    process.exit(1);
  }

  console.log(`📋 Current API Key: ${currentApiKey.substring(0, 8)}...${currentApiKey.substring(currentApiKey.length - 4)}`);

  // Check for username and password
  const username = process.env.DVLA_USERNAME;
  const password = process.env.DVLA_PASSWORD;
  
  if (!username || !password) {
    console.error('\n❌ Error: DVLA credentials not found in .env file');
    console.log('\n📝 To rotate your DVLA API key, you need to add:');
    console.log('   DVLA_USERNAME=your_dvla_username');
    console.log('   DVLA_PASSWORD=your_dvla_password');
    console.log('\n💡 These are the credentials you use to log in to:');
    console.log('   https://developer-portal.driver-vehicle-licensing.api.gov.uk');
    console.log('\n🔒 Security Note:');
    console.log('   - Your credentials are only stored locally in .env');
    console.log('   - They are used to authenticate and get a JWT token');
    console.log('   - The JWT token is then used to rotate your API key');
    console.log('\n📧 For assistance, contact: DVLASecureAccess@dvla.gov.uk');
    process.exit(1);
  }

  try {
    // Step 1: Authenticate to get JWT token
    const jwtToken = await authenticateWithDVLA(username, password);
    
    // Step 2: Use JWT token to rotate API key
    console.log('\n🔄 Requesting new API key...');
    
    const response = await axios.post(
      DVLA_KEY_ROTATION_URL,
      {}, // Empty body
      {
        headers: {
          'x-api-key': currentApiKey,
          'Authorization': jwtToken,
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.newApiKey) {
      const newApiKey = response.data.newApiKey;
      
      console.log('✅ Successfully received new API key!');
      console.log(`📋 New API Key: ${newApiKey.substring(0, 8)}...${newApiKey.substring(newApiKey.length - 4)}`);
      
      // Update .env file
      await updateEnvFile(currentApiKey, newApiKey);
      
      console.log('\n✅ API key rotation completed successfully!');
      console.log('🔒 Your old API key has been automatically invalidated by DVLA');
      console.log('🚀 Your application will now use the new API key');
      console.log('\n💡 Tip: DVLA recommends rotating API keys every 365 days');
      
    } else {
      console.error('❌ Unexpected response format from DVLA');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    if (error.message && error.message.includes('Authentication failed')) {
      // Already handled in authenticateWithDVLA
      process.exit(1);
    }
    
    console.error('\n❌ Error rotating API key:');
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      console.error(`   Status: ${status}`);
      console.error(`   Message: ${data[0]?.detail || data.message || 'Unknown error'}`);
      
      if (status === 401 || status === 403) {
        console.log('\n💡 Authentication failed. Possible reasons:');
        console.log('   - Your JWT token has expired (this is rare, just generated)');
        console.log('   - Your current API key is invalid');
        console.log('\n📝 Solution:');
        console.log('   - Verify your DVLA_API_KEY in .env is correct');
        console.log('   - Contact DVLASecureAccess@dvla.gov.uk for support');
      } else if (status === 429) {
        console.log('\n💡 Rate limit exceeded. Please try again later.');
      }
      
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.error('   Network timeout - please check your connection');
    } else {
      console.error(`   ${error.message}`);
    }
    
    console.log('\n📧 For support, contact: DVLASecureAccess@dvla.gov.uk');
    process.exit(1);
  }
}

/**
 * Update .env file with new API key
 */
async function updateEnvFile(oldKey, newKey) {
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    console.log('\n📝 Updating .env file...');
    
    // Read current .env file
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace old key with new key
    const updatedContent = envContent.replace(
      `DVLA_API_KEY=${oldKey}`,
      `DVLA_API_KEY=${newKey}`
    );
    
    // Write back to .env file
    fs.writeFileSync(envPath, updatedContent, 'utf8');
    
    console.log('✅ .env file updated successfully');
    
    // Also create a backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, '..', `.env.backup-${timestamp}`);
    fs.writeFileSync(backupPath, envContent, 'utf8');
    
    console.log(`💾 Backup created: .env.backup-${timestamp}`);
    
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    console.log('\n📋 Please manually update your .env file:');
    console.log(`   Old: DVLA_API_KEY=${oldKey}`);
    console.log(`   New: DVLA_API_KEY=${newKey}`);
    throw error;
  }
}

// Run the script
rotateDvlaApiKey();
