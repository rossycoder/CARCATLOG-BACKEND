const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const options = {
      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      
      // TLS/SSL settings
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      
      // Retry settings
      retryWrites: true,
      retryReads: true
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Check for specific SSL/TLS errors
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.error('🔒 SSL/TLS Error detected. Possible causes:');
      console.error('   1. Your IP address is not whitelisted in MongoDB Atlas');
      console.error('   2. Network/Firewall is blocking the connection');
      console.error('   3. MongoDB Atlas cluster is paused or unavailable');
      console.error('   4. Node.js version is outdated (update to latest LTS)');
      console.error('\n💡 Quick Fix:');
      console.error('   - Go to MongoDB Atlas → Network Access');
      console.error('   - Add your current IP or use 0.0.0.0/0 (allow all)');
    }
    
    // Retry connection after 10 seconds
    setTimeout(connectDB, 10000);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

module.exports = connectDB;
