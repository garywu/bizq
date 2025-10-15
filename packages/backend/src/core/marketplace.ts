#!/usr/bin/env -S npx tsx

/**
 * BizQ Marketplace Layer
 * Where workers register, claim tasks, and build reputation
 */

import { EventEmitter } from 'events';

// Worker types and capabilities
export interface WorkerProfile {
  id: string;
  name: string;
  type: 'ai' | 'human' | 'hybrid';
  capabilities: string[];
  rating: number;
  completedTasks: number;
  earnings: number;
  availability: 'available' | 'busy' | 'offline';
  specializations: string[];
  pricePerTask: number;
  responseTime: number; // average in seconds
  successRate: number; // percentage
}

// Task marketplace listing
export interface MarketplaceTask {
  id: string;
  title: string;
  description: string;
  category: string;
  requiredCapabilities: string[];
  creditReward: number;
  estimatedTime: number; // in seconds
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: Date;
  submittedBy: string;
  status: 'open' | 'claimed' | 'in_progress' | 'completed' | 'disputed';
  claimedBy?: string;
  claimedAt?: Date;
  completedAt?: Date;
  result?: any;
  rating?: number;
}

// Marketplace statistics
interface MarketplaceStats {
  totalWorkers: number;
  activeWorkers: number;
  openTasks: number;
  completedToday: number;
  averageCompletionTime: number;
  totalCreditsCirculated: number;
}

export class BizQMarketplace extends EventEmitter {
  private workers: Map<string, WorkerProfile> = new Map();
  private tasks: Map<string, MarketplaceTask> = new Map();
  private taskQueue: MarketplaceTask[] = [];
  private workerTasks: Map<string, Set<string>> = new Map();
  
  constructor() {
    super();
    this.initializeMarketplace();
  }

  private initializeMarketplace() {
    // Register some initial AI workers
    this.registerWorker({
      id: 'ai-worker-1',
      name: 'DataProcessor AI',
      type: 'ai',
      capabilities: ['data_analysis', 'reporting', 'forecasting'],
      rating: 4.8,
      completedTasks: 1250,
      earnings: 5000,
      availability: 'available',
      specializations: ['financial_analysis', 'market_research'],
      pricePerTask: 5,
      responseTime: 2,
      successRate: 98
    });

    this.registerWorker({
      id: 'ai-worker-2',
      name: 'ContentCreator AI',
      type: 'ai',
      capabilities: ['content_creation', 'copywriting', 'seo'],
      rating: 4.9,
      completedTasks: 890,
      earnings: 4450,
      availability: 'available',
      specializations: ['blog_posts', 'product_descriptions', 'ad_copy'],
      pricePerTask: 5,
      responseTime: 5,
      successRate: 96
    });

    // Register human workers
    this.registerWorker({
      id: 'human-worker-1',
      name: 'Sarah Marketing Expert',
      type: 'human',
      capabilities: ['strategy', 'campaign_management', 'brand_development'],
      rating: 4.95,
      completedTasks: 450,
      earnings: 13500,
      availability: 'available',
      specializations: ['ecommerce', 'social_media', 'influencer_marketing'],
      pricePerTask: 30,
      responseTime: 3600,
      successRate: 99
    });

    this.registerWorker({
      id: 'human-worker-2',
      name: 'Mike Legal Advisor',
      type: 'human',
      capabilities: ['legal_review', 'contract_drafting', 'compliance'],
      rating: 5.0,
      completedTasks: 220,
      earnings: 22000,
      availability: 'available',
      specializations: ['business_law', 'intellectual_property', 'contracts'],
      pricePerTask: 100,
      responseTime: 7200,
      successRate: 100
    });

    console.log('🏪 Marketplace initialized with', this.workers.size, 'workers');
  }

