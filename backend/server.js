// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Test database connection on startup
testConnection().then((success) => {
  if (!success) {
    console.error('❌ Failed to connect to database. Exiting...');
    process.exit(1);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/complaints', require('./routes/complaint.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/purchase-orders', require('./routes/purchase.routes'));
app.use('/api/requisitions', require('./routes/requisition.routes'));
app.use('/api/delivery-orders', require('./routes/delivery.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/vendors', require('./routes/vendor.routes'));
app.use('/api/goods-receipts', require('./routes/goodsReceipt.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/items', require('./routes/item.routes'));
app.use('/api/operational-areas', require('./routes/area.routes'));
app.use('/api/service-tariffs', require('./routes/tariff.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 ====================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Health check: http://localhost:${PORT}/health`);
  console.log('🚀 ====================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});