const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const options = {
      // Connection pool settings - increased for high traffic
      maxPoolSize: 50,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxIdleTimeMS: 30000,
      
      // TLS/SSL settings - only for Atlas (not localhost)
      ...(process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('localhost') ? {
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
      } : {}),
      
      // Retry settings
      retryWrites: true,
      retryReads: true
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
    });

    mongoose.connection.on('disconnected', () => {
    });

    mongoose.connection.on('reconnected', () => {
    });

    return conn;
  } catch (error) {
    // Check for specific SSL/TLS errors
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.error('   4. Node.js version is outdated (update to latest LTS)');
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
    process.exit(1);
  }
});

module.exports = connectDB;
