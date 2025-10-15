#!/usr/bin/env -S npx tsx

/**
 * BizQ AI Manager - Unified interface for multiple AI providers
 * Supports Claude Code SDK, LiteLLM with claude-code-server, and fallbacks
 */

import { EventEmitter } from 'events';
import BizQAIProvider from './ai-provider';
import BizQLiteLLMProvider from './ai-provider-litellm';
import { ClaudeCodeProvider } from './ai-provider-claude-code';

export interface AIProviderConfig {
  type: 'claude-sdk' | 'claude-code' | 'litellm' | 'openai' | 'auto';
  baseURL?: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  fallback?: AIProviderConfig;
}

export interface AIResponse {
  success: boolean;
  result: any;
  confidence: number;
  tokensUsed?: number;
  sessionId?: string;
  error?: string;
  provider?: string;
}

export class BizQAIManager extends EventEmitter {
  private primaryProvider: any;
  private fallbackProvider: any;
  private config: AIProviderConfig;
  
  constructor(config: AIProviderConfig = { type: 'auto' }) {
    super();
    this.config = config;
    this.initializeProviders();
    
    console.log('🤖 BizQ AI Manager initialized');
    console.log(`📋 Primary: ${config.type}, Fallback: ${config.fallback?.type || 'none'}`);
  }

  /**
   * Initialize AI providers based on configuration
   */
  private initializeProviders() {
    // Initialize primary provider
    switch (this.config.type) {
      case 'claude-sdk':
        this.primaryProvider = new BizQAIProvider();
        break;
      case 'claude-code':
        this.primaryProvider = new ClaudeCodeProvider({
          model: this.config.model,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens
        });
        break;
      case 'litellm':
        this.primaryProvider = new BizQLiteLLMProvider({
          baseURL: this.config.baseURL,
          apiKey: this.config.apiKey,
          model: this.config.model
        });
        break;
      case 'auto':
        // Auto-detect best available provider - use Claude Code directly
        this.primaryProvider = new ClaudeCodeProvider({
          model: 'claude-3-5-sonnet-20241022'
        });
        break;
      default:
        throw new Error(`Unsupported provider type: ${this.config.type}`);
    }
    
    // Initialize fallback provider if configured
    if (this.config.fallback) {
      switch (this.config.fallback.type) {
        case 'claude-sdk':
          this.fallbackProvider = new BizQAIProvider();
          break;
        case 'claude-code':
          this.fallbackProvider = new ClaudeCodeProvider({
            model: this.config.fallback.model,
            temperature: this.config.fallback.temperature,
            maxTokens: this.config.fallback.maxTokens
          });
          break;
        case 'litellm':
          this.fallbackProvider = new BizQLiteLLMProvider({
            baseURL: this.config.fallback.baseURL,
            apiKey: this.config.fallback.apiKey,
            model: this.config.fallback.model
          });
          break;
      }
    }
    
    // Set up event forwarding
    this.primaryProvider.on('task:processed', (data: any) => {
      this.emit('task:processed', { ...data, provider: 'primary' });
    });
    
    if (this.fallbackProvider) {
      this.fallbackProvider.on('task:processed', (data: any) => {
        this.emit('task:processed', { ...data, provider: 'fallback' });
      });
    }
  }

  /**
   * Process a business task with automatic fallback
   */
  async processTask(task: {
    businessId: string;
    content: string;
    type: string;
    metadata?: any;
  }): Promise<AIResponse> {
    try {
      const result = await this.primaryProvider.processTask(task);
      return { ...result, provider: 'primary' };
    } catch (error: any) {
      console.warn('❌ Primary provider failed, trying fallback...', error.message);
      
      if (this.fallbackProvider) {
        try {
          const result = await this.fallbackProvider.processTask(task);
          return { ...result, provider: 'fallback' };
        } catch (fallbackError: any) {
          console.error('❌ Fallback provider also failed:', fallbackError.message);
          return {
            success: false,
            result: null,
            confidence: 0,
            error: `Both providers failed: ${error.message}, ${fallbackError.message}`,
            provider: 'none'
          };
        }
      }
      
      return {
        success: false,
        result: null,
        confidence: 0,
        error: error.message,
        provider: 'primary'
      };
    }
  }

