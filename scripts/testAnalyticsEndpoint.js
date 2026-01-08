const axios = require('axios');
const jwt = require('jsonwebtoken');
const TradeDealer = require('../models/TradeDealer');
const connectDB = require('../config/database');

async function testAnalyticsEndpoint() {
  try {
    // Connect to database
    await connectDB();
    console.log('✓ Connected to database');

    // Find a test dealer
    const dealer = await TradeDealer.findOne({ status: 'active' });
    
    if (!dealer) {
      console.log('✗ No active dealer found');
      process.exit(1);
    }

    console.log('✓ Found dealer:', dealer._id, dealer.businessName);

    // Create a valid JWT token
    const token = jwt.sign(
      { id: dealer._id, role: 'trade_dealer' },
      process.env.JWT_SECRET || 'your-secret-key'
    );

    console.log('✓ Generated JWT token');

    // Make request to analytics endpoint
    const response = await axios.get('http://localhost:5000/api/trade/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✓ Analytics endpoint response:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAnalyticsEndpoint();
