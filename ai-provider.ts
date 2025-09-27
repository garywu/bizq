#!/usr/bin/env -S npx tsx

/**
 * BizQ AI Provider using Claude Code SDK
 * Emulates AI capabilities for task processing
 */

import { query } from '@instantlyeasy/claude-code-sdk-ts';
import { EventEmitter } from 'events';

export interface AIResponse {
  success: boolean;
  result: any;
  confidence: number;
  tokensUsed?: number;
  sessionId?: string;
  error?: string;
}

export class BizQAIProvider extends EventEmitter {
  private sessionCache: Map<string, string> = new Map();
  
  constructor() {
    super();
    console.log('🤖 BizQ AI Provider initialized with Claude Code SDK');
  }

  /**
   * Process a business task using Claude Code
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
      
      // Execute query to Claude Code
      const messages = [];
      let sessionId = '';
      let tokensUsed = 0;
      
      for await (const message of query(prompt)) {
        messages.push(message);
        
        if (message.session_id) {
          sessionId = message.session_id;
        }
        
        if (message.usage) {
          tokensUsed = message.usage.output_tokens || 0;
        }
      }
      
      // Extract the actual response
      const responseText = this.extractResponse(messages);
      
      // Parse based on task type
      const result = this.parseResponse(responseText, task.type);
      
      this.emit('task:processed', { task, result });
      
      return {
        success: true,
        result,
        confidence: 0.95,
        tokensUsed,
        sessionId
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
      const messages = [];
      for await (const message of query(prompt)) {
        messages.push(message);
      }
      
      return this.extractResponse(messages);
    } catch (error: any) {
      console.error('❌ Content generation error:', error.message);
      return `Error generating ${type} content`;
    }
  }

  /**
   * Analyze business data
   */
  async analyzeData(data: any, analysisType: string): Promise<any> {
    const prompt = `Analyze the following ${analysisType} data and provide insights:\n${JSON.stringify(data, null, 2)}`;
    
    try {
      const messages = [];
      for await (const message of query(prompt)) {
        messages.push(message);
      }
      
      const response = this.extractResponse(messages);
      
      // Try to parse as JSON if possible
      try {
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
      const messages = [];
      for await (const message of query(prompt)) {
        messages.push(message);
      }
      
      const response = this.extractResponse(messages);
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(response);
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
   * Extract the response text from Claude Code messages
   */
  private extractResponse(messages: any[]): string {
    let responseText = '';
    
    for (const message of messages) {
      if (message.type === 'assistant' && message.content) {
        for (const content of message.content) {
          if (content.type === 'text') {
            responseText += content.text + '\n';
          }
        }
      }
    }
    
    return responseText.trim();
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

// Demo the AI provider
async function demo() {
  console.log('🚀 BizQ AI Provider Demo\n');
  console.log('=' .repeat(50));
  
  const ai = new BizQAIProvider();
  
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
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export default BizQAIProvider;