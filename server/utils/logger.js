const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create transports
const transports = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: logFormat,
      level: 'info',
    })
  );
}

// File transport for all logs
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
    level: 'info',
  })
);

// File transport for errors only
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: logFormat,
    level: 'error',
  })
);

// File transport for audit logs (ISO 27001 / SOC 2 compliance)
const auditTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '90d', // Keep audit logs for 90 days
  format: logFormat,
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'student-accommodation-manager',
    environment: process.env.NODE_ENV || 'development',
  },
  transports,
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

// Create dedicated audit logger
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  defaultMeta: {
    type: 'audit',
    service: 'student-accommodation-manager',
  },
  transports: [auditTransport],
});

/**
 * Log audit events for compliance (ISO 27001, SOC 2)
 * @param {object} event - Audit event details
 */
const logAudit = (event) => {
  const auditEvent = {
    timestamp: new Date().toISOString(),
    ...event,
  };
  auditLogger.info(auditEvent);
};

/**
 * Log data access events
 * @param {object} params - Access event parameters
 */
const logDataAccess = ({ userId, resource, action, resourceId, ip, success = true, metadata = {} }) => {
  logAudit({
    eventType: 'DATA_ACCESS',
    userId,
    resource,
    action,
    resourceId,
    ip,
    success,
    metadata,
  });
};

/**
 * Log authentication events
 * @param {object} params - Auth event parameters
 */
const logAuth = ({ userId, action, ip, success = true, metadata = {} }) => {
  logAudit({
    eventType: 'AUTHENTICATION',
    userId,
    action,
    ip,
    success,
    metadata,
  });
};

/**
 * Log authorization events
 * @param {object} params - Authorization event parameters
 */
const logAuthorization = ({ userId, resource, action, ip, success = true, metadata = {} }) => {
  logAudit({
    eventType: 'AUTHORIZATION',
    userId,
    resource,
    action,
    ip,
    success,
    metadata,
  });
};

/**
 * Log configuration changes
 * @param {object} params - Configuration change parameters
 */
const logConfigChange = ({ userId, setting, oldValue, newValue, ip, metadata = {} }) => {
  logAudit({
    eventType: 'CONFIGURATION_CHANGE',
    userId,
    setting,
    oldValue,
    newValue,
    ip,
    metadata,
  });
};

/**
 * Log security events
 * @param {object} params - Security event parameters
 */
const logSecurityEvent = ({ eventType, severity, description, ip, metadata = {} }) => {
  logAudit({
    eventType: 'SECURITY_EVENT',
    securityEventType: eventType,
    severity,
    description,
    ip,
    metadata,
  });
};

module.exports = {
  logger,
  auditLogger,
  logAudit,
  logDataAccess,
  logAuth,
  logAuthorization,
  logConfigChange,
  logSecurityEvent,
};
