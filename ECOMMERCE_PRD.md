# BizQ E-Commerce Platform PRD

**Product Requirements Document v1.0**

---

## 1. Product Overview

### 1.1 Vision
Enable anyone to start, run, and scale an e-commerce business through a single platform that consolidates all operations into delegatable tasks with a configurable UI.

### 1.2 Problem Statement
E-commerce entrepreneurs currently juggle 15-30 different tools costing $3000-7000/month, requiring technical expertise and constant manual management. Small businesses cannot compete due to complexity and cost barriers.

### 1.3 Solution
BizQ provides a unified platform where all e-commerce operations are standardized tasks that can be delegated to AI or human workers, with a drag-and-drop UI that adapts to each business stage.

### 1.4 Success Metrics
- User can launch store in <60 seconds
- Achieve first sale within 7 days
- Reduce operational costs by 60-75%
- 80% of routine tasks automated
- $25,000 average monthly revenue per active store

---

## 2. Technical Architecture

### 2.1 Stack Overview
```
Frontend: React + Next.js + shadcn/ui + Tailwind CSS
Backend: NestJS + PostgreSQL + Redis
Task Queue: BullMQ
Authentication: Supabase Auth
Payments: Stripe
AI Services: OpenAI API + Anthropic Claude
Deployment: Vercel (Frontend) + Railway (Backend)
```

### 2.2 System Architecture
```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                │
│  • Configurable UI (JSON templates)                 │
│  • shadcn component registry                        │
│  • Drag-and-drop builder                           │
└─────────────────────────────────────────────────────┘
                          ↕️ GraphQL/REST
┌─────────────────────────────────────────────────────┐
│                   Backend (NestJS)                  │
│  • Business Logic APIs                             │
│  • Task Orchestration                              │
│  • Worker Management                               │
│  • Integration Gateway                             │
└─────────────────────────────────────────────────────┘
                          ↕️
┌─────────────────────────────────────────────────────┐
│                   Data Layer                        │
│  • PostgreSQL (Business data)                      │
│  • Redis (Cache, queues)                           │
│  • S3 (Media storage)                              │
└─────────────────────────────────────────────────────┘
```

### 2.3 NestJS Backend Structure
```typescript
src/
├── modules/
│   ├── auth/           # Authentication & authorization
│   ├── users/          # User management
│   ├── stores/         # Store management
│   ├── products/       # Product catalog
│   ├── orders/         # Order processing
│   ├── tasks/          # Task management
│   ├── workers/        # Worker registry
│   ├── templates/      # UI templates
│   ├── integrations/   # Third-party APIs
│   └── analytics/      # Business intelligence
├── common/
│   ├── guards/         # Auth guards
│   ├── interceptors/   # Logging, transformation
│   ├── pipes/          # Validation
│   └── filters/        # Error handling
└── shared/
    ├── database/       # TypeORM entities
    ├── queues/         # BullMQ jobs
    └── services/       # Shared services
```

---

## 3. Core Features

### 3.1 Store Management

#### 3.1.1 Quick Setup Wizard
```typescript
interface StoreSetup {
  businessName: string;
  niche: string;
  targetAudience: string;
  startingBudget: number;
  experience: 'beginner' | 'intermediate' | 'advanced';
}

// NestJS Endpoint
@Post('stores/quick-setup')
async quickSetup(@Body() setup: StoreSetup) {
  // Creates store and triggers initial tasks
  const store = await this.storeService.create(setup);
  await this.taskService.createBatch([
    { type: 'market.research', params: { niche: setup.niche }},
    { type: 'supplier.find', params: { budget: setup.startingBudget }},
    { type: 'product.generate_catalog', params: { count: 10 }},
    { type: 'brand.create_identity', params: { name: setup.businessName }}
  ]);
  return store;
}
```

#### 3.1.2 Multi-Channel Integration
- Shopify (primary)
- Amazon Marketplace
- eBay
- Walmart Marketplace
- Etsy
- Social Commerce (Instagram, TikTok Shop)

### 3.2 Task System

#### 3.2.1 Task Definition Schema
```typescript
@Entity()
export class TaskDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // e.g., "product.optimize_listing"

  @Column('jsonb')
  inputSchema: Record<string, any>; // JSON Schema

  @Column('jsonb')
  outputSchema: Record<string, any>;

  @Column()
  category: TaskCategory;

  @Column()
  estimatedCost: number; // In credits

  @Column()
  estimatedTime: number; // In seconds

  @Column('text', { array: true })
  workerRequirements: string[]; // ['ai', 'human', 'expert']

  @Column()
  royaltyPercentage: number; // For creator

  @ManyToOne(() => User)
  creator: User;
}
```