  // Register a new worker
  registerWorker(worker: WorkerProfile): void {
    this.workers.set(worker.id, worker);
    this.workerTasks.set(worker.id, new Set());
    this.emit('worker:registered', worker);
    console.log(`✅ Worker registered: ${worker.name} (${worker.type})`);
  }

  // Post a task to the marketplace
  postTask(task: Omit<MarketplaceTask, 'id' | 'status' | 'submittedBy'>): string {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const marketplaceTask: MarketplaceTask = {
      ...task,
      id: taskId,
      status: 'open',
      submittedBy: 'business-owner-1'
    };

    this.tasks.set(taskId, marketplaceTask);
    this.taskQueue.push(marketplaceTask);
    this.emit('task:posted', marketplaceTask);

    // Auto-match with suitable workers
    this.matchTaskWithWorkers(marketplaceTask);

    console.log(`📋 Task posted: ${task.title} (${task.creditReward} credits)`);
    return taskId;
  }

  // Match task with capable workers
  private matchTaskWithWorkers(task: MarketplaceTask): void {
    const capableWorkers = Array.from(this.workers.values()).filter(worker => {
      // Check if worker has required capabilities
      const hasCapabilities = task.requiredCapabilities.every(cap => 
        worker.capabilities.includes(cap)
      );
      
      // Check if worker is available
      const isAvailable = worker.availability === 'available';
      
      // Check if price matches
      const priceAcceptable = worker.pricePerTask <= task.creditReward;
      
      return hasCapabilities && isAvailable && priceAcceptable;
    });

    if (capableWorkers.length > 0) {
      // Sort by rating and response time
      capableWorkers.sort((a, b) => {
        const scoreA = a.rating * a.successRate / a.responseTime;
        const scoreB = b.rating * b.successRate / b.responseTime;
        return scoreB - scoreA;
      });

      console.log(`🎯 Found ${capableWorkers.length} capable workers for task`);
      this.emit('task:matched', { task, workers: capableWorkers });

      // Auto-assign to best AI worker if urgent
      if (task.priority === 'urgent' && capableWorkers[0].type === 'ai') {
        this.claimTask(task.id, capableWorkers[0].id);
      }
    } else {
      console.log('⚠️ No suitable workers found for task');
      this.emit('task:no-match', task);
    }
  }

  // Worker claims a task
  claimTask(taskId: string, workerId: string): boolean {
    const task = this.tasks.get(taskId);
    const worker = this.workers.get(workerId);

    if (!task || !worker) {
      console.error('❌ Task or worker not found');
      return false;
    }

    if (task.status !== 'open') {
      console.error('❌ Task already claimed or completed');
      return false;
    }

    // Verify worker can handle the task
    const canHandle = task.requiredCapabilities.every(cap => 
      worker.capabilities.includes(cap)
    );

    if (!canHandle) {
      console.error('❌ Worker lacks required capabilities');
      return false;
    }

    // Claim the task
    task.status = 'claimed';
    task.claimedBy = workerId;
    task.claimedAt = new Date();

    // Update worker status
    worker.availability = 'busy';
    this.workerTasks.get(workerId)?.add(taskId);

    this.emit('task:claimed', { task, worker });
    console.log(`🤝 Task claimed by ${worker.name}`);

    // Simulate task execution
    this.executeTask(taskId, workerId);

    return true;
  }

  // Execute a claimed task
  private async executeTask(taskId: string, workerId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    const worker = this.workers.get(workerId);

    if (!task || !worker) return;

    task.status = 'in_progress';
    this.emit('task:started', { task, worker });

    console.log(`⚙️ ${worker.name} is working on: ${task.title}`);

    // Simulate work time based on worker type
    const workTime = worker.type === 'ai' ? 
      worker.responseTime * 1000 : 
      Math.min(worker.responseTime * 1000, 5000); // Cap human simulation at 5s

    await new Promise(resolve => setTimeout(resolve, workTime));

    // Generate result based on task type
    const result = this.generateTaskResult(task, worker);

    // Complete the task
    task.status = 'completed';
    task.completedAt = new Date();
    task.result = result;

    // Update worker stats
    worker.completedTasks++;
    worker.earnings += task.creditReward;
    worker.availability = 'available';
    this.workerTasks.get(workerId)?.delete(taskId);

    this.emit('task:completed', { task, worker, result });
    console.log(`✅ Task completed by ${worker.name}`);
    console.log(`💰 ${worker.name} earned ${task.creditReward} credits`);
  }

  // Generate realistic task results
  private generateTaskResult(task: MarketplaceTask, worker: WorkerProfile): any {
    const baseResult = {
      taskId: task.id,
      workerId: worker.id,
      workerName: worker.name,
      completionTime: new Date(),
      quality: worker.rating
    };

    // Generate specific results based on task category
    switch (task.category) {
      case 'market_analysis':
        return {
          ...baseResult,
          analysis: {
            marketSize: '$2.4B',
            growthRate: '12% YoY',
            topCompetitors: ['CompA', 'CompB', 'CompC'],
            opportunities: [
              'Untapped demographic: Gen Z',
              'Geographic expansion: Southeast',
              'Product line extension: Premium tier'
            ],
            risks: [
              'Supply chain disruption',
              'New regulations pending'
            ],
            recommendation: 'Proceed with cautious expansion'
          }
        };

      case 'content_creation':
        return {
          ...baseResult,
          content: {
            title: 'Revolutionary Product Launch',
            body: 'Compelling product description generated by AI...',
            keywords: ['innovation', 'quality', 'value'],
            seoScore: 92,
            readabilityScore: 88
          }
        };

      case 'financial_analysis':
        return {
          ...baseResult,
          financials: {
            revenue: { current: 125000, projected: 150000 },
            profit: { current: 25000, projected: 35000 },
            cashFlow: { runway: '6 months', recommendation: 'Healthy' },
            kpis: {
              cac: 45,
              ltv: 450,
              churn: 5
            }
          }
        };

      default:
        return {
          ...baseResult,
          data: {
            status: 'completed',
            output: 'Task successfully processed',
            metrics: {
              efficiency: 95,
              accuracy: 98,
              satisfaction: 100
            }
          }
        };
    }
  }

  // Rate a completed task
  rateTask(taskId: string, rating: number, feedback?: string): void {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'completed') {
      console.error('❌ Cannot rate uncompleted task');
      return;
    }

    task.rating = rating;
    
    // Update worker rating
    const worker = this.workers.get(task.claimedBy!);
    if (worker) {
      // Weighted average of ratings
      worker.rating = (worker.rating * worker.completedTasks + rating) / 
                     (worker.completedTasks + 1);
      
      this.emit('task:rated', { task, worker, rating, feedback });
      console.log(`⭐ Task rated ${rating}/5 for ${worker.name}`);
    }
  }

  // Get marketplace statistics
  getStats(): MarketplaceStats {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const completedToday = Array.from(this.tasks.values()).filter(task => 
      task.status === 'completed' && 
      task.completedAt && 
      task.completedAt >= todayStart
    ).length;

    const completedTasks = Array.from(this.tasks.values()).filter(t => 
      t.status === 'completed'
    );

    const avgCompletionTime = completedTasks.length > 0 ?
      completedTasks.reduce((sum, task) => {
        const time = task.completedAt!.getTime() - task.claimedAt!.getTime();
        return sum + time;
      }, 0) / completedTasks.length / 1000 : 0;

    return {
      totalWorkers: this.workers.size,
      activeWorkers: Array.from(this.workers.values()).filter(w => 
        w.availability === 'available'
      ).length,
      openTasks: Array.from(this.tasks.values()).filter(t => 
        t.status === 'open'
      ).length,
      completedToday,
      averageCompletionTime: Math.round(avgCompletionTime),
      totalCreditsCirculated: Array.from(this.workers.values()).reduce((sum, w) => 
        sum + w.earnings, 0
      )
    };
  }

  // Get leaderboard
  getLeaderboard(limit: number = 10): WorkerProfile[] {
    return Array.from(this.workers.values())
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, limit);
  }

  // Search for workers by capability
  findWorkers(capabilities: string[]): WorkerProfile[] {
    return Array.from(this.workers.values()).filter(worker =>
      capabilities.every(cap => worker.capabilities.includes(cap))
    );
  }

  // Get worker's active tasks
  getWorkerTasks(workerId: string): MarketplaceTask[] {
    const taskIds = this.workerTasks.get(workerId);
    if (!taskIds) return [];
    
    return Array.from(taskIds).map(id => this.tasks.get(id)).filter(Boolean) as MarketplaceTask[];
  }
}

