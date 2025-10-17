import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import winston from 'winston';

// Configuration
const config = {
  port: process.env.PORT || 3000,
  services: {
    'search-suggestions': process.env.SEARCH_SUGGESTIONS_URL || 'http://localhost:3001',
    'domain-suggestions': process.env.DOMAIN_SUGGESTIONS_URL || 'http://localhost:3002'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'api-gateway.log' })
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
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    services: config.services
  });
});

// Service discovery/health checks
app.get('/api/services/health', async (req, res) => {
  const results = {};

  for (const [serviceName, serviceUrl] of Object.entries(config.services)) {
    try {
      const response = await fetch(`${serviceUrl}/health`, {
        timeout: 5000
      });
      results[serviceName] = {
        status: response.ok ? 'healthy' : 'unhealthy',
        url: serviceUrl
      };
    } catch (error) {
      results[serviceName] = {
        status: 'unreachable',
        url: serviceUrl,
        error: error.message
      };
    }
  }

  res.json(results);
});

// Proxy middleware for search suggestions
app.use('/api/suggestions', createProxyMiddleware({
  target: config.services['search-suggestions'],
  changeOrigin: true,
  pathRewrite: {
    '^/api/suggestions': '/api/suggestions'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying search suggestions request', {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent']
    });
  },
  onError: (err, req, res) => {
    logger.error('Search suggestions proxy error', {
      error: err.message,
      url: req.url
    });
    res.status(502).json({ error: 'Search suggestions service unavailable' });
  }
}));

// Proxy middleware for domain suggestions
app.use('/api/domains', createProxyMiddleware({
  target: config.services['domain-suggestions'],
  changeOrigin: true,
  pathRewrite: {
    '^/api/domains': '/api'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying domain suggestions request', {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent']
    });
  },
  onError: (err, req, res) => {
    logger.error('Domain suggestions proxy error', {
      error: err.message,
      url: req.url
    });
    res.status(502).json({ error: 'Domain suggestions service unavailable' });
  }
}));

// Unified suggestions endpoint
app.get('/api/unified/suggestions', async (req, res) => {
  try {
    const { q: query, type = 'all' } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const results = {
      search: null,
      domains: null,
      query,
      timestamp: new Date().toISOString()
    };

    // Get search suggestions if requested
    if (type === 'all' || type === 'search') {
      try {
        const searchResponse = await fetch(
          `${config.services['search-suggestions']}/api/suggestions?q=${encodeURIComponent(query)}&limit=5`
        );
        if (searchResponse.ok) {
          results.search = await searchResponse.json();
        }
      } catch (error) {
        logger.warn('Search suggestions service error', { error: error.message });
      }
    }

    // Get domain suggestions if requested
    if (type === 'all' || type === 'domains') {
      try {
        const domainResponse = await fetch(
          `${config.services['domain-suggestions']}/api/suggest?industry=${encodeURIComponent(query)}&limit=5`
        );
        if (domainResponse.ok) {
          results.domains = await domainResponse.json();
        }
      } catch (error) {
        logger.warn('Domain suggestions service error', { error: error.message });
      }
    }

    res.json(results);

  } catch (error) {
    logger.error('Unified suggestions error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.port, () => {
  logger.info(`API Gateway listening on port ${config.port}`);
  logger.info('Service URLs:', config.services);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});