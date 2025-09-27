#!/usr/bin/env -S npx tsx

/**
 * BizQ Core with Real AI Integration
 * Uses Claude Code SDK for actual AI processing
 */

import { EventEmitter } from 'events';
import BizQAIProvider from './ai-provider';

export interface UniversalTask {
  businessId: string;
  content: string;
  type: string;
  credits?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export class BizQCoreWithAI extends EventEmitter {
  private ai: BizQAIProvider;
  private cache: Map<string, any> = new Map();
  private taskHistory: any[] = [];
  private creditsSpent: number = 0;
  private creditsSaved: number = 0;

  constructor() {
    super();
    this.ai = new BizQAIProvider();
    console.log('🌟 BizQ Core initialized with real AI capabilities');
  }

  async submitTask(task: UniversalTask): Promise<any> {
    console.log(`\n🎯 Processing task: ${task.content}`);
    
    // Check cache first
    const cacheKey = this.getCacheKey(task);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('💎 CACHE HIT! Instant return');
      console.log(`💰 Saved ${task.credits || 10} credits`);
      this.creditsSaved += task.credits || 10;
      
      // Pay residual to original creator
      const residualCredits = Math.ceil((task.credits || 10) * 0.1);
      console.log(`💸 Pay ${residualCredits} credit residual to: ${cached.creator}`);
      
      this.emit('cache:hit', { task, cached });
      return cached.result;
    }

    // Process with AI
    const startTime = Date.now();
    const aiResponse = await this.ai.processTask(task);
    const processingTime = Date.now() - startTime;
    
    if (aiResponse.success) {
      console.log(`✅ AI completed task in ${processingTime}ms`);
      console.log(`📊 Confidence: ${(aiResponse.confidence * 100).toFixed(1)}%`);
      
      if (aiResponse.tokensUsed) {
        console.log(`🔤 Tokens used: ${aiResponse.tokensUsed}`);
      }
      
      // Calculate credits used
      const creditsUsed = this.calculateCredits(task, processingTime);
      this.creditsSpent += creditsUsed;
      console.log(`💰 Credits spent: ${creditsUsed}`);
      
      // Cache successful results
      this.cache.set(cacheKey, {
        result: aiResponse.result,
        creator: 'ai-claude-code',
        timestamp: new Date(),
        processingTime,
        credits: creditsUsed
      });
      
      // Store in history
      this.taskHistory.push({
        task,
        result: aiResponse.result,
        timestamp: new Date(),
        processingTime,
        credits: creditsUsed
      });
      
      this.emit('task:completed', { task, result: aiResponse.result, credits: creditsUsed });
      
      return aiResponse.result;
      
    } else {
      console.log(`❌ AI failed: ${aiResponse.error}`);
      console.log('🔄 Routing to human marketplace...');
      
      this.emit('task:human-required', task);
      
      return {
        status: 'pending_human',
        message: 'Task requires human expertise',
        error: aiResponse.error
      };
    }
  }

  /**
   * Bulk task processing
   */
  async submitBulkTasks(tasks: UniversalTask[]): Promise<any[]> {
    console.log(`\n📦 Processing ${tasks.length} tasks in bulk`);
    
    const results = [];
    let cachedCount = 0;
    
    for (const task of tasks) {
      const result = await this.submitTask(task);
      results.push(result);
      
      // Check if it was cached
      const cacheKey = this.getCacheKey(task);
      if (this.cache.has(cacheKey)) {
        cachedCount++;
      }
    }
    
    console.log(`\n📊 Bulk processing complete:`);
    console.log(`  - Total tasks: ${tasks.length}`);
    console.log(`  - Cache hits: ${cachedCount}`);
    console.log(`  - Credits spent: ${this.creditsSpent}`);
    console.log(`  - Credits saved: ${this.creditsSaved}`);
    
    return results;
  }

  /**
   * Generate business insights
   */
  async generateInsights(businessId: string): Promise<any> {
    const recentTasks = this.taskHistory.filter(h => 
      h.task.businessId === businessId
    ).slice(-10);
    
    if (recentTasks.length === 0) {
      return { message: 'No task history for insights' };
    }
    
    const analysisData = {
      taskCount: recentTasks.length,
      avgProcessingTime: recentTasks.reduce((sum, t) => sum + t.processingTime, 0) / recentTasks.length,
      totalCredits: recentTasks.reduce((sum, t) => sum + t.credits, 0),
      taskTypes: recentTasks.map(t => t.task.type)
    };
    
    const insights = await this.ai.analyzeData(analysisData, 'business_performance');
    
    return {
      businessId,
      insights,
      metrics: analysisData
    };
  }

