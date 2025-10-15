/**
 * Shared TypeScript interfaces and types for BizQ
 */

export interface UniversalTask {
  businessId: string;
  content: string;
  type: string;
  credits?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface WorkerProfile {
  id: string;
  type: 'ai' | 'human' | 'hybrid';
  capabilities: string[];
  costPerTask: number;
  avgResponseTime: number;
  successRate: number;
}

export interface TaskDecomposition {
  subtasks: Array<{
    id: string;
    content: string;
    type: string;
    dependencies: string[];
    estimatedCredits: number;
  }>;
  execution_mode: 'sequential' | 'parallel';
  total_credits: number;
}

export interface AIResponse {
  success: boolean;
  result: any;
  confidence: number;
  tokensUsed?: number;
  sessionId?: string;
  error?: string;
}

export interface BizQConfig {
  port: number;
  host: string;
  environment: string;
  ai: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
    maxRetries: number;
    fallback?: {
      provider: string;
    };
  };
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  logging: {
    level: string;
    format: string;
  };
  business: {
    maxBusinesses: number;
    defaultCredits: number;
    bulkOperationLimit: number;
  };
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ExecutorType = 'ai' | 'human' | 'hybrid';