#### 3.2.2 Task Execution Engine
```typescript
@Injectable()
export class TaskExecutionService {
  constructor(
    private readonly workerPool: WorkerPoolService,
    private readonly queue: Queue,
  ) {}

  async execute(task: Task) {
    // 1. Find suitable worker
    const worker = await this.workerPool.findBestWorker(task);
    
    // 2. Create job in queue
    const job = await this.queue.add('execute-task', {
      taskId: task.id,
      workerId: worker.id,
      input: task.input,
    });

    // 3. Monitor execution
    job.on('completed', (result) => {
      this.validateOutput(result, task.outputSchema);
      this.processPayment(worker, task);
      this.distributeRoyalties(task);
    });

    return job;
  }
}
```

#### 3.2.3 Task Categories
- **Product**: Research, listing, optimization
- **Marketing**: Campaigns, content, SEO
- **Customer**: Support, reviews, retention
- **Finance**: Bookkeeping, analysis, optimization
- **Operations**: Inventory, shipping, returns
- **Growth**: Scaling, expansion, partnerships

### 3.3 UI Template System

#### 3.3.1 Template Structure
```typescript
interface UITemplate {
  id: string;
  name: string;
  category: 'starter' | 'growth' | 'scale' | 'custom';
  layout: {
    type: 'flex' | 'grid';
    style: CSSProperties;
    children: BlockConfig[];
  };
  blocks: BlockConfig[];
  automations: AutomationRule[];
  theme: string;
}

interface BlockConfig {
  id: string;
  component: string; // Component name from registry
  position: { x: number; y: number };
  size: { width: number; height: number };
  props: Record<string, any>;
  actions?: {
    trigger: string;
    execute: string; // task:// or api://
    params?: Record<string, any>;
  }[];
}
```

#### 3.3.2 Component Registry Integration
```typescript
@Module({
  imports: [HttpModule],
})
export class ComponentRegistryModule {
  @Get('components/available')
  async getAvailableComponents() {
    // Fetch from shadcn registry
    const shadcnComponents = await this.fetchShadcnRegistry();
    
    // Add BizQ business components
    const bizqComponents = await this.componentService.getAll();
    
    return [...shadcnComponents, ...bizqComponents];
  }

  @Post('components/register')
  async registerComponent(@Body() component: ComponentMetadata) {
    return this.componentService.register(component);
  }
}
```

### 3.4 Product Management

#### 3.4.1 Product Sourcing
```typescript
@Injectable()
export class ProductSourcingService {
  async findSuppliers(criteria: SupplierCriteria) {
    const suppliers = await Promise.all([
      this.searchSupliful(criteria),    // Zero MOQ supplements
      this.searchBlanka(criteria),      // Zero MOQ beauty
      this.searchPrintful(criteria),    // Print-on-demand
      this.searchAlibaba(criteria),     // Bulk options
    ]);
    
    return this.rankSuppliers(suppliers, criteria);
  }

  async progressiveMOQ(product: Product) {
    const monthlySales = await this.getmonthlySales(product);
    
    if (monthlySales > 200) {
      return this.transitionToBulk(product);
    } else if (monthlySales > 50) {
      return this.transitionToLowMOQ(product);
    }
    
    return null; // Stay with zero MOQ
  }
}
```

#### 3.4.2 Listing Optimization
```typescript
@Injectable()
export class ListingOptimizationService {
  async optimizeListing(product: Product) {
    // AI-powered optimization
    const optimizations = await this.aiService.analyze({
      title: product.title,
      description: product.description,
      images: product.images,
      competitors: await this.findCompetitors(product),
    });

    return {
      newTitle: optimizations.title,
      newDescription: optimizations.description,
      newKeywords: optimizations.keywords,
      expectedConversionIncrease: optimizations.impact,
    };
  }
}
```

### 3.5 Order Processing

#### 3.5.1 Order Pipeline
```typescript
@Injectable()
export class OrderPipelineService {
  async processOrder(order: Order) {
    // 1. Payment processing
    await this.paymentService.charge(order);
    
    // 2. Inventory allocation
    await this.inventoryService.allocate(order);
    
    // 3. Fulfillment routing
    if (order.isDigital) {
      await this.digitalFulfillment(order);
    } else if (order.isDropship) {
      await this.dropshipFulfillment(order);
    } else {
      await this.warehouseFulfillment(order);
    }
    
    // 4. Customer notification
    await this.notificationService.sendOrderConfirmation(order);
    
    // 5. Create follow-up tasks
    await this.createFollowUpTasks(order);
  }
}
```