  /**
   * Generate content with fallback support
   */
  async generateContent(type: string, context: any): Promise<string> {
    try {
      return await this.primaryProvider.generateContent(type, context);
    } catch (error: any) {
      console.warn('❌ Primary provider failed for content generation, trying fallback...');
      
      if (this.fallbackProvider) {
        try {
          return await this.fallbackProvider.generateContent(type, context);
        } catch (fallbackError: any) {
          console.error('❌ Fallback provider also failed for content generation');
          return `Error generating ${type} content: ${error.message}`;
        }
      }
      
      return `Error generating ${type} content: ${error.message}`;
    }
  }

  /**
   * Analyze data with fallback support
   */
  async analyzeData(data: any, analysisType: string): Promise<any> {
    try {
      return await this.primaryProvider.analyzeData(data, analysisType);
    } catch (error: any) {
      console.warn('❌ Primary provider failed for data analysis, trying fallback...');
      
      if (this.fallbackProvider) {
        try {
          return await this.fallbackProvider.analyzeData(data, analysisType);
        } catch (fallbackError: any) {
          console.error('❌ Fallback provider also failed for data analysis');
          return { error: `Analysis failed: ${error.message}` };
        }
      }
      
      return { error: error.message };
    }
  }

  /**
   * Make business decisions with fallback support
   */
  async makeDecision(context: {
    situation: string;
    options: string[];
    constraints?: any;
  }): Promise<{
    recommendation: string;
    reasoning: string;
    confidence: number;
  }> {
    try {
      return await this.primaryProvider.makeDecision(context);
    } catch (error: any) {
      console.warn('❌ Primary provider failed for decision making, trying fallback...');
      
      if (this.fallbackProvider) {
        try {
          return await this.fallbackProvider.makeDecision(context);
        } catch (fallbackError: any) {
          console.error('❌ Fallback provider also failed for decision making');
          return {
            recommendation: context.options[0],
            reasoning: `Error in decision making: ${error.message}`,
            confidence: 0.3
          };
        }
      }
      
      return {
        recommendation: context.options[0],
        reasoning: `Error in decision making: ${error.message}`,
        confidence: 0.3
      };
    }
  }

  /**
   * Stream responses if supported by provider
   */
  async *streamCompletion(prompt: string): AsyncGenerator<string, void, unknown> {
    try {
      if (this.primaryProvider.streamCompletion) {
        yield* this.primaryProvider.streamCompletion(prompt);
      } else {
        // Fallback to regular completion
        const result = await this.primaryProvider.generateContent('text', { prompt });
        yield result;
      }
    } catch (error: any) {
      console.warn('❌ Primary provider failed for streaming, trying fallback...');
      
      if (this.fallbackProvider?.streamCompletion) {
        try {
          yield* this.fallbackProvider.streamCompletion(prompt);
        } catch (fallbackError: any) {
          yield `Error: ${error.message}`;
        }
      } else {
        yield `Error: ${error.message}`;
      }
    }
  }

  /**
   * Check health of all providers
   */
  async healthCheck(): Promise<{
    primary: { available: boolean; latency?: number; error?: string };
    fallback?: { available: boolean; latency?: number; error?: string };
  }> {
    const result: any = {};
    
    // Check primary provider
    try {
      if (this.primaryProvider.healthCheck) {
        result.primary = await this.primaryProvider.healthCheck();
      } else {
        // Simple test for providers without health check
        await this.primaryProvider.generateContent('test', { content: 'ping' });
        result.primary = { available: true };
      }
    } catch (error: any) {
      result.primary = { available: false, error: error.message };
    }
    
    // Check fallback provider
    if (this.fallbackProvider) {
      try {
        if (this.fallbackProvider.healthCheck) {
          result.fallback = await this.fallbackProvider.healthCheck();
        } else {
          await this.fallbackProvider.generateContent('test', { content: 'ping' });
          result.fallback = { available: true };
        }
      } catch (error: any) {
        result.fallback = { available: false, error: error.message };
      }
    }
    
    return result;
  }

