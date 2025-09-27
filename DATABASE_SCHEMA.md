# BizQ Database Schema

**Multi-Tenant Business Application Database with Row-Level Security**

---

## Schema Overview

BizQ uses a multi-tenant PostgreSQL database hosted on Supabase with Row-Level Security (RLS) for data isolation. The schema is designed to support content generation, e-commerce operations, and AI task management at scale.

**Architecture Pattern**: Adapted from Midday's proven multi-tenant design with BizQ-specific business entities.

---

## Core Tables

### 1. Workspaces (Tenant Isolation)

```sql
-- Main tenant/workspace table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  
  -- Subscription & Billing
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'scale', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'suspended', 'trial')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Credits & Usage
  credits_balance INTEGER NOT NULL DEFAULT 100,
  credits_used_this_month INTEGER DEFAULT 0,
  monthly_credit_limit INTEGER DEFAULT 1000,
  
  -- Configuration
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  
  -- AI Preferences
  ai_preferences JSONB DEFAULT '{
    "preferred_provider": "auto",
    "quality_tier": "standard",
    "cost_sensitivity": 0.5,
    "max_task_cost": 10.0
  }'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_credits CHECK (credits_balance >= 0),
  CONSTRAINT valid_monthly_limit CHECK (monthly_credit_limit > 0)
);

-- Indexes
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_plan ON workspaces(plan);
CREATE INDEX idx_workspaces_subscription_status ON workspaces(subscription_status);
```

### 2. Users & Authentication

```sql
-- User management with workspace association
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Identity
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Authentication (Supabase Auth integration)
  auth_user_id UUID UNIQUE, -- Links to auth.users
  
  -- Permissions
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- Preferences
  preferences JSONB DEFAULT '{
    "email_notifications": true,
    "task_notifications": true,
    "theme": "system",
    "language": "en"
  }'::jsonb,
  
  -- Activity
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(workspace_id, email)
);

-- Indexes
CREATE INDEX idx_users_workspace_id ON users(workspace_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_role ON users(role);
```

### 3. Task Execution System

```sql
-- Central task management and execution
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Task Definition
  type TEXT NOT NULL, -- 'content.write_blog_post', 'order.process_batch', etc.
  category TEXT NOT NULL, -- 'content', 'ecommerce', 'customer_service', 'analytics'
  name TEXT NOT NULL,
  description TEXT,
  
  -- Execution
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'queued', 'processing', 'completed', 'failed', 'cancelled', 'escalated'
  )),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1=highest, 10=lowest
  
  -- Input/Output
  input JSONB NOT NULL,
  output JSONB,
  error_details JSONB,
  
  -- Processing Details
  worker_type TEXT DEFAULT 'ai' CHECK (worker_type IN ('ai', 'human', 'integration', 'webhook')),
  ai_model TEXT, -- 'gpt-4', 'claude-3-opus', etc.
  ai_provider TEXT, -- 'openai', 'anthropic', etc.
  processing_time_ms INTEGER,
  
  -- Cost & Credits
  estimated_cost INTEGER, -- In credits
  actual_cost INTEGER, -- In credits
  cost_breakdown JSONB, -- Detailed cost info
  
  -- Relationships
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id), -- For human tasks
  parent_task_id UUID REFERENCES tasks(id), -- For subtasks
  workflow_id UUID, -- For grouped tasks
  
  -- Dependencies
  depends_on UUID[] DEFAULT '{}', -- Array of task IDs
  blocks UUID[] DEFAULT '{}', -- Array of task IDs this blocks
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Context for AI
  context JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  
  -- Quality & Feedback
  quality_score DECIMAL(3,2), -- 0.00 to 5.00
  user_feedback JSONB,
  
  -- Constraints
  CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 10),
  CONSTRAINT valid_quality_score CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 5))
);

-- Indexes
CREATE INDEX idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_scheduled_for ON tasks(scheduled_for);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX idx_tasks_workflow_id ON tasks(workflow_id);
CREATE INDEX idx_tasks_priority_status ON tasks(priority, status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- GIN indexes for JSONB columns
CREATE INDEX idx_tasks_input_gin ON tasks USING GIN(input);
CREATE INDEX idx_tasks_output_gin ON tasks USING GIN(output);
CREATE INDEX idx_tasks_context_gin ON tasks USING GIN(context);
```

---

## Business Entity Tables

### 4. Store Integrations

