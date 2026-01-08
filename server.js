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

// Validate API credentials on startup
try {
  validateAndInitialize();
} catch (error) {
  console.error('Failed to start server: Invalid API credentials');
  process.exit(1);
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
app.get('/health', (req, res) => {
  const { checkDatabaseHealth } = require('./utils/dbHealthCheck');
  const dbHealth = checkDatabaseHealth();
  
  res.json({ 
    status: 'OK',
    database: dbHealth,
    timestamp: new Date().toISOString() 
  });
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
const tradeDealerRoutes = require('./routes/tradeDealerRoutes');
const tradeInventoryRoutes = require('./routes/tradeInventoryRoutes');
const tradeSubscriptionRoutes = require('./routes/tradeSubscriptionRoutes');
const tradeAnalyticsRoutes = require('./routes/tradeAnalyticsRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const vanRoutes = require('./routes/vanRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/postcode', postcodeRoutes);
app.use('/api/vehicle-history', historyRoutes);
app.use('/api/vehicle-valuation', valuationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/adverts', advertRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trade/auth', tradeDealerRoutes);
app.use('/api/trade/inventory', tradeInventoryRoutes);
app.use('/api/trade/subscriptions', tradeSubscriptionRoutes);
app.use('/api/trade/analytics', tradeAnalyticsRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/vans', vanRoutes);

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
