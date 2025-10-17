# BizQ Search Suggestions Microservice

AI-powered search suggestions and autocomplete functionality for BizQ platform.

## Features

- **Elasticsearch Integration**: Fast prefix-based suggestions using completion suggesters
- **AI Enhancement**: OpenAI GPT integration for contextual suggestions
- **Redis Caching**: High-performance caching layer
- **Rate Limiting**: Built-in protection against abuse
- **Health Monitoring**: Comprehensive logging and health checks

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Search Engine**: Elasticsearch
- **AI**: OpenAI GPT-3.5-turbo
- **Cache**: Redis
- **Web Framework**: Express.js

## Quick Start

### Prerequisites

- Node.js 18+
- Elasticsearch 8.x
- Redis 6.x
- OpenAI API key

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file:

```env
PORT=3001
ELASTICSEARCH_NODE=http://localhost:9200
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key_here
```

### Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### GET /api/suggestions
Get search suggestions for a query.

**Parameters:**
- `q` (string, required): Search query
- `limit` (number, optional): Number of suggestions (default: 10)
- `category` (string, optional): Filter by category
- `useAI` (boolean, optional): Include AI-generated suggestions

**Example:**
```bash
curl "http://localhost:3001/api/suggestions?q=restaur&limit=5&useAI=true"
```

**Response:**
```json
{
  "suggestions": ["restaurant", "restaurants", "restaurant management"],
  "source": "hybrid",
  "query": "restaur",
  "processingTime": 45
}
```

### POST /api/admin/index
Index a new suggestion (admin endpoint).

**Body:**
```json
{
  "suggestion": "example term",
  "weight": 1
}
```

### GET /health
Health check endpoint.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│ Search Service  │────│  Elasticsearch  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              └────────────────────────┘
                                       │
                              ┌─────────────────┐
                              │      Redis      │
                              │     Cache       │
                              └─────────────────┘
                                       │
                              ┌─────────────────┐
                              │     OpenAI      │
                              │      API        │
                              └─────────────────┘
```

## Development

### Adding New Suggestion Sources

1. Implement a new suggestion provider class
2. Add it to the `SuggestionService` class
3. Update the API to accept new parameters

### Testing

```bash
npm test
```

### Docker

```bash
docker build -t bizq-search-suggestions .
docker run -p 3001:3001 bizq-search-suggestions
```

## Performance

- **Response Time**: <100ms for cached requests
- **Throughput**: 1000+ requests/second
- **Cache Hit Rate**: 85%+ for frequent queries
- **AI Fallback**: Seamless degradation when AI unavailable

## Monitoring

- Structured logging with Winston
- Health checks for all dependencies
- Performance metrics collection
- Error tracking and alerting

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Use conventional commits