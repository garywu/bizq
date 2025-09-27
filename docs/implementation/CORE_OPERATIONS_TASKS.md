# BizQ Core Operations & Tasks

**Initial Focus: Content Generation + E-Commerce (Digital-First)**

---

## Overview

BizQ supports the modern digital entrepreneur who operates across content and commerce. These businesses typically:
- Start with digital products (low barrier to entry)
- Create content to build audience
- Sell across multiple channels
- Need to handle up to 100 orders/day
- Operate both content and commerce (sometimes separately, sometimes together)

---

## Content Generation Operations

### 1. Content Research & Planning

#### Task: `content.research_topic`
```typescript
{
  input: {
    niche: string,
    keywords: string[],
    competitor_urls?: string[],
    intent: "educational" | "commercial" | "viral"
  },
  output: {
    topic_ideas: Array<{
      title: string,
      search_volume: number,
      competition: "low" | "medium" | "high",
      content_angle: string
    }>,
    content_gaps: string[],
    trending_angles: string[]
  },
  cost: $2-5,
  time: "2-5 minutes",
  worker: "AI"
}
```

#### Task: `content.create_calendar`
```typescript
{
  input: {
    duration: "week" | "month" | "quarter",
    channels: ["blog", "email", "social", "youtube"],
    posting_frequency: Record<string, number>,
    themes?: string[]
  },
  output: {
    calendar: Array<{
      date: Date,
      channel: string,
      topic: string,
      content_type: string,
      keywords: string[],
      cta: string
    }>
  },
  cost: $5-10,
  time: "5-10 minutes",
  worker: "AI"
}
```

### 2. Written Content Creation

#### Task: `content.write_blog_post`
```typescript
{
  input: {
    topic: string,
    keywords: string[],
    word_count: number,
    tone: "professional" | "casual" | "authoritative",
    include_sections?: string[],
    seo_optimized: boolean
  },
  output: {
    title: string,
    meta_description: string,
    content: string, // Markdown format
    internal_links: string[],
    external_links: string[],
    images_needed: string[]
  },
  cost: $5-20,
  time: "5-15 minutes",
  worker: "AI" | "Human" (for complex topics)
}
```

#### Task: `content.write_product_description`
```typescript
{
  input: {
    product_name: string,
    features: string[],
    benefits: string[],
    target_audience: string,
    competitors?: string[],
    platform: "shopify" | "amazon" | "own_site"
  },
  output: {
    title: string,
    short_description: string,
    long_description: string,
    bullet_points: string[],
    seo_keywords: string[],
    variants_descriptions?: Record<string, string>
  },
  cost: $2-8,
  time: "3-5 minutes",
  worker: "AI"
}
```

#### Task: `content.create_email_newsletter`
```typescript
{
  input: {
    purpose: "weekly_update" | "product_launch" | "educational",
    subscriber_segment: string,
    products_to_feature?: Product[],
    content_to_include?: string[],
    cta: string
  },
  output: {
    subject_line: string,
    preview_text: string,
    html_content: string,
    plain_text: string,
    personalization_tokens: string[]
  },
  cost: $3-10,
  time: "5-10 minutes",
  worker: "AI"
}
```

### 3. Visual Content Creation

#### Task: `content.generate_social_graphics`
```typescript
{
  input: {
    platform: "instagram" | "facebook" | "twitter" | "linkedin",
    post_type: "carousel" | "single" | "story",
    text_content: string,
    brand_colors: string[],
    include_logo: boolean
  },
  output: {
    images: string[], // URLs to generated images
    dimensions: string,
    format: string,
    variations: number
  },
  cost: $2-5,
  time: "2-3 minutes",
  worker: "AI"
}
```

#### Task: `content.create_product_images`
```typescript
{
  input: {
    product: Product,
    image_types: ["hero", "lifestyle", "features", "size_chart"],
    background: "white" | "lifestyle" | "custom",
    annotations?: string[]
  },
  output: {
    images: Array<{
      url: string,
      type: string,
      dimensions: string,
      alt_text: string
    }>
  },
  cost: $5-20,
  time: "10-30 minutes",
  worker: "AI" | "Human" (for physical products)
}
```

### 4. Video Content Creation

#### Task: `content.generate_video_script`
```typescript
{
  input: {
    video_type: "product_demo" | "tutorial" | "testimonial" | "ad",
    duration: number, // seconds
    key_points: string[],
    call_to_action: string,
    tone: string
  },
  output: {
    script: {
      hook: string,
      main_content: Array<{
        timestamp: string,
        text: string,
        visual_notes: string
      }>,
      cta: string
    },
    shot_list: string[],
    b_roll_suggestions: string[]
  },
  cost: $5-15,
  time: "5-10 minutes",
  worker: "AI"
}
```

#### Task: `content.create_video_content`
```typescript
{
  input: {
    script: string,
    video_type: "talking_head" | "product_showcase" | "animated",
    duration: number,
    brand_assets?: Assets,
    music?: "upbeat" | "calm" | "dramatic" | "none"
  },
  output: {
    video_url: string,
    thumbnail_url: string,
    captions_file: string,
    formats: ["mp4", "webm"],
    social_cuts?: string[] // Different aspect ratios
  },
  cost: $20-100,
  time: "30-120 minutes",
  worker: "AI" | "Human"
}
```

### 5. Content Optimization

#### Task: `content.optimize_seo`
```typescript
{
  input: {
    content: string,
    target_keywords: string[],
    current_url: string,
    competitor_urls?: string[]
  },
  output: {
    optimized_content: string,
    meta_title: string,
    meta_description: string,
    schema_markup: string,
    internal_link_suggestions: string[],
    improvement_score: number
  },
  cost: $3-8,
  time: "3-5 minutes",
  worker: "AI"
}
```

---

## E-Commerce Operations (End-to-End)

### 1. Product Research & Sourcing

#### Task: `product.research_trending`
```typescript
{
  input: {
    niche: string,
    budget_range: [number, number],
    product_type: "digital" | "physical" | "service",
    platforms: ["shopify", "amazon", "etsy"]
  },
  output: {
    products: Array<{
      name: string,
      estimated_demand: number,
      competition_level: string,
      profit_margin: number,
      suppliers: Supplier[]
    }>,
    market_insights: string[],
    seasonal_trends: Trend[]
  },
  cost: $10-30,
  time: "30-60 minutes",
  worker: "AI" | "Human"
}
```

#### Task: `product.find_suppliers`
```typescript
{
  input: {
    product: Product,
    requirements: {
      moq: number,
      location_preference?: string,
      certifications?: string[],
      dropship_capable: boolean
    }
  },
  output: {
    suppliers: Array<{
      name: string,
      location: string,
      moq: number,
      unit_price: number,
      shipping_time: string,
      rating: number,
      payment_terms: string
    }>,
    recommended: Supplier,
    negotiation_tips: string[]
  },
  cost: $20-50,
  time: "2-4 hours",
  worker: "Human"
}
```

### 2. Store Setup & Management

#### Task: `store.create_listing`
```typescript
{
  input: {
    product: Product,
    platform: "shopify" | "amazon" | "etsy" | "woocommerce",
    optimization_level: "basic" | "advanced"
  },
  output: {
    title: string,
    description: string,
    features: string[],
    images: Image[],
    pricing: PricingStrategy,
    categories: string[],
    tags: string[],
    variants?: Variant[]
  },
  cost: $5-20,
  time: "10-30 minutes",
  worker: "AI"
}
```

#### Task: `store.optimize_conversion`
```typescript
{
  input: {
    store_url: string,
    current_conversion_rate: number,
    traffic_sources: Source[],
    product_types: string[]
  },
  output: {
    recommendations: Array<{
      element: string,
      current_state: string,
      suggested_change: string,
      expected_impact: string,
      priority: "high" | "medium" | "low"
    }>,
    a_b_tests: TestPlan[],
    quick_wins: string[]
  },
  cost: $30-100,
  time: "2-4 hours",
  worker: "Human" | "AI"
}
```

### 3. Order Processing

#### Task: `order.process_batch`
```typescript
{
  input: {
    orders: Order[],
    fulfillment_type: "digital" | "dropship" | "warehouse",
    priority_rules?: Rule[]
  },
  output: {
    processed: Order[],
    fulfillment_requests: FulfillmentRequest[],
    tracking_numbers: Record<string, string>,
    customer_notifications: Notification[]
  },
  cost: $0.50 * orders.length,
  time: "1-5 minutes",
  worker: "AI"
}
```

#### Task: `order.handle_fulfillment`
```typescript
{
  input: {
    order: Order,
    type: "digital_delivery" | "dropship_order" | "print_on_demand"
  },
  output: {
    status: "completed" | "pending" | "failed",
    delivery_details: {
      digital_links?: string[],
      tracking_number?: string,
      estimated_delivery?: Date
    },
    customer_email_sent: boolean
  },
  cost: $1-5,
  time: "instant-24 hours",
  worker: "AI" | "Integration"
}
```

### 4. Customer Service

#### Task: `customer.answer_inquiry`
```typescript
{
  input: {
    inquiry: string,
    customer_history: CustomerHistory,
    order_context?: Order,
    knowledge_base: KB
  },
  output: {
    response: string,
    suggested_actions: Action[],
    escalation_needed: boolean,
    satisfaction_predicted: number
  },
  cost: $0.50-5,
  time: "30 seconds - 5 minutes",
  worker: "AI" | "Human" (for complex issues)
}
```

#### Task: `customer.process_return`
```typescript
{
  input: {
    order: Order,
    reason: string,
    customer_request: string,
    return_policy: Policy
  },
  output: {
    decision: "approved" | "denied" | "partial",
    return_label?: string,
    refund_amount: number,
    replacement_order?: Order,
    customer_communication: string
  },
  cost: $2-10,
  time: "5-15 minutes",
  worker: "AI" | "Human"
}
```

