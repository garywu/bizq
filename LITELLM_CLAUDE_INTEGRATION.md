# BizQ + LiteLLM + Claude Code Server Integration

This document outlines the complete integration of BizQ with LiteLLM using the claude-code-server as the LLM backend.

## Architecture Overview

```
┌─────────┐    ┌─────────────┐    ┌─────────┐    ┌─────────────────┐    ┌─────────┐
│  BizQ   │───▶│ AI Manager  │───▶│ LiteLLM │───▶│ Claude-Code-    │───▶│ Claude  │
│         │    │             │    │         │    │ Server          │    │ CLI     │
│ Web App │    │ (Unified)   │    │ (OpenAI │    │ (Protocol       │    │         │
│         │    │             │    │ Client) │    │ Translator)     │    │         │
└─────────┘    └─────────────┘    └─────────┘    └─────────────────┘    └─────────┘
```

## Key Components

### 1. BizQ Core Application (`web-interface.ts`)
- **Express.js web server** with Socket.IO for real-time updates
- **AI-powered endpoints** that use the AI Manager
- **RESTful API** for business operations and AI tasks
- **Mobile-first interface** for multi-business management

### 2. AI Manager (`ai-manager.ts`)
- **Unified interface** for multiple AI providers
- **Automatic fallback** from LiteLLM to Claude SDK
- **Provider switching** capabilities
- **Health monitoring** and error handling
- **Streaming support** for real-time responses

### 3. LiteLLM Provider (`ai-provider-litellm.ts`)
- **OpenAI-compatible client** pointing to claude-code-server
- **Structured business tasks** processing
- **Content generation** for marketing, strategy, etc.
- **Data analysis** with JSON output parsing
- **Decision making** with confidence scoring

### 4. Claude Code Server (External)
- **Protocol translator** that implements OpenAI API
- **Direct Claude CLI execution** (no API keys needed)
- **Multiple protocol support** (REST, JSON-RPC, MCP)
- **Local authentication** via Claude CLI login

## Benefits of This Architecture

### 🔐 **Security & Privacy**
- **No API keys required** - uses local Claude CLI authentication
- **All processing local** - no data sent to external APIs
- **Full control** over AI processing pipeline

### 🔧 **Flexibility**
- **Provider independence** - can switch between Claude SDK and LiteLLM
- **OpenAI compatibility** - works with any OpenAI-compatible client
- **Protocol options** - REST, JSON-RPC, WebSocket, MCP support

### 🚀 **Performance**
- **Local execution** - no network latency to external APIs
- **Caching support** - responses cached for efficiency
- **Streaming responses** - real-time AI output
- **Automatic fallback** - redundancy for reliability

### 💼 **Business Features**
- **Multi-business management** - handle multiple businesses from one interface
- **AI-powered operations** - automated business task processing
- **Real-time updates** - WebSocket integration for live data
- **Comprehensive analytics** - data analysis with AI insights

## Installation & Setup

### Prerequisites
1. **Claude CLI installed and authenticated**
   ```bash
   curl -fsSL https://claude.ai/install.sh | bash
   claude login
   ```

2. **Node.js 18+** for BizQ application

3. **Python 3.9+** for claude-code-server

### Quick Start
```bash
# 1. Start everything with the provided script
./start-bizq-with-claude-server.sh

# 2. Or manually start components:

# Start Claude Code Server
cd /tmp/claude-code-server-test
source venv/bin/activate
python run.py --port 8000

# Start BizQ
npm run dev
```

### Testing Integration
```bash
# Run comprehensive integration test
npx tsx test-ai-integration-litellm.ts

# Test individual components
curl http://localhost:8000/health  # Claude server
curl http://localhost:3000/api/ai/health  # BizQ AI
```

## API Endpoints

### AI-Powered Business Operations
```javascript
// Process business task
POST /api/ai/process-task
{
  "businessId": "biz-001",
  "content": "Analyze Q4 sales performance",
  "type": "financial",
  "metadata": { "quarter": "Q4", "year": 2024 }
}

// Generate marketing content
POST /api/ai/generate-content
{
  "type": "marketing",
  "context": {
    "product": "Eco-friendly water bottles",
    "target": "environmentally conscious consumers"
  }
}

// Analyze business data
POST /api/ai/analyze-data
{
  "data": {
    "revenue": [100000, 120000, 115000],
    "costs": [70000, 85000, 80000]
  },
  "analysisType": "financial"
}

// Make strategic decisions
POST /api/ai/make-decision
{
  "situation": "Competitor launched similar product",
  "options": ["Lower prices", "Improve features", "New marketing"],
  "constraints": { "budget": 50000, "timeline": "3 months" }
}
```

### Health & Monitoring
```javascript
// Check AI system health
GET /api/ai/health
// Returns provider status, available models, configuration

// Stream AI responses
GET /api/ai/stream/your-prompt-here
// Server-sent events for real-time responses
```

## Configuration Options

### Pydantic-Style Settings Configuration

BizQ uses a centralized settings system with environment variable support and file-based configuration.

