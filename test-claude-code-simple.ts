#!/usr/bin/env -S npx tsx

/**
 * Simple test to verify Claude Code SDK returns AI results
 */

import { query } from '@anthropic-ai/claude-code';

async function testClaudeCodeResponse() {
  console.log('🧪 Testing Claude Code SDK response...');
  console.log('=' .repeat(50));
  
  try {
    const start = Date.now();
    
    console.log('📤 Sending query: "What is 2+2?"');
    
    const queryStream = query({
      prompt: 'What is 2+2? Give a brief answer.',
      options: {
        model: 'sonnet'
      }
    });
    
    console.log('📡 Collecting response...');
    let fullResponse = '';
    let messageCount = 0;
    
    for await (const message of queryStream) {
      messageCount++;
      console.log(`📨 Message ${messageCount}:`, typeof message, message.type || 'unknown');
      
      if (message.type === 'assistant') {
        // Extract text from assistant message content
        const textContent = message.message.content
          .map((c) => (c.type === 'text' ? c.text : ''))
          .join('');
        fullResponse += textContent;
        console.log('📝 Assistant text:', textContent);
      } else if (message.type === 'result') {
        console.log('📊 Result message:', {
          session_id: message.session_id,
          duration_ms: message.duration_ms,
          cost_usd: message.total_cost_usd
        });
      }
    }
    
    const duration = Date.now() - start;
    
    console.log('📥 Final Response:');
    console.log('-'.repeat(30));
    console.log(fullResponse || 'No text content received');
    console.log('-'.repeat(30));
    console.log(`📊 Messages received: ${messageCount}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    
    if (fullResponse.trim()) {
      console.log('✅ SUCCESS: Claude Code SDK returned AI response');
      return true;
    } else {
      console.log('⚠️  WARNING: No text content in response');
      return false;
    }
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
testClaudeCodeResponse()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });