/**
 * Test MongoDB Atlas Connection
 * Tests if we can connect to MongoDB Atlas from your machine
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const testConnection = async () => {
  console.log('\n🔍 Testing MongoDB Atlas Connection...\n');
  
  const mongoUri = process.env.MONGODB_URI;
  
  console.log('📝 Connection String:', mongoUri.replace(/:[^:@]+@/, ':****@'));
  console.log('⏳ Attempting to connect...\n');
  
  try {
    // Set a shorter timeout for testing
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 10000,
    });
    
    console.log('✅ SUCCESS! Connected to MongoDB Atlas');
    console.log('📊 Host:', conn.connection.host);
    console.log('📊 Database:', conn.connection.name);
    console.log('📊 Ready State:', conn.connection.readyState);
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📊 Collections:', collections.length);
    
    await mongoose.connection.close();
    console.log('\n✅ Connection test passed!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ FAILED to connect to MongoDB Atlas\n');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n🔧 Possible Solutions:');
      console.error('1. Check your internet connection');
      console.error('2. Verify MongoDB Atlas IP whitelist includes your IP');
      console.error('3. Try using a VPN or different network');
      console.error('4. Check if your firewall is blocking MongoDB (port 27017)');
      console.error('5. Verify the connection string is correct');
      console.error('\n📝 To whitelist your IP:');
      console.error('   - Go to https://cloud.mongodb.com');
      console.error('   - Network Access → Add IP Address');
      console.error('   - Add 0.0.0.0/0 (allow all) or your specific IP');
    }
    
    if (error.message.includes('authentication')) {
      console.error('\n🔧 Authentication Issue:');
      console.error('1. Check username and password in connection string');
      console.error('2. Verify database user exists in MongoDB Atlas');
      console.error('3. Check if password contains special characters (needs URL encoding)');
    }
    
    console.error('\n');
    process.exit(1);
  }
};

testConnection();
