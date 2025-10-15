#!/usr/bin/env -S npx tsx

/**
 * BizQ AI Provider using LiteLLM with Claude Code Server
 * Uses the claude-code-server as an OpenAI-compatible endpoint
 */

import OpenAI from 'openai';
import { EventEmitter } from 'events';

export interface AIResponse {
  success: boolean;
  result: any;
  confidence: number;
  tokensUsed?: number;
  sessionId?: string;
  error?: string;
}

export class BizQLiteLLMProvider extends EventEmitter {
  private client: OpenAI;
  private sessionCache: Map<string, string> = new Map();
  
  constructor(
    private options: {
      baseURL?: string;
      apiKey?: string;
      model?: string;
    } = {}
  ) {
    super();
    
    // Initialize OpenAI client pointing to claude-code-server
    this.client = new OpenAI({
      baseURL: options.baseURL || 'http://localhost:9000/v1',
      apiKey: options.apiKey || 'not-needed', // Claude-code-server ignores API key
    });
    
    console.log('🤖 BizQ LiteLLM Provider initialized with Claude Code Server');
    console.log(`🔗 Base URL: ${options.baseURL || 'http://localhost:9000/v1'}`);
  }

  /**
   * Process a business task using Claude Code Server via OpenAI API
   */
  async processTask(task: {
    businessId: string;
    content: string;
    type: string;
    metadata?: any;
  }): Promise<AIResponse> {
    try {
      const prompt = this.buildPrompt(task);
      console.log(`🎯 Processing: ${task.content}`);
      
      const completion = await this.client.chat.completions.create({
        model: this.options.model || 'claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });
      
      const responseText = completion.choices[0]?.message?.content || '';
      const result = this.parseResponse(responseText, task.type);
      
      this.emit('task:processed', { task, result });
      
      return {
        success: true,
        result,
        confidence: 0.95,
        tokensUsed: completion.usage?.total_tokens || 0,
        sessionId: completion.id
      };
      
    } catch (error: any) {
      console.error('❌ AI processing error:', error.message);
      
      return {
        success: false,
        result: null,
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Generate content using AI
   */
  async generateContent(type: string, context: any): Promise<string> {
    const prompts: Record<string, string> = {
      marketing: `Create marketing content for: ${JSON.stringify(context)}`,
      financial: `Generate financial analysis for: ${JSON.stringify(context)}`,
      strategy: `Develop business strategy for: ${JSON.stringify(context)}`,
      email: `Write professional email for: ${JSON.stringify(context)}`
    };
    
    const prompt = prompts[type] || `Generate ${type} content for: ${JSON.stringify(context)}`;
    
    try {
      const completion = await this.client.chat.completions.create({
        model: this.options.model || 'claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.8
      });
      
      return completion.choices[0]?.message?.content || `Error generating ${type} content`;
    } catch (error: any) {
      console.error('❌ Content generation error:', error.message);
      return `Error generating ${type} content: ${error.message}`;
    }
  }

  /**
   * Analyze business data
   */
  async analyzeData(data: any, analysisType: string): Promise<any> {
    const prompt = `Analyze the following ${analysisType} data and provide insights. Return your analysis as a JSON object with clear structure:\n\n${JSON.stringify(data, null, 2)}`;
    
    try {
      const completion = await this.client.chat.completions.create({
        model: this.options.model || 'claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'system',
            content: 'You are a business analyst. Provide structured analysis in JSON format when possible.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });
      
      const response = completion.choices[0]?.message?.content || '';
      
      // Try to parse as JSON if possible
      try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
        return JSON.parse(response);
      } catch {
        return { analysis: response };
      }
    } catch (error: any) {
      console.error('❌ Data analysis error:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Make business decisions
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
    const prompt = `
Given this business situation: ${context.situation}

Options:
${context.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

${context.constraints ? `Constraints: ${JSON.stringify(context.constraints)}` : ''}

Provide a recommendation with reasoning. Format as JSON with fields: recommendation, reasoning, confidence (0-1).
`;
    
    try {
      const completion = await this.client.chat.completions.create({
        model: this.options.model || 'claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'system',
            content: 'You are a business consultant. Always respond with structured JSON containing recommendation, reasoning, and confidence fields.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.5
      });
      
      const response = completion.choices[0]?.message?.content || '';
      
      // Try to parse JSON response
      try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(response);
        
        return {
          recommendation: parsed.recommendation || context.options[0],
          reasoning: parsed.reasoning || 'Based on analysis',
          confidence: parsed.confidence || 0.8
        };
      } catch {
        // Fallback to text parsing
        return {
          recommendation: context.options[0],
          reasoning: response,
          confidence: 0.7
        };
      }
    } catch (error: any) {
      return {
        recommendation: context.options[0],
        reasoning: 'Error in decision making: ' + error.message,
        confidence: 0.3
      };
    }
  }

  /**
   * Stream responses for real-time interaction
   */
  async *streamCompletion(prompt: string): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.options.model || 'claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      console.error('❌ Streaming error:', error.message);
      yield `Error: ${error.message}`;
    }
  }

  /**
   * Check if the claude-code-server is available
   */
  async healthCheck(): Promise<{
    available: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      
      const completion = await this.client.chat.completions.create({
        model: this.options.model || 'claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'user',
            content: 'Say "OK" if you are working.'
          }
        ],
        max_tokens: 10
      });
      
      const latency = Date.now() - startTime;
      const response = completion.choices[0]?.message?.content || '';
      
      return {
        available: true,
        latency
      };
    } catch (error: any) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Get available models from the server
   */
  async getModels(): Promise<string[]> {
    try {
      const models = await this.client.models.list();
      return models.data.map(model => model.id);
    } catch (error: any) {
      console.error('❌ Error fetching models:', error.message);
      return ['claude-3-5-sonnet-20241022']; // Default fallback
    }
  }

  /**
   * Build a contextual prompt for the task
   */
  private buildPrompt(task: any): string {
    const prompts: Record<string, string> = {
      financial: `Analyze and provide insights for this financial task: ${task.content}`,
      marketing: `Create a marketing solution for: ${task.content}`,
      operations: `Optimize this business operation: ${task.content}`,
      strategy: `Develop a strategic approach for: ${task.content}`,
      legal: `Provide legal guidance (not legal advice) for: ${task.content}`,
      content: `Generate content for: ${task.content}`,
      analysis: `Analyze and provide insights for: ${task.content}`
    };
    
    return prompts[task.type] || task.content;
  }

  /**
   * Parse response based on task type
   */
  private parseResponse(response: string, taskType: string): any {
    // Try to extract JSON if present
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Fall through to text response
      }
    }
    
    // Try to extract code if present
    const codeMatch = response.match(/```(?:typescript|javascript)?\n([\s\S]*?)\n```/);
    if (codeMatch) {
      return {
        type: 'code',
        content: codeMatch[1],
        description: response.replace(codeMatch[0], '').trim()
      };
    }
    
    // Default to text response
    return {
      type: 'text',
      content: response
    };
  }
}

// Demo the LiteLLM AI provider
async function demo() {
  console.log('🚀 BizQ LiteLLM AI Provider Demo\n');
  console.log('=' .repeat(50));
  
  const ai = new BizQLiteLLMProvider({
    baseURL: 'http://localhost:9000/v1',
    model: 'claude-3-5-sonnet-20241022'
  });
  
  // Health check first
  console.log('\n🏥 Health Check');
  console.log('-'.repeat(30));
  
  const health = await ai.healthCheck();
  console.log('Server Status:', health);
  
  if (!health.available) {
    console.log('❌ Claude Code Server not available. Please start it first:');
    console.log('   cd /path/to/claude-code-server && python run.py');
    return;
  }
  
  // Get available models
  console.log('\n📋 Available Models');
  console.log('-'.repeat(30));
  
  const models = await ai.getModels();
  console.log('Models:', models);
  
  // Test 1: Process a task
  console.log('\n📋 Test 1: Process Business Task');
  console.log('-'.repeat(30));
  
  const task1 = await ai.processTask({
    businessId: 'biz-001',
    content: 'Calculate optimal pricing for Black Friday sale with 20% margin target',
    type: 'financial'
  });
  
  console.log('Result:', task1);
  
  // Test 2: Generate content
  console.log('\n📋 Test 2: Generate Marketing Content');
  console.log('-'.repeat(30));
  
  const content = await ai.generateContent('marketing', {
    product: 'Organic Coffee',
    target: 'millennials',
    channel: 'social media'
  });
  
  console.log('Generated:', content.substring(0, 200) + '...');
  
  // Test 3: Make a decision
  console.log('\n📋 Test 3: Make Business Decision');
  console.log('-'.repeat(30));
  
  const decision = await ai.makeDecision({
    situation: 'Need to expand inventory for holiday season',
    options: [
      'Order 50% more inventory now',
      'Wait for Black Friday results',
      'Use dropshipping for overflow'
    ],
    constraints: { budget: 50000, storage: 'limited' }
  });
  
  console.log('Decision:', decision);
  
  // Test 4: Analyze data
  console.log('\n📋 Test 4: Analyze Business Data');
  console.log('-'.repeat(30));
  
  const analysis = await ai.analyzeData({
    revenue: [10000, 12000, 15000, 14000],
    costs: [7000, 8000, 9000, 8500],
    customers: [100, 120, 150, 140]
  }, 'financial');
  
  console.log('Analysis:', analysis);
  
  // Test 5: Streaming response
  console.log('\n📋 Test 5: Streaming Response');
  console.log('-'.repeat(30));
  
  console.log('Streaming response:');
  for await (const chunk of ai.streamCompletion('Write a brief business tip for e-commerce entrepreneurs.')) {
    process.stdout.write(chunk);
  }
  console.log('\n');
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export default BizQLiteLLMProvider;