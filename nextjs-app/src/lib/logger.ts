/**
 * Structured logging with Winston
 * ISO 27001 & SOC 2 compliant audit logging
 */

import winston from 'winston';
import { env } from '@/env';
import { redactSensitiveData } from './security';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(redactSensitiveData(metadata), null, 2)}`;
  }

  return msg;
});

// Create logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: {
    service: 'student-accommodation',
    environment: env.NODE_ENV,
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format:
        env.NODE_ENV === 'development'
          ? combine(colorize(), devFormat)
          : combine(json()),
    }),

    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),

    // Audit log (ISO 27001 / SOC 2)
    new winston.transports.File({
      filename: 'logs/audit.log',
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 30, // Keep for 7+ years as required
    }),
  ],
});

/**
 * Audit log for compliance
 */
export function logAudit(data: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}) {
  logger.info('AUDIT', {
    type: 'audit',
    ...redactSensitiveData(data),
  });
}

/**
 * Data access log (GDPR/POPIA compliance)
 */
export function logDataAccess(data: {
  userId: string;
  resource: string;
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE';
  resourceId?: string;
  metadata?: any;
  ipAddress?: string;
}) {
  logger.info('DATA_ACCESS', {
    type: 'data_access',
    timestamp: new Date().toISOString(),
    ...redactSensitiveData(data),
  });
}

/**
 * Security event log
 */
export function logSecurityEvent(data: {
  type: 'login' | 'logout' | 'failed_login' | 'password_reset' | 'permission_denied' | 'suspicious_activity';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}) {
  logger.warn('SECURITY_EVENT', {
    type: 'security',
    ...redactSensitiveData(data),
  });
}

/**
 * Performance log
 */
export function logPerformance(data: {
  operation: string;
  duration: number;
  metadata?: any;
}) {
  if (data.duration > 1000) {
    // Log slow operations (>1s)
    logger.warn('SLOW_OPERATION', data);
  } else {
    logger.debug('PERFORMANCE', data);
  }
}

/**
 * Error log with context
 */
export function logError(error: Error, context?: any) {
  logger.error('ERROR', {
    message: error.message,
    stack: error.stack,
    context: redactSensitiveData(context),
  });
}

/**
 * NSFAS compliance log
 */
export function logNsfasCompliance(data: {
  studentId: string;
  propertyId: string;
  complianceType: string;
  status: 'compliant' | 'non_compliant';
  details?: any;
}) {
  logger.info('NSFAS_COMPLIANCE', {
    type: 'nsfas_compliance',
    ...data,
  });
}

/**
 * Bursary audit log
 */
export function logBursaryAction(data: {
  userId: string;
  action: string;
  bursaryId?: string;
  studentId?: string;
  providerId?: string;
  details?: any;
}) {
  logger.info('BURSARY_ACTION', {
    type: 'bursary',
    ...redactSensitiveData(data),
  });
}

// Export logger as default
export default logger;
