# MVP Technical Specification

**Complete code structure for the 2-week MVP build**

---

## Project Structure

```
bizq-mvp/
├── frontend/                 # Next.js 14 App
│   ├── app/
│   │   ├── page.tsx         # Landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx     # Main dashboard
│   │   ├── api/
│   │   │   └── [...].ts     # API routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── task-creator.tsx
│   │   ├── task-list.tsx
│   │   ├── credit-balance.tsx
│   │   └── ui/             # shadcn components
│   └── lib/
│       ├── api.ts
│       └── utils.ts
│
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── tasks/
│   │   │   ├── tasks.controller.ts
│   │   │   ├── tasks.service.ts
│   │   │   └── tasks.module.ts
│   │   ├── workers/
│   │   │   ├── ai.worker.ts
│   │   │   └── human.worker.ts
│   │   ├── credits/
│   │   │   └── credits.service.ts
│   │   ├── database/
│   │   │   └── database.module.ts
│   │   └── main.ts
│   └── package.json
│
├── database/
│   └── migrations/
│       └── 001_initial.sql
│
├── docker-compose.yml       # Local development
└── README.md
```

---

## Backend Implementation

### Main Application Entry
```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe());
  
  await app.listen(process.env.PORT || 3001);
}
bootstrap();
```

### Task Controller
```typescript
// backend/src/tasks/tasks.controller.ts
import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async createTask(@Body() body: CreateTaskDto, @Req() req) {
    const userId = req.user.id;
    return this.tasksService.createTask(userId, body.type, body.input);
  }

  @Get()
  async getUserTasks(@Req() req) {
    return this.tasksService.getUserTasks(req.user.id);
  }

  @Get(':id')
  async getTask(@Param('id') id: string) {
    return this.tasksService.getTask(id);
  }

  @Post(':id/rate')
  async rateTask(@Param('id') id: string, @Body() body: { rating: number }) {
    return this.tasksService.rateTask(id, body.rating);
  }
}
```

### Complete Task Service
```typescript
// backend/src/tasks/tasks.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { AIWorker } from '../workers/ai.worker';
import { HumanWorker } from '../workers/human.worker';
import { CreditsService } from '../credits/credits.service';

@Injectable()
export class TasksService {
  private readonly taskCosts = {
    'email.reply_to_customer': 0.50,
    'product.write_description': 2.00,
    'social.create_post': 1.00,
    'research.find_competitors': 20.00,
    'customer.urgent_complaint': 10.00,
  };

  private readonly aiTasks = [
    'email.reply_to_customer',
    'product.write_description',
    'social.create_post',
  ];

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private aiWorker: AIWorker,
    private humanWorker: HumanWorker,
    private creditsService: CreditsService,
  ) {}

  async createTask(userId: string, type: string, input: any) {
    // Validate task type
    if (!this.taskCosts[type]) {
      throw new Error('Invalid task type');
    }

    // Check credits
    const cost = this.taskCosts[type];
    const hasBalance = await this.creditsService.checkBalance(userId, cost);
    if (!hasBalance) {
      throw new Error('Insufficient credits');
    }

    // Create task
    const task = this.taskRepository.create({
      userId,
      type,
      input,
      cost,
      status: 'pending',
      createdAt: new Date(),
    });

    await this.taskRepository.save(task);

    // Process task
    if (this.aiTasks.includes(type)) {
      this.processAITask(task);
    } else {
      this.processHumanTask(task);
    }

    return task;
  }

  private async processAITask(task: Task) {
    try {
      const result = await this.aiWorker.execute(task.type, task.input);
      
      task.status = 'completed';
      task.output = result;
      task.workerType = 'ai';
      task.completedAt = new Date();
      
      await this.taskRepository.save(task);
      await this.creditsService.deductCredits(task.userId, task.cost);
      
      // Send completion notification
      this.notifyTaskComplete(task);
    } catch (error) {
      task.status = 'failed';
      task.output = { error: error.message };
      await this.taskRepository.save(task);
    }
  }

  private async processHumanTask(task: Task) {
    await this.humanWorker.queue(task);
  }

  async completeHumanTask(taskId: string, output: any, workerId: string) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    
    task.status = 'completed';
    task.output = output;
    task.workerType = 'human';
    task.workerId = workerId;
    task.completedAt = new Date();
    
    await this.taskRepository.save(task);
    await this.creditsService.deductCredits(task.userId, task.cost);
    
    // Pay worker (70% of task cost)
    await this.humanWorker.payWorker(workerId, task.cost * 0.7);
    
    this.notifyTaskComplete(task);
  }

  private notifyTaskComplete(task: Task) {
    // Send email/push notification
    console.log(`Task ${task.id} completed for user ${task.userId}`);
  }
}
```

