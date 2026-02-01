const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const connectDB = require('./config/database');
const { validateAndInitialize } = require('./config/apiCredentials');

// Load environment variables
dotenv.config();

// Initialize Passport configuration
require('./config/passport');

// Validate API credentials on startup (non-blocking)
try {
  validateAndInitialize();
} catch (error) {
  console.warn('⚠️  Warning: API credentials validation failed');
  console.warn('   Some features (vehicle history/valuation) may not work');
  console.warn('   Error:', error.message);
  // Don't exit - allow server to start without these optional features
}

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',  // Vite default port
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://carcatlog.vercel.app',  // Production frontend
    'https://carcatlog-git-main-rozeenas-projects.vercel.app',  // Vercel preview deployments
    /^https:\/\/carcatlog-.*\.vercel\.app$/  // All Vercel preview URLs
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Passport
app.use(passport.initialize());

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Car Website API',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { checkDatabaseHealth } = require('./utils/dbHealthCheck');
    const dbHealth = checkDatabaseHealth();
    
    // Check environment configuration
    const envCheck = {
      nodeEnv: process.env.NODE_ENV || 'not set',
      mongodbConfigured: !!process.env.MONGODB_URI,
      jwtConfigured: !!process.env.JWT_SECRET,
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
      cloudinaryConfigured: !!process.env.CLOUDINARY_CLOUD_NAME,
      emailConfigured: !!process.env.EMAIL_SERVICE,
      checkCardApiConfigured: !!process.env.CHECKCARD_API_KEY,
      dvlaApiConfigured: !!process.env.DVLA_API_KEY
    };
    
    res.json({ 
      status: 'OK',
      database: dbHealth,
      environment: envCheck,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint for debugging
app.get('/test-advert', async (req, res) => {
  try {
    const Car = require('./models/Car');
    const testCar = new Car({
      advertId: 'test-' + Date.now(),
      make: 'Test',
      model: 'Car',
      year: 2020,
      mileage: 50000,
      price: 10000,
      color: 'Blue',
      fuelType: 'Petrol',
      transmission: 'manual',
      advertStatus: 'active',
      publishedAt: new Date()
    });
    
    await testCar.save();
    
    res.json({
      success: true,
      message: 'Test car created successfully',
      carId: testCar._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      errorName: error.name,
      stack: error.stack
    });
  }
});

// API Routes
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const postcodeRoutes = require('./routes/postcodeRoutes');
const historyRoutes = require('./routes/historyRoutes');
const valuationRoutes = require('./routes/valuationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const advertRoutes = require('./routes/advertRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminFixRoutes = require('./routes/adminFixRoutes');
const tradeDealerRoutes = require('./routes/tradeDealerRoutes');
const tradeInventoryRoutes = require('./routes/tradeInventoryRoutes');
const tradeSubscriptionRoutes = require('./routes/tradeSubscriptionRoutes');
const tradeAnalyticsRoutes = require('./routes/tradeAnalyticsRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const vanRoutes = require('./routes/vanRoutes');
const seoRoutes = require('./routes/seoRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/postcode', postcodeRoutes);
app.use('/api/vehicle-history', historyRoutes);
app.use('/api/vehicle-valuation', valuationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/adverts', advertRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminFixRoutes);
app.use('/api/trade/auth', tradeDealerRoutes);
app.use('/api/trade/inventory', tradeInventoryRoutes);
app.use('/api/trade/subscriptions', tradeSubscriptionRoutes);
app.use('/api/trade/analytics', tradeAnalyticsRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/vans', vanRoutes);
app.use('/api/seo', seoRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize cron jobs for automatic expiration
const { initializeCronJobs } = require('./jobs/expirationCron');
initializeCronJobs();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
});

module.exports = app;
