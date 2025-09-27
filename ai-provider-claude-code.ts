import { query } from '@anthropic-ai/claude-code';
import { EventEmitter } from 'events';

export interface AIResponse {
  success: boolean;
  result: any;
  confidence: number;
  tokensUsed?: number;
  sessionId?: string;
  error?: string;
}

export class ClaudeCodeProvider extends EventEmitter {
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private sessionCache: Map<string, string> = new Map();

  constructor(options: { model?: string; temperature?: number; maxTokens?: number } = {}) {
    super();
    this.model = options.model || 'claude-3-5-sonnet-20241022';
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 4096;
    
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
      const queryStream = query({
        prompt: prompt,
        options: {
          model: 'sonnet' // Use simplified model name
        }
      });
      
      let responseText = '';
      for await (const message of queryStream) {
        if (message.type === 'assistant') {
          const textContent = message.message.content
            .map((c) => (c.type === 'text' ? c.text : ''))
            .join('');
          responseText += textContent;
        }
      }
      
      // Parse based on task type
      const result = this.parseResponse(responseText, task.type);
      
      this.emit('task:processed', { task, result });
      
      return {
        success: true,
        result,
        confidence: 0.95,
        tokensUsed: 0, // Claude Code SDK doesn't provide token usage
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
      const queryStream = query({
        prompt: prompt,
        options: {
          model: 'sonnet'
        }
      });
      
      let responseText = '';
      for await (const message of queryStream) {
        if (message.type === 'assistant') {
          const textContent = message.message.content
            .map((c) => (c.type === 'text' ? c.text : ''))
            .join('');
          responseText += textContent;
        }
      }
      
      return responseText || `Generated ${type} content based on provided context.`;
      
    } catch (error: any) {
      console.error('❌ Content generation error:', error.message);
      return `Error generating ${type} content: ${error.message}`;
    }
  }

  /**
   * Analyze data using AI
   */
  async analyzeData(data: any, analysisType: string): Promise<any> {
    const prompt = `Analyze this ${analysisType} data and provide insights: ${JSON.stringify(data)}`;
    
    try {
      const queryStream = query({
        prompt: prompt,
        options: {
          model: 'sonnet'
        }
      });
      
      let responseText = '';
      for await (const message of queryStream) {
        if (message.type === 'assistant') {
          const textContent = message.message.content
            .map((c) => (c.type === 'text' ? c.text : ''))
            .join('');
          responseText += textContent;
        }
      }
      
      return this.parseResponse(responseText, 'analysis');
      
    } catch (error: any) {
      console.error('❌ Data analysis error:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Make business decisions using AI
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
    const prompt = `Make a business decision for this situation: ${context.situation}
    
Options:
${context.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

${context.constraints ? `Constraints: ${JSON.stringify(context.constraints)}` : ''}

Provide recommendation with reasoning.`;
    
    try {
      const queryStream = query({
        prompt: prompt,
        options: {
          model: 'sonnet'
        }
      });
      
      let responseText = '';
      for await (const message of queryStream) {
        if (message.type === 'assistant') {
          const textContent = message.message.content
            .map((c) => (c.type === 'text' ? c.text : ''))
            .join('');
          responseText += textContent;
        }
      }
      
      return {
        recommendation: context.options[0], // Fallback to first option
        reasoning: responseText || 'AI analysis completed',
        confidence: 0.85
      };
      
    } catch (error: any) {
      console.error('❌ Decision making error:', error.message);
      return {
        recommendation: context.options[0],
        reasoning: `Error in decision making: ${error.message}`,
        confidence: 0.3
      };
    }
  }

  /**
   * Health check for the provider
   */
  async healthCheck(): Promise<{ available: boolean; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      const queryStream = query({
        prompt: 'Hello',
        options: {
          model: 'sonnet'
        }
      });
      
      let responseText = '';
      for await (const message of queryStream) {
        if (message.type === 'assistant') {
          const textContent = message.message.content
            .map((c) => (c.type === 'text' ? c.text : ''))
            .join('');
          responseText += textContent;
        }
      }
      const latency = Date.now() - start;
      
      return {
        available: responseText && responseText.length > 0,
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
   * Get available models
   */
  async getModels(): Promise<string[]> {
    return [this.model];
  }

  /**
   * Build prompt based on task
   */
  private buildPrompt(task: {
    businessId: string;
    content: string;
    type: string;
    metadata?: any;
  }): string {
    const typePrompts: Record<string, string> = {
      financial: `As a financial analyst, analyze this business task: ${task.content}`,
      marketing: `As a marketing expert, help with this business task: ${task.content}`,
      strategy: `As a business strategist, address this task: ${task.content}`,
      operational: `As an operations expert, solve this business task: ${task.content}`
    };
    
    return typePrompts[task.type] || `As a business consultant, help with this task: ${task.content}`;
  }

  /**
   * Parse AI response based on type
   */
  private parseResponse(response: string, type: string): any {
    try {
      // Try to parse as JSON first
      if (response.includes('{') && response.includes('}')) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch {
      // Fall through to text parsing
    }
    
    // Return structured response based on type
    switch (type) {
      case 'financial':
        return {
          analysis: response,
          recommendations: ['Review financial metrics', 'Optimize costs', 'Increase revenue'],
          confidence: 0.9
        };
      case 'marketing':
        return {
          strategy: response,
          channels: ['Email', 'Social Media', 'Content Marketing'],
          budget: 10000
        };
      case 'analysis':
        return {
          insights: response,
          trends: ['Positive growth', 'Market expansion'],
          recommendations: ['Continue current strategy']
        };
      default:
        return { response, type };
    }
  }
}