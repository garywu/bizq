/**
 * Application constants for BizQ
 */

export const TASK_TYPES = {
  CUSTOMER_REPLY: 'customer.reply',
  PRODUCT_DESCRIPTION: 'product.description',
  MARKET_RESEARCH: 'market.research',
  INVOICE_PROCESS: 'invoice.process',
  EMAIL_ANALYZE: 'email.analyze',
  CONTENT_GENERATE: 'content.generate'
} as const;

export const EXECUTOR_TYPES = {
  AI: 'ai',
  HUMAN: 'human',
  HYBRID: 'hybrid'
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export const DEFAULT_CONFIG = {
  PORT: 9321,
  HOST: '127.0.0.1',
  ENVIRONMENT: 'development',
  AI_TIMEOUT: 120000,
  MAX_RETRIES: 3,
  CACHE_TTL: 3600,
  MAX_CACHE_SIZE: 1000
} as const;

export const ERROR_MESSAGES = {
  TASK_NOT_FOUND: 'Task not found',
  INVALID_TASK_TYPE: 'Invalid task type',
  PROVIDER_UNAVAILABLE: 'AI provider unavailable',
  INSUFFICIENT_CREDITS: 'Insufficient credits',
  VALIDATION_FAILED: 'Input validation failed'
} as const;

export const SUCCESS_MESSAGES = {
  TASK_CREATED: 'Task created successfully',
  TASK_EXECUTED: 'Task executed successfully',
  PROVIDER_CONNECTED: 'AI provider connected',
  CONFIG_LOADED: 'Configuration loaded successfully'
} as const;