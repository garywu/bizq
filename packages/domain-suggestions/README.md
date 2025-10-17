# BizQ Domain Suggestions - Cloudflare Native

AI-powered domain name suggestions for business ideas using Cloudflare's serverless infrastructure.

## Features

- **Cloudflare Native**: Built entirely on Cloudflare Workers, D1, and KV
- **AI-Powered Generation**: OpenAI GPT integration for creative domain suggestions
- **Real-time Availability**: WHOIS-based domain availability checking
- **Industry-Specific**: Tailored suggestions based on business sector
- **Edge Caching**: Cloudflare KV for high-performance caching
- **Serverless Database**: Cloudflare D1 for persistent storage
- **Rate Limiting**: Built-in protection with KV-based rate limiting

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│  Cloudflare     │────│  Cloudflare     │
│   Workers       │    │   D1 Database   │
│                 │    │                 │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┼─────────────────────────┐
                                 │                         │
                    ┌─────────────────┐      ┌─────────────────┐
                    │  Cloudflare KV  │      │   OpenAI API    │
                    │     Cache       │      │                 │
                    └─────────────────┘      └─────────────────┘
```

## Tech Stack

- **Runtime**: Cloudflare Workers (JavaScript/TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV
- **AI**: OpenAI GPT-3.5-turbo
- **Domain Check**: WHOIS API integration

## Prerequisites

- Cloudflare account with Wrangler CLI installed
- OpenAI API key
- Cloudflare D1 database
- Cloudflare KV namespace

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Cloudflare Resources

Create the required Cloudflare resources:

```bash
# Create D1 database
wrangler d1 create domain-suggestions-db

# Create KV namespace
wrangler kv:namespace create "CACHE"
```

### 3. Update Configuration

Edit `wrangler.jsonc` with your actual resource IDs:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "domain-suggestions-db",
      "database_id": "your-actual-database-id"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "your-actual-kv-namespace-id",
      "preview_id": "your-actual-kv-preview-id"
    }
  ]
}
```

### 4. Set Environment Variables

```bash
# Set OpenAI API key as a secret
wrangler secret put OPENAI_API_KEY
```

### 5. Initialize Database

```bash
# Run database migrations
npm run db:migrate
```

### 6. Test the API

```bash
# Run the test script to verify everything works
npm test
```

The test script will verify:
- Health check endpoint
- POST /api/suggest with sample data
- GET /api/suggest with query parameters

## Development

### Local Development

```bash
# Start local development server
npm run dev
```

### Testing

```bash
npm test
```

### Deployment

```bash
# Deploy to Cloudflare
npm run deploy
```

## API Endpoints

### POST /api/suggest
Generate domain name suggestions.

**Request Body:**
```json
{
  "industry": "technology",
  "keywords": ["innovative", "fast", "cloud"],
  "limit": 10,
  "checkAvailability": true
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "name": "TechNova",
      "available": true,
      "tld": "com"
    },
    {
      "name": "CloudFast",
      "available": false,
      "tld": "com"
    }
  ],
  "industry": "technology",
  "keywords": ["innovative", "fast", "cloud"],
  "processingTime": 1250,
  "source": "ai"
}
```

### GET /api/suggest
Generate domain suggestions via query parameters.

**Parameters:**
- `industry` (string, required): Business industry
- `keywords` (array, optional): Comma-separated keywords
- `limit` (number, optional): Number of suggestions (default: 10)
- `checkAvailability` (boolean, optional): Check domain availability

**Example:**
```bash
GET /api/suggest?industry=restaurant&keywords=pizza,italian&limit=5
```

### GET /health
Health check endpoint.

## Database Schema

### domain_suggestions
```sql
CREATE TABLE domain_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    keywords TEXT,
    available BOOLEAN,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, industry)
);
```

### industry_patterns
```sql
CREATE TABLE industry_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    industry TEXT NOT NULL UNIQUE,
    patterns TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Performance

- **Cold Start**: ~100-200ms (Cloudflare Workers)
- **AI Generation**: 1-3 seconds
- **Domain Check**: 0.5-2 seconds per domain
- **Cache Hit**: <50ms response time
- **Rate Limit**: 50 requests/hour per IP

## Caching Strategy

1. **KV Cache**: Stores complete API responses for 1 hour
2. **Database Cache**: Stores domain availability for 24 hours
3. **Industry Patterns**: Cached in memory for session duration

## Rate Limiting

- **Per IP**: 50 requests per hour
- **Implementation**: KV-based distributed rate limiting
- **Reset**: Automatic hourly reset

## Error Handling

- **AI Failures**: Fallback to cached/database suggestions
- **Domain Check Failures**: Assume available (optimistic approach)
- **Rate Limit Exceeded**: 429 status with retry information
- **Database Errors**: Graceful degradation with error logging

## Monitoring

### Cloudflare Dashboard

- **Workers Analytics**: Request volume, latency, errors
- **D1 Analytics**: Query performance, storage usage
- **KV Analytics**: Cache hit rates, storage usage

### Custom Logging

- Structured logging with request IDs
- Performance metrics collection
- Error tracking with context

## Security

- **API Key Protection**: OpenAI key stored as Cloudflare secret
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Input Validation**: Sanitized inputs prevent injection attacks
- **CORS**: Configured for cross-origin requests

## Contributing

1. Follow TypeScript best practices
2. Add comprehensive error handling
3. Update tests for new features
4. Document API changes
5. Use conventional commits

## Deployment Checklist

- [ ] D1 database created and configured
- [ ] KV namespace created and configured
- [ ] OpenAI API key set as secret
- [ ] Database schema migrated
- [ ] Worker deployed successfully
- [ ] Custom domain configured (optional)
- [ ] Monitoring alerts set up

## Current Status

✅ **Completed:**
- Cloudflare Worker implementation with TypeScript
- D1 database schema and migrations
- KV caching for performance
- OpenAI GPT integration for AI generation
- WHOIS API integration for domain checking
- Rate limiting and security features
- Comprehensive error handling
- Marketing site integration (Domain Suggestions tool added)

🔄 **Next Steps:**
1. Set OpenAI API key: `wrangler secret put OPENAI_API_KEY`
2. Test API endpoints: `npm test`
3. Monitor performance and optimize as needed

## Troubleshooting

### Common Issues

1. **Wrangler Authentication**
   ```bash
   wrangler auth login
   ```

2. **Database Connection**
   ```bash
   wrangler d1 execute domain-suggestions-db --command="SELECT 1;"
   ```

3. **KV Namespace Issues**
   ```bash
   wrangler kv:key list --binding=CACHE
   ```

4. **OpenAI API Errors**
   - Verify API key is set correctly
   - Check API quota and billing
   - Review OpenAI service status

### Logs

```bash
# View worker logs
wrangler tail

# View deployment logs
wrangler deploy --dry-run
```

## Cost Optimization

- **D1**: Pay per GB stored and GB transferred
- **KV**: Pay per GB stored and operations
- **Workers**: Pay per request and GB transferred
- **OpenAI**: Pay per token used

**Optimization Tips:**
- Cache aggressively to reduce AI calls
- Use smaller AI models when possible
- Implement request deduplication
- Monitor usage patterns for cost anomalies