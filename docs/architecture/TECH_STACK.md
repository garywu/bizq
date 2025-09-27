# BizQ Technical Stack

**Complete Architecture & Technology Decisions**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 14)                  │
│         React + TypeScript + Tailwind + shadcn/ui        │
└─────────────────────────────────────────────────────────┘
                            ↕️ GraphQL + REST
┌─────────────────────────────────────────────────────────┐
│                    API Gateway (NestJS)                  │
│          Authentication | Rate Limiting | Routing        │
└─────────────────────────────────────────────────────────┘
                            ↕️
┌──────────────┬──────────────┬──────────────┬───────────┐
│   Services   │ Task Engine  │  Workers     │Integration│
│   (NestJS)   │  (BullMQ)    │  (AI/Human)  │ Gateway   │
└──────────────┴──────────────┴──────────────┴───────────┘
                            ↕️
┌──────────────┬──────────────┬──────────────┬───────────┐
│  PostgreSQL  │    Redis     │   S3/CDN     │ Analytics │
│  (Primary)   │   (Cache)    │  (Storage)   │ (PostHog) │
└──────────────┴──────────────┴──────────────┴───────────┘
```

---

## Core Technology Choices

### Frontend Stack

#### Framework: Next.js 14
```json
{
  "why": "Full-stack React framework with SSR/SSG",
  "alternatives_considered": ["Remix", "SvelteKit", "Vue/Nuxt"],
  "decision_factors": [
    "Best-in-class performance",
    "Vercel integration",
    "Large ecosystem",
    "TypeScript first"
  ]
}
```

#### UI Library: shadcn/ui
```typescript
// Component example
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Why shadcn:
// - Copy/paste, not npm install
// - Full customization
// - Accessibility built-in
// - Radix UI primitives
```

#### Styling: Tailwind CSS
- Utility-first CSS
- JIT compilation
- Tree-shaking
- Design system ready

#### State Management: Zustand + React Query
```typescript
// Global state with Zustand
const useStore = create((set) => ({
  tasks: [],
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, task] 
  }))
}))

// Server state with React Query
const { data, error } = useQuery({
  queryKey: ['tasks'],
  queryFn: fetchTasks
})
```

### Backend Stack

#### Framework: NestJS
```typescript
// Why NestJS:
// - Enterprise-grade Node.js
// - Dependency injection
// - Modular architecture
// - TypeScript native
// - Extensive ecosystem

@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}
  
  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }
}
```

#### Database: PostgreSQL
```sql
-- Why PostgreSQL:
-- JSONB for flexible schemas
-- Full-text search
-- Row-level security
-- Proven at scale
-- Supabase compatible

CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid(),
  type VARCHAR(100),
  input JSONB,
  output JSONB,
  status VARCHAR(50),
  PRIMARY KEY (id)
);
```

#### Cache: Redis
```typescript
// Usage patterns:
// - Session storage
// - Task queue (BullMQ)
// - Real-time pubsub
// - API rate limiting
// - Response caching

await redis.set(`task:${id}`, JSON.stringify(task), 'EX', 3600);
```

#### Queue: BullMQ
```typescript
// Task processing
const taskQueue = new Queue('tasks', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  }
});

// Worker
new Worker('tasks', async (job) => {
  const result = await processTask(job.data);
  return result;
});
```

### AI & Worker Infrastructure

#### AI Providers
```typescript
// Multi-provider strategy
interface AIProvider {
  name: 'openai' | 'anthropic' | 'local';
  models: string[];
  costPerToken: number;
  capabilities: string[];
}

// Provider selection
function selectProvider(task: Task): AIProvider {
  if (task.complexity === 'high') return anthropicClaude;
  if (task.cost_sensitive) return localLlama;
  return openAIGPT4;
}
```

#### Model Configuration
```yaml
models:
  content_generation:
    primary: gpt-4-turbo
    fallback: claude-3-opus
    budget: llama-3-70b
  
  code_generation:
    primary: claude-3-opus
    fallback: gpt-4
    budget: codellama-34b
  
  simple_tasks:
    primary: gpt-3.5-turbo
    fallback: claude-instant
    budget: mistral-7b
