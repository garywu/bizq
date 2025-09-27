#!/usr/bin/env -S npx tsx

/**
 * BizQ - Testing Claude Code Community SDK Integration
 * Using proper import syntax
 */

async function testClaudeCodeSDK() {
  console.log('🧪 Testing Claude Code TypeScript SDK\n');
  
  try {
    // Import the SDK with correct syntax
    const { query } = await import('@instantlyeasy/claude-code-sdk-ts');
    
    console.log('📋 Test 1: Simple Query');
    console.log('-'.repeat(40));
    
    // Simple query test
    const result = await query('Write a TypeScript function that calculates business ROI');
    
    // The SDK returns an async generator, so we need to iterate
    for await (const message of result) {
      console.log('Message:', message);
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    
    // Try alternative import approach
    console.log('\n🔄 Trying alternative approach...\n');
    await testAlternativeSDK();
  }
}

async function testAlternativeSDK() {
  try {
    // Check what's actually exported from the module
    const sdkModule = await import('@instantlyeasy/claude-code-sdk-ts');
    console.log('Available exports:', Object.keys(sdkModule));
    
    // Try using the default export if available
    if (sdkModule.default) {
      console.log('Found default export, attempting to use it...');
      const sdk = sdkModule.default;
      
      // Check if it's a function or class
      console.log('Type of default export:', typeof sdk);
      
      if (typeof sdk === 'function') {
        // Try using it as a query function
        const result = await sdk('Generate a simple hello world function');
        console.log('Result:', result);
      }
    }
    
    // Try direct query if available
    if (sdkModule.query) {
      console.log('\nFound query function, testing it...');
      
      const messages = await sdkModule.query('Write a simple addition function in TypeScript', {
        model: 'sonnet',
        maxTurns: 1
      });
      
      for await (const message of messages) {
        console.log('Response:', message);
      }
    }
    
    // Try ClaudeCodeSDK if available
    if (sdkModule.ClaudeCodeSDK) {
      console.log('\nFound ClaudeCodeSDK class...');
      const SDK = sdkModule.ClaudeCodeSDK;
      const instance = new SDK();
      console.log('Created instance:', instance);
    }
    
  } catch (error: any) {
    console.error('❌ Alternative approach failed:', error.message);
  }
}

// Test claude-code-js as fallback
async function testClaudeCodeJS() {
  console.log('\n🧪 Testing claude-code-js SDK\n');
  
  try {
    const { ClaudeCodeSDK } = await import('claude-code-js');
    
    // Initialize SDK
    const sdk = new ClaudeCodeSDK();
    
    console.log('📋 Running query with claude-code-js...');
    
    // Execute a query
    const response = await sdk.query('Write a hello world function', {
      model: 'sonnet',
      maxTurns: 1
    });
    
    // Process the response
    for await (const message of response) {
      console.log(message);
    }
    
    console.log('\n✅ claude-code-js test completed!');
    
  } catch (error: any) {
    console.error('❌ claude-code-js error:', error.message);
    
    if (error.message.includes('Cannot find module')) {
      console.log('\nℹ️ Install claude-code-js with: npm install claude-code-js');
    }
  }
}

// Check if Claude Code CLI is installed
async function checkClaudeCLI() {
  console.log('\n🔍 Checking Claude Code CLI installation...\n');
  
  try {
    const { execSync } = require('child_process');
    const version = execSync('claude --version', { encoding: 'utf-8' });
    console.log('✅ Claude Code CLI found:', version.trim());
    return true;
  } catch (error) {
    console.log('❌ Claude Code CLI not found');
    console.log('\nTo install Claude Code CLI:');
    console.log('  npm install -g @anthropic-ai/claude-code');
    console.log('  claude login');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 BizQ Claude Code SDK Integration Test\n');
  console.log('=' .repeat(50));
  
  // Check CLI first
  const hasClaudeCLI = await checkClaudeCLI();
  
  if (!hasClaudeCLI) {
    console.log('\n⚠️ Claude Code CLI is required for these SDKs to work');
    console.log('They wrap the CLI functionality, not direct API access');
  }
  
  // Test TypeScript SDK
  await testClaudeCodeSDK();
  
  // Test JavaScript SDK
  await testClaudeCodeJS();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { testClaudeCodeSDK, testClaudeCodeJS, checkClaudeCLI };