# BizQ Monorepo Structure

**Production-Ready Architecture Based on Midday Patterns**

---

## Directory Structure

```
bizq/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # Continuous integration
│   │   ├── deploy-dashboard.yml   # Dashboard deployment
│   │   ├── deploy-api.yml         # API deployment
│   │   └── deploy-workers.yml     # Background workers
│   └── ISSUE_TEMPLATE/
├── apps/
│   ├── dashboard/                 # Main web application
│   │   ├── src/
│   │   │   ├── app/              # Next.js 15 app router
│   │   │   │   ├── (auth)/       # Authentication routes
│   │   │   │   ├── dashboard/    # Main dashboard
│   │   │   │   ├── settings/     # Workspace settings
│   │   │   │   ├── tasks/        # Task management
│   │   │   │   └── api/          # API routes
│   │   │   ├── components/       # React components
│   │   │   │   ├── ai/           # AI-related components
│   │   │   │   ├── forms/        # Form components
│   │   │   │   ├── tasks/        # Task components
│   │   │   │   └── ui/           # Base UI components
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── lib/              # Utility functions
│   │   │   └── styles/           # Global styles
│   │   ├── public/               # Static assets
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── tailwind.config.js
│   ├── api/                      # NestJS API service
│   │   ├── src/
│   │   │   ├── auth/             # Authentication module
│   │   │   ├── tasks/            # Task execution module
│   │   │   ├── ai/               # AI service module
│   │   │   ├── integrations/     # Third-party integrations
│   │   │   ├── workspaces/       # Workspace management
│   │   │   ├── users/            # User management
│   │   │   └── common/           # Shared utilities
│   │   ├── test/                 # API tests
│   │   ├── package.json
│   │   └── nest-cli.json
│   ├── workers/                  # Background task processing
│   │   ├── src/
│   │   │   ├── queues/           # Queue handlers
│   │   │   ├── processors/       # Task processors
│   │   │   ├── schedulers/       # Scheduled jobs
│   │   │   └── utils/            # Worker utilities
│   │   └── package.json
│   ├── desktop/                  # Tauri desktop app (future)
│   │   ├── src-tauri/            # Rust backend
│   │   ├── src/                  # Web frontend
│   │   └── package.json
│   └── website/                  # Marketing website
│       ├── src/
│       │   ├── app/              # Next.js marketing site
│       │   ├── components/       # Marketing components
│       │   └── content/          # MDX content
│       └── package.json
├── packages/
│   ├── database/                 # Database layer
│   │   ├── src/
│   │   │   ├── schema/           # Prisma schema
│   │   │   ├── migrations/       # Database migrations
│   │   │   ├── seed/             # Seed data
│   │   │   └── client.ts         # Database client
│   │   └── package.json
│   ├── ui/                       # Shared UI components
│   │   ├── src/
│   │   │   ├── components/       # Shadcn components
│   │   │   ├── hooks/            # UI hooks
│   │   │   ├── utils/            # UI utilities
│   │   │   └── index.ts          # Exports
│   │   └── package.json
│   ├── ai/                       # AI utilities and tools
│   │   ├── src/
│   │   │   ├── tools/            # AI tool definitions
│   │   │   ├── models/           # Model configurations
│   │   │   ├── cache/            # AI caching layer
│   │   │   ├── routing/          # Model routing logic
│   │   │   └── streaming/        # Streaming utilities
│   │   └── package.json
│   ├── tasks/                    # Task definitions and schemas
│   │   ├── src/
│   │   │   ├── types/            # TypeScript types
│   │   │   ├── schemas/          # Zod schemas
│   │   │   ├── definitions/      # Task definitions
│   │   │   └── workflows/        # Workflow patterns
│   │   └── package.json
│   ├── integrations/             # Third-party integrations
│   │   ├── src/
│   │   │   ├── shopify/          # Shopify integration
│   │   │   ├── stripe/           # Stripe integration
│   │   │   ├── klaviyo/          # Klaviyo integration
│   │   │   ├── gorgias/          # Customer service
│   │   │   └── base/             # Base integration class
│   │   └── package.json
│   ├── email/                    # Email templates and utilities
│   │   ├── src/
│   │   │   ├── templates/        # React email templates
│   │   │   ├── providers/        # Email providers
│   │   │   └── utils/            # Email utilities
│   │   └── package.json
│   └── auth/                     # Authentication utilities
│       ├── src/
│       │   ├── providers/        # Auth providers
│       │   ├── middleware/       # Auth middleware
│       │   └── utils/            # Auth utilities
│       └── package.json
├── config/                       # Shared configuration
│   ├── eslint/
│   │   ├── base.js
│   │   ├── next.js
│   │   └── nest.js
│   ├── typescript/
│   │   ├── base.json
│   │   ├── next.json
│   │   └── nest.json
│   └── tailwind/
│       ├── base.js
│       └── dashboard.js
├── tooling/                      # Development tools
│   ├── scripts/
│   │   ├── build.ts              # Build scripts
│   │   ├── dev.ts                # Development scripts
│   │   └── deploy.ts             # Deployment scripts
│   └── generators/               # Code generators
├── docs/                         # Documentation
│   ├── api/                      # API documentation
│   ├── development/              # Development guides
│   └── deployment/               # Deployment guides
├── .env.example                  # Environment variables template
├── .env.local                    # Local environment (git ignored)
├── .gitignore                    # Git ignore rules
├── bun.lockb                     # Bun lock file
├── package.json                  # Root package.json
├── turbo.json                    # Turborepo configuration
└── README.md                     # Project README
```

