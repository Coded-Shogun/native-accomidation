require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const { initDatabase } = require('./database/init');
const { logger } = require('./utils/logger');
const { applySecurityMiddleware, corsOptions } = require('./config/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { logAuthenticatedRequest } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (for correct IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Apply security middleware (Helmet, rate limiting, etc.)
applySecurityMiddleware(app);

// CORS configuration
app.use(cors(corsOptions));

// Request logging
if (process.env.NODE_ENV === 'production') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
} else {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Log authenticated requests for audit trail
app.use(logAuthenticatedRequest);

// Health check (public, no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Student Accommodation Management System API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/leases', require('./routes/leases'));
app.use('/api/access', require('./routes/access'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Student Portal Routes
app.use('/api/student/notices', require('./routes/student/notices'));
app.use('/api/student/laundry', require('./routes/student/laundry'));
app.use('/api/student/visitors', require('./routes/student/visitors'));
app.use('/api/student/complaints', require('./routes/student/complaints'));
app.use('/api/student/kiosk', require('./routes/student/kiosk'));
app.use('/api/student/wifi', require('./routes/student/wifi'));
app.use('/api/student/deliveries', require('./routes/student/deliveries'));

// Management Portal Routes - Bursary System
app.use('/api/management/bursary-providers', require('./routes/management/bursary-providers'));
app.use('/api/management/student-bursaries', require('./routes/management/student-bursaries'));
app.use('/api/management/bursary-reports', require('./routes/management/bursary-reports'));
app.use('/api/management/residence-verification', require('./routes/management/residence-verification'));

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Initialize database and start server
if (require.main === module) {
  initDatabase()
    .then(() => {
      app.listen(PORT, () => {
        logger.info(`Server started successfully`, {
          port: PORT,
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
        });
      });
    })
    .catch((err) => {
      logger.error('Failed to initialize database:', { error: err.message });
      process.exit(1);
    });
}

module.exports = app;