### 3.6 Marketing Automation

#### 3.6.1 Campaign Management
```typescript
interface MarketingCampaign {
  name: string;
  type: 'email' | 'social' | 'ads' | 'influencer';
  budget: number;
  targetAudience: AudienceSegment;
  content: CampaignContent;
  schedule: CampaignSchedule;
}

@Injectable()
export class CampaignService {
  async launchCampaign(campaign: MarketingCampaign) {
    // Decompose into tasks
    const tasks = [
      { type: 'marketing.research_audience', params: campaign.targetAudience },
      { type: 'marketing.create_content', params: campaign.content },
      { type: 'marketing.setup_automation', params: campaign.schedule },
      { type: 'marketing.monitor_performance', params: { recurring: true }},
    ];
    
    return this.taskService.createChain(tasks);
  }
}
```

### 3.7 Customer Service

#### 3.7.1 Intelligent Routing
```typescript
@Injectable()
export class CustomerServiceRouter {
  async routeTicket(ticket: SupportTicket) {
    const analysis = await this.aiService.analyzeTicket(ticket);
    
    if (analysis.sentiment === 'negative' && ticket.customer.ltv > 1000) {
      // High-value upset customer → Human expert
      return this.assignToHumanExpert(ticket);
    } else if (analysis.complexity === 'simple') {
      // Simple query → AI
      return this.assignToAI(ticket);
    } else {
      // Standard → Human support
      return this.assignToHumanSupport(ticket);
    }
  }
}
```

### 3.8 Analytics & Reporting

#### 3.8.1 Real-time Dashboard
```typescript
@WebSocketGateway()
export class DashboardGateway {
  @SubscribeMessage('subscribe-metrics')
  async handleSubscription(client: Socket, storeId: string) {
    // Send real-time updates
    setInterval(async () => {
      const metrics = await this.metricsService.getRealtime(storeId);
      client.emit('metrics-update', {
        revenue: metrics.revenue,
        orders: metrics.orders,
        conversion: metrics.conversionRate,
        activeTasks: metrics.activeTasks,
        inventory: metrics.inventoryStatus,
      });
    }, 5000); // Every 5 seconds
  }
}
```

---

## 4. User Journeys

### 4.1 New Store Setup (Day 1)
```
1. User signs up → Selects "Start E-commerce Business"
2. Quick setup wizard → Enter niche and budget
3. System creates tasks:
   - market.research_niche
   - supplier.find_zero_moq
   - product.generate_catalog
   - brand.create_identity
4. UI shows progress dashboard
5. Store ready in <60 seconds
```

### 4.2 Daily Operations (Ongoing)
```
1. Morning: Check dashboard
   - View overnight orders (auto-processed)
   - Review AI-handled customer inquiries
   - Approve suggested inventory reorders

2. Afternoon: Growth activities
   - Review AI-generated social content
   - Approve influencer outreach messages
   - Check competitor price changes

3. Evening: Planning
   - Review daily performance
   - Adjust tomorrow's task budget
   - Set automation rules
```

### 4.3 Scaling Journey (Month 3+)
```
1. System detects product selling 50+ units/month
2. Suggests supplier transition to low MOQ
3. User approves transition
4. System handles:
   - Supplier negotiation
   - Inventory transition
   - Price optimization
   - Margin improvement tracking
```

---

## 5. API Design

### 5.1 RESTful Endpoints

```typescript
// Store Management
POST   /api/stores                 // Create store
GET    /api/stores/:id            // Get store details
PUT    /api/stores/:id            // Update store
DELETE /api/stores/:id            // Delete store

// Product Management  
GET    /api/products              // List products
POST   /api/products              // Create product
PUT    /api/products/:id         // Update product
POST   /api/products/:id/optimize // Optimize listing

// Task Management
POST   /api/tasks                 // Create task
GET    /api/tasks/:id            // Get task status
POST   /api/tasks/:id/cancel     // Cancel task
GET    /api/tasks/marketplace     // Browse available tasks

// Order Processing
GET    /api/orders                // List orders
POST   /api/orders/:id/fulfill   // Fulfill order
POST   /api/orders/:id/refund    // Process refund

// Templates
GET    /api/templates             // List UI templates
POST   /api/templates/:id/apply  // Apply template
POST   /api/templates             // Save custom template
```