```

### Infrastructure

#### Deployment Architecture
```yaml
# Production Environment
production:
  frontend:
    provider: Vercel
    regions: [us-east-1, eu-west-1, ap-southeast-1]
    cdn: Vercel Edge Network
    
  backend:
    provider: Railway
    instances: 3-10 (auto-scaling)
    memory: 2GB per instance
    cpu: 2 vCPU per instance
    
  database:
    provider: Supabase
    plan: Pro ($25/month initially)
    backup: Daily with 30-day retention
    
  redis:
    provider: Upstash
    plan: Pay-as-you-go
    persistence: Enabled
```

#### Monitoring & Observability
```typescript
// Logging: Pino + Logflare
logger.info('Task completed', { taskId, duration, cost });

// Metrics: Prometheus + Grafana
taskCounter.inc({ type: 'email.reply', status: 'success' });

// Tracing: OpenTelemetry
const span = tracer.startSpan('process-task');

// Error tracking: Sentry
Sentry.captureException(error, { 
  tags: { task_type, user_id } 
});

// Analytics: PostHog
posthog.capture('task_created', { 
  type, estimated_cost, user_plan 
});
```

---

## Development Workflow

### Version Control
```bash
# Monorepo structure with pnpm workspaces
bizq/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # NestJS backend
│   └── admin/        # Admin dashboard
├── packages/
│   ├── ui/           # Shared components
│   ├── database/     # Prisma schemas
│   └── types/        # TypeScript types
└── services/
    ├── workers/      # Task workers
    └── webhooks/     # Webhook handlers
```

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    - pnpm test
    - pnpm lint
    - pnpm type-check
    
  build:
    - docker build
    - push to registry
    
  deploy:
    - vercel deploy (frontend)
    - railway up (backend)
    - run migrations
```

### Development Tools
```json
{
  "package_manager": "pnpm",
  "bundler": "Turbo",
  "linting": "ESLint + Prettier",
  "testing": "Vitest + Playwright",
  "git_hooks": "Husky + lint-staged",
  "code_generation": "Plop",
  "api_testing": "Insomnia",
  "database_gui": "TablePlus"
}
```

---

## Security Architecture

### Authentication & Authorization
```typescript
// JWT + Refresh tokens
interface AuthStrategy {
  provider: 'supabase' | 'auth0' | 'custom';
  mfa: boolean;
  sso: boolean;
  rbac: {
    roles: ['owner', 'admin', 'member', 'viewer'];
    permissions: string[];
  };
}

// Row-level security
CREATE POLICY workspace_isolation ON tasks
  FOR ALL
  USING (workspace_id = current_workspace_id());
```

### Data Security
```yaml
encryption:
  at_rest: AES-256
  in_transit: TLS 1.3
  database: Column-level encryption for PII
  files: Client-side encryption for sensitive docs

compliance:
  - SOC 2 Type II
  - GDPR
  - CCPA
  - PCI DSS (via Stripe)
```

### API Security
```typescript
// Rate limiting
@UseGuards(RateLimitGuard)
@RateLimit({ points: 100, duration: 60 })

// Input validation
@UsePipes(ValidationPipe)
@Body() createTaskDto: CreateTaskDto

// CORS
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
});

// Helmet
app.use(helmet());
```

---

## Scaling Strategy

### Performance Targets
```yaml
targets:
  api_response_time: <200ms p95
  task_completion: <5s p95
  page_load: <1s
  uptime: 99.9%
  concurrent_users: 10,000
  tasks_per_second: 1,000
```

### Scaling Triggers
```typescript
// Horizontal scaling rules
const scalingRules = {
  cpu: { above: 70, scale_up: 2 },
  memory: { above: 80, scale_up: 1 },
  queue_depth: { above: 1000, scale_up: 3 },
  response_time: { above: 500, scale_up: 1 }
};

// Database scaling
if (connections > 80) {
  await scaleDatabase('read-replicas', 2);
}
```

### Caching Strategy
```typescript
// Multi-layer caching
const cacheStrategy = {
  edge: 'Cloudflare (static assets)',
  application: 'Redis (hot data)',
  database: 'PostgreSQL (materialized views)',
  client: 'React Query (UI state)'
};

// Cache invalidation
await redis.del(`user:${userId}:tasks`);
await cdn.purge(`/api/tasks/${taskId}`);
```

