# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BizQ is an AI-first multi-business management SaaS platform designed for solo entrepreneurs to manage 1-1000+ businesses from a single mobile-native application. The platform emphasizes AI-guided operations where AI proactively generates business possibilities rather than waiting for user queries.

## Architecture & Design Principles

### Core Philosophy
- **AI-First**: Every operation that CAN be done by AI, WILL be done by AI first
- **Mobile-First**: Built for entrepreneurs running businesses from their phone
- **Proactive AI**: AI continuously generates possibilities, paths, and what-if scenarios
- **Bulk Operations**: Execute identical operations across unlimited businesses
- **Zero Context Switching**: Everything done in one app
- **Delegation Framework**: Seamless delegation to AI, humans, or hybrid workflows

### Technical Architecture
- **Frontend**: React Native (iOS/Android from single codebase)
- **Backend**: Serverless + Microservices on AWS
- **Databases**: DynamoDB (operational), RDS Aurora (financial), ElasticSearch (analytics), Redis (cache)
- **AI Stack**: OpenAI GPT-4+, custom ML models, real-time data pipelines (Kinesis + Lambda)
- **API**: REST for external services, GraphQL for mobile data fetching

## Development Commands

Since this is currently a specification/documentation project without implemented code, here are the anticipated commands for when development begins:

### Mobile App Development (React Native)
```bash
# Install dependencies
npm install

# Run iOS simulator
npm run ios

# Run Android emulator  
npm run android

# Run tests
npm test

# Build for production
npm run build:ios
npm run build:android
```

### Backend Development (Node.js/Serverless)
```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run tests
npm test

# Deploy to AWS
npm run deploy:staging
npm run deploy:production

# Run database migrations
npm run migrate

# Seed test data
npm run seed
```

## Key Components & Features

### 1. Universal Delegation System
- Handles delegation to AI workers, human workers, or hybrid workflows
- Supports role-based, time-boxed, one-time, and conditional delegation
- Implements privacy-first compartmentalized access

### 2. Continuous Possibility Engine  
- 24/7 monitoring of internal metrics and external signals
- Multi-path generation for every decision point
- Automated what-if scenario simulation
- Dynamic decision trees with cascading effect analysis

### 3. Marketplace Ecosystem
- Micro-service providers for specialized business functions
- Universal Service Provider API for integration
- Quality control and certification system
- Revenue sharing model (80/20 split)

## Security & Data Privacy

- **End-to-end encryption** for all data
- **Multi-factor authentication** with biometrics
- **Role-based access control** per business entity
- **Zero-knowledge delegation** where delegates only see task-specific data
- **Compartmentalized knowledge** to prevent any single person from accessing full business context
- **Audit trail** with complete logging of all access and actions

## Testing Strategy

- Unit tests for all business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing for bulk operations
- Security testing for data isolation

## API Integration Points

### Essential Integrations
- **E-commerce**: Shopify, WooCommerce, BigCommerce, Magento
- **Payments**: Stripe, PayPal, Square, Authorize.net
- **Marketing**: Meta Business, Google Ads, TikTok Ads, Klaviyo
- **Financial**: QuickBooks, Xero, Plaid (banking), tax software

### Provider API Framework
- OAuth 2.0 authentication required
- TLS 1.3 encryption for all data in transit
- No storage of business data by providers
- Rate limiting and audit logging enforced

## Performance Targets

- App response time: <200ms for 95% of requests
- AI decision accuracy: >95% for routine decisions  
- System uptime: 99.99% availability
- Data sync: Real-time updates within 5 seconds
- Offline capability: 24 hours without connectivity

## Development Workflow

1. Review the three main specification documents:
   - `SAAS_REQUIREMENTS.md` - Core platform requirements
   - `AI_GUIDED_OPERATIONS.md` - Proactive AI framework
   - `MARKETPLACE_ECOSYSTEM.md` - Provider marketplace architecture

2. Follow mobile-first development with React Native

3. Implement serverless backend functions for scalability

4. Use AI-first approach for all feature development

5. Ensure bulk operation support from the start

6. Build with delegation framework in mind

7. Test at scale (simulate 1000+ businesses)