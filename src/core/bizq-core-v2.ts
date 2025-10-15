#!/usr/bin/env -S npx tsx

/**
 * BizQ Core V2 - Enhanced with task routing and worker selection
 */

import { EventEmitter } from 'events';

export interface UniversalTask {
  businessId: string;
  content: string;
  type: string;
  credits?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

interface WorkerProfile {
  id: string;
  type: 'ai' | 'human' | 'hybrid';
  capabilities: string[];
  costPerTask: number;
  avgResponseTime: number;
  successRate: number;
}

interface TaskDecomposition {
  subtasks: Array<{
    id: string;
    content: string;
    type: string;
    dependencies: string[];
    estimatedCredits: number;
  }>;
  execution_mode: 'sequential' | 'parallel';
  total_credits: number;
}

export default class BizQCoreV2 extends EventEmitter {
  private cache: Map<string, any> = new Map();
  private workers: Map<string, WorkerProfile> = new Map();
  private taskHistory: any[] = [];

  constructor() {
    super();
    this.initializeWorkers();
  }

  private initializeWorkers() {
    // Register AI workers
    this.workers.set('ai-general', {
      id: 'ai-general',
      type: 'ai',
      capabilities: ['analysis', 'reporting', 'content', 'optimization'],
      costPerTask: 1,
      avgResponseTime: 2,
      successRate: 95
    });

    // Register human workers
    this.workers.set('human-expert', {
      id: 'human-expert',
      type: 'human',
      capabilities: ['strategy', 'negotiation', 'creativity', 'judgment'],
      costPerTask: 10,
      avgResponseTime: 3600,
      successRate: 99
    });
  }

  async submitTask(task: UniversalTask): Promise<any> {
    console.log(`\n🎯 New task: ${task.content}`);
    
    // Check cache first
    const cacheKey = this.getCacheKey(task);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('💎 CACHE HIT! Instant return');
      console.log(`💰 Pay residual 1 credit to original creator: ${cached.creator}`);
      this.emit('cache:hit', { task, cached });
      return cached.result;
    }

    // Determine task complexity
    const complexity = this.assessComplexity(task);
    
    if (complexity === 'simple') {
      return this.handleSimpleTask(task);
    } else {
      return this.handleComplexTask(task);
    }
  }

  private getCacheKey(task: UniversalTask): string {
    return `${task.type}:${task.content.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }

  private assessComplexity(task: UniversalTask): 'simple' | 'complex' {
    const complexKeywords = ['strategy', 'negotiate', 'review', 'legal', 'campaign', 'launch'];
    const isComplex = complexKeywords.some(keyword => 
      task.content.toLowerCase().includes(keyword)
    );
    return isComplex ? 'complex' : 'simple';
  }

  private async handleSimpleTask(task: UniversalTask): Promise<any> {
    console.log('🤖 AI handling simple task...');
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = {
      status: 'completed',
      output: `AI processed: ${task.content}`,
      confidence: 0.95,
      credits_used: 1
    };

    // Cache the result
    this.cache.set(this.getCacheKey(task), {
      result,
      creator: 'ai-general',
      timestamp: new Date()
    });

    console.log('✅ Task completed by AI');
    this.emit('task:completed', { task, result });
    
    return result;
  }

  private async handleComplexTask(task: UniversalTask): Promise<any> {
    console.log('🔄 Complex task detected, decomposing...');
    
    // Decompose task into subtasks
    const decomposition = await this.decomposeTask(task);
    
    console.log(`📊 Split into ${decomposition.subtasks.length} subtasks`);
    decomposition.subtasks.forEach(st => {
      console.log(`  - ${st.content} (${st.estimatedCredits} credits)`);
    });

    // Route subtasks to appropriate workers
    const subtasks = decomposition.subtasks.map(st => ({
      ...st,
      worker: this.selectWorker(st.type)
    }));

    // Execute based on execution mode
    const results = await this.executeSubtasks(subtasks, decomposition.execution_mode);

    // Aggregate results
    const finalResult = await this.aggregateResults(task, results);

    // Cache the aggregated result
    this.cache.set(this.getCacheKey(task), {
      result: finalResult,
      creator: 'bizq-orchestrator',
      timestamp: new Date()
    });

    console.log('✅ Complex task completed');
    this.emit('task:completed', { task, result: finalResult });

    return finalResult;
  }

  private async decomposeTask(task: UniversalTask): Promise<TaskDecomposition> {
    // Simulate intelligent task decomposition
    if (task.content.includes('campaign')) {
      return {
        subtasks: [
          {
            id: 'st1',
            content: 'Analyze target audience',
            type: 'analysis',
            dependencies: [],
            estimatedCredits: 2
          },
          {
            id: 'st2',
            content: 'Create campaign content',
            type: 'content',
            dependencies: ['st1'],
            estimatedCredits: 3
          },
          {
            id: 'st3',
            content: 'Optimize distribution channels',
            type: 'optimization',
            dependencies: ['st1'],
            estimatedCredits: 2
          }
        ],
        execution_mode: 'parallel',
        total_credits: 7
      };
    }

    // Default decomposition
    return {
      subtasks: [{
        id: 'st1',
        content: task.content,
        type: task.type,
        dependencies: [],
        estimatedCredits: task.credits || 5
      }],
      execution_mode: 'sequential',
      total_credits: task.credits || 5
    };
  }

  private selectWorker(taskType: string): string {
    // Route to appropriate worker based on task type
    const humanRequiredTypes = ['legal', 'negotiation', 'strategy'];
    
    if (humanRequiredTypes.includes(taskType)) {
      this.emit('task:human-required', { type: taskType });
      return 'human-expert';
    }
    
    return 'ai-general';
  }

  private async executeSubtasks(subtasks: any[], mode: string): Promise<any[]> {
    if (mode === 'parallel') {
      console.log('⚡ Executing subtasks in parallel...');
      return Promise.all(subtasks.map(st => this.executeSubtask(st)));
    } else {
      console.log('📝 Executing subtasks sequentially...');
      const results = [];
      for (const subtask of subtasks) {
        results.push(await this.executeSubtask(subtask));
      }
      return results;
    }
  }

  private async executeSubtask(subtask: any): Promise<any> {
    const worker = this.workers.get(subtask.worker);
    
    console.log(`  ⚙️ ${worker?.type} worker handling: ${subtask.content}`);
    
    // Simulate execution time based on worker type
    const delay = worker?.type === 'ai' ? 500 : 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return {
      subtaskId: subtask.id,
      output: `Processed by ${worker?.id}: ${subtask.content}`,
      worker: worker?.id,
      creditsUsed: subtask.estimatedCredits
    };
  }

  private async aggregateResults(task: UniversalTask, results: any[]): Promise<any> {
    console.log('🔗 Aggregating results...');
    
    return {
      status: 'completed',
      task: task.content,
      subtaskResults: results,
      totalCreditsUsed: results.reduce((sum, r) => sum + r.creditsUsed, 0),
      completedAt: new Date()
    };
  }
}

// Export for use in other modules
if (require.main === module) {
  // Demo if run directly
  async function demo() {
    const core = new BizQCoreV2();
    
    await core.submitTask({
      businessId: 'biz-001',
      content: 'Generate monthly financial report',
      type: 'reporting',
      credits: 2
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    await core.submitTask({
      businessId: 'biz-002',
      content: 'Launch Black Friday marketing campaign',
      type: 'campaign',
      credits: 10
    });
  }
  
  demo().catch(console.error);
}