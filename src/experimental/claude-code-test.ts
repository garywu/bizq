#!/usr/bin/env -S npx tsx

/**
 * BizQ - Testing Claude Code Community SDK Integration
 * Using @instantlyeasy/claude-code-sdk-ts
 */

import { ClaudeCodeSDK } from '@instantlyeasy/claude-code-sdk-ts';

async function testClaudeCodeSDK() {
  console.log('🧪 Testing Claude Code SDK Integration\n');
  
  try {
    // Initialize the SDK
    const sdk = new ClaudeCodeSDK({
      model: 'sonnet', // or 'opus'
      maxTurns: 3,
      allowTools: ['Read', 'Write', 'Bash'],
      allowedCommands: ['npm', 'node', 'git'],
      appendSystemPrompt: 'You are helping build BizQ, an AI-first business management platform.'
    });

    console.log('📋 Test 1: Simple Code Generation');
    console.log('-'.repeat(40));
    
    // Test 1: Simple code generation
    const response1 = await sdk
      .query('Write a TypeScript function that calculates ROI for a business')
      .asText();
    
    console.log('Response:', response1);
    console.log();

    console.log('📋 Test 2: Code Analysis');
    console.log('-'.repeat(40));
    
    // Test 2: Analyze existing code
    const response2 = await sdk
      .query('Analyze the BizQ marketplace.ts file and suggest improvements')
      .withWorkingDirectory('/Users/admin/Work/bizq')
      .asText();
    
    console.log('Response:', response2);
    console.log();

    console.log('📋 Test 3: Streaming Response');
    console.log('-'.repeat(40));
    
    // Test 3: Stream responses for real-time feedback
    console.log('Streaming response:');
    await sdk
      .query('Create a simple task queue system with priorities')
      .onMessage((msg) => {
        process.stdout.write(msg.text || '');
      })
      .asText();
    
    console.log('\n');

    console.log('📋 Test 4: JSON Response');
    console.log('-'.repeat(40));
    
    // Test 4: Get structured JSON response
    const jsonResponse = await sdk
      .query('Generate a JSON schema for a BizQ task object with businessId, content, type, credits, and priority fields')
      .asJSON();
    
    console.log('JSON Response:', JSON.stringify(jsonResponse, null, 2));
    console.log();

    console.log('📋 Test 5: Tool Usage');
    console.log('-'.repeat(40));
    
    // Test 5: Use tools to interact with filesystem
    const toolResponse = await sdk
      .query('List all TypeScript files in the current directory')
      .allowTools('Bash')
      .withWorkingDirectory('/Users/admin/Work/bizq')
      .onToolUse((tool) => {
        console.log(`🔧 Tool used: ${tool.name} - ${tool.input}`);
      })
      .asText();
    
    console.log('Tool Response:', toolResponse);
    console.log();

    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Claude Code SDK:', error);
    console.error('\nNote: This SDK requires Claude Code CLI to be installed and authenticated.');
    console.error('Install with: npm install -g @anthropic-ai/claude-code');
    console.error('Then authenticate with: claude login');
  }
}

// Alternative test using claude-code-js SDK
async function testClaudeCodeJS() {
  console.log('\n🧪 Alternative: Testing claude-code-js SDK\n');
  
  try {
    // Import dynamically since we might not have it installed
    const { query } = await import('claude-code-js');
    
    console.log('📋 Test: Simple Query');
    console.log('-'.repeat(40));
    
    // Simple query
    for await (const message of query('Write a hello world function in TypeScript')) {
      console.log(message);
    }
    
    console.log('\n📋 Test: With Options');
    console.log('-'.repeat(40));
    
    // Query with options
    const options = {
      model: 'sonnet',
      maxTurns: 2,
      allowedTools: ['Read', 'Write'],
      systemPrompt: 'You are a helpful coding assistant for BizQ'
    };
    
    for await (const message of query('Create a simple credit calculation function', options)) {
      console.log(message);
    }
    
    console.log('\n✅ claude-code-js tests completed!');
    
  } catch (error) {
    console.error('❌ Error with claude-code-js:', error);
    console.error('Install with: npm install claude-code-js');
  }
}

// Main execution
async function main() {
  console.log('🚀 BizQ Claude Code SDK Integration Test\n');
  console.log('=' .repeat(50));
  
  // Test the TypeScript SDK
  await testClaudeCodeSDK();
  
  // Optionally test the JavaScript SDK
  // await testClaudeCodeJS();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { testClaudeCodeSDK, testClaudeCodeJS };