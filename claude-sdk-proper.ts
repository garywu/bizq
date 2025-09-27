#!/usr/bin/env -S npx tsx

/**
 * Proper Claude Code SDK usage based on Python SDK patterns
 * Non-interactive mode with max_turns=1
 */

import { query } from '@instantlyeasy/claude-code-sdk-ts';

interface ClaudeCodeOptions {
  model?: 'opus' | 'sonnet';
  maxTurns?: number;
  allowedTools?: string[];
  permissionMode?: 'acceptEdits' | 'askUser' | 'rejectEdits';
  systemPrompt?: string;
  customSystemPrompt?: string;
  appendSystemPrompt?: string;
  json?: boolean;
}

class ClaudeCodeClient {
  private defaultOptions: ClaudeCodeOptions = {
    model: 'sonnet',
    maxTurns: 1,  // Critical for non-interactive mode
    allowedTools: [],  // No tools for non-interactive
    permissionMode: 'rejectEdits',  // Don't try to edit files
    json: false
  };

  /**
   * Execute a non-interactive query
   */
  async query(prompt: string, options?: ClaudeCodeOptions): Promise<string> {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    console.log('🔄 Executing query with options:', finalOptions);
    
    try {
      const messages = [];
      let responseText = '';
      
      // Execute query with non-interactive settings
      for await (const message of query(prompt, finalOptions)) {
        messages.push(message);
        
        // Extract text from assistant messages
        if (message.type === 'assistant' && message.content) {
          for (const content of message.content) {
            if (content.type === 'text') {
              responseText += content.text + '\n';
            }
          }
        }
        
        // Stop after getting a result
        if (message.type === 'result') {
          break;
        }
      }
      
      return responseText.trim() || 'No response generated';
      
    } catch (error: any) {
      console.error('❌ Query error:', error.message);
      throw error;
    }
  }

  /**
   * Execute a simple calculation (test case)
   */
  async calculate(expression: string): Promise<string> {
    return this.query(`Calculate: ${expression}. Just give the numeric answer.`, {
      maxTurns: 1,
      allowedTools: []
    });
  }

  /**
   * Generate code
   */
  async generateCode(description: string, language = 'typescript'): Promise<string> {
    const prompt = `Generate ${language} code for: ${description}. Return only the code, no explanations.`;
    
    return this.query(prompt, {
      maxTurns: 1,
      allowedTools: [],
      systemPrompt: 'You are a code generator. Return only code without explanations.'
    });
  }

  /**
   * Analyze business data
   */
  async analyzeData(data: any): Promise<string> {
    const prompt = `Analyze this data and provide insights: ${JSON.stringify(data)}`;
    
    return this.query(prompt, {
      maxTurns: 1,
      allowedTools: [],
      systemPrompt: 'You are a business analyst. Provide concise insights.'
    });
  }
}

// Test the proper SDK usage
async function testProperSDK() {
  console.log('🚀 Testing Proper Claude Code SDK Usage\n');
  console.log('=' .repeat(50));
  
  const client = new ClaudeCodeClient();
  
  // Test 1: Simple calculation
  console.log('\n📋 Test 1: Simple Calculation');
  console.log('-'.repeat(30));
  
  try {
    const result = await client.calculate('2 + 2');
    console.log('Result:', result);
  } catch (error: any) {
    console.log('Error:', error.message);
  }
  
  // Test 2: Code generation
  console.log('\n📋 Test 2: Code Generation');
  console.log('-'.repeat(30));
  
  try {
    const code = await client.generateCode('function to calculate factorial');
    console.log('Generated code:\n', code);
  } catch (error: any) {
    console.log('Error:', error.message);
  }
  
  // Test 3: Business analysis
  console.log('\n📋 Test 3: Business Analysis');
  console.log('-'.repeat(30));
  
  try {
    const analysis = await client.analyzeData({
      revenue: [10000, 12000, 15000],
      costs: [7000, 8000, 9000],
      months: ['Jan', 'Feb', 'Mar']
    });
    console.log('Analysis:', analysis);
  } catch (error: any) {
    console.log('Error:', error.message);
  }
}

// Alternative: Direct usage matching Python SDK pattern
async function testDirectPattern() {
  console.log('\n🧪 Direct Pattern (Python SDK Style)\n');
  console.log('=' .repeat(50));
  
  // Exactly like Python SDK example
  const options = {
    maxTurns: 1,
    allowedTools: [],
    permissionMode: 'rejectEdits' as const
  };
  
  console.log('Query: "What is 2 + 2?"');
  
  try {
    let response = '';
    for await (const message of query('What is 2 + 2?', options)) {
      if (message.type === 'assistant' && message.content) {
        for (const content of message.content) {
          if (content.type === 'text') {
            response += content.text;
          }
        }
      }
    }
    console.log('Response:', response);
  } catch (error: any) {
    console.log('Error:', error.message);
  }
}

// Main execution
async function main() {
  // Test the proper client
  await testProperSDK();
  
  // Test direct pattern
  await testDirectPattern();
  
  console.log('\n✅ Tests completed');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { ClaudeCodeClient };