---

## Package.json Configuration

### Root Package.json
```json
{
  "name": "bizq",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "tooling/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "clean": "turbo run clean",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "db:generate": "turbo run db:generate",
    "db:push": "turbo run db:push",
    "db:studio": "turbo run db:studio"
  },
  "devDependencies": {
    "@turbo/gen": "^1.11.2",
    "prettier": "^3.1.1",
    "turbo": "^1.11.2",
    "typescript": "^5.3.3"
  },
  "packageManager": "bun@1.0.0"
}
```

### Turbo.json Configuration
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:studio": {
      "cache": false
    }
  }
}
```

---

## Core Package Specifications

### Dashboard App (apps/dashboard)
```json
{
  "name": "@bizq/dashboard",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@vercel/ai": "^3.0.0",
    "@midday/ai-sdk-tools": "latest",
    "@midday/ai-sdk-zustand": "latest",
    "@trpc/client": "^10.45.0",
    "@trpc/react-query": "^10.45.0",
    "@tanstack/react-query": "^5.8.0",
    "zustand": "^4.4.0",
    "@bizq/ui": "workspace:*",
    "@bizq/database": "workspace:*",
    "@bizq/ai": "workspace:*",
    "@bizq/tasks": "workspace:*"
  }
}
```

### API Service (apps/api)
```json
{
  "name": "@bizq/api",
  "version": "1.0.0",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@nestjs/core": "^10.0.0",
    "@nestjs/common": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@trpc/server": "^10.45.0",
    "@bizq/database": "workspace:*",
    "@bizq/ai": "workspace:*",
    "@bizq/tasks": "workspace:*",
    "@bizq/integrations": "workspace:*"
  }
}
```

### Database Package (packages/database)
```json
{
  "name": "@bizq/database",
  "version": "1.0.0",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx src/seed/index.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.6.0",
    "@supabase/supabase-js": "^2.38.0"
  },
  "devDependencies": {
    "prisma": "^5.6.0",
    "tsx": "^4.0.0"
  }
}
```

### AI Package (packages/ai)
```json
{
  "name": "@bizq/ai",
  "version": "1.0.0",
  "dependencies": {
    "@vercel/ai": "^3.0.0",
    "@ai-sdk/openai": "^0.0.42",
    "@ai-sdk/anthropic": "^0.0.31",
    "@midday/ai-sdk-tools": "latest",
    "zod": "^3.22.0",
    "ioredis": "^5.3.0"
  }
}
```

### UI Package (packages/ui)
```json
{
  "name": "@bizq/ui",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@radix-ui/react-slot": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss-animate": "^1.0.0",
    "framer-motion": "^10.16.0"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

---

## Development Workflow

### Local Development Setup
```bash
# Clone and setup
git clone https://github.com/bizq/bizq.git
cd bizq

# Install dependencies (uses bun workspaces)
bun install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configurations

# Setup database
bun run db:generate
bun run db:push
bun run db:seed

# Start development servers
bun run dev
```

### Running Individual Apps
```bash
# Dashboard only
bun run dev --filter=@bizq/dashboard

# API only  
bun run dev --filter=@bizq/api

# Workers only
bun run dev --filter=@bizq/workers

# Multiple apps
bun run dev --filter=@bizq/dashboard --filter=@bizq/api
```

### Building for Production
```bash
# Build all apps
bun run build

# Build specific app
bun run build --filter=@bizq/dashboard

# Type checking
bun run typecheck

# Linting
bun run lint
```

---

## Package Interdependencies

### Dependency Graph
```
apps/dashboard
├── @bizq/ui
├── @bizq/database
├── @bizq/ai
├── @bizq/tasks
└── @bizq/auth

apps/api
├── @bizq/database
├── @bizq/ai
├── @bizq/tasks
├── @bizq/integrations
└── @bizq/auth

apps/workers
├── @bizq/database
├── @bizq/ai
├── @bizq/tasks
├── @bizq/integrations
└── @bizq/email

packages/ai
├── @bizq/tasks
└── @bizq/database

packages/integrations
├── @bizq/database
└── @bizq/tasks

packages/ui
└── (no internal dependencies)
```

### Shared Dependencies
- **TypeScript**: Consistent typing across all packages
- **ESLint**: Shared linting configuration
- **Prettier**: Code formatting
- **Tailwind CSS**: Consistent styling system
- **Zod**: Schema validation everywhere

---

## File Organization Principles

### Component Organization
```
components/
├── ui/              # Base Shadcn components
├── forms/           # Form-specific components
├── tasks/           # Task-related components
├── ai/              # AI interaction components
└── layout/          # Layout components
```

### Feature-Based Structure
```
src/
├── app/
│   ├── dashboard/   # Dashboard feature
│   ├── tasks/       # Task management feature
│   └── settings/    # Settings feature
└── components/
    ├── dashboard/   # Dashboard-specific components
    ├── tasks/       # Task-specific components
    └── settings/    # Settings-specific components
```

### Hook Organization
```
hooks/
├── use-tasks.ts     # Task management
├── use-ai.ts        # AI interactions
├── use-workspace.ts # Workspace context
└── use-auth.ts      # Authentication
```

---

## Build and Deployment Strategy

### CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run lint
      - run: bun run typecheck
      - run: bun run test
      - run: bun run build
```

### Deployment Configuration
- **Dashboard**: Vercel (automatic deployments)
- **API**: Fly.io (Dockerfile-based)
- **Workers**: Fly.io (background processing)
- **Database**: Supabase (managed)

### Environment Variables
```bash
# Database
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=

# AI Services
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Integrations
SHOPIFY_APP_KEY=
STRIPE_SECRET_KEY=
```

---

## Benefits of This Structure

### Development Benefits
- **Fast builds**: Turborepo caching and parallelization
- **Type safety**: Shared TypeScript configurations
- **Code reuse**: Packages shared across apps
- **Consistent tooling**: Unified linting, formatting, testing

### Scalability Benefits
- **Independent deployment**: Apps can be deployed separately
- **Team ownership**: Teams can own specific packages
- **Feature isolation**: New features in separate packages
- **Performance**: Only affected packages rebuild

### Maintenance Benefits
- **Clear boundaries**: Each package has specific responsibilities
- **Dependency management**: Explicit dependency relationships
- **Testing strategy**: Package-level and integration testing
- **Documentation**: Package-specific documentation

---

*"A well-structured monorepo is the foundation of a scalable application. Follow proven patterns, optimize for developer experience."*

**BizQ: Built for scale from day one.**