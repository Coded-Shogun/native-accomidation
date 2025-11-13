const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Rate limiting configuration
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// API rate limiter (100 requests per 15 minutes)
const apiLimiter = createRateLimiter(15 * 60 * 1000, 100);

// Auth rate limiter (5 login attempts per 15 minutes)
const authLimiter = createRateLimiter(15 * 60 * 1000, 5);

// Strict rate limiter for sensitive operations (10 per hour)
const strictLimiter = createRateLimiter(60 * 60 * 1000, 10);

// Security headers configuration
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};

// Apply all security middleware
const applySecurityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmetConfig);

  // Sanitize data against NoSQL injection (works for SQLite parameter injection too)
  app.use(mongoSanitize());

  // Prevent XSS attacks
  app.use(xss());

  // Prevent HTTP parameter pollution
  app.use(hpp());

  // Apply general API rate limiting
  app.use('/api/', apiLimiter);

  return app;
};

module.exports = {
  applySecurityMiddleware,
  apiLimiter,
  authLimiter,
  strictLimiter,
  corsOptions,
};
