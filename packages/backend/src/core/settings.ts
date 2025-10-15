#!/usr/bin/env -S npx tsx

/**
 * BizQ Settings Configuration
 * Centralized configuration management with environment variable support
 */

export interface BizQSettings {
  // Server Configuration
  port: number;
  host: string;
  environment: 'development' | 'production' | 'test';
  
  // AI Provider Configuration
  ai: {
    provider: 'claude-code' | 'litellm' | 'claude-sdk' | 'auto';
    baseURL?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    timeout: number;
    maxRetries: number;
    fallback?: {
      provider: 'claude-code' | 'litellm' | 'claude-sdk';
      baseURL?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  
  // Cache Configuration
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  
  // Logging Configuration
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'pretty';
  };
  
  // Business Configuration
  business: {
    maxBusinesses: number;
    defaultCredits: number;
    bulkOperationLimit: number;
  };
}

/**
 * Default configuration values
 */
const defaultSettings: BizQSettings = {
  port: 9321,
  host: '127.0.0.1',
  environment: 'development',
  
  ai: {
    provider: 'claude-code',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 4096,
    timeout: 120000,
    maxRetries: 3,
    fallback: {
      provider: 'claude-sdk'
    }
  },
  
  cache: {
    enabled: true,
    ttl: 3600,
    maxSize: 1000
  },
  
  logging: {
    level: 'info',
    format: 'pretty'
  },
  
  business: {
    maxBusinesses: 50,
    defaultCredits: 100,
    bulkOperationLimit: 10
  }
};

/**
 * Environment variable mapping
 */
const envMapping = {
  // Server
  'PORT': 'port',
  'HOST': 'host',
  'NODE_ENV': 'environment',
  
  // AI Provider
  'AI_PROVIDER': 'ai.provider',
  'AI_BASE_URL': 'ai.baseURL',
  'AI_MODEL': 'ai.model',
  'AI_TEMPERATURE': 'ai.temperature',
  'AI_MAX_TOKENS': 'ai.maxTokens',
  'AI_TIMEOUT': 'ai.timeout',
  'AI_MAX_RETRIES': 'ai.maxRetries',
  'AI_FALLBACK_PROVIDER': 'ai.fallback.provider',
  'AI_FALLBACK_BASE_URL': 'ai.fallback.baseURL',
  'AI_FALLBACK_MODEL': 'ai.fallback.model',
  'AI_FALLBACK_TEMPERATURE': 'ai.fallback.temperature',
  'AI_FALLBACK_MAX_TOKENS': 'ai.fallback.maxTokens',
  
  // Cache
  'CACHE_ENABLED': 'cache.enabled',
  'CACHE_TTL': 'cache.ttl',
  'CACHE_MAX_SIZE': 'cache.maxSize',
  
  // Logging
  'LOG_LEVEL': 'logging.level',
  'LOG_FORMAT': 'logging.format',
  
  // Business
  'MAX_BUSINESSES': 'business.maxBusinesses',
  'DEFAULT_CREDITS': 'business.defaultCredits',
  'BULK_OPERATION_LIMIT': 'business.bulkOperationLimit'
};

/**
 * Set nested object property by path
 */
function setNestedProperty(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  const finalKey = keys[keys.length - 1];
  current[finalKey] = value;
}

/**
 * Parse environment variable value to appropriate type
 */
function parseEnvValue(value: string, targetType: any): any {
  if (typeof targetType === 'boolean') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  
  if (typeof targetType === 'number') {
    const parsed = Number(value);
    return isNaN(parsed) ? targetType : parsed;
  }
  
  return value;
}

/**
 * Load settings from environment variables and defaults
 */
function loadSettings(): BizQSettings {
  // Start with defaults
  const settings = JSON.parse(JSON.stringify(defaultSettings)) as BizQSettings;
  
  // Override with environment variables
  for (const [envVar, settingPath] of Object.entries(envMapping)) {
    const envValue = process.env[envVar];
    if (envValue !== undefined) {
      // Get the target type from defaults
      const keys = settingPath.split('.');
      let targetValue = defaultSettings as any;
      for (const key of keys) {
        targetValue = targetValue[key];
      }
      
      const parsedValue = parseEnvValue(envValue, targetValue);
      setNestedProperty(settings, settingPath, parsedValue);
    }
  }
  
  return settings;
}

/**
 * Validate settings
 */
function validateSettings(settings: BizQSettings): void {
  const errors: string[] = [];
  
  // Validate port
  if (settings.port < 1 || settings.port > 65535) {
    errors.push(`Invalid port: ${settings.port}. Must be between 1 and 65535.`);
  }
  
  // Validate AI provider
  const validProviders = ['claude-code', 'litellm', 'claude-sdk', 'auto'];
  if (!validProviders.includes(settings.ai.provider)) {
    errors.push(`Invalid AI provider: ${settings.ai.provider}. Must be one of: ${validProviders.join(', ')}`);
  }
  
  // Validate AI base URL (only required for litellm)
  if (settings.ai.provider === 'litellm' && settings.ai.baseURL) {
    try {
      new URL(settings.ai.baseURL);
    } catch {
      errors.push(`Invalid AI base URL: ${settings.ai.baseURL}`);
    }
  }
  
  // Validate timeouts
  if (settings.ai.timeout < 1000) {
    errors.push(`AI timeout too low: ${settings.ai.timeout}ms. Must be at least 1000ms.`);
  }
  
  // Validate cache settings
  if (settings.cache.ttl < 1) {
    errors.push(`Cache TTL too low: ${settings.cache.ttl}. Must be at least 1 second.`);
  }
  
  if (settings.cache.maxSize < 1) {
    errors.push(`Cache max size too low: ${settings.cache.maxSize}. Must be at least 1.`);
  }
  
  // Validate business settings
  if (settings.business.maxBusinesses < 1) {
    errors.push(`Max businesses too low: ${settings.business.maxBusinesses}. Must be at least 1.`);
  }
  
  if (errors.length > 0) {
    throw new Error(`Settings validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Load and validate settings from file
 */
function loadSettingsFromFile(filePath: string): Partial<BizQSettings> {
  try {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty object
      return {};
    }
    throw new Error(`Failed to load settings from ${filePath}: ${error.message}`);
  }
}

/**
 * Merge settings with file-based overrides
 */
function mergeSettings(base: BizQSettings, override: Partial<BizQSettings>): BizQSettings {
  return {
    ...base,
    ...override,
    ai: {
      ...base.ai,
      ...override.ai,
      fallback: {
        ...base.ai.fallback,
        ...override.ai?.fallback
      }
    },
    cache: {
      ...base.cache,
      ...override.cache
    },
    logging: {
      ...base.logging,
      ...override.logging
    },
    business: {
      ...base.business,
      ...override.business
    }
  };
}

/**
 * Initialize and export settings
 */
let cachedSettings: BizQSettings | null = null;

export function getSettings(configFile?: string): BizQSettings {
  if (cachedSettings) {
    return cachedSettings;
  }
  
  // Load base settings from environment and defaults
  let settings = loadSettings();
  
  // Load settings from file if specified
  if (configFile) {
    const fileSettings = loadSettingsFromFile(configFile);
    settings = mergeSettings(settings, fileSettings);
  }
  
  // Check for standard config files
  const standardConfigFiles = [
    './bizq.config.json',
    './config/bizq.json',
    './settings.json'
  ];
  
  for (const file of standardConfigFiles) {
    try {
      const fileSettings = loadSettingsFromFile(file);
      if (Object.keys(fileSettings).length > 0) {
        settings = mergeSettings(settings, fileSettings);
        console.log(`📋 Loaded configuration from: ${file}`);
        break;
      }
    } catch {
      // Ignore file loading errors for standard files
    }
  }
  
  // Validate settings
  validateSettings(settings);
  
  // Cache settings
  cachedSettings = settings;
  
  return settings;
}

/**
 * Print current settings (for debugging)
 */
export function printSettings(settings?: BizQSettings): void {
  const s = settings || getSettings();
  
  console.log('🔧 BizQ Configuration:');
  console.log('==================');
  console.log(`Server: http://${s.host}:${s.port}`);
  console.log(`Environment: ${s.environment}`);
  console.log(`AI Provider: ${s.ai.provider}${s.ai.baseURL ? ` (${s.ai.baseURL})` : ''}`);
  console.log(`AI Model: ${s.ai.model}`);
  if (s.ai.fallback) {
    console.log(`AI Fallback: ${s.ai.fallback.provider}`);
  }
  console.log(`Cache: ${s.cache.enabled ? 'enabled' : 'disabled'} (TTL: ${s.cache.ttl}s)`);
  console.log(`Log Level: ${s.logging.level}`);
  console.log(`Max Businesses: ${s.business.maxBusinesses}`);
  console.log('==================');
}

/**
 * Create a settings file template
 */
export function createSettingsTemplate(filePath: string = './bizq.config.json'): void {
  const template = {
    "port": 9321,
    "host": "127.0.0.1",
    "environment": "development",
    "ai": {
      "provider": "claude-code",
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.7,
      "maxTokens": 4096,
      "timeout": 120000,
      "maxRetries": 3,
      "fallback": {
        "provider": "claude-sdk"
      }
    },
    "cache": {
      "enabled": true,
      "ttl": 3600,
      "maxSize": 1000
    },
    "logging": {
      "level": "info",
      "format": "pretty"
    },
    "business": {
      "maxBusinesses": 50,
      "defaultCredits": 100,
      "bulkOperationLimit": 10
    }
  };
  
  const fs = require('fs');
  fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
  console.log(`📋 Created settings template: ${filePath}`);
}

// Export the initialized settings
export const settings = getSettings();

// Demo function
async function demo() {
  console.log('🚀 BizQ Settings Demo\n');
  
  // Print current settings
  printSettings();
  
  // Show environment variable examples
  console.log('\n📋 Environment Variable Examples:');
  console.log('PORT=9321 npm run dev');
  console.log('AI_BASE_URL=http://localhost:9000/v1 npm run dev');
  console.log('AI_PROVIDER=claude-sdk npm run dev');
  console.log('LOG_LEVEL=debug npm run dev');
  
  // Create template file
  console.log('\n📋 Creating settings template...');
  createSettingsTemplate('./example-bizq.config.json');
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export default settings;