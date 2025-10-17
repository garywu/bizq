# BizQ Domain Suggestions Microservice

AI-powered domain name suggestions for business ideas using OpenAI GPT and WHOIS validation.

## Features

- **AI-Powered Generation**: OpenAI GPT for creative domain suggestions
- **WHOIS Validation**: Real-time domain availability checking
- **Industry-Specific**: Tailored suggestions based on business sector
- **Keyword Integration**: Incorporate business keywords into suggestions
- **Caching**: Redis-based caching for performance
- **Rate Limiting**: Built-in protection and fair usage

## Tech Stack

- **Runtime**: Python 3.11+ with FastAPI
- **AI**: OpenAI GPT-3.5-turbo
- **Domain Validation**: WHOIS protocol
- **Cache**: Redis
- **Web Framework**: FastAPI with Uvicorn

## Quick Start

### Prerequisites

- Python 3.11+
- Redis 6.x
- OpenAI API key

### Installation

```bash
pip install -r requirements.txt
```

### Configuration

Create a `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
REDIS_URL=redis://localhost:6379
PORT=3002
```

### Running

```bash
# Development
python main.py

# Production
uvicorn main:app --host 0.0.0.0 --port 3002
```

## API Endpoints

### POST /api/suggest
Generate domain name suggestions.

**Request Body:**
```json
{
  "industry": "technology",
  "keywords": ["innovative", "fast", "reliable"],
  "limit": 10,
  "check_availability": true
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
      "name": "RapidInnovate",
      "available": false,
      "tld": "com"
    }
  ],
  "industry": "technology",
  "keywords": ["innovative", "fast", "reliable"],
  "processing_time": 1.23,
  "source": "ai"
}
```

### GET /api/suggest
Generate domain suggestions via query parameters.

**Parameters:**
- `industry` (string, required): Business industry
- `keywords` (array, optional): Comma-separated keywords
- `limit` (number, optional): Number of suggestions (default: 10)
- `check_availability` (boolean, optional): Check domain availability

**Example:**
```bash
curl "http://localhost:3002/api/suggest?industry=restaurant&keywords=pizza,italian&limit=5"
```

### GET /health
Health check endpoint.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│ Domain Service  │────│     OpenAI      │
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
                              │     WHOIS       │
                              │   Validation    │
                              └─────────────────┘
```

## Development

### Adding New TLD Support

1. Update the `DomainSuggestion` model to include new TLDs
2. Modify the WHOIS validation logic for different TLD registries
3. Add TLD-specific validation rules

### Testing

```bash
pytest
```

### Docker

```bash
docker build -t bizq-domain-suggestions .
docker run -p 3002:3002 bizq-domain-suggestions
```

## Performance

- **Generation Time**: 1-3 seconds for AI suggestions
- **Validation Time**: 0.5-2 seconds per domain check
- **Cache Hit Rate**: 90%+ for repeated queries
- **Concurrent Requests**: 50+ simultaneous suggestions

## Monitoring

- Structured logging with structlog
- Health checks for all dependencies
- Performance metrics and timing
- Error tracking with detailed context

## Contributing

1. Follow Python best practices (PEP 8)
2. Add type hints for all functions
3. Write comprehensive tests
4. Update API documentation
5. Use conventional commits