  /**
   * Make strategic decisions
   */
  async makeStrategicDecision(context: {
    businessId: string;
    situation: string;
    options: string[];
  }): Promise<any> {
    const decision = await this.ai.makeDecision(context);
    
    // Store decision in history
    this.taskHistory.push({
      task: {
        businessId: context.businessId,
        content: context.situation,
        type: 'strategic_decision'
      },
      result: decision,
      timestamp: new Date(),
      processingTime: 0,
      credits: 5
    });
    
    this.creditsSpent += 5;
    
    return decision;
  }

  /**
   * Get platform statistics
   */
  getStats() {
    const successfulTasks = this.taskHistory.filter(h => h.result);
    const avgProcessingTime = successfulTasks.length > 0 ?
      successfulTasks.reduce((sum, t) => sum + t.processingTime, 0) / successfulTasks.length : 0;
    
    return {
      totalTasks: this.taskHistory.length,
      cacheSize: this.cache.size,
      cacheHitRate: this.cache.size > 0 ? 
        (this.creditsSaved / (this.creditsSpent + this.creditsSaved) * 100).toFixed(1) + '%' : '0%',
      creditsSpent: this.creditsSpent,
      creditsSaved: this.creditsSaved,
      avgProcessingTime: Math.round(avgProcessingTime),
      netSavings: this.creditsSaved - this.creditsSpent * 0.1 // Account for residuals
    };
  }

  private getCacheKey(task: UniversalTask): string {
    return `${task.type}:${task.content.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50)}`;
  }

  private calculateCredits(task: UniversalTask, processingTime: number): number {
    // Base credits
    let credits = task.credits || 5;
    
    // Adjust based on processing time
    if (processingTime > 5000) credits += 2;
    if (processingTime > 10000) credits += 3;
    
    // Adjust based on priority
    if (task.priority === 'urgent') credits += 3;
    if (task.priority === 'high') credits += 1;
    
    return credits;
  }
}

// Demo with real AI
async function demo() {
  console.log('🚀 BizQ Core with Real AI Demo');
  console.log('=' .repeat(50));
  
  const bizq = new BizQCoreWithAI();
  
  // Listen to events
  bizq.on('task:completed', ({ task, credits }) => {
    console.log(`\n✨ Event: Task completed for ${task.businessId} (${credits} credits)`);
  });
  
  bizq.on('cache:hit', ({ task }) => {
    console.log(`\n⚡ Event: Cache hit for "${task.content}"`);
  });
  
  // Test 1: Single task
  console.log('\n📌 Test 1: Single AI Task');
  console.log('-'.repeat(30));
  
  await bizq.submitTask({
    businessId: 'biz-001',
    content: 'Create a pricing strategy for subscription service',
    type: 'strategy',
    priority: 'high'
  });
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 2000));
  
  // Test 2: Cached task (same as above)
  console.log('\n📌 Test 2: Cached Task');
  console.log('-'.repeat(30));
  
  await bizq.submitTask({
    businessId: 'biz-002',
    content: 'Create a pricing strategy for subscription service',
    type: 'strategy'
  });
  
  // Test 3: Different task
  console.log('\n📌 Test 3: Marketing Task');
  console.log('-'.repeat(30));
  
  await bizq.submitTask({
    businessId: 'biz-001',
    content: 'Generate Instagram post for product launch',
    type: 'marketing',
    priority: 'medium'
  });
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 2000));
  
  // Test 4: Strategic decision
  console.log('\n📌 Test 4: Strategic Decision');
  console.log('-'.repeat(30));
  
  const decision = await bizq.makeStrategicDecision({
    businessId: 'biz-001',
    situation: 'Competitor just lowered prices by 20%',
    options: [
      'Match the price reduction',
      'Maintain prices and emphasize quality',
      'Offer temporary discount with value-adds'
    ]
  });
  
  console.log('Strategic Decision:', decision);
  
  // Test 5: Generate insights
  console.log('\n📌 Test 5: Business Insights');
  console.log('-'.repeat(30));
  
  const insights = await bizq.generateInsights('biz-001');
  console.log('Insights:', insights);
  
  // Show final stats
  console.log('\n📊 Platform Statistics');
  console.log('=' .repeat(50));
  console.log(bizq.getStats());
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export default BizQCoreWithAI;