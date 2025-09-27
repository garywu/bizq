#!/usr/bin/env -S npx tsx

/**
 * Test BizQ Claude Code Provider
 */

import { ClaudeCodeProvider } from './ai-provider-claude-code.js';

async function testBizQProvider() {
  console.log('🧪 Testing BizQ Claude Code Provider...');
  console.log('=' .repeat(50));
  
  const provider = new ClaudeCodeProvider();
  
  try {
    console.log('📤 Testing business task processing...');
    
    const result = await provider.processTask({
      businessId: 'test-001',
      content: 'What are 3 ways to improve customer retention?',
      type: 'strategy'
    });
    
    console.log('📥 Task Result:');
    console.log('-'.repeat(30));
    console.log('Success:', result.success);
    console.log('Confidence:', result.confidence);
    if (result.result) {
      console.log('Response type:', typeof result.result);
      console.log('Response:', JSON.stringify(result.result, null, 2));
    }
    if (result.error) {
      console.log('Error:', result.error);
    }
    console.log('-'.repeat(30));
    
    if (result.success) {
      console.log('✅ SUCCESS: BizQ Provider processed task successfully');
      return true;
    } else {
      console.log('❌ FAILED: Task processing failed');
      return false;
    }
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    return false;
  }
}

// Run the test
testBizQProvider()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });