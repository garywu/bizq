# AI Task Routing System

**Intelligent Model Selection & Execution for BizQ**

---

## System Overview

The AI Task Routing System intelligently selects the optimal AI model and configuration for each business task based on task type, complexity, cost constraints, and performance requirements.

**Core Principle**: Different business tasks require different AI capabilities. Route each task to the model that delivers the best value.

---

## Model Selection Matrix

### Task-to-Model Mapping

```typescript
interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  temperature: number;
  max_tokens: number;
  cost_per_token: number;
  speed_tier: 'fast' | 'standard' | 'thorough';
  reasoning: string;
}

const TASK_MODEL_MAP: Record<string, ModelConfig> = {
  // Content Creation Tasks
  'content.write_blog_post': {
    provider: 'anthropic',
    model: 'claude-3-opus',
    temperature: 0.7,
    max_tokens: 4000,
    cost_per_token: 0.000015,
    speed_tier: 'thorough',
    reasoning: 'Creative writing requires nuanced understanding and engaging tone'
  },

  'content.write_product_description': {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.3,
    max_tokens: 1000,
    cost_per_token: 0.00003,
    speed_tier: 'standard',
    reasoning: 'Structured output with persuasive elements, good balance of creativity and consistency'
  },

  'content.create_social_post': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.6,
    max_tokens: 500,
    cost_per_token: 0.000002,
    speed_tier: 'fast',
    reasoning: 'Short-form content, speed and cost efficiency important'
  },

  'content.optimize_seo': {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.2,
    max_tokens: 2000,
    cost_per_token: 0.00003,
    speed_tier: 'standard',
    reasoning: 'Technical SEO optimization requires precision and structured thinking'
  },

  // Customer Service Tasks
  'customer.answer_inquiry': {
    provider: 'anthropic',
    model: 'claude-3-opus',
    temperature: 0.4,
    max_tokens: 800,
    cost_per_token: 0.000015,
    speed_tier: 'standard',
    reasoning: 'Empathetic responses require emotional intelligence and nuanced understanding'
  },

  'customer.process_return': {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.1,
    max_tokens: 600,
    cost_per_token: 0.00003,
    speed_tier: 'standard',
    reasoning: 'Policy-based decisions require logical reasoning and consistency'
  },

  // E-commerce Operations
  'order.process_batch': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.1,
    max_tokens: 300,
    cost_per_token: 0.000002,
    speed_tier: 'fast',
    reasoning: 'Structured data processing, prioritize speed and cost'
  },

  'product.research_trending': {
    provider: 'anthropic',
    model: 'claude-3-opus',
    temperature: 0.5,
    max_tokens: 3000,
    cost_per_token: 0.000015,
    speed_tier: 'thorough',
    reasoning: 'Market research requires deep analysis and trend identification'
  },

  // Analytics Tasks
  'analytics.generate_report': {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.1,
    max_tokens: 2000,
    cost_per_token: 0.00003,
    speed_tier: 'standard',
    reasoning: 'Data analysis requires accuracy and structured presentation'
  },

  // Marketing Tasks
  'marketing.create_campaign': {
    provider: 'anthropic',
    model: 'claude-3-opus',
    temperature: 0.6,
    max_tokens: 2500,
    cost_per_token: 0.000015,
    speed_tier: 'thorough',
    reasoning: 'Strategic marketing requires creative thinking and audience understanding'
  }
};
```

---

## Dynamic Routing Logic

### Router Implementation

```typescript
export class AITaskRouter {
  private fallbackChain: ModelConfig[] = [
    { provider: 'openai', model: 'gpt-4' },
    { provider: 'anthropic', model: 'claude-3-opus' },
    { provider: 'openai', model: 'gpt-3.5-turbo' }
  ];

  async routeTask(task: Task, context: RoutingContext): Promise<ModelConfig> {
    // 1. Get base model configuration
    let config = this.getBaseConfig(task.type);

    // 2. Apply contextual modifications
    config = this.applyContextualAdjustments(config, context);

    // 3. Check availability and constraints
    config = await this.validateAndAdjust(config, context);

    return config;
  }

  private getBaseConfig(taskType: string): ModelConfig {
    return TASK_MODEL_MAP[taskType] || TASK_MODEL_MAP['default'];
  }

  private applyContextualAdjustments(
    config: ModelConfig, 
    context: RoutingContext
  ): ModelConfig {
    const adjusted = { ...config };

    // Budget constraints
    if (context.budget_tier === 'economy') {
      adjusted.provider = 'openai';
      adjusted.model = 'gpt-3.5-turbo';
      adjusted.cost_per_token = 0.000002;
    }

    // Priority adjustments
    if (context.priority === 'urgent') {
      adjusted.speed_tier = 'fast';
      adjusted.max_tokens = Math.min(adjusted.max_tokens, 1000);
    }

    // Quality requirements
    if (context.quality_tier === 'premium') {
      adjusted.provider = 'anthropic';
      adjusted.model = 'claude-3-opus';
      adjusted.temperature = Math.max(0.1, adjusted.temperature - 0.1);
    }

    // Workspace preferences
    if (context.workspace_preferences?.preferred_provider) {
      adjusted.provider = context.workspace_preferences.preferred_provider;
    }

    return adjusted;
  }

  private async validateAndAdjust(
    config: ModelConfig, 
    context: RoutingContext
  ): Promise<ModelConfig> {
    // Check API availability
    const isAvailable = await this.checkModelAvailability(config);
    if (!isAvailable) {
      return this.selectFallback(config, context);
    }

    // Check rate limits
    const withinLimits = await this.checkRateLimits(config, context);
    if (!withinLimits) {
      return this.selectFallback(config, context);
    }

    // Check budget constraints
    const estimatedCost = this.estimateCost(config, context);
    if (estimatedCost > context.max_cost) {
      return this.selectCheaperAlternative(config, context);
    }

    return config;
  }

  private async selectFallback(
    originalConfig: ModelConfig, 
    context: RoutingContext
  ): Promise<ModelConfig> {
    for (const fallback of this.fallbackChain) {
      const isAvailable = await this.checkModelAvailability(fallback);
      const withinBudget = this.estimateCost(fallback, context) <= context.max_cost;
      
      if (isAvailable && withinBudget) {
        return { ...fallback, reasoning: 'Fallback due to availability/constraints' };
      }
    }

    throw new Error('No available models meet the current constraints');
  }
}
```

---

## Context-Aware Routing

### Routing Context Schema

```typescript
interface RoutingContext {
  // Task context
  task_complexity: 'simple' | 'moderate' | 'complex';
  estimated_tokens: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Workspace context
  workspace_id: string;
  user_tier: 'starter' | 'growth' | 'scale';
  budget_tier: 'economy' | 'standard' | 'premium';
  quality_tier: 'basic' | 'standard' | 'premium';
  
  // Constraints
  max_cost: number;
  max_processing_time: number;
  requires_consistency: boolean;
  
  // Preferences
  workspace_preferences?: {
    preferred_provider?: string;
    quality_over_speed?: boolean;
    cost_sensitivity?: number;
  };
  
  // Historical data
  recent_task_performance?: {
    average_response_time: number;
    success_rate: number;
    user_satisfaction: number;
  };
}
```

### Adaptive Learning

```typescript
export class AdaptiveRouter extends AITaskRouter {
  private performanceTracker = new Map<string, TaskPerformance>();

  async routeTaskWithLearning(
    task: Task, 
    context: RoutingContext
  ): Promise<ModelConfig> {
    // Get historical performance
    const historyKey = this.getHistoryKey(task.type, context);
    const history = this.performanceTracker.get(historyKey);

    // Adjust routing based on performance
    if (history) {
      context = this.adjustContextFromHistory(context, history);
    }

    const config = await this.routeTask(task, context);

    // Track this routing decision
    await this.trackRoutingDecision(task, config, context);

    return config;
  }

  private adjustContextFromHistory(
    context: RoutingContext,
    history: TaskPerformance
  ): RoutingContext {
    const adjusted = { ...context };

    // If a model consistently performs poorly, adjust preferences
    if (history.success_rate < 0.8) {
      adjusted.quality_tier = 'premium';
    }

    // If response times are too slow, prioritize speed
    if (history.average_response_time > context.max_processing_time * 0.8) {
      adjusted.workspace_preferences = {
        ...adjusted.workspace_preferences,
        quality_over_speed: false
      };
    }

    // If user satisfaction is low, increase quality requirements
    if (history.user_satisfaction < 4.0) {
      adjusted.quality_tier = 'premium';
      adjusted.budget_tier = 'premium';
    }

    return adjusted;
  }

  async trackTaskResult(
    taskId: string,
    result: TaskResult,
    userFeedback?: UserFeedback
  ): Promise<void> {
    const routingDecision = await this.getRoutingDecision(taskId);
    if (!routingDecision) return;

    const performance: TaskPerformance = {
      response_time: result.processing_time,
      success: result.status === 'completed',
      cost: result.cost,
      user_satisfaction: userFeedback?.rating || null,
      model_used: routingDecision.config.model,
      timestamp: new Date()
    };

    const historyKey = this.getHistoryKey(
      routingDecision.task.type, 
      routingDecision.context
    );

    this.updatePerformanceHistory(historyKey, performance);
  }
}
```

---

## Cost Optimization

### Cost Calculator

```typescript
export class CostCalculator {
  private readonly MODEL_COSTS = {
    'gpt-4': { input: 0.00003, output: 0.00006 },
    'gpt-3.5-turbo': { input: 0.000002, output: 0.000002 },
    'claude-3-opus': { input: 0.000015, output: 0.000075 },
    'claude-3-sonnet': { input: 0.000003, output: 0.000015 }
  };

  estimateTaskCost(
    task: Task, 
    config: ModelConfig, 
    context: RoutingContext
  ): CostEstimate {
    const modelCost = this.MODEL_COSTS[config.model];
    
    // Estimate input tokens (task prompt + context)
    const inputTokens = this.estimateInputTokens(task, context);
    
    // Estimate output tokens based on task type
    const outputTokens = this.estimateOutputTokens(task.type, config);
    
    const estimatedCost = 
      (inputTokens * modelCost.input) + 
      (outputTokens * modelCost.output);

    return {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost: estimatedCost,
      model: config.model,
      confidence: this.getCostConfidence(task.type)
    };
  }

  optimizeForBudget(
    task: Task,
    context: RoutingContext,
    maxCost: number
  ): ModelConfig {
    // Try models in order of cost efficiency
    const costOrderedModels = this.getModelsByCostEfficiency(task.type);
    
    for (const model of costOrderedModels) {
      const config = this.getConfigForModel(model);
      const estimate = this.estimateTaskCost(task, config, context);
      
      if (estimate.estimated_cost <= maxCost) {
        return config;
      }
    }

    throw new Error(`Cannot complete task within budget of $${maxCost}`);
  }

  private getModelsByCostEfficiency(taskType: string): string[] {
    // Return models ordered by value-for-money for this task type
    const efficiencyMap = {
      'content.write_product_description': [
        'gpt-3.5-turbo',
        'gpt-4',
        'claude-3-sonnet',
        'claude-3-opus'
      ],
      'customer.answer_inquiry': [
        'claude-3-sonnet',
        'gpt-4',
        'claude-3-opus',
        'gpt-3.5-turbo'
      ],
      'order.process_batch': [
        'gpt-3.5-turbo',
        'claude-3-sonnet',
        'gpt-4',
        'claude-3-opus'
      ]
    };

    return efficiencyMap[taskType] || efficiencyMap['default'];
  }
}
```

---

## Performance Monitoring

### Real-time Performance Tracking

```typescript
export class PerformanceMonitor {
  async trackTaskExecution(
    taskId: string,
    config: ModelConfig,
    metrics: ExecutionMetrics
  ): Promise<void> {
    const performance = {
      task_id: taskId,
      model: config.model,
      provider: config.provider,
      response_time: metrics.response_time,
      first_token_time: metrics.first_token_time,
      tokens_per_second: metrics.tokens_per_second,
      total_tokens: metrics.total_tokens,
      cost: metrics.cost,
      success: metrics.success,
      error_type: metrics.error_type,
      timestamp: new Date()
    };

    // Store metrics
    await this.storeMetrics(performance);

    // Check for performance degradation
    await this.checkPerformanceAlerts(config.model, performance);

    // Update model health scores
    await this.updateModelHealthScore(config.model, performance);
  }

  async getModelRecommendation(taskType: string): Promise<ModelRecommendation> {
    const recentPerformance = await this.getRecentPerformance(taskType);
    
    return {
      recommended_model: this.getBestPerformingModel(recentPerformance),
      confidence: this.calculateConfidence(recentPerformance),
      reasoning: this.generateRecommendationReasoning(recentPerformance),
      alternative_models: this.getAlternatives(recentPerformance),
      performance_metrics: this.summarizePerformance(recentPerformance)
    };
  }

  private async checkPerformanceAlerts(
    model: string, 
    current: PerformanceMetric
  ): Promise<void> {
    const baseline = await this.getBaselinePerformance(model);
    
    // Response time degradation
    if (current.response_time > baseline.response_time * 1.5) {
      await this.sendAlert({
        type: 'performance_degradation',
        model,
        metric: 'response_time',
        current: current.response_time,
        baseline: baseline.response_time
      });
    }

    // Success rate drop
    if (current.success_rate < baseline.success_rate * 0.9) {
      await this.sendAlert({
        type: 'success_rate_drop',
        model,
        current: current.success_rate,
        baseline: baseline.success_rate
      });
    }
  }
}
```

---

## A/B Testing for Model Selection

### Model Performance Testing

```typescript
export class ModelABTester {
  async runModelComparison(
    taskType: string,
    models: ModelConfig[],
    sampleSize: number = 100
  ): Promise<ABTestResult> {
    const results = new Map<string, ModelPerformance>();

    // Split traffic between models
    for (let i = 0; i < sampleSize; i++) {
      const modelIndex = i % models.length;
      const model = models[modelIndex];
      
      // Execute task with this model
      const task = await this.generateTestTask(taskType);
      const result = await this.executeWithModel(task, model);
      
      // Track results
      this.addResult(results, model.model, result);
    }

    return this.analyzeResults(results);
  }

  private analyzeResults(results: Map<string, ModelPerformance>): ABTestResult {
    const models = Array.from(results.entries());
    const winner = this.determineWinner(models);
    
    return {
      winner: winner.model,
      confidence: this.calculateStatisticalSignificance(models),
      metrics: {
        response_time: this.compareMetric(models, 'response_time'),
        cost: this.compareMetric(models, 'cost'),
        quality_score: this.compareMetric(models, 'quality_score'),
        user_satisfaction: this.compareMetric(models, 'user_satisfaction')
      },
      recommendation: this.generateRecommendation(winner, models)
    };
  }

  async deployWinner(
    taskType: string,
    testResult: ABTestResult,
    rolloutPercentage: number = 10
  ): Promise<void> {
    // Gradual rollout of winning model
    await this.updateRoutingWeights(taskType, {
      [testResult.winner]: rolloutPercentage,
      default: 100 - rolloutPercentage
    });

    // Monitor performance during rollout
    this.scheduleRolloutMonitoring(taskType, testResult.winner);
  }
}
```

---

## Failover and Reliability

### Resilient Execution

```typescript
export class ResilientExecutor {
  async executeWithFailover(
    task: Task,
    primaryConfig: ModelConfig,
    context: RoutingContext
  ): Promise<TaskResult> {
    const fallbackChain = this.buildFallbackChain(primaryConfig, context);
    
    for (const config of fallbackChain) {
      try {
        // Attempt execution
        const result = await this.executeWithTimeout(task, config);
        
        // Validate result quality
        if (this.isResultAcceptable(result, task)) {
          return result;
        }
        
        // Log quality issue and try next model
        await this.logQualityIssue(config, result, task);
        continue;
        
      } catch (error) {
        // Log error and try next model
        await this.logExecutionError(config, error, task);
        
        // If this is the last model, escalate
        if (config === fallbackChain[fallbackChain.length - 1]) {
          return await this.escalateToHuman(task, error);
        }
        
        continue;
      }
    }

    throw new Error('All AI models failed to complete the task');
  }

  private buildFallbackChain(
    primary: ModelConfig,
    context: RoutingContext
  ): ModelConfig[] {
    const chain = [primary];
    
    // Add different provider as backup
    if (primary.provider === 'openai') {
      chain.push(this.getAnthropicAlternative(primary));
    } else {
      chain.push(this.getOpenAIAlternative(primary));
    }
    
    // Add fast/cheap option as last resort
    chain.push({
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      max_tokens: 1000,
      reasoning: 'Last resort fallback'
    });

    return chain;
  }

  private async escalateToHuman(
    task: Task,
    error: Error
  ): Promise<TaskResult> {
    // Create human task
    const humanTask = await this.createHumanTask({
      original_task: task,
      ai_failure_reason: error.message,
      priority: 'high',
      estimated_time: '30-60 minutes'
    });

    return {
      status: 'escalated',
      human_task_id: humanTask.id,
      estimated_completion: humanTask.estimated_completion,
      cost: humanTask.estimated_cost,
      reasoning: 'AI execution failed, escalated to human worker'
    };
  }
}
```

---

## Usage Examples

### Basic Task Routing

```typescript
// Initialize router
const router = new AITaskRouter();

// Route a content task
const task = {
  type: 'content.write_product_description',
  input: {
    product_name: 'Wireless Headphones',
    features: ['Noise cancelling', 'Bluetooth 5.0', '30-hour battery'],
    platform: 'shopify'
  }
};

const context = {
  workspace_id: 'ws_123',
  user_tier: 'growth',
  budget_tier: 'standard',
  priority: 'normal',
  max_cost: 0.50
};

const config = await router.routeTask(task, context);
console.log(`Selected model: ${config.model} (${config.reasoning})`);
```

### Advanced Routing with Learning

```typescript
// Adaptive router with performance tracking
const adaptiveRouter = new AdaptiveRouter();

// Execute task with learning
const config = await adaptiveRouter.routeTaskWithLearning(task, context);
const result = await executeTask(task, config);

// Track results for future improvement
await adaptiveRouter.trackTaskResult(
  task.id,
  result,
  { rating: 4.5, feedback: 'Good quality description' }
);
```

### Cost-Optimized Routing

```typescript
// Cost calculator for budget constraints
const calculator = new CostCalculator();

// Get cost estimate
const estimate = calculator.estimateTaskCost(task, config, context);
console.log(`Estimated cost: $${estimate.estimated_cost}`);

// Find optimal model within budget
const optimized = calculator.optimizeForBudget(task, context, 0.25);
console.log(`Budget-optimized model: ${optimized.model}`);
```

---

## Integration with BizQ Architecture

### Router Service

```typescript
// packages/ai/src/router.ts
export class BizQAIRouter {
  constructor(
    private performanceMonitor: PerformanceMonitor,
    private costCalculator: CostCalculator,
    private abTester: ModelABTester
  ) {}

  async routeAndExecute(
    task: Task,
    context: RoutingContext
  ): Promise<TaskResult> {
    // 1. Route to optimal model
    const config = await this.routeTask(task, context);
    
    // 2. Execute with failover
    const result = await this.executeWithFailover(task, config, context);
    
    // 3. Track performance
    await this.performanceMonitor.trackTaskExecution(
      task.id,
      config,
      result.metrics
    );
    
    return result;
  }
}

// Export for use in API and workers
export const aiRouter = new BizQAIRouter(
  new PerformanceMonitor(),
  new CostCalculator(),
  new ModelABTester()
);
```

---

*"The right model for the right task at the right cost. Intelligence in routing, efficiency in execution."*

**BizQ: Where AI becomes your intelligent business partner.**