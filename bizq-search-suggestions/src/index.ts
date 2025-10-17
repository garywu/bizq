import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Client } from '@elastic/elasticsearch';
import { createClient as createRedisClient } from 'redis';
import OpenAI from 'openai';
import winston from 'winston';

// Types
interface SuggestionRequest {
  query: string;
  limit?: number;
  category?: string;
  useAI?: boolean;
}

interface SuggestionResponse {
  suggestions: string[];
  source: 'elasticsearch' | 'ai' | 'hybrid';
  query: string;
  processingTime: number;
}

// Configuration
const config = {
  port: process.env.PORT || 3001,
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    index: 'search-suggestions'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};

// Initialize clients
const elasticsearch = new Client({ node: config.elasticsearch.node });
const redis = createRedisClient({ url: config.redis.url });
const openai = new OpenAI({ apiKey: config.openai.apiKey });

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'search-suggestions.log' })
  ]
});

// Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit(config.rateLimit));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'search-suggestions' });
});

// Elasticsearch suggestion service
class ElasticsearchSuggestions {
  async getSuggestions(query: string, limit: number = 10): Promise<string[]> {
    try {
      const result = await elasticsearch.search({
        index: config.elasticsearch.index,
        body: {
          suggest: {
            text: query,
            completion: {
              field: 'suggest',
              size: limit,
              skip_duplicates: true
            }
          }
        }
      });

      return result.suggest?.completion?.[0]?.options?.map(opt => opt.text) || [];
    } catch (error) {
      logger.error('Elasticsearch error:', error);
      return [];
    }
  }

  async indexSuggestion(suggestion: string, weight: number = 1): Promise<void> {
    try {
      await elasticsearch.index({
        index: config.elasticsearch.index,
        body: {
          suggest: {
            input: suggestion,
            weight: weight
          }
        }
      });
    } catch (error) {
      logger.error('Indexing error:', error);
    }
  }
}

// AI-enhanced suggestions
class AISuggestions {
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
      const prompt = `Generate ${limit} relevant search suggestions for the query "${query}". 
      Return only the suggestions as a JSON array of strings, no explanation.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      try {
        const suggestions = JSON.parse(content);
        return Array.isArray(suggestions) ? suggestions.slice(0, limit) : [];
      } catch {
        // Fallback: extract suggestions from text
        return content.split('\n').filter(s => s.trim()).slice(0, limit);
      }
    } catch (error) {
      logger.error('OpenAI error:', error);
      return [];
    }
  }
}

// Redis cache
class CacheService {
  async get(key: string): Promise<string[] | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: string[], ttl: number = 3600): Promise<void> {
    try {
      await redis.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }
}

// Main suggestion service
class SuggestionService {
  private es = new ElasticsearchSuggestions();
  private ai = new AISuggestions();
  private cache = new CacheService();

  async getSuggestions(req: SuggestionRequest): Promise<SuggestionResponse> {
    const startTime = Date.now();
    const { query, limit = 10, category, useAI = false } = req;

    // Check cache first
    const cacheKey = `suggestions:${query}:${limit}:${category || 'all'}:${useAI}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return {
        suggestions: cached,
        source: 'elasticsearch',
        query,
        processingTime: Date.now() - startTime
      };
    }

    let suggestions: string[] = [];
    let source: 'elasticsearch' | 'ai' | 'hybrid' = 'elasticsearch';

    // Get Elasticsearch suggestions
    const esSuggestions = await this.es.getSuggestions(query, Math.floor(limit * 0.7));
    suggestions = esSuggestions;

    // Add AI suggestions if requested
    if (useAI && esSuggestions.length < limit) {
      const aiSuggestions = await this.ai.getSuggestions(query, Math.ceil(limit * 0.3));
      suggestions = [...esSuggestions, ...aiSuggestions];
      source = 'hybrid';
    } else if (useAI && esSuggestions.length === 0) {
      suggestions = await this.ai.getSuggestions(query, limit);
      source = 'ai';
    }

    // Remove duplicates and limit
    suggestions = [...new Set(suggestions)].slice(0, limit);

    // Cache results
    await this.cache.set(cacheKey, suggestions);

    return {
      suggestions,
      source,
      query,
      processingTime: Date.now() - startTime
    };
  }
}

const suggestionService = new SuggestionService();

// API Routes
app.get('/api/suggestions', async (req, res) => {
  try {
    const { q: query, limit, category, useAI } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const request: SuggestionRequest = {
      query,
      limit: limit ? parseInt(limit as string) : 10,
      category: category as string,
      useAI: useAI === 'true'
    };

    const result = await suggestionService.getSuggestions(request);
    res.json(result);

  } catch (error) {
    logger.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to index suggestions
app.post('/api/admin/index', async (req, res) => {
  try {
    const { suggestion, weight } = req.body;

    if (!suggestion) {
      return res.status(400).json({ error: 'Suggestion is required' });
    }

    const es = new ElasticsearchSuggestions();
    await es.indexSuggestion(suggestion, weight || 1);

    res.json({ success: true, message: 'Suggestion indexed' });
  } catch (error) {
    logger.error('Indexing error:', error);
    res.status(500).json({ error: 'Failed to index suggestion' });
  }
});

// Initialize and start server
async function startServer() {
  try {
    // Connect to Redis
    await redis.connect();
    logger.info('Connected to Redis');

    // Check Elasticsearch connection
    const esInfo = await elasticsearch.info();
    logger.info('Connected to Elasticsearch:', esInfo.name);

    // Create index if it doesn't exist
    const indexExists = await elasticsearch.indices.exists({ index: config.elasticsearch.index });
    if (!indexExists) {
      await elasticsearch.indices.create({
        index: config.elasticsearch.index,
        body: {
          mappings: {
            properties: {
              suggest: {
                type: 'completion',
                analyzer: 'simple'
              }
            }
          }
        }
      });
      logger.info('Created Elasticsearch index');
    }

    app.listen(config.port, () => {
      logger.info(`Search Suggestions service listening on port ${config.port}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await redis.disconnect();
  process.exit(0);
});

startServer();