### 5. Marketing & Promotion

#### Task: `marketing.create_campaign`
```typescript
{
  input: {
    campaign_type: "email" | "social" | "ads" | "influencer",
    products: Product[],
    budget: number,
    duration: string,
    target_audience: Audience
  },
  output: {
    campaign_plan: {
      channels: Channel[],
      content: Content[],
      schedule: Schedule,
      budget_allocation: Budget
    },
    creative_assets: Asset[],
    tracking_setup: Analytics
  },
  cost: $20-100,
  time: "1-4 hours",
  worker: "AI" | "Human"
}
```

#### Task: `marketing.manage_social_commerce`
```typescript
{
  input: {
    platforms: ["instagram", "tiktok", "facebook"],
    products: Product[],
    content_type: "posts" | "stories" | "reels",
    frequency: number
  },
  output: {
    content_calendar: Calendar,
    posts: Array<{
      platform: string,
      content: string,
      media: string[],
      hashtags: string[],
      publish_time: Date
    }>,
    shop_tags: ProductTag[]
  },
  cost: $5-20 per post,
  time: "30 minutes per post",
  worker: "AI"
}
```

### 6. Analytics & Optimization

#### Task: `analytics.generate_report`
```typescript
{
  input: {
    store: Store,
    period: DateRange,
    metrics: ["revenue", "conversion", "aov", "traffic"],
    comparison_period?: DateRange
  },
  output: {
    metrics: Metrics,
    insights: Array<{
      finding: string,
      impact: "positive" | "negative",
      recommendation: string
    }>,
    visualizations: Chart[],
    action_items: Task[]
  },
  cost: $5-20,
  time: "10-30 minutes",
  worker: "AI"
}
```

---

## Integrated Workflows

### Content → Commerce Flow
```typescript
workflow: "content_to_sales" {
  steps: [
    { task: "content.research_topic", params: { intent: "commercial" }},
    { task: "content.write_blog_post", params: { include_products: true }},
    { task: "content.optimize_seo" },
    { task: "marketing.create_campaign", params: { type: "email" }},
    { task: "analytics.track_conversions" }
  ],
  triggers: ["weekly", "product_launch"],
  expected_outcome: "Drive 20-50 sales from content"
}
```

### Product Launch Flow
```typescript
workflow: "digital_product_launch" {
  steps: [
    { task: "product.create_digital_product" },
    { task: "store.create_listing", parallel: true },
    { task: "content.write_product_description", parallel: true },
    { task: "content.create_product_images", parallel: true },
    { task: "marketing.create_campaign" },
    { task: "content.create_video_content" },
    { task: "customer.setup_support_docs" }
  ],
  timeline: "5 days",
  budget: "$200-500 in tasks"
}
```

### Daily Operations Flow
```typescript
workflow: "daily_operations" {
  morning: [
    { task: "order.process_batch" },
    { task: "customer.answer_inquiry", all_pending: true },
    { task: "inventory.check_levels" }
  ],
  afternoon: [
    { task: "content.create_social_post" },
    { task: "marketing.check_ad_performance" },
    { task: "product.update_pricing" }
  ],
  evening: [
    { task: "analytics.generate_report", params: { period: "today" }},
    { task: "order.prepare_tomorrow" }
  ],
  estimated_time_saved: "3-4 hours/day"
}
```

---

## Priority Task Implementation

### Phase 1: Core Content & Commerce (MVP)
1. `content.write_product_description` - Most requested
2. `customer.answer_inquiry` - Highest time save
3. `order.process_batch` - Critical for operations
4. `content.create_social_post` - Daily need
5. `product.research_trending` - Growth driver

### Phase 2: Scale Enablers
6. `content.write_blog_post` - SEO traffic
7. `marketing.create_campaign` - Revenue growth
8. `store.create_listing` - Multi-channel expansion
9. `content.create_email_newsletter` - Retention
10. `analytics.generate_report` - Data-driven decisions

### Phase 3: Advanced Automation
11. `content.create_video_content` - Viral growth
12. `product.find_suppliers` - Margin improvement
13. `store.optimize_conversion` - Revenue optimization
14. `customer.process_return` - Customer satisfaction
15. `marketing.manage_social_commerce` - New channels

---

## Success Metrics

### For Content Operations
- Content pieces per week: 10-20
- Time per piece: <10 minutes (vs 2-4 hours manual)
- Content ROI: 5x (traffic value vs task cost)
- SEO rankings improvement: 30% in 3 months

### For E-Commerce Operations
- Orders processed per day: Up to 100
- Customer response time: <5 minutes (vs hours)
- Conversion rate improvement: 20-30%
- Operational cost reduction: 60-80%

### Combined Impact
- **Total time saved**: 4-6 hours/day
- **Cost reduction**: $2000-5000/month
- **Revenue increase**: 30-50% through optimization
- **Scale capability**: 10x without hiring

---

*"Supporting the modern digital entrepreneur - from content creation to commerce, all automated."*