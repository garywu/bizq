# MVP Implementation Plan: Day-by-Day Execution

**Turning the 1% concept into reality in 14 days**

---

## Pre-Development (Day 0)

### Environment Setup
```bash
# Create project structure
mkdir bizq-mvp
cd bizq-mvp
npx create-next-app@latest frontend --typescript --tailwind --app
nest new backend
cd backend && npm install @nestjs/config @nestjs/typeorm typeorm pg
npm install openai stripe @bull/queue

# Database setup
createdb bizq_mvp
```

### Critical Decisions Made Upfront
- **AI Model**: GPT-4 for quality over GPT-3.5 for cost
- **Payment Model**: Credits system ($1 = 100 credits)
- **Human Routing**: Manual Discord channel initially
- **Deploy Target**: Vercel (frontend) + Railway (backend)

---

## Day 1-2: Database & Authentication

### Database Schema
```sql
-- Minimal viable schema
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  shopify_domain VARCHAR(255),
  credits_balance DECIMAL(10,2) DEFAULT 100.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  input JSONB NOT NULL,
  output JSONB,
  worker_type VARCHAR(20), -- 'ai' or 'human'
  worker_id VARCHAR(100),
  cost DECIMAL(10,2),
  rating INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  amount DECIMAL(10,2),
  type VARCHAR(20), -- 'charge' or 'credit'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Supabase Auth Setup
```typescript
// backend/src/auth/auth.service.ts
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  async validateUser(token: string) {
    const { data: { user } } = await this.supabase.auth.getUser(token);
    return user;
  }
}
```

---

## Day 3-4: Task Execution Engine

### Core Task Service
```typescript
// backend/src/tasks/task.service.ts
@Injectable()
export class TaskService {
  constructor(
    private openai: OpenAI,
    private db: DatabaseService,
    private credits: CreditsService
  ) {}

  async createTask(userId: string, type: string, input: any) {
    // Check credits
    const cost = this.getTaskCost(type);
    if (!await this.credits.hasBalance(userId, cost)) {
      throw new Error('Insufficient credits');
    }

    // Create task record
    const task = await this.db.tasks.create({
      user_id: userId,
      type,
      input,
      status: 'pending',
      cost
    });

    // Route to appropriate worker
    if (this.isAITask(type)) {
      this.executeAITask(task);
    } else {
      this.queueHumanTask(task);
    }

    return task;
  }

  private async executeAITask(task: Task) {
    try {
      const result = await this.processAITask(task.type, task.input);
      
      await this.db.tasks.update(task.id, {
        status: 'completed',
        output: result,
        worker_type: 'ai',
        completed_at: new Date()
      });

      await this.credits.charge(task.user_id, task.cost);
    } catch (error) {
      await this.db.tasks.update(task.id, {
        status: 'failed',
        output: { error: error.message }
      });
    }
  }

  private async processAITask(type: string, input: any) {
    const prompts = {
      'email.reply_to_customer': `
        You are a customer service expert. Reply professionally to this email:
        Customer Email: ${input.email}
        Context: ${input.context || 'E-commerce store'}
        
        Write a helpful, empathetic response that resolves their issue.
      `,
      'product.write_description': `
        Write an SEO-optimized product description for:
        Product: ${input.name}
        Features: ${input.features}
        Target Audience: ${input.audience || 'General consumers'}
        
        Include: Title, description (150 words), bullet points, SEO keywords.
      `,
      'social.create_post': `
        Create an engaging social media post for:
        Platform: ${input.platform}
        Topic: ${input.topic}
        Goal: ${input.goal || 'Engagement'}
        
        Include hashtags and call-to-action. Keep within platform limits.
      `
    };

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompts[type] }],
      temperature: 0.7,
      max_tokens: 500
    });

    return { 
      content: completion.choices[0].message.content,
      model: 'gpt-4',
      tokens: completion.usage.total_tokens
    };
  }
}
```

### Human Task Queue
```typescript
// backend/src/tasks/human-queue.service.ts
@Injectable()
export class HumanQueueService {
  private discordWebhook = process.env.DISCORD_WEBHOOK;

  async queueHumanTask(task: Task) {
    // Post to Discord for MVP
    await axios.post(this.discordWebhook, {
      content: `**New Human Task**\nID: ${task.id}\nType: ${task.type}\nReward: $${task.cost * 0.7}`,
      embeds: [{
        title: 'Task Details',
        description: JSON.stringify(task.input, null, 2),
        color: 0x00ff00,
        footer: { text: 'Reply with task ID and solution' }
      }]
    });

    // In production: Use proper queue system
    // await this.queue.add('human-task', task);
  }

  async completeHumanTask(taskId: string, output: any, workerId: string) {
    await this.db.tasks.update(taskId, {
      status: 'completed',
      output,
      worker_type: 'human',
      worker_id: workerId,
      completed_at: new Date()
    });

    const task = await this.db.tasks.findOne(taskId);
    await this.credits.charge(task.user_id, task.cost);
    
    // Pay worker (70% of task cost)
    await this.payWorker(workerId, task.cost * 0.7);
  }
}
```

---

## Day 5-6: Frontend Dashboard

### Main Dashboard Component
```tsx
// frontend/app/dashboard/page.tsx
'use client';

export default function Dashboard() {
  const { user, credits } = useAuth();
  const [tasks, setTasks] = useState([]);

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Credit Balance */}
        <Card>
          <CardHeader>
            <CardTitle>Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${credits.toFixed(2)}
            </div>
            <Button className="mt-2" size="sm">
              Add Credits
            </Button>
          </CardContent>
        </Card>

        {/* Quick Task Creator */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Create Task</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskCreator onTaskCreated={loadTasks} />
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>Tasks: {tasks.filter(t => isToday(t.created_at)).length}</div>
              <div>Saved: 2.5 hours</div>
              <div>Cost: ${calculateDailyCost(tasks)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList 
              tasks={tasks.filter(t => t.status === 'pending')}
              type="active"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList 
              tasks={tasks.filter(t => t.status === 'completed')}
              type="completed"
              onRate={rateTask}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Task Creator Component
```tsx
// frontend/components/task-creator.tsx
const TASK_TYPES = [
  {
    id: 'email.reply_to_customer',
    name: 'Reply to Customer Email',
    cost: 0.5,
    icon: Mail,
    fields: ['email', 'context']
  },
  {
    id: 'product.write_description',
    name: 'Write Product Description',
    cost: 2,
    icon: Package,
    fields: ['name', 'features', 'audience']
  },
  {
    id: 'social.create_post',
    name: 'Create Social Post',
    cost: 1,
    icon: Share2,
    fields: ['platform', 'topic', 'goal']
  },
  {
    id: 'research.find_competitors',
    name: 'Research Competitors',
    cost: 20,
    icon: Search,
    fields: ['business', 'focus']
  },
  {
    id: 'customer.urgent_complaint',
    name: 'Handle Urgent Complaint',
    cost: 10,
    icon: AlertTriangle,
    fields: ['complaint', 'customer_value']
  }
];

export function TaskCreator({ onTaskCreated }) {
  const [selectedType, setSelectedType] = useState(null);
  const [input, setInput] = useState({});

  const createTask = async () => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: selectedType.id, input })
    });
    
    if (response.ok) {
      toast.success('Task created!');
      onTaskCreated();
      setSelectedType(null);
      setInput({});
    }
  };

  return (
    <div className="space-y-4">
      {/* Task Type Selection */}
      <div className="grid grid-cols-2 gap-2">
        {TASK_TYPES.map(type => (
          <Button
            key={type.id}
            variant={selectedType?.id === type.id ? 'default' : 'outline'}
            onClick={() => setSelectedType(type)}
            className="justify-start"
          >
            <type.icon className="mr-2 h-4 w-4" />
            <div className="text-left">
              <div className="text-sm">{type.name}</div>
              <div className="text-xs opacity-60">${type.cost}</div>
            </div>
          </Button>
        ))}
      </div>

      {/* Dynamic Input Fields */}
      {selectedType && (
        <div className="space-y-3 p-4 border rounded">
          <h3 className="font-semibold">{selectedType.name}</h3>
          {selectedType.fields.map(field => (
            <div key={field}>
              <Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
              <Textarea
                placeholder={`Enter ${field}...`}
                value={input[field] || ''}
                onChange={(e) => setInput({...input, [field]: e.target.value})}
                rows={field === 'email' || field === 'complaint' ? 6 : 3}
              />
            </div>
          ))}
          <Button onClick={createTask} className="w-full">
            Create Task (${selectedType.cost})
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

## Day 7: Integration & Deployment

### Shopify Integration
```typescript
// backend/src/integrations/shopify.service.ts
@Injectable()
export class ShopifyService {
  async connectStore(userId: string, shop: string, accessToken: string) {
    // Verify token with Shopify
    const shopify = new Shopify({
      shopName: shop,
      accessToken: accessToken
    });

    const shopData = await shopify.shop.get();
    
    // Save connection
    await this.db.users.update(userId, {
      shopify_domain: shop,
      shopify_token: this.encrypt(accessToken),
      shopify_data: shopData
    });

    // Import initial data
    await this.importProducts(userId, shopify);
    await this.importCustomers(userId, shopify);
    
    return shopData;
  }

  async importRecentEmails(userId: string) {
    // For MVP: Use email forwarding
    // User forwards support@store.com to task-[userid]@bizq.app
    // We parse and create tasks automatically
  }
}
```

### Deployment Scripts
```yaml
# railway.yml
services:
  backend:
    build: ./backend
    env:
      DATABASE_URL: ${{ POSTGRES_URL }}
      OPENAI_API_KEY: ${{ OPENAI_API_KEY }}
      STRIPE_SECRET_KEY: ${{ STRIPE_SECRET_KEY }}
    healthcheck:
      path: /health
      interval: 30s

# vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_STRIPE_KEY": "@stripe_publishable_key"
  }
}
```

---

## Day 8-9: User Recruitment

### Outreach Template
```
Subject: Free AI Assistant for Your Shopify Store (10 Spots)

Hi [Name],

I noticed you run [Store Name] on Shopify. We're testing a new AI assistant that handles repetitive tasks like:
- Writing customer email replies
- Creating product descriptions  
- Generating social media posts

We're offering 10 store owners:
✓ Free access for 30 days
✓ $100 in task credits
✓ Personal onboarding call
✓ Daily support

The catch? We need your honest feedback to improve the product.

Interested? Just reply "YES" and I'll send the details.

Best,
[Your Name]
```

### Target Channels
1. **Shopify Community Forums**
2. **Facebook Groups**: "Shopify Entrepreneurs", "E-commerce All-Stars"
3. **Reddit**: r/shopify, r/ecommerce, r/entrepreneur
4. **Direct Outreach**: Find stores via BuiltWith
5. **Personal Network**: Friends running online stores

### Qualification Criteria
- Active Shopify store (>$5k/month revenue)
- Getting 10+ support emails/day
- Currently doing tasks manually
- Willing to provide feedback
- Available for 15-min onboarding

---

## Day 10-11: User Onboarding

### Onboarding Checklist
```markdown
## 15-Minute Onboarding Call

1. **Welcome & Context** (2 min)
   - Thank them for participating
   - Explain what we're testing
   - Set expectations

2. **Account Setup** (3 min)
   - Create account
   - Connect Shopify store
   - Add $100 credits

3. **First Task Together** (5 min)
   - Share screen
   - Create email reply task
   - Show task completion
   - Review output quality

4. **Daily Workflow** (3 min)
   - When to use BizQ
   - What tasks work best
   - How to rate tasks
   - Where to get help

5. **Questions & Support** (2 min)
   - Join Discord channel
   - Daily check-in schedule
   - Feedback form link
```

### Onboarding Email
```
Subject: Welcome to BizQ! Here's How to Start

Hi [Name],

Your account is set up with $100 in free credits! 

🚀 Quick Start:
1. Go to app.bizq.app/dashboard
2. Click "Create Task"
3. Choose "Reply to Customer Email"
4. Paste a real customer email
5. Watch AI handle it in <30 seconds

📱 Join our Discord for instant help: [link]

💡 Try these tasks today:
- Reply to 5 customer emails
- Write a product description
- Create tomorrow's Instagram post

I'll check in tomorrow to see how it's going!

Best,
[Your Name]
P.S. Remember to rate each task - it helps us improve!
```

---

## Day 12-13: Daily Operations

### Daily Monitoring Dashboard
```typescript
// admin/monitoring.ts
interface DailyMetrics {
  activeUsers: number;
  tasksCreated: number;
  tasksCompleted: number;
  aiSuccessRate: number;
  averageCompletionTime: number;
  totalCost: number;
  userFeedback: Feedback[];
  errors: Error[];
}

async function generateDailyReport(): Promise<DailyMetrics> {
  const metrics = await db.query(`
    SELECT 
      COUNT(DISTINCT user_id) as active_users,
      COUNT(*) as tasks_created,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      AVG(CASE WHEN worker_type = 'ai' AND rating >= 4 THEN 1 ELSE 0 END) as ai_success,
      AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_time,
      SUM(cost) as total_cost
    FROM tasks
    WHERE created_at > NOW() - INTERVAL '24 hours'
  `);

  // Send to Slack/Discord
  await sendDailyReport(metrics);
  
  return metrics;
}
```

### User Check-in Script
```javascript
// Daily check-in message (automated)
const checkInMessage = `
Hi [Name]! Day ${dayNumber} update:

📊 Your Stats:
- Tasks completed: ${userStats.completed}
- Time saved: ${userStats.timeSaved} hours
- Credits remaining: $${userStats.credits}

❓ Quick question: What task would you love to delegate that we don't support yet?

Reply here or in Discord!
`;
```

### Issue Resolution Playbook
```
COMMON ISSUES & FIXES:

1. "AI response not good enough"
   → Review prompt
   → Switch to GPT-4 if using GPT-3.5
   → Escalate to human if needed
   → Refund credits

2. "Task taking too long"
   → Check worker queue
   → Manually complete if urgent
   → Add rush option for future

3. "Don't understand how to use"
   → Schedule 1-on-1 call
   → Create video walkthrough
   → Pair them with successful user

4. "Want different task type"
   → Add to feature requests
   → Try to solve with existing tasks
   → Promise in next iteration
```

---

## Day 14: Analysis & Decision

### Final Data Collection
```typescript
interface MVPResults {
  // Quantitative
  totalUsers: 10;
  activeUsers: number; // Target: 5+
  totalTasks: number; // Target: 100+
  aiCompletionRate: number; // Target: 80%+
  averageDailyTasks: number; // Target: 10+
  averageCostPerDay: number; // Target: <$5
  taskSatisfaction: number; // Target: 4.0+
  
  // Qualitative
  willingToPay: number; // Target: 3+
  pricePoint: number; // Target: $297
  featureRequests: string[];
  biggestPainPoints: string[];
  testimonials: string[];
  
  // Economics
  averageTaskCost: number;
  platformMargin: number;
  projectedLTV: number;
  paybackPeriod: number;
}
```

### Decision Framework
```
GO (Raise Seed Round):
✓ 5+ daily active users
✓ 80%+ AI success rate
✓ 3+ willing to pay $297
✓ Positive unit economics
✓ Clear product-market fit signals

PIVOT (Adjust & Retest):
⚠️ 3-4 daily active users
⚠️ 60-79% AI success rate
⚠️ Users want different features
⚠️ Price resistance at $297
→ Action: Adjust based on feedback, test again

STOP (Try Different Approach):
✗ <3 daily active users
✗ <60% AI success rate
✗ No willingness to pay
✗ Fundamental trust issues
→ Action: Consider different model
```

### Investor Pitch Prep
```markdown
## 2-Week MVP Results

**Traction**
- 10 beta users processed 1,000+ tasks
- 80% AI completion rate
- 4.5/5 average satisfaction
- 5 users want to pay $297/month

**Economics**
- $3 average cost per user per day
- 70% gross margin
- $297 MRR per customer
- 3-month payback period

**Insights**
- Most requested: [List top 5 tasks]
- Biggest value: Time savings (3 hrs/day)
- Key concern: Quality consistency
- Viral potential: Template sharing

**Ask**
- $2M seed round
- 18-month runway
- Scale to 1,000 customers
- Build full platform
```

---

## Post-MVP: Immediate Next Steps

### If GO Decision

#### Week 3-4: Rapid Iteration
- Add top 5 requested task types
- Improve AI prompts based on feedback
- Build proper human worker queue
- Add basic analytics dashboard

#### Week 5-6: Scale to 100 Users
- Automate onboarding
- Build referral program
- Launch ProductHunt
- Start content marketing

#### Week 7-8: Prepare for Fundraise
- Incorporate company
- Create pitch deck
- Build financial model
- Line up advisors
- Warm intros to investors

### If PIVOT Decision

#### Alternative Tests
1. **Different market**: Agencies instead of e-commerce
2. **Different tasks**: Focus on high-value only
3. **Different model**: Pay-per-success, not per-task
4. **Different positioning**: VA replacement, not tool consolidation

---

## Risk Mitigation

### Technical Risks
- **AI Quality**: Have human fallback for all tasks
- **Scalability**: Use queues from day 1
- **Security**: Never store sensitive data
- **Reliability**: 99.9% uptime SLA

### Business Risks
- **Trust**: Money-back guarantee
- **Adoption**: Free credits remove friction
- **Retention**: Daily check-ins catch issues early
- **Competition**: Move fast, build moat with data

### Legal Risks
- **Data Privacy**: GDPR compliant from start
- **Worker Classification**: Clear contractor agreements
- **Terms of Service**: Lawyer-reviewed before launch
- **IP Rights**: Users own all output

---

## Success Criteria Checklist

### Must Have (Day 14)
- [ ] 10 users onboarded
- [ ] 100+ tasks completed
- [ ] 80%+ AI success rate
- [ ] Core platform stable
- [ ] Payment processing working

### Should Have
- [ ] 5+ daily active users
- [ ] 4.0+ satisfaction rating
- [ ] 3+ willing to pay
- [ ] <$5 daily cost per user
- [ ] Clear feature roadmap

### Nice to Have
- [ ] Viral referral started
- [ ] Case study from power user
- [ ] Advisor interested
- [ ] Investor meeting scheduled
- [ ] Press coverage

---

*"In 14 days, we'll know if BizQ is a billion-dollar idea or just another idea."*

**The plan is ready. Time to execute.**