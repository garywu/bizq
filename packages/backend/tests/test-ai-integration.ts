#!/usr/bin/env -S npx tsx

/**
 * Quick test of AI integration
 */

import { query } from '@instantlyeasy/claude-code-sdk-ts';

async function quickTest() {
  console.log('🧪 Quick AI Integration Test\n');
  
  try {
    console.log('Sending query to Claude Code...');
    
    let responseReceived = false;
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        console.log('\n⏱️ Query is taking time, Claude Code may be processing...');
      }
    }, 5000);
    
    const messages = [];
    for await (const message of query('Write a simple hello world function')) {
      responseReceived = true;
      clearTimeout(timeout);
      
      if (message.type === 'assistant' && message.content) {
        for (const content of message.content) {
          if (content.type === 'text') {
            console.log('\n✅ Response received:');
            console.log(content.text);
            messages.push(content.text);
          }
        }
      }
      
      if (message.usage) {
        console.log('\n📊 Token usage:', message.usage.output_tokens);
      }
    }
    
    console.log('\n✨ Integration successful!');
    return messages.join('\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

quickTest().then(result => {
  if (result) {
    console.log('\n🎉 AI integration is working with BizQ!');
  }
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});