### 5.2 GraphQL Schema
```graphql
type Store {
  id: ID!
  name: String!
  niche: String!
  products: [Product!]!
  orders: [Order!]!
  metrics: StoreMetrics!
  activeTasks: [Task!]!
}

type Task {
  id: ID!
  type: String!
  status: TaskStatus!
  input: JSON!
  output: JSON
  worker: Worker
  cost: Float!
  createdAt: DateTime!
  completedAt: DateTime
}

type Query {
  store(id: ID!): Store
  tasks(storeId: ID!, status: TaskStatus): [Task!]!
  analytics(storeId: ID!, period: Period!): Analytics!
}

type Mutation {
  createStore(input: StoreInput!): Store!
  createTask(input: TaskInput!): Task!
  applyTemplate(storeId: ID!, templateId: ID!): Store!
}

type Subscription {
  taskUpdates(storeId: ID!): Task!
  metricsUpdates(storeId: ID!): StoreMetrics!
}
```

---

## 6. Database Schema

### 6.1 Core Tables

```sql
-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  niche VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  cost DECIMAL(10,2),
  inventory_quantity INTEGER DEFAULT 0,
  supplier_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  customer_email VARCHAR(255),
  total_amount DECIMAL(10,2),
  status VARCHAR(50),
  items JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  input JSONB,
  output JSONB,
  worker_id UUID,
  cost DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- UI Templates
CREATE TABLE ui_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  config JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  creator_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. Security & Compliance

### 7.1 Authentication & Authorization
- Supabase Auth for user management
- JWT tokens for API access
- Role-based access control (Owner, Manager, Viewer)
- API rate limiting per tier

### 7.2 Data Security
- All data encrypted at rest (AES-256)
- TLS 1.3 for data in transit
- PCI DSS compliance for payment data
- GDPR compliance for EU customers

### 7.3 Task Security
- Templates are JSON only (no code execution)
- Worker sandboxing for task execution
- Output validation against schemas
- Fraud detection for suspicious patterns

---

## 8. Performance Requirements

### 8.1 Response Times
- Dashboard load: <1 second
- Task creation: <500ms
- Template application: <2 seconds
- Real-time updates: <100ms latency

### 8.2 Scale Requirements
- Support 10,000 concurrent stores
- Process 1M tasks/day
- Handle 100K orders/day
- Store 1TB product media

### 8.3 Availability
- 99.9% uptime SLA
- Zero-downtime deployments
- Multi-region failover
- Automatic scaling

---

## 9. Launch Plan

### Phase 1: MVP (Month 1-2)
- [ ] Core store management
- [ ] Basic task system (10 task types)
- [ ] Shopify integration
- [ ] Simple UI templates
- [ ] Payment processing

### Phase 2: Growth Features (Month 3-4)
- [ ] Full task marketplace
- [ ] AI worker integration
- [ ] Advanced templates
- [ ] Multi-channel selling
- [ ] Analytics dashboard

### Phase 3: Scale (Month 5-6)
- [ ] Custom task creation
- [ ] Template marketplace
- [ ] Advanced automation
- [ ] International support
- [ ] Enterprise features

---

## 10. Success Metrics

### 10.1 User Metrics
- 1,000 stores created in Month 1
- 10,000 stores by Month 6
- 70% monthly retention rate
- <60 second setup time
- <7 days to first sale

### 10.2 Business Metrics
- $25,000 average store revenue/month
- 60-75% cost reduction vs alternatives
- 80% task automation rate
- 40%+ profit margins by Month 6
- $10M GMV by Year 1

### 10.3 Platform Metrics
- 95% task completion rate
- <5 minute average task time
- 80% AI resolution rate
- 4.5+ star user satisfaction
- 50% viral coefficient (referrals)

---

## Appendix A: Task Catalog (Initial 50 Tasks)

### Product Tasks (10)
- product.research_trending
- product.create_listing
- product.optimize_seo
- product.competitor_analysis
- product.price_optimization
- product.bundle_creation
- product.seasonal_adjustment
- product.quality_validation
- product.sourcing_alternatives
- product.profit_analysis

### Marketing Tasks (10)
- marketing.create_campaign
- marketing.email_sequence
- marketing.social_content
- marketing.influencer_outreach
- marketing.ad_creative
- marketing.seo_audit
- marketing.competitor_monitoring
- marketing.review_generation
- marketing.referral_program
- marketing.retention_campaign

[... continues with all 50 initial tasks ...]

---

*End of PRD v1.0*