---

## Integration Architecture

### API Design
```typescript
// RESTful endpoints
GET    /api/v1/tasks
POST   /api/v1/tasks
GET    /api/v1/tasks/:id
PUT    /api/v1/tasks/:id
DELETE /api/v1/tasks/:id

// GraphQL schema
type Task {
  id: ID!
  type: String!
  status: TaskStatus!
  input: JSON!
  output: JSON
  worker: Worker
  cost: Float!
}

// WebSocket events
io.on('connection', (socket) => {
  socket.on('task:create', handleCreate);
  socket.emit('task:completed', result);
});
```

### External Integrations
```yaml
e_commerce:
  - Shopify (REST + Webhooks)
  - WooCommerce (REST)
  - BigCommerce (REST)
  - Square (SDK)

email:
  - SendGrid (API)
  - Mailgun (API)
  - Postmark (API)
  
payments:
  - Stripe (SDK + Webhooks)
  - PayPal (SDK)
  
ai_providers:
  - OpenAI (SDK)
  - Anthropic (SDK)
  - Replicate (API)
  - Hugging Face (API)
```

### Webhook System
```typescript
// Webhook registration
@Post('webhooks/register')
async registerWebhook(@Body() webhook: WebhookDto) {
  const secret = generateSecret();
  await this.webhookService.register(webhook, secret);
  return { webhook_id, secret };
}

// Webhook delivery
async deliverWebhook(event: Event) {
  const signature = createHmacSignature(event, secret);
  await axios.post(webhook.url, event, {
    headers: { 'X-Signature': signature }
  });
}
```

---

## Database Schema

### Core Tables
```sql
-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workspaces (Multi-tenant)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  owner_id UUID REFERENCES users(id),
  plan VARCHAR(50),
  credits DECIMAL(10,2)
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  type VARCHAR(100),
  status VARCHAR(50),
  input JSONB,
  output JSONB,
  cost DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  category VARCHAR(100),
  config JSONB,
  creator_id UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false
);
```

### Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

-- Full-text search
CREATE INDEX idx_templates_search ON templates 
  USING gin(to_tsvector('english', name || ' ' || category));

-- JSONB indexes
CREATE INDEX idx_tasks_input ON tasks USING gin(input);
CREATE INDEX idx_templates_config ON templates USING gin(config);
```

---

## Testing Strategy

### Testing Pyramid
```yaml
unit_tests: 70%
  - Services
  - Utilities
  - Components

integration_tests: 20%
  - API endpoints
  - Database queries
  - External services

e2e_tests: 10%
  - Critical paths
  - Payment flows
  - Task execution
```

### Testing Tools
```typescript
// Unit testing
describe('TaskService', () => {
  it('should create task', async () => {
    const task = await service.create(mockData);
    expect(task).toBeDefined();
  });
});

// API testing
describe('POST /tasks', () => {
  it('should return 201', async () => {
    const res = await request(app)
      .post('/tasks')
      .send(taskData);
    expect(res.status).toBe(201);
  });
});

// E2E testing
test('complete task workflow', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('button[name="create-task"]');
  await expect(page).toHaveURL('/tasks/new');
});
```

---

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Database migrations reviewed

### Deployment
- [ ] Blue-green deployment
- [ ] Health checks passing
- [ ] Rollback plan ready
- [ ] Monitoring alerts configured
- [ ] Feature flags set

### Post-deployment
- [ ] Smoke tests completed
- [ ] Metrics within normal range
- [ ] No error spike
- [ ] Customer communication sent
- [ ] Team retrospective scheduled

---

## Technology Roadmap

### Phase 1: MVP (Current)
- Basic stack implementation
- Monolithic deployment
- Single region
- Manual scaling

### Phase 2: Growth (Months 3-6)
- Microservices architecture
- Multi-region deployment
- Auto-scaling
- Advanced monitoring

### Phase 3: Scale (Year 1)
- Edge computing
- Custom AI models
- Real-time collaboration
- Blockchain integration

### Phase 4: Platform (Year 2)
- Plugin architecture
- SDK release
- Marketplace APIs
- White-label solution

---

*"Built for scale from day one. Simple enough for MVP, powerful enough for IPO."*