#### Configuration File (`bizq.config.json`)
```json
{
  "port": 9321,
  "host": "127.0.0.1",
  "environment": "development",
  "ai": {
    "provider": "litellm",
    "baseURL": "http://localhost:9000/v1",
    "model": "claude-3-5-sonnet-20241022",
    "timeout": 120000,
    "maxRetries": 3,
    "fallback": {
      "provider": "claude-sdk"
    }
  },
  "cache": {
    "enabled": true,
    "ttl": 3600,
    "maxSize": 1000
  },
  "logging": {
    "level": "info",
    "format": "pretty"
  },
  "business": {
    "maxBusinesses": 50,
    "defaultCredits": 100,
    "bulkOperationLimit": 10
  }
}
```

#### Environment Variables
```bash
# Server Configuration
PORT=9321
HOST=127.0.0.1
NODE_ENV=production

# AI Provider Configuration
AI_PROVIDER=litellm
AI_BASE_URL=http://localhost:9000/v1
AI_MODEL=claude-3-5-sonnet-20241022
AI_TIMEOUT=120000
AI_MAX_RETRIES=3
AI_FALLBACK_PROVIDER=claude-sdk

# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=pretty

# Business Configuration
MAX_BUSINESSES=50
DEFAULT_CREDITS=100
BULK_OPERATION_LIMIT=10
```

#### Settings Loading Priority
1. **Default values** (built into the application)
2. **Configuration files** (`bizq.config.json`, `config/bizq.json`, `settings.json`)
3. **Environment variables** (highest priority)

#### AI Manager Initialization
```typescript
// Settings are loaded automatically
const config = getSettings();

const aiManager = new BizQAIManager({
  type: config.ai.provider,
  baseURL: config.ai.baseURL,
  model: config.ai.model,
  fallback: config.ai.fallback
});
```

### Provider Types
- **`litellm`** - Uses OpenAI client with claude-code-server
- **`claude-sdk`** - Direct Claude Code SDK integration
- **`auto`** - Automatic provider detection and selection

## File Structure

```
bizq/
├── ai-manager.ts                    # Unified AI interface
├── ai-provider-litellm.ts          # LiteLLM provider implementation
├── ai-provider.ts                  # Original Claude SDK provider
├── web-interface.ts                # Main BizQ application
├── test-ai-integration-litellm.ts  # Integration tests
├── start-bizq-with-claude-server.sh # Startup script
└── LITELLM_CLAUDE_INTEGRATION.md   # This documentation
```

## Error Handling & Fallbacks

### Automatic Fallback Chain
1. **Primary**: LiteLLM → Claude Code Server → Claude CLI
2. **Fallback**: Claude SDK → Direct Claude Code execution
3. **Error Response**: Structured error with provider information

### Health Monitoring
- **Real-time health checks** for all providers
- **Latency monitoring** for performance optimization
- **Automatic provider switching** on failures
- **Detailed error reporting** for debugging

## Troubleshooting

### Common Issues

**Claude Code Server Not Starting**
```bash
# Check if Claude CLI is authenticated
claude --version

# Verify server dependencies
cd /tmp/claude-code-server-test
source venv/bin/activate
python -c "import fastapi, uvicorn; print('Dependencies OK')"
```

**LiteLLM Connection Failed**
```bash
# Test server directly
curl http://localhost:8000/v1/models

# Check BizQ AI health
curl http://localhost:3000/api/ai/health
```

**Provider Fallback Not Working**
```typescript
// Check AI Manager configuration
const health = await aiManager.healthCheck();
console.log('Provider Health:', health);
```

### Debug Commands
```bash
# Monitor logs
tail -f /tmp/claude-code-server-test/claude-server.log
tail -f bizq.log

# Test components individually
npx tsx ai-provider-litellm.ts    # Test LiteLLM provider
npx tsx ai-manager.ts             # Test AI manager
```

## Performance Optimization

### Caching Strategy
- **Response caching** in claude-code-server with TTL
- **Model caching** for faster subsequent requests
- **Session management** for conversation continuity

### Load Balancing
- **Multiple server instances** can be run on different ports
- **Round-robin distribution** for high-load scenarios
- **Health-based routing** to available instances

## Security Considerations

### Local Processing
- **No external API calls** - everything runs locally
- **Data privacy** - business data never leaves your machine
- **Authentication** - uses existing Claude CLI login

### Network Security
- **Localhost binding** by default
- **No API key storage** required
- **Process isolation** between components

## Future Enhancements

### Planned Features
1. **Multi-model support** - Add support for other local models
2. **Advanced caching** - Redis integration for distributed caching
3. **Load balancing** - Automatic distribution across server instances
4. **Analytics dashboard** - Real-time AI usage and performance metrics
5. **Plugin system** - Custom AI providers and business logic

### Integration Opportunities
1. **Database integration** - Persistent business data storage
2. **External APIs** - Connect to business tools and services
3. **Mobile app** - Native mobile interface for BizQ
4. **Team collaboration** - Multi-user business management

## Conclusion

This integration provides BizQ with powerful AI capabilities while maintaining:
- **Local control** over AI processing
- **OpenAI compatibility** for future flexibility
- **Robust error handling** with automatic fallbacks
- **Real-time capabilities** for responsive user experience

The architecture is designed to be maintainable, scalable, and adaptable to future AI developments while providing immediate business value through automated task processing and intelligent decision support.