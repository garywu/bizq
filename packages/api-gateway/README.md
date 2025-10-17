# BizQ API Gateway

A Cloudflare-native API Gateway service built with Hono framework, providing intelligent routing, rate limiting, caching, and observability for BizQ microservices.

## Features

- 🚀 **Cloudflare Native**: Built for Cloudflare Workers with D1 and KV
- 🛡️ **Rate Limiting**: IP-based and route-specific rate limiting with KV storage
- 🔄 **Intelligent Routing**: Dynamic route configuration with pattern matching
- 📊 **Observability**: Built-in logging, metrics, and health checks
- 🔐 **Security**: CORS, authentication, and request validation
- ⚡ **Performance**: Global edge distribution with automatic scaling
- 💰 **Cost Effective**: Sub-$10/month with Cloudflare's generous free tier

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Hono Router   │    │      D1         │    │       KV        │
│   + Middleware  │◄──►│   Database      │◄──►│     Cache       │
│                 │    │                 │    │                 │
│ • CORS          │    │ • Route Configs │    │ • Rate Limits   │
│ • Rate Limiting │    │ • API Keys      │    │ • Response Cache│
│ • Logging       │    │ • Analytics     │    │ • Sessions      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Target Services │
                    │ • Domain Service │
                    │ • Search Service │
                    │ • Auth Service   │
                    └─────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account with Workers enabled

### Installation

```bash
cd packages/api-gateway
npm install
```

### Configuration

1. **Create D1 Database**:
```bash
wrangler d1 create api-gateway-db
```

2. **Create KV Namespace**:
```bash
wrangler kv:namespace create "CACHE"
```

3. **Update wrangler.jsonc** with your database and KV IDs

4. **Initialize Database**:
```bash
wrangler d1 execute api-gateway-db --file=schema.sql
```

### Development

```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Testing
npm run test
```

### Deployment

```bash
# Deploy to production
npm run deploy
```

## API Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "api-gateway",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": { "healthy": true, "latency": 15 },
    "cache": { "healthy": true, "latency": 8 }
  }
}
```

### Route Management (Admin)
```http
GET /admin/routes
POST /admin/routes
```

### Dynamic Routing
All other requests are dynamically routed based on D1 configuration:

```sql
-- Example route configuration
INSERT INTO routes (path, target, methods, rate_limit, auth_required)
VALUES ('/api/domains/*', 'https://domain-service.bizq.workers.dev', 'GET,POST', 100, false);
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment name | development |
| `RATE_LIMIT_REQUESTS` | Global rate limit per hour | 100 |
| `RATE_LIMIT_WINDOW` | Rate limit window in milliseconds | 3600000 |

### Route Configuration

Routes are stored in D1 and support:
- **Pattern Matching**: `/api/*` matches `/api/domains`, `/api/search`, etc.
- **Method Filtering**: `GET,POST,PUT,DELETE`
- **Rate Limiting**: Per-route limits
- **Authentication**: Optional API key requirements

## Rate Limiting

### Global Rate Limiting
- **Default**: 100 requests/hour per IP
- **Storage**: KV with automatic expiration
- **Headers**: Standard rate limit headers included

### Route-Specific Limits
- **Configuration**: Stored in D1 per route
- **Override**: Route limits can be more restrictive than global limits
- **Tracking**: Separate counters per route per IP

## Security

### Authentication
- **API Keys**: SHA-256 hashed storage in D1
- **Permissions**: Path-based access control
- **Expiration**: Automatic key expiration

### Request Validation
- **CORS**: Configured for allowed origins
- **Headers**: Security headers automatically added
- **Input Sanitization**: Automatic cleaning of malicious inputs

## Monitoring

### Built-in Metrics
- **Request Count**: Total requests by endpoint
- **Response Times**: P95 latency tracking
- **Error Rates**: 4xx/5xx status code tracking
- **Rate Limit Hits**: Blocked request tracking

### Health Checks
- **Database Connectivity**: D1 health monitoring
- **Cache Performance**: KV operation latency
- **External Dependencies**: Target service availability

### Logging
- **Structured Logs**: JSON format with consistent fields
- **Cloudflare Analytics**: Automatic request/response logging
- **Error Tracking**: Detailed error context and stack traces

## Performance

### Benchmarks
- **Cold Start**: <1ms (vs 100-500ms for traditional serverless)
- **Response Time**: <50ms globally average
- **Throughput**: Millions of requests/second
- **Concurrent Connections**: 1000+ simultaneous

### Optimization Features
- **Edge Caching**: Automatic response caching at edge
- **Connection Pooling**: Efficient target service connections
- **Request Deduplication**: Automatic duplicate request handling
- **Smart Routing**: Geographic load balancing

## Cost Analysis

### Monthly Costs (Estimated)
```
Cloudflare Workers: $5-10 (1M requests)
D1 Database: $2-5 (storage + queries)
KV Cache: $1-2 (operations)
Routes: $0.10/route
Total: $8-17/month
```

### Free Tier Coverage
- **Workers**: 100K requests/day free
- **D1**: 10GB storage, 5M queries/month free
- **KV**: 10K operations/day free
- **Routes**: Unlimited free

## Development

### Project Structure
```
packages/api-gateway/
├── src/
│   └── index.ts          # Main Hono application
├── schema.sql            # D1 database schema
├── wrangler.jsonc        # Cloudflare configuration
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

### Key Files

#### `src/index.ts`
- Hono application setup
- Middleware configuration
- Route handling logic
- Health check endpoints

#### `schema.sql`
- D1 database schema
- Default route configurations
- Indexes for performance

#### `wrangler.jsonc`
- Cloudflare Workers configuration
- D1 and KV bindings
- Environment variables
- Cron triggers

## Migration from Express.js

### Before (Express.js)
```javascript
const express = require('express');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/*', (req, res) => {
  // Proxy logic with http-proxy-middleware
});
```

### After (Hono)
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors());
app.use('*', prettyJSON());

app.all('/api/*', async (c) => {
  // Native Cloudflare fetch
  const response = await fetch(targetUrl, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body
  });
  return response;
});
```

## Contributing

1. **Development Setup**: Follow Quick Start guide
2. **Code Style**: TypeScript with strict type checking
3. **Testing**: Vitest for unit tests, integration tests
4. **Deployment**: Automated via GitHub Actions

## License

MIT License - see LICENSE file for details.