  /**
   * Get available models from providers
   */
  async getAvailableModels(): Promise<{
    primary: string[];
    fallback?: string[];
  }> {
    const result: any = {};
    
    try {
      if (this.primaryProvider.getModels) {
        result.primary = await this.primaryProvider.getModels();
      } else {
        result.primary = ['default'];
      }
    } catch (error: any) {
      result.primary = [];
    }
    
    if (this.fallbackProvider) {
      try {
        if (this.fallbackProvider.getModels) {
          result.fallback = await this.fallbackProvider.getModels();
        } else {
          result.fallback = ['default'];
        }
      } catch (error: any) {
        result.fallback = [];
      }
    }
    
    return result;
  }

  /**
   * Switch to a different provider configuration
   */
  async switchProvider(newConfig: AIProviderConfig) {
    console.log(`🔄 Switching AI provider from ${this.config.type} to ${newConfig.type}`);
    
    this.config = newConfig;
    
    // Remove existing event listeners
    this.primaryProvider.removeAllListeners();
    if (this.fallbackProvider) {
      this.fallbackProvider.removeAllListeners();
    }
    
    // Reinitialize providers
    this.initializeProviders();
    
    console.log('✅ Provider switch completed');
  }
}

// Demo the AI manager
async function demo() {
  console.log('🚀 BizQ AI Manager Demo\n');
  console.log('=' .repeat(50));
  
  // Configuration for Claude Code SDK directly (no server needed)
  const aiManager = new BizQAIManager({
    type: 'claude-code',
    model: 'claude-3-5-sonnet-20241022',
    fallback: {
      type: 'claude-sdk'
    }
  });
  
  // Health check
  console.log('\n🏥 Health Check');
  console.log('-'.repeat(30));
  
  const health = await aiManager.healthCheck();
  console.log('Provider Health:', health);
  
  // Get available models
  console.log('\n📋 Available Models');
  console.log('-'.repeat(30));
  
  const models = await aiManager.getAvailableModels();
  console.log('Models:', models);
  
  // Test business task processing
  console.log('\n📋 Test: Process Business Task');
  console.log('-'.repeat(30));
  
  const task = await aiManager.processTask({
    businessId: 'biz-001',
    content: 'Analyze Q4 revenue trends and recommend action items',
    type: 'financial'
  });
  
  console.log('Task Result:', task);
  
  // Test content generation
  console.log('\n📋 Test: Generate Marketing Content');
  console.log('-'.repeat(30));
  
  const content = await aiManager.generateContent('marketing', {
    product: 'AI-powered business automation tool',
    target: 'small business owners',
    tone: 'professional yet approachable'
  });
  
  console.log('Generated Content:');
  console.log(content.substring(0, 300) + '...');
  
  // Test streaming response
  console.log('\n📋 Test: Streaming Response');
  console.log('-'.repeat(30));
  
  console.log('Streaming business advice:');
  for await (const chunk of aiManager.streamCompletion('Give 3 quick tips for improving customer retention in e-commerce.')) {
    process.stdout.write(chunk);
  }
  console.log('\n');
  
  // Test decision making
  console.log('\n📋 Test: Business Decision');
  console.log('-'.repeat(30));
  
  const decision = await aiManager.makeDecision({
    situation: 'Our main competitor just launched a similar feature',
    options: [
      'Rush to release our version immediately',
      'Take time to build a better version',
      'Pivot to a different feature entirely',
      'Acquire the competitor'
    ],
    constraints: {
      budget: 100000,
      timeline: '6 months',
      team_size: 5
    }
  });
  
  console.log('Decision:', decision);
  
  console.log('\n🎉 AI Manager demo completed!');
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export default BizQAIManager;