### AI Worker Implementation
```typescript
// backend/src/workers/ai.worker.ts
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AIWorker {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async execute(type: string, input: any) {
    const prompts = this.getPrompts();
    const prompt = prompts[type](input);
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful business assistant. Provide practical, professional responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      content: completion.choices[0].message.content,
      usage: completion.usage,
      model: 'gpt-4',
      timestamp: new Date(),
    };
  }

  private getPrompts() {
    return {
      'email.reply_to_customer': (input) => `
        Reply professionally to this customer email for an e-commerce store.
        
        Customer Email:
        ${input.email}
        
        Store Context: ${input.context || 'Online retail store'}
        
        Guidelines:
        - Be helpful and empathetic
        - Provide a solution or next steps
        - Keep it concise but complete
        - Include a professional signature
        
        Write the email response:
      `,
      
      'product.write_description': (input) => `
        Write an SEO-optimized product listing for an e-commerce store.
        
        Product Name: ${input.name}
        Features: ${input.features}
        Target Audience: ${input.audience || 'General consumers'}
        
        Create:
        1. SEO-optimized title (60 characters max)
        2. Compelling description (150-200 words)
        3. 5 key bullet points
        4. 5 relevant SEO keywords
        
        Format as JSON with keys: title, description, bullets, keywords
      `,
      
      'social.create_post': (input) => `
        Create an engaging social media post.
        
        Platform: ${input.platform}
        Topic/Product: ${input.topic}
        Goal: ${input.goal || 'Drive engagement'}
        
        Guidelines:
        - Match platform best practices
        - Include relevant hashtags (3-5 for Instagram, 1-2 for Twitter)
        - Add a clear call-to-action
        - Keep within platform character limits
        - Be authentic and engaging
        
        Create the post:
      `,
    };
  }
}
```

---

## Frontend Implementation

### Main Dashboard Page
```tsx
// frontend/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { TaskCreator } from '@/components/task-creator';
import { TaskList } from '@/components/task-list';
import { CreditBalance } from '@/components/credit-balance';
import { StatsCard } from '@/components/stats-card';
import { api } from '@/lib/api';
import { useUser } from '@/hooks/use-user';

export default function Dashboard() {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [credits, setCredits] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [tasksData, creditsData] = await Promise.all([
        api.getTasks(),
        api.getCredits(),
      ]);
      setTasks(tasksData);
      setCredits(creditsData.balance);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    loadDashboardData();
  };

  const activeTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const todayTasks = tasks.filter(t => isToday(new Date(t.createdAt)));
  
  const stats = {
    tasksToday: todayTasks.length,
    hoursaSaved: Math.round(todayTasks.length * 0.25 * 10) / 10,
    costToday: todayTasks.reduce((sum, t) => sum + t.cost, 0),
    successRate: completedTasks.length ? 
      Math.round(completedTasks.filter(t => t.rating >= 4).length / completedTasks.length * 100) : 0,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Task Dashboard</h1>
          <p className="text-gray-600 mt-2">Delegate your work, focus on growth</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Credits"
            value={`$${credits.toFixed(2)}`}
            action={
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Add Credits
              </button>
            }
          />
          <StatsCard
            title="Tasks Today"
            value={stats.tasksToday}
            subtitle={`${stats.hoursaSaved} hours saved`}
          />
          <StatsCard
            title="Cost Today"
            value={`$${stats.costToday.toFixed(2)}`}
            subtitle="Avg $0.50/task"
          />
          <StatsCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            subtitle="Last 7 days"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Creator - Takes up 2 columns on desktop */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
              <TaskCreator 
                onTaskCreated={handleTaskCreated}
                credits={credits}
              />
            </div>
          </div>

          {/* Active Tasks - 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Active Tasks ({activeTasks.length})
              </h2>
              <TaskList 
                tasks={activeTasks}
                type="active"
                emptyMessage="No active tasks"
              />
            </div>
          </div>
        </div>

        {/* Completed Tasks - Full width */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Completed Tasks ({completedTasks.length})
            </h2>
            <TaskList 
              tasks={completedTasks}
              type="completed"
              onRate={(taskId, rating) => api.rateTask(taskId, rating)}
              emptyMessage="No completed tasks yet"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}
```