```sql
-- E-commerce platform integrations
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Store Identity
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN (
    'shopify', 'woocommerce', 'amazon', 'etsy', 'squarespace', 'bigcommerce'
  )),
  store_url TEXT NOT NULL,
  
  -- API Connection
  credentials JSONB NOT NULL, -- Encrypted API keys and tokens
  api_version TEXT,
  
  -- Status & Health
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'setup')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
  sync_error TEXT,
  
  -- Configuration
  sync_settings JSONB DEFAULT '{
    "auto_sync": true,
    "sync_frequency": "hourly",
    "sync_products": true,
    "sync_orders": true,
    "sync_customers": true
  }'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(workspace_id, platform, store_url)
);

-- Indexes
CREATE INDEX idx_stores_workspace_id ON stores(workspace_id);
CREATE INDEX idx_stores_platform ON stores(platform);
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_stores_last_sync_at ON stores(last_sync_at);
```

### 5. Products

```sql
-- Product catalog across all stores
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Product Identity
  external_id TEXT, -- Platform-specific ID
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  
  -- Pricing
  price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Inventory
  inventory_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT TRUE,
  
  -- Classification
  product_type TEXT,
  vendor TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Media
  images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs and metadata
  featured_image TEXT,
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  handle TEXT, -- URL slug
  
  -- Variants
  has_variants BOOLEAN DEFAULT FALSE,
  variant_options JSONB, -- Size, Color, etc.
  
  -- AI Enhancement Status
  ai_description_generated BOOLEAN DEFAULT FALSE,
  ai_images_generated BOOLEAN DEFAULT FALSE,
  ai_seo_optimized BOOLEAN DEFAULT FALSE,
  ai_last_enhanced_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  platform_data JSONB DEFAULT '{}'::jsonb, -- Platform-specific fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_price CHECK (price IS NULL OR price >= 0),
  CONSTRAINT valid_inventory CHECK (inventory_quantity >= 0)
);

-- Indexes
CREATE INDEX idx_products_workspace_id ON products(workspace_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_external_id ON products(external_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_product_type ON products(product_type);
CREATE INDEX idx_products_tags_gin ON products USING GIN(tags);
CREATE INDEX idx_products_ai_enhanced ON products(ai_description_generated, ai_images_generated);
```

### 6. Product Variants

```sql
-- Product variants (sizes, colors, etc.)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Variant Identity
  external_id TEXT,
  sku TEXT,
  barcode TEXT,
  
  -- Options
  option1 TEXT, -- Size, Color, etc.
  option2 TEXT,
  option3 TEXT,
  
  -- Pricing
  price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  
  -- Inventory
  inventory_quantity INTEGER DEFAULT 0,
  
  -- Status
  available BOOLEAN DEFAULT TRUE,
  
  -- Physical
  weight DECIMAL(8,2),
  weight_unit TEXT DEFAULT 'kg',
  
  -- Media
  image_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_variant_price CHECK (price IS NULL OR price >= 0),
  CONSTRAINT valid_variant_inventory CHECK (inventory_quantity >= 0)
);

-- Indexes
CREATE INDEX idx_product_variants_workspace_id ON product_variants(workspace_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
```

### 7. Customers

```sql
-- Customer database across all stores
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Customer Identity
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  
  -- Demographics
  date_of_birth DATE,
  gender TEXT,
  
  -- Address
  addresses JSONB DEFAULT '[]'::jsonb,
  default_address JSONB,
  
  -- Customer Metrics
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  
  -- Engagement
  first_order_at TIMESTAMP WITH TIME ZONE,
  last_order_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  accepts_marketing BOOLEAN DEFAULT FALSE,
  
  -- Segmentation
  customer_segment TEXT, -- VIP, Regular, New, etc.
  tags TEXT[] DEFAULT '{}',
  
  -- Support History
  support_tickets INTEGER DEFAULT 0,
  support_satisfaction DECIMAL(3,2), -- Average satisfaction score
  support_notes TEXT,
  
  -- AI Insights
  ai_insights JSONB DEFAULT '{}'::jsonb,
  customer_persona TEXT,
  predicted_ltv DECIMAL(10,2),
  churn_risk_score DECIMAL(3,2),
  
  -- Platform Data
  external_customer_ids JSONB DEFAULT '{}'::jsonb, -- Platform-specific IDs
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_total_spent CHECK (total_spent >= 0),
  CONSTRAINT valid_lifetime_value CHECK (lifetime_value >= 0),
  CONSTRAINT valid_churn_risk CHECK (churn_risk_score IS NULL OR (churn_risk_score >= 0 AND churn_risk_score <= 1))
);

-- Indexes
CREATE INDEX idx_customers_workspace_id ON customers(workspace_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_customer_segment ON customers(customer_segment);
CREATE INDEX idx_customers_total_spent ON customers(total_spent);
CREATE INDEX idx_customers_last_order_at ON customers(last_order_at);
CREATE INDEX idx_customers_tags_gin ON customers USING GIN(tags);
```

