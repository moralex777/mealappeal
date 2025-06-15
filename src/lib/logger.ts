import winston from 'winston'

// Create structured logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  ),
  defaultMeta: { 
    service: 'mealappeal-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

// Add production logging to file in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  )
  
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  )
}

// Enhanced logging methods with context
export const log = {
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta)
  },
  
  error: (message: string, error?: Error | unknown, meta?: Record<string, any>) => {
    logger.error(message, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      ...meta
    })
  },
  
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta)
  },
  
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta)
  },

  // API request logging
  apiRequest: (method: string, path: string, userId?: string, meta?: Record<string, any>) => {
    logger.info('API Request', {
      type: 'api_request',
      method,
      path,
      userId,
      ...meta
    })
  },

  // API response logging
  apiResponse: (method: string, path: string, statusCode: number, duration: number, userId?: string, meta?: Record<string, any>) => {
    logger.info('API Response', {
      type: 'api_response',
      method,
      path,
      statusCode,
      duration,
      userId,
      ...meta
    })
  },

  // Rate limit logging
  rateLimit: (userId: string, tier: string, success: boolean, remaining: number, meta?: Record<string, any>) => {
    logger.info('Rate Limit Check', {
      type: 'rate_limit',
      userId,
      tier,
      success,
      remaining,
      ...meta
    })
  },

  // Security events
  security: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: Record<string, any>) => {
    logger.warn('Security Event', {
      type: 'security',
      event,
      severity,
      ...meta
    })
  },

  // Business metrics
  metric: (name: string, value: number, unit?: string, meta?: Record<string, any>) => {
    logger.info('Metric', {
      type: 'metric',
      name,
      value,
      unit,
      ...meta
    })
  }
}

export default logger