// Demo the marketplace
async function demo() {
  console.log('🚀 BizQ Marketplace Demo\n');
  
  const marketplace = new BizQMarketplace();

  // Listen to marketplace events
  marketplace.on('task:matched', ({ task, workers }) => {
    console.log(`\n🔔 Notification: ${workers.length} workers can handle "${task.title}"`);
  });

  marketplace.on('task:completed', ({ task, worker, result }) => {
    console.log(`\n🎉 "${task.title}" completed by ${worker.name}`);
    console.log('📊 Result preview:', JSON.stringify(result).substring(0, 100) + '...');
  });

  // Post various tasks
  console.log('\n📮 Posting tasks to marketplace...\n');

  const task1 = marketplace.postTask({
    title: 'Analyze Q4 market trends',
    description: 'Need comprehensive analysis of market trends for Q4',
    category: 'market_analysis',
    requiredCapabilities: ['data_analysis', 'forecasting'],
    creditReward: 5,
    estimatedTime: 300,
    priority: 'high'
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  const task2 = marketplace.postTask({
    title: 'Create product launch content',
    description: 'Write compelling copy for new product launch',
    category: 'content_creation',
    requiredCapabilities: ['content_creation', 'copywriting'],
    creditReward: 5,
    estimatedTime: 600,
    priority: 'urgent'
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  const task3 = marketplace.postTask({
    title: 'Review partnership contract',
    description: 'Legal review of partnership agreement',
    category: 'legal',
    requiredCapabilities: ['legal_review', 'contract_drafting'],
    creditReward: 100,
    estimatedTime: 7200,
    priority: 'medium'
  });

  // Manually claim a task
  await new Promise(resolve => setTimeout(resolve, 1000));
  marketplace.claimTask(task3, 'human-worker-2');

  // Wait for tasks to complete
  console.log('\n⏳ Waiting for tasks to complete...\n');
  await new Promise(resolve => setTimeout(resolve, 6000));

  // Show marketplace stats
  console.log('\n📊 Marketplace Statistics:');
  const stats = marketplace.getStats();
  console.log('- Total Workers:', stats.totalWorkers);
  console.log('- Active Workers:', stats.activeWorkers);
  console.log('- Open Tasks:', stats.openTasks);
  console.log('- Completed Today:', stats.completedToday);
  console.log('- Avg Completion Time:', stats.averageCompletionTime, 'seconds');
  console.log('- Credits Circulated:', stats.totalCreditsCirculated);

  // Show leaderboard
  console.log('\n🏆 Top Workers Leaderboard:');
  const leaderboard = marketplace.getLeaderboard(5);
  leaderboard.forEach((worker, index) => {
    console.log(`${index + 1}. ${worker.name} - ${worker.earnings} credits earned (${worker.completedTasks} tasks)`);
  });

  // Search for specific workers
  console.log('\n🔍 Finding legal experts...');
  const legalExperts = marketplace.findWorkers(['legal_review']);
  legalExperts.forEach(worker => {
    console.log(`- ${worker.name}: ${worker.pricePerTask} credits/task, ${worker.rating}⭐`);
  });
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export default BizQMarketplace;