### 8. Orders

```sql
-- Order tracking across all platforms
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id),
  customer_id UUID REFERENCES customers(id),
  
  -- Order Identity
  external_id TEXT NOT NULL, -- Platform order ID
  order_number TEXT,
  
  -- Financial
  total_amount DECIMAL(10,2) NOT NULL,
  subtotal_amount DECIMAL(10,2),
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  )),
  fulfillment_status TEXT CHECK (fulfillment_status IN (
    'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  )),
  payment_status TEXT CHECK (payment_status IN (
    'pending', 'paid', 'partially_paid', 'refunded', 'voided'
  )),
  
  -- Dates
  order_date TIMESTAMP WITH TIME ZONE NOT NULL,
  shipped_date TIMESTAMP WITH TIME ZONE,
  delivered_date TIMESTAMP WITH TIME ZONE,
  
  -- Shipping
  shipping_address JSONB,
  billing_address JSONB,
  shipping_method TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  
  -- Order Details
  line_items JSONB NOT NULL, -- Array of order items
  shipping_lines JSONB DEFAULT '[]'::jsonb,
  tax_lines JSONB DEFAULT '[]'::jsonb,
  discount_codes JSONB DEFAULT '[]'::jsonb,
  
  -- Customer
  customer_email TEXT,
  customer_phone TEXT,
  customer_notes TEXT,
  
  -- Processing
  processed_by TEXT, -- 'ai', 'human', 'auto'
  processing_notes TEXT,
  requires_attention BOOLEAN DEFAULT FALSE,
  
  -- Platform Data
  platform_data JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_total_amount CHECK (total_amount >= 0),
  CONSTRAINT valid_tax_amount CHECK (tax_amount >= 0),
  CONSTRAINT valid_shipping_amount CHECK (shipping_amount >= 0)
);

-- Indexes
CREATE INDEX idx_orders_workspace_id ON orders(workspace_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_external_id ON orders(external_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_requires_attention ON orders(requires_attention);
```

---

## Content Management Tables

### 9. Content Projects

```sql
-- Content creation and management
CREATE TABLE content_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Project Details
  name TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN (
    'blog_post', 'product_description', 'email_campaign', 'social_post', 
    'video_script', 'ad_copy', 'newsletter', 'landing_page'
  )),
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'in_progress', 'review', 'approved', 'published', 'archived'
  )),
  
  -- Content
  title TEXT,
  content TEXT,
  excerpt TEXT,
  meta_description TEXT,
  
  -- SEO
  target_keywords TEXT[] DEFAULT '{}',
  seo_score INTEGER, -- 0-100
  readability_score INTEGER, -- 0-100
  
  -- Publishing
  publish_date TIMESTAMP WITH TIME ZONE,
  published_urls TEXT[] DEFAULT '{}',
  
  -- AI Generation
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_model_used TEXT,
  ai_prompt TEXT,
  ai_generation_cost INTEGER, -- In credits
  
  -- Assets
  featured_image TEXT,
  media_assets JSONB DEFAULT '[]'::jsonb,
  
  -- Relationships
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  related_products UUID[] DEFAULT '{}', -- Array of product IDs
  
  -- Campaign
  campaign_id UUID,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  engagement_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_seo_score CHECK (seo_score IS NULL OR (seo_score >= 0 AND seo_score <= 100))
);

-- Indexes
CREATE INDEX idx_content_projects_workspace_id ON content_projects(workspace_id);
CREATE INDEX idx_content_projects_content_type ON content_projects(content_type);
CREATE INDEX idx_content_projects_status ON content_projects(status);
CREATE INDEX idx_content_projects_created_by ON content_projects(created_by);
CREATE INDEX idx_content_projects_publish_date ON content_projects(publish_date);
CREATE INDEX idx_content_projects_tags_gin ON content_projects USING GIN(tags);
```

---

## Analytics & Reporting Tables

### 10. Analytics Events

```sql
-- Event tracking for analytics
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL, -- 'page_view', 'purchase', 'task_completed', etc.
  event_name TEXT NOT NULL,
  
  -- Context
  user_id UUID REFERENCES users(id),
  session_id TEXT,
  source TEXT, -- 'dashboard', 'api', 'webhook', etc.
  
  -- Data
  properties JSONB DEFAULT '{}'::jsonb,
  revenue DECIMAL(10,2),
  
  -- Related Entities
  product_id UUID REFERENCES products(id),
  customer_id UUID REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  task_id UUID REFERENCES tasks(id),
  
  -- Timestamp
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_events_workspace_id ON analytics_events(workspace_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_occurred_at ON analytics_events(occurred_at);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_properties_gin ON analytics_events USING GIN(properties);

-- Partitioning by month for performance
CREATE TABLE analytics_events_y2024m01 PARTITION OF analytics_events
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

## Row-Level Security (RLS) Policies

### Enable RLS on All Tables

```sql
-- Enable RLS on all workspace-scoped tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
```

### RLS Policy Functions

```sql
-- Function to get current user's workspace
CREATE OR REPLACE FUNCTION current_user_workspace()
RETURNS UUID AS $$
  SELECT workspace_id 
  FROM users 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = required_role
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user can access workspace
CREATE OR REPLACE FUNCTION user_can_access_workspace(target_workspace_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = auth.uid() 
    AND workspace_id = target_workspace_id
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

### RLS Policies

```sql
-- Workspace access (users can only see their workspace)
CREATE POLICY workspace_access ON workspaces
  FOR ALL USING (id = current_user_workspace());

-- User access (users can see other users in their workspace)
CREATE POLICY user_workspace_access ON users
  FOR ALL USING (workspace_id = current_user_workspace());

-- Task access (workspace isolation)
CREATE POLICY task_workspace_access ON tasks
  FOR ALL USING (workspace_id = current_user_workspace());

-- Store access (workspace isolation)
CREATE POLICY store_workspace_access ON stores
  FOR ALL USING (workspace_id = current_user_workspace());

-- Product access (workspace isolation)
CREATE POLICY product_workspace_access ON products
  FOR ALL USING (workspace_id = current_user_workspace());

-- Product variant access
CREATE POLICY product_variant_workspace_access ON product_variants
  FOR ALL USING (workspace_id = current_user_workspace());

-- Customer access (workspace isolation)
CREATE POLICY customer_workspace_access ON customers
  FOR ALL USING (workspace_id = current_user_workspace());

-- Order access (workspace isolation)
CREATE POLICY order_workspace_access ON orders
  FOR ALL USING (workspace_id = current_user_workspace());

-- Content project access (workspace isolation)
CREATE POLICY content_project_workspace_access ON content_projects
  FOR ALL USING (workspace_id = current_user_workspace());

-- Analytics event access (workspace isolation)
CREATE POLICY analytics_event_workspace_access ON analytics_events
  FOR ALL USING (workspace_id = current_user_workspace());
```

---

## Database Functions & Triggers

### Update Timestamps

```sql
-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (repeat for all tables with updated_at)
```

### Business Logic Functions

```sql
-- Function to update customer metrics when order is created/updated
CREATE OR REPLACE FUNCTION update_customer_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer totals
  UPDATE customers SET
    total_orders = (
      SELECT COUNT(*) FROM orders 
      WHERE customer_id = NEW.customer_id 
      AND status NOT IN ('cancelled', 'refunded')
    ),
    total_spent = (
      SELECT COALESCE(SUM(total_amount), 0) FROM orders 
      WHERE customer_id = NEW.customer_id 
      AND status NOT IN ('cancelled', 'refunded')
    ),
    last_order_at = (
      SELECT MAX(order_date) FROM orders 
      WHERE customer_id = NEW.customer_id
    )
  WHERE id = NEW.customer_id;
  
  -- Update average order value
  UPDATE customers SET
    average_order_value = CASE 
      WHEN total_orders > 0 THEN total_spent / total_orders 
      ELSE 0 
    END
  WHERE id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_metrics_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_customer_metrics();
```

### Credit Deduction Function

```sql
-- Function to deduct credits for task execution
CREATE OR REPLACE FUNCTION deduct_task_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Only deduct credits when task completes successfully
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE workspaces SET
      credits_balance = credits_balance - COALESCE(NEW.actual_cost, NEW.estimated_cost, 0),
      credits_used_this_month = credits_used_this_month + COALESCE(NEW.actual_cost, NEW.estimated_cost, 0)
    WHERE id = NEW.workspace_id;
    
    -- Check if workspace is out of credits
    IF (SELECT credits_balance FROM workspaces WHERE id = NEW.workspace_id) < 0 THEN
      -- Trigger low credit notification
      INSERT INTO analytics_events (workspace_id, event_type, event_name, properties)
      VALUES (NEW.workspace_id, 'system', 'low_credits', '{"credits_remaining": 0}'::jsonb);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deduct_task_credits_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION deduct_task_credits();
```

---

## Views for Common Queries

### Workspace Dashboard View

```sql
CREATE VIEW workspace_dashboard AS
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  w.plan,
  w.credits_balance,
  w.credits_used_this_month,
  
  -- Task metrics
  COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
  COUNT(CASE WHEN t.status = 'processing' THEN 1 END) as processing_tasks,
  COUNT(CASE WHEN t.status = 'completed' AND t.created_at >= CURRENT_DATE THEN 1 END) as tasks_completed_today,
  
  -- Financial metrics
  COALESCE(SUM(CASE WHEN o.order_date >= CURRENT_DATE - INTERVAL '30 days' THEN o.total_amount END), 0) as revenue_30d,
  COUNT(CASE WHEN o.order_date >= CURRENT_DATE THEN 1 END) as orders_today,
  
  -- Product metrics
  COUNT(DISTINCT p.id) as total_products,
  COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_products
  
FROM workspaces w
LEFT JOIN tasks t ON t.workspace_id = w.id
LEFT JOIN orders o ON o.workspace_id = w.id
LEFT JOIN products p ON p.workspace_id = w.id
GROUP BY w.id, w.name, w.plan, w.credits_balance, w.credits_used_this_month;
```

### Task Performance View

```sql
CREATE VIEW task_performance AS
SELECT 
  workspace_id,
  type as task_type,
  COUNT(*) as total_executions,
  AVG(processing_time_ms) as avg_processing_time,
  AVG(actual_cost) as avg_cost,
  AVG(quality_score) as avg_quality_score,
  COUNT(CASE WHEN status = 'completed' THEN 1 END)::FLOAT / COUNT(*) as success_rate,
  DATE_TRUNC('day', created_at) as date
FROM tasks
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY workspace_id, type, DATE_TRUNC('day', created_at);
```

---

## Database Migrations Strategy

### Migration Structure

```sql
-- migrations/001_initial_schema.sql
-- Contains all table definitions

-- migrations/002_add_rls_policies.sql
-- Contains all RLS policies

-- migrations/003_add_indexes.sql
-- Contains performance indexes

-- migrations/004_add_functions_triggers.sql
-- Contains business logic functions

-- migrations/005_add_views.sql
-- Contains analytical views
```

### Seed Data

```sql
-- seed/development.sql
INSERT INTO workspaces (name, slug, plan) VALUES 
('Demo Workspace', 'demo-workspace', 'growth');

INSERT INTO users (workspace_id, email, full_name, role) VALUES 
((SELECT id FROM workspaces WHERE slug = 'demo-workspace'), 'demo@bizq.com', 'Demo User', 'owner');

-- Add sample products, tasks, etc.
```

---

## Performance Considerations

### Partitioning Strategy

- **analytics_events**: Partition by month
- **tasks**: Consider partitioning by created_at if volume is high
- **orders**: Partition by order_date for historical data

### Index Strategy

- **Workspace isolation**: All queries filter by workspace_id first
- **Status queries**: Combined indexes on (workspace_id, status)
- **Time-based queries**: Indexes on timestamp columns
- **Search**: GIN indexes on JSONB and text array columns

### Query Optimization

```sql
-- Use workspace_id in every query
SELECT * FROM tasks 
WHERE workspace_id = $1 AND status = 'pending'
ORDER BY priority ASC, created_at ASC;

-- Use partial indexes for common filters
CREATE INDEX idx_tasks_pending ON tasks(created_at) 
WHERE status = 'pending';

-- Use composite indexes for common query patterns
CREATE INDEX idx_orders_workspace_status_date ON orders(workspace_id, status, order_date);
```

---

*"A well-designed database is the foundation of a scalable application. Multi-tenancy with RLS ensures security and performance at scale."*

**BizQ: Built on solid data foundations.**