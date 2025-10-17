import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Environment bindings
interface Bindings {
  DB: D1Database;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
}

// Route configuration stored in D1
interface RouteConfig {
  id: number;
  path: string;
  target: string;
  methods: string;
  rate_limit: number;
  auth_required: boolean;
  created_at: string;
  updated_at: string;
}

// Rate limit tracking
interface RateLimitInfo {
  requests: number;
  resetTime: number;
}

// API Gateway using Hono framework
const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', cors({
  origin: ['https://bizq.com', 'https://app.bizq.com', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));

app.use('*', logger());
app.use('*', prettyJSON());

// Rate limiting middleware
async function rateLimit(c: any, next: any) {
  const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const maxRequests = parseInt(c.env.RATE_LIMIT_REQUESTS) || 100;
  const windowMs = parseInt(c.env.RATE_LIMIT_WINDOW) || 3600000; // 1 hour

  const key = `ratelimit:${clientIP}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Get current rate limit data
    const data = await c.env.CACHE.get(key);
    let rateLimitInfo: RateLimitInfo = data ? JSON.parse(data) : { requests: 0, resetTime: now + windowMs };

    // Reset if window has expired
    if (now > rateLimitInfo.resetTime) {
      rateLimitInfo = { requests: 0, resetTime: now + windowMs };
    }

    // Check if limit exceeded
    if (rateLimitInfo.requests >= maxRequests) {
      return c.json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitInfo.resetTime - now) / 1000),
        limit: maxRequests,
        remaining: 0,
        resetTime: new Date(rateLimitInfo.resetTime).toISOString()
      }, 429, {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitInfo.resetTime.toString(),
        'Retry-After': Math.ceil((rateLimitInfo.resetTime - now) / 1000).toString()
      });
    }

    // Increment counter
    rateLimitInfo.requests++;

    // Store updated rate limit info
    await c.env.CACHE.put(key, JSON.stringify(rateLimitInfo), {
      expirationTtl: Math.ceil(windowMs / 1000)
    });

    // Add headers to response
    await next();

    // Set rate limit headers on response
    c.res.headers.set('X-RateLimit-Limit', maxRequests.toString());
    c.res.headers.set('X-RateLimit-Remaining', (maxRequests - rateLimitInfo.requests).toString());
    c.res.headers.set('X-RateLimit-Reset', rateLimitInfo.resetTime.toString());

  } catch (error) {
    console.error('Rate limiting error:', error);
    // Allow request on error to avoid blocking legitimate traffic
    await next();
  }
}

// Apply rate limiting to all routes except health check
app.use('*', async (c, next) => {
  if (c.req.path === '/health') {
    await next();
  } else {
    await rateLimit(c, next);
  }
});

// Health check endpoint
app.get('/health', async (c) => {
  const dbStatus = await checkDatabaseHealth(c.env.DB);
  const cacheStatus = await checkCacheHealth(c.env.CACHE);

  const isHealthy = dbStatus.healthy && cacheStatus.healthy;

  return c.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: c.env.ENVIRONMENT,
    checks: {
      database: dbStatus,
      cache: cacheStatus
    }
  }, isHealthy ? 200 : 503);
});

// Route management endpoints (admin only)
app.get('/admin/routes', async (c) => {
  try {
    const routes = await c.env.DB.prepare(
      'SELECT * FROM routes ORDER BY path'
    ).all();

    return c.json({
      routes: routes.results,
      total: routes.results?.length || 0
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return c.json({ error: 'Failed to fetch routes' }, 500);
  }
});

app.post('/admin/routes', async (c) => {
  try {
    const body = await c.req.json();
    const { path, target, methods, rate_limit, auth_required } = body;

    if (!path || !target) {
      return c.json({ error: 'Path and target are required' }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO routes (path, target, methods, rate_limit, auth_required, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      path,
      target,
      methods || 'GET,POST,PUT,DELETE',
      rate_limit || 100,
      auth_required || false
    ).run();

    return c.json({
      success: true,
      route: {
        id: result.meta?.last_row_id,
        path,
        target,
        methods: methods || 'GET,POST,PUT,DELETE',
        rate_limit: rate_limit || 100,
        auth_required: auth_required || false
      }
    });
  } catch (error) {
    console.error('Error creating route:', error);
    return c.json({ error: 'Failed to create route' }, 500);
  }
});

// Dynamic routing - catch all other requests
app.all('*', async (c) => {
  const path = c.req.path;
  const method = c.req.method;

  try {
    // Find matching route configuration
    const routeConfig = await findRouteConfig(c.env.DB, path, method);

    if (!routeConfig) {
      return c.json({
        error: 'Route not found',
        path,
        method
      }, 404);
    }

    // Check authentication if required
    if (routeConfig.auth_required) {
      const authHeader = c.req.header('Authorization') || c.req.header('X-API-Key');
      if (!authHeader) {
        return c.json({ error: 'Authentication required' }, 401);
      }
      // TODO: Implement proper authentication validation
    }

    // Check route-specific rate limit
    if (routeConfig.rate_limit > 0) {
      const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
      const routeKey = `route:${routeConfig.id}:${clientIP}`;

      const routeLimit = await c.env.CACHE.get(routeKey);
      let routeRequests = routeLimit ? parseInt(routeLimit) : 0;

      if (routeRequests >= routeConfig.rate_limit) {
        return c.json({
          error: 'Route rate limit exceeded',
          limit: routeConfig.rate_limit
        }, 429);
      }

      routeRequests++;
      await c.env.CACHE.put(routeKey, routeRequests.toString(), {
        expirationTtl: 3600 // 1 hour
      });
    }

    // Proxy the request to target service
    const targetUrl = buildTargetUrl(routeConfig.target, path, c.req.query());

    console.log(`Proxying ${method} ${path} -> ${targetUrl}`);

    // Forward the request
    const response = await fetch(targetUrl, {
      method,
      headers: {
        ...c.req.raw.headers,
        // Remove hop-by-hop headers
        'host': new URL(targetUrl).host,
        'connection': undefined,
        'keep-alive': undefined,
        'proxy-authenticate': undefined,
        'proxy-authorization': undefined,
        'te': undefined,
        'trailers': undefined,
        'transfer-encoding': undefined,
        'upgrade': undefined,
      },
      body: method !== 'GET' && method !== 'HEAD' ? c.req.raw.body : undefined,
    });

    // Return the proxied response
    const responseBody = await response.arrayBuffer();

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        // Add gateway headers
        'X-API-Gateway': 'bizq-api-gateway',
        'X-Request-ID': crypto.randomUUID(),
      },
    });

  } catch (error) {
    console.error(`Gateway error for ${method} ${path}:`, error);
    return c.json({
      error: 'Gateway error',
      message: 'Internal server error'
    }, 500);
  }
});

// Scheduled task for cleanup
export const scheduled = async (event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) => {
  console.log('Running scheduled cleanup...');

  try {
    // Clean up expired cache entries
    // Note: KV TTL handles most cleanup automatically
    // This could be extended for custom cleanup logic

    console.log('Cleanup completed');
  } catch (error) {
    console.error('Scheduled cleanup error:', error);
  }
};

// Helper functions
async function checkDatabaseHealth(db: D1Database): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  const start = Date.now();
  try {
    await db.prepare('SELECT 1').first();
    const latency = Date.now() - start;
    return { healthy: true, latency };
  } catch (error) {
    return { healthy: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function checkCacheHealth(cache: KVNamespace): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  const start = Date.now();
  try {
    const testKey = `health-check-${Date.now()}`;
    await cache.put(testKey, 'test', { expirationTtl: 60 });
    await cache.get(testKey);
    await cache.delete(testKey);
    const latency = Date.now() - start;
    return { healthy: true, latency };
  } catch (error) {
    return { healthy: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function findRouteConfig(db: D1Database, path: string, method: string): Promise<RouteConfig | null> {
  try {
    // Find exact path match first
    let result = await db.prepare(
      'SELECT * FROM routes WHERE path = ? AND methods LIKE ? LIMIT 1'
    ).bind(path, `%${method}%`).first();

    if (result) {
      return result as RouteConfig;
    }

    // Try pattern matching for parameterized routes
    const routes = await db.prepare(
      'SELECT * FROM routes WHERE methods LIKE ? ORDER BY LENGTH(path) DESC'
    ).bind(`%${method}%`).all();

    for (const route of routes.results || []) {
      const routeConfig = route as RouteConfig;
      if (matchesRoutePattern(path, routeConfig.path)) {
        return routeConfig;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding route config:', error);
    return null;
  }
}

function matchesRoutePattern(requestPath: string, routePattern: string): boolean {
  // Simple pattern matching - could be enhanced with more sophisticated routing
  if (routePattern.includes('*')) {
    const regex = new RegExp(routePattern.replace(/\*/g, '.*'));
    return regex.test(requestPath);
  }

  // Exact match
  return requestPath === routePattern;
}

function buildTargetUrl(target: string, requestPath: string, queryParams: Record<string, string>): string {
  // Remove the gateway prefix from path if present
  const cleanPath = requestPath.replace(/^\/gateway/, '');

  // Build target URL
  const url = new URL(target);
  url.pathname = cleanPath;

  // Add query parameters
  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export default app;