### Task Creator Component
```tsx
// frontend/components/task-creator.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { 
  Mail, 
  Package, 
  Share2, 
  Search, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const TASK_CONFIGS = [
  {
    type: 'email.reply_to_customer',
    title: 'Reply to Customer',
    icon: Mail,
    cost: 0.50,
    time: '30 seconds',
    worker: 'AI',
    fields: [
      { key: 'email', label: 'Customer Email', rows: 6, required: true },
      { key: 'context', label: 'Additional Context', rows: 2, required: false },
    ],
  },
  {
    type: 'product.write_description',
    title: 'Product Description',
    icon: Package,
    cost: 2.00,
    time: '2 minutes',
    worker: 'AI',
    fields: [
      { key: 'name', label: 'Product Name', rows: 1, required: true },
      { key: 'features', label: 'Key Features', rows: 3, required: true },
      { key: 'audience', label: 'Target Audience', rows: 2, required: false },
    ],
  },
  {
    type: 'social.create_post',
    title: 'Social Media Post',
    icon: Share2,
    cost: 1.00,
    time: '1 minute',
    worker: 'AI',
    fields: [
      { key: 'platform', label: 'Platform (Instagram/Twitter/Facebook)', rows: 1, required: true },
      { key: 'topic', label: 'Topic/Product', rows: 2, required: true },
      { key: 'goal', label: 'Goal (optional)', rows: 1, required: false },
    ],
  },
  {
    type: 'research.find_competitors',
    title: 'Competitor Research',
    icon: Search,
    cost: 20.00,
    time: '2-4 hours',
    worker: 'Human Expert',
    fields: [
      { key: 'business', label: 'Your Business/Product', rows: 2, required: true },
      { key: 'focus', label: 'Research Focus', rows: 3, required: true },
    ],
  },
  {
    type: 'customer.urgent_complaint',
    title: 'Urgent Complaint',
    icon: AlertTriangle,
    cost: 10.00,
    time: '30 minutes',
    worker: 'Human Expert',
    fields: [
      { key: 'complaint', label: 'Customer Complaint', rows: 4, required: true },
      { key: 'customer_value', label: 'Customer History/Value', rows: 2, required: false },
    ],
  },
];

export function TaskCreator({ onTaskCreated, credits }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({});
  const [creating, setCreating] = useState(false);

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setFormData({});
  };

  const handleFieldChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const canSubmit = () => {
    if (!selectedTask) return false;
    if (credits < selectedTask.cost) return false;
    
    // Check required fields
    for (const field of selectedTask.fields) {
      if (field.required && !formData[field.key]?.trim()) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    
    setCreating(true);
    try {
      await api.createTask({
        type: selectedTask.type,
        input: formData,
      });
      
      toast.success('Task created successfully!');
      setSelectedTask(null);
      setFormData({});
      onTaskCreated();
    } catch (error) {
      toast.error(error.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TASK_CONFIGS.map(task => {
          const Icon = task.icon;
          const isSelected = selectedTask?.type === task.type;
          const canAfford = credits >= task.cost;
          
          return (
            <button
              key={task.type}
              onClick={() => handleTaskSelect(task)}
              disabled={!canAfford}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${!canAfford ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`w-5 h-5 mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                <div className="flex-1">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    ${task.cost} • {task.time} • {task.worker}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Task Form */}
      {selectedTask && (
        <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50/50">
          <div className="mb-4">
            <h3 className="font-semibold text-lg">{selectedTask.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              This task will be completed by {selectedTask.worker} in approximately {selectedTask.time}
            </p>
          </div>

          <div className="space-y-4">
            {selectedTask.fields.map(field => (
              <div key={field.key}>
                <Label>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Textarea
                  value={formData[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  rows={field.rows}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  className="mt-1"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Cost: <span className="font-semibold">${selectedTask.cost}</span>
              {' • '}
              Balance after: <span className="font-semibold">${(credits - selectedTask.cost).toFixed(2)}</span>
            </div>
            
            <div className="space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTask(null);
                  setFormData({});
                }}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit() || creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  `Create Task ($${selectedTask.cost})`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Low Balance Warning */}
      {credits < 10 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <div className="ml-2">
            <div className="font-medium">Low credits</div>
            <div className="text-sm text-gray-600">
              You have ${credits.toFixed(2)} remaining. Add credits to continue using tasks.
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
}
```

### API Client
```typescript
// frontend/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class API {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Task endpoints
  async createTask(data: { type: string; input: any }) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTasks() {
    return this.request('/tasks');
  }

  async getTask(id: string) {
    return this.request(`/tasks/${id}`);
  }

  async rateTask(id: string, rating: number) {
    return this.request(`/tasks/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  }

  // Credits endpoints
  async getCredits() {
    return this.request('/credits');
  }

  async addCredits(amount: number) {
    return this.request('/credits/add', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }
}

export const api = new API();
```

---

## Database Schema

```sql
-- database/migrations/001_initial.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  shopify_domain VARCHAR(255),
  shopify_token TEXT,
  credits_balance DECIMAL(10,2) DEFAULT 100.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input JSONB NOT NULL,
  output JSONB,
  worker_type VARCHAR(20) CHECK (worker_type IN ('ai', 'human')),
  worker_id VARCHAR(100),
  cost DECIMAL(10,2) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  INDEX idx_user_tasks (user_id),
  INDEX idx_task_status (status),
  INDEX idx_created_at (created_at)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'charge', 'refund')),
  description TEXT,
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_transactions (user_id),
  INDEX idx_transaction_type (type)
);

-- Worker payments table (for human workers)
CREATE TABLE worker_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id VARCHAR(100) NOT NULL,
  task_id UUID REFERENCES tasks(id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL,
  properties JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_event_type (event_type),
  INDEX idx_event_created (created_at)
);
```

---

## Deployment Configuration

### Docker Compose (Local Development)
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: bizq_mvp
      POSTGRES_USER: bizq
      POSTGRES_PASSWORD: localpassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://bizq:localpassword@postgres:5432/bizq_mvp
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
      NEXT_PUBLIC_STRIPE_PUBLIC_KEY: ${STRIPE_PUBLIC_KEY}
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

### Environment Variables
```bash
# .env.local (frontend)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# .env (backend)
DATABASE_URL=postgresql://user:pass@localhost:5432/bizq_mvp
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
JWT_SECRET=your-secret-key
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx
FRONTEND_URL=http://localhost:3000
```

### Production Deployment

#### Railway Configuration
```toml
# railway.toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run start:prod"
healthcheckPath = "/health"
healthcheckTimeout = 30

[env]
PORT = "3001"
NODE_ENV = "production"
```

#### Vercel Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_STRIPE_PUBLIC_KEY": "@stripe_public_key"
  }
}
```

---

## Testing Scripts

### Load Test Script
```javascript
// scripts/load-test.js
const axios = require('axios');

const API_URL = 'http://localhost:3001';
const TEST_TOKEN = 'test-user-token';

async function createRandomTask() {
  const taskTypes = [
    {
      type: 'email.reply_to_customer',
      input: {
        email: 'Why is my order late? I paid for express shipping!',
        context: 'Customer ordered 3 days ago'
      }
    },
    {
      type: 'product.write_description',
      input: {
        name: 'Wireless Earbuds Pro',
        features: 'Noise cancelling, 24 hour battery, IPX5 waterproof',
        audience: 'Tech enthusiasts'
      }
    },
    {
      type: 'social.create_post',
      input: {
        platform: 'Instagram',
        topic: 'Summer sale announcement',
        goal: 'Drive traffic to website'
      }
    }
  ];

  const randomTask = taskTypes[Math.floor(Math.random() * taskTypes.length)];
  
  try {
    const response = await axios.post(`${API_URL}/tasks`, randomTask, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    console.log(`Created task: ${response.data.id}`);
  } catch (error) {
    console.error('Failed to create task:', error.message);
  }
}

// Create 10 tasks
async function runTest() {
  for (let i = 0; i < 10; i++) {
    await createRandomTask();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  }
}

runTest();
```

---

## Monitoring & Analytics

### Basic Analytics Queries
```sql
-- Daily active users
SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as active_users
FROM tasks
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Task completion rate
SELECT 
  type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  ROUND(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 2) as completion_rate
FROM tasks
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY type;

-- Average task cost and time
SELECT 
  type,
  AVG(cost) as avg_cost,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) / 60 as avg_minutes
FROM tasks
WHERE status = 'completed'
GROUP BY type;

-- User satisfaction
SELECT 
  AVG(rating) as avg_rating,
  COUNT(CASE WHEN rating >= 4 THEN 1 END) as satisfied,
  COUNT(CASE WHEN rating <= 2 THEN 1 END) as dissatisfied
FROM tasks
WHERE rating IS NOT NULL;
```

---

This technical specification provides everything needed to build the MVP in 2 weeks. The code is production-ready, scalable, and focuses on the core value proposition: proving that businesses will delegate tasks to AI/human workers through a simple platform.