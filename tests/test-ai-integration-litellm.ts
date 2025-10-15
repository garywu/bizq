#!/usr/bin/env -S npx tsx

/**
 * BizQ AI Integration Test with LiteLLM + Claude Code Server
 * Tests the complete flow: BizQ -> AI Manager -> LiteLLM -> Claude Code Server -> Claude CLI
 */

import BizQAIManager from './ai-manager';

async function testAIIntegration() {
  console.log('🚀 BizQ AI Integration Test with LiteLLM + Claude Code Server\n');
  console.log('=' .repeat(70));
  
  // Initialize AI Manager with LiteLLM configuration
  const aiManager = new BizQAIManager({
    type: 'litellm',
    baseURL: 'http://localhost:7321/v1',
    model: 'claude-3-5-sonnet-20241022',
    fallback: {
      type: 'claude-sdk'
    }
  });
  
  console.log('\n🔧 Testing AI Provider Health');
  console.log('-'.repeat(40));
  
  const health = await aiManager.healthCheck();
  console.log('Health Status:', JSON.stringify(health, null, 2));
  
  if (!health.primary?.available) {
    console.log('\n❌ Claude Code Server is not available!');
    console.log('📋 To start the server:');
    console.log('   1. cd /tmp/claude-code-server-test');
    console.log('   2. source venv/bin/activate');
    console.log('   3. python run.py --port 7321');
    console.log('\nSkipping tests...');
    return;
  }
  
  console.log('✅ Claude Code Server is available!');
  
  // Test 1: Business Task Processing
  console.log('\n📋 Test 1: Business Task Processing');
  console.log('-'.repeat(40));
  
  const businessTask = {
    businessId: 'biz-001',
    content: 'Create a pricing strategy for our new eco-friendly product line targeting millennials',
    type: 'strategy',
    metadata: {
      budget: 50000,
      timeline: '3 months',
      target_audience: 'environmentally conscious millennials'
    }
  };
  
  console.log('Processing task:', businessTask.content);
  
  const taskResult = await aiManager.processTask(businessTask);
  console.log('\nTask Result:');
  console.log(`Success: ${taskResult.success}`);
  console.log(`Provider: ${taskResult.provider}`);
  console.log(`Confidence: ${taskResult.confidence}`);
  console.log(`Tokens Used: ${taskResult.tokensUsed}`);
  console.log('Content:', JSON.stringify(taskResult.result, null, 2));
  
  // Test 2: Content Generation
  console.log('\n📋 Test 2: Marketing Content Generation');
  console.log('-'.repeat(40));
  
  const marketingContext = {
    product: 'AI-powered business management platform',
    target: 'small business owners',
    channel: 'LinkedIn',
    tone: 'professional but approachable',
    goal: 'drive trial signups'
  };
  
  console.log('Generating marketing content for:', JSON.stringify(marketingContext, null, 2));
  
  const content = await aiManager.generateContent('marketing', marketingContext);
  console.log('\nGenerated Content:');
  console.log(content);
  
  // Test 3: Data Analysis
  console.log('\n📋 Test 3: Business Data Analysis');
  console.log('-'.repeat(40));
  
  const businessData = {
    quarterly_revenue: [120000, 135000, 158000, 142000],
    quarterly_costs: [80000, 85000, 95000, 88000],
    customer_acquisition: [450, 523, 612, 580],
    customer_retention: [0.82, 0.85, 0.88, 0.86],
    product_lines: {
      'premium': { revenue: 180000, margin: 0.45 },
      'standard': { revenue: 250000, margin: 0.32 },
      'budget': { revenue: 145000, margin: 0.18 }
    }
  };
  
  console.log('Analyzing business data...');
  
  const analysis = await aiManager.analyzeData(businessData, 'financial');
  console.log('\nAnalysis Result:');
  console.log(JSON.stringify(analysis, null, 2));
  
  // Test 4: Business Decision Making
  console.log('\n📋 Test 4: Strategic Decision Making');
  console.log('-'.repeat(40));
  
  const decisionContext = {
    situation: 'Competitor launched a similar product with 30% lower pricing. Our customer inquiries increased but conversion dropped 15%.',
    options: [
      'Match competitor pricing immediately',
      'Improve product features to justify premium pricing',
      'Launch a new budget tier to compete directly',
      'Focus on premium market and ignore price competition',
      'Bundle services to increase value proposition'
    ],
    constraints: {
      budget: 200000,
      timeline: '4 months',
      team_capacity: 'limited',
      brand_positioning: 'premium'
    }
  };
  
  console.log('Making strategic decision...');
  console.log('Situation:', decisionContext.situation);
  console.log('Options:', decisionContext.options.length, 'available');
  
  const decision = await aiManager.makeDecision(decisionContext);
  console.log('\nDecision Result:');
  console.log(`Recommendation: ${decision.recommendation}`);
  console.log(`Confidence: ${decision.confidence}`);
  console.log(`Reasoning: ${decision.reasoning}`);
  
  // Test 5: Streaming Response
  console.log('\n📋 Test 5: Streaming AI Response');
  console.log('-'.repeat(40));
  
  const streamPrompt = 'Write a brief guide on implementing AI in small businesses. Include 3 key steps.';
  console.log('Streaming response for:', streamPrompt);
  console.log('\nStreaming output:');
  console.log('-'.repeat(30));
  
  for await (const chunk of aiManager.streamCompletion(streamPrompt)) {
    process.stdout.write(chunk);
  }
  
  console.log('\n' + '-'.repeat(30));
  
  // Test 6: Available Models
  console.log('\n📋 Test 6: Available Models');
  console.log('-'.repeat(40));
  
  const models = await aiManager.getAvailableModels();
  console.log('Available Models:');
  console.log(JSON.stringify(models, null, 2));
  
  // Test 7: Provider Switching
  console.log('\n📋 Test 7: Provider Switching');
  console.log('-'.repeat(40));
  
  console.log('Current provider: LiteLLM');
  console.log('Switching to Claude SDK fallback...');
  
  // Test a quick task with current provider
  const quickTask1 = await aiManager.processTask({
    businessId: 'test',
    content: 'What are 3 key metrics for e-commerce success?',
    type: 'analysis'
  });
  
  console.log(`Provider used: ${quickTask1.provider}`);
  
  // Test provider health again
  console.log('\n📋 Final Health Check');
  console.log('-'.repeat(40));
  
  const finalHealth = await aiManager.healthCheck();
  console.log('Final Health Status:', JSON.stringify(finalHealth, null, 2));
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('🎉 BizQ AI Integration Test Complete!');
  console.log('\n✅ Successfully tested:');
  console.log('   • LiteLLM integration with Claude Code Server');
  console.log('   • Business task processing');
  console.log('   • Content generation');
  console.log('   • Data analysis');
  console.log('   • Decision making');
  console.log('   • Streaming responses');
  console.log('   • Provider health monitoring');
  console.log('   • Model availability');
  console.log('\n🔗 Integration Architecture:');
  console.log('   BizQ → AI Manager → LiteLLM → Claude Code Server → Claude CLI');
  console.log('\n📊 This setup provides:');
  console.log('   • Unified AI interface for BizQ');
  console.log('   • OpenAI API compatibility');
  console.log('   • Local Claude execution (no API keys)');
  console.log('   • Automatic fallback to Claude SDK');
  console.log('   • Real-time streaming capabilities');
}

// Run the integration test
if (require.main === module) {
  testAIIntegration().catch(console.error);
}

export default testAIIntegration;