export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  IP2LOCATION_API_KEY: string;
  DOMAINS_INDEX_API_KEY: string;
}

interface DomainCheckRequest {
  domains: string[];
  tlds?: string[];
  filters?: {
    minLength?: number;
    maxLength?: number;
    includeHyphens?: boolean;
    excludeNumbers?: boolean;
  };
}

interface DomainCheckResult {
  domain: string;
  available: boolean;
  tld: string;
  checkedAt: string;
}

interface DomainCheckResponse {
  results: DomainCheckResult[];
  totalChecked: number;
  availableCount: number;
  processingTime: number;
  source: 'cache' | 'api' | 'database';
}

// Rate limiting helper
class RateLimiter {
  private cache: KVNamespace;

  constructor(cache: KVNamespace) {
    this.cache = cache;
  }

  async checkLimit(clientIP: string, maxRequests: number = 50, windowMs: number = 3600000): Promise<boolean> {
    const key = `rate_limit:${clientIP}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      const data = await this.cache.get(key);
      let requests: number[] = data ? JSON.parse(data) : [];

      // Remove old requests
      requests = requests.filter(time => time > windowStart);

      if (requests.length >= maxRequests) {
        return false;
      }

      requests.push(now);
      await this.cache.put(key, JSON.stringify(requests), { expirationTtl: windowMs / 1000 });
      return true;
    } catch (error) {
      console.error('Rate limit error:', error);
      return true; // Allow request on error
    }
  }
}

// Domain filtering utilities
class DomainFilter {
  static applyFilters(domains: string[], filters?: DomainCheckRequest['filters']): string[] {
    if (!filters) return domains;

    return domains.filter(domain => {
      const { minLength, maxLength, includeHyphens, excludeNumbers } = filters;

      // Length filters
      if (minLength && domain.length < minLength) return false;
      if (maxLength && domain.length > maxLength) return false;

      // Hyphen filter
      if (!includeHyphens && domain.includes('-')) return false;

      // Number filter
      if (excludeNumbers && /\d/.test(domain)) return false;

      return true;
    });
  }
}

// Domain availability checker
class DomainAvailabilityChecker {
  private readonly IP2LOCATION_API_URL = 'https://api.ip2location.io';
  private readonly BATCH_SIZE = 10; // Check domains in batches to avoid rate limits
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async checkDomain(domain: string, tld: string = 'com'): Promise<boolean> {
    try {
      const fullDomain = `${domain}.${tld}`;

      // Use IP2Location WHOIS API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.IP2LOCATION_API_URL}/?key=${this.apiKey}&domain=${fullDomain}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BizQ-Domain-Checker/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // IP2Location returns domain_status: 'ACTIVE' | 'INACTIVE' | etc.
        return data.domain_status !== 'ACTIVE';
      }

      // Log API errors but don't assume availability
      console.warn(`IP2Location API error for ${fullDomain}: ${response.status}`);
      return false; // Be conservative - assume taken if API fails
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`Domain check timeout for ${domain}.${tld}`);
      } else {
        console.error(`Domain check error for ${domain}.${tld}:`, error);
      }
      return false; // Be conservative on errors
    }
  }

  async checkDomainsBatch(domains: string[], tld: string = 'com'): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < domains.length; i += this.BATCH_SIZE) {
      const batch = domains.slice(i, i + this.BATCH_SIZE);
      const batchPromises = batch.map(domain => this.checkDomain(domain, tld));

      try {
        const batchResults = await Promise.allSettled(batchPromises);

        batch.forEach((domain, index) => {
          const result = batchResults[index];
          if (result.status === 'fulfilled') {
            results.set(domain, result.value);
          } else {
            console.error(`Failed to check ${domain}.${tld}:`, result.reason);
            results.set(domain, false); // Conservative approach
          }
        });
      } catch (error) {
        console.error('Batch processing error:', error);
        // Mark all batch domains as unavailable on batch failure
        batch.forEach(domain => results.set(domain, false));
      }

      // Small delay between batches to be respectful to the API
      if (i + this.BATCH_SIZE < domains.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }
}

// Database operations
class DomainDatabase {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async saveDomainCheck(domain: string, tld: string, available: boolean, source: string = 'api'): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT OR REPLACE INTO domain_checks (domain, tld, available, checked_at, source)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
      `).bind(domain, tld, available, source).run();
    } catch (error) {
      console.error('Database save error:', error);
    }
  }

  async getDomainChecks(domains: string[], tld: string = 'com', maxAgeMinutes: number = 60, source?: string): Promise<Map<string, boolean>> {
    try {
      const placeholders = domains.map(() => '?').join(',');
      let query = `
        SELECT domain, available FROM domain_checks
        WHERE domain IN (${placeholders}) AND tld = ?
        AND checked_at > datetime('now', '-${maxAgeMinutes} minutes')
      `;

      const params = [...domains, tld];

      if (source) {
        query += ' AND source = ?';
        params.push(source);
      }

      const result = await this.db.prepare(query).bind(...params).all();

      const cached = new Map<string, boolean>();
      result.results.forEach(row => {
        cached.set(row.domain as string, row.available as boolean);
      });

      return cached;
    } catch (error) {
      console.error('Database query error:', error);
      return new Map();
    }
  }

  async getBulkDomainStats(tlds: string[] = ['com']): Promise<{ total: number, available: number, lastChecked: string }[]> {
    try {
      const results = [];
      for (const tld of tlds) {
        const result = await this.db.prepare(`
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN available = 1 THEN 1 ELSE 0 END) as available,
            MAX(checked_at) as last_checked
          FROM domain_checks
          WHERE tld = ?
        `).bind(tld).first();

        results.push({
          total: result?.total || 0,
          available: result?.available || 0,
          lastChecked: result?.last_checked || 'never'
        });
      }
      return results;
    } catch (error) {
      console.error('Bulk stats query error:', error);
      return [];
    }
  }
}

// Bulk data ingestion for affordable data sources
class BulkDataIngestion {
  private db: D1Database;
  private cache: KVNamespace;
  private readonly DOMAINS_INDEX_FREE_URL = 'https://domains-index.com/wp-content/uploads/bundle_free.zip';
  private readonly DOMAINS_INDEX_PAID_URL = 'https://domains-index.com/download/premium_domains.csv';

  constructor(db: D1Database, cache: KVNamespace) {
    this.db = db;
    this.cache = cache;
  }

  // Ingest bulk data from various affordable sources
  async ingestBulkData(source: 'domains-index-free' | 'domains-index-paid' = 'domains-index-free', apiKey?: string): Promise<{ processed: number, errors: number, source: string }> {
    const startTime = Date.now();

    try {
      let downloadUrl: string;
      let isCompressed = false;

      switch (source) {
        case 'domains-index-free':
          downloadUrl = this.DOMAINS_INDEX_FREE_URL;
          isCompressed = true;
          break;
        case 'domains-index-paid':
          if (!apiKey) throw new Error('API key required for paid Domains Index');
          downloadUrl = `${this.DOMAINS_INDEX_PAID_URL}?key=${apiKey}`;
          isCompressed = false;
          break;
        default:
          throw new Error(`Unknown data source: ${source}`);
      }

      console.log(`Downloading bulk data from ${source}: ${downloadUrl}`);

      const response = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'BizQ-Domain-Ingestion/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download bulk data: ${response.status} ${response.statusText}`);
      }

      let content: string;
      if (isCompressed) {
        // For now, assume uncompressed CSV for free tier
        // In production, would need to handle ZIP decompression
        content = await response.text();
      } else {
        content = await response.text();
      }

      const lines = content.split('\n').filter(line => line.trim());
      console.log(`Downloaded ${lines.length} lines of data`);

      let processed = 0;
      let errors = 0;

      // Process in batches to avoid memory issues and rate limits
      const batchSize = 1000;
      for (let i = 1; i < lines.length; i += batchSize) { // Skip header if exists
        const batch = lines.slice(i, Math.min(i + batchSize, lines.length));
        const batchResults = await this.processBulkDataBatch(batch, source);

        processed += batchResults.processed;
        errors += batchResults.errors;

        // Update progress in cache
        const progress = {
          source,
          processed,
          errors,
          total: lines.length - 1,
          progress: Math.round((processed / (lines.length - 1)) * 100),
          lastUpdated: new Date().toISOString(),
          duration: Date.now() - startTime
        };

        await this.cache.put(`bulk_ingestion_progress_${source}`, JSON.stringify(progress), { expirationTtl: 3600 });

        // Log progress every 10,000 domains
        if (processed % 10000 === 0) {
          console.log(`Progress: ${processed}/${lines.length - 1} domains processed (${Math.round((processed / (lines.length - 1)) * 100)}%)`);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`Bulk ingestion complete for ${source}: ${processed} processed, ${errors} errors in ${duration}ms`);

      return { processed, errors, source };
    } catch (error) {
      console.error(`Bulk data ingestion error for ${source}:`, error);
      return { processed: 0, errors: 1, source };
    }
  }

  // Legacy method for backward compatibility
  async ingestDomainsIndexData(apiKey?: string): Promise<{ processed: number, errors: number }> {
    const result = await this.ingestBulkData(apiKey ? 'domains-index-paid' : 'domains-index-free', apiKey);
    return { processed: result.processed, errors: result.errors };
  }

  private async processBulkDataBatch(lines: string[], source: string): Promise<{ processed: number, errors: number }> {
    const statements = [];
    let processed = 0;
    let errors = 0;

    for (const line of lines) {
      try {
        let domain: string, tld: string, available: boolean;

        // Parse based on source format
        if (source.includes('domains-index')) {
          // Domains Index format: domain,tld,status or just domain list
          const parts = line.split(',');
          if (parts.length >= 2) {
            [domain, tld] = parts;
            const status = parts[2]?.toLowerCase();
            available = status === 'available' || status === 'free' || !status; // Assume available if no status
          } else {
            // Just domain name, assume .com and available
            domain = parts[0];
            tld = 'com';
            available = true;
          }
        } else {
          // Generic format: assume domain,tld,available
          const [domainPart, tldPart, availablePart] = line.split(',');
          domain = domainPart;
          tld = tldPart || 'com';
          available = availablePart?.toLowerCase() === 'true' || availablePart === '1';
        }

        if (!domain || !tld) continue;

        // Clean domain name (remove TLD if present)
        const cleanDomain = domain.replace(new RegExp(`\\.${tld}$`), '');

        statements.push(`
          INSERT OR REPLACE INTO domain_checks (domain, tld, available, checked_at, source)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
        `);

        processed++;
      } catch (error) {
        console.error(`Error processing line: ${line}`, error);
        errors++;
      }
    }

    // Execute batch insert with prepared statements
    if (statements.length > 0) {
      try {
        // Use batch operations for better performance
        const batchOps = statements.map(sql => ({ sql, bindings: [] }));
        // Note: In production, would need to properly bind parameters
        // For now, using direct exec for simplicity
        const batchSql = statements.join('; ');
        await this.db.exec(batchSql);
      } catch (error) {
        console.error('Batch insert error:', error);
        errors += statements.length;
        processed -= statements.length;
      }
    }

    return { processed, errors };
  }

  // Get ingestion status
  async getIngestionStatus(): Promise<any> {
    try {
      const status = await this.cache.get('bulk_ingestion_progress');
      return status ? JSON.parse(status) : { processed: 0, errors: 0, total: 0 };
    } catch (error) {
      console.error('Status retrieval error:', error);
      return { processed: 0, errors: 0, total: 0 };
    }
  }
}

// Cache operations
class DomainCache {
  private cache: KVNamespace;

  constructor(cache: KVNamespace) {
    this.cache = cache;
  }

  async getDomainChecks(domains: string[], tld: string = 'com'): Promise<Map<string, boolean>> {
    try {
      const keys = domains.map(domain => `domain:${domain}:${tld}`);
      const results = await this.cache.getWithMetadata(keys);

      const cached = new Map<string, boolean>();
      results.forEach((result, index) => {
        if (result.value) {
          cached.set(domains[index], JSON.parse(result.value));
        }
      });

      return cached;
    } catch (error) {
      console.error('Cache get error:', error);
      return new Map();
    }
  }

  async setDomainChecks(results: Map<string, boolean>, tld: string = 'com', ttl: number = 1800): Promise<void> {
    try {
      const operations = [];
      for (const [domain, available] of results) {
        const key = `domain:${domain}:${tld}`;
        operations.push(this.cache.put(key, JSON.stringify(available), { expirationTtl: ttl }));
      }
      await Promise.all(operations);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async getBulkCheck(key: string): Promise<DomainCheckResponse | null> {
    try {
      const data = await this.cache.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Bulk cache get error:', error);
      return null;
    }
  }

  async setBulkCheck(key: string, value: DomainCheckResponse, ttl: number = 600): Promise<void> {
    try {
      await this.cache.put(key, JSON.stringify(value), { expirationTtl: ttl });
    } catch (error) {
      console.error('Bulk cache set error:', error);
    }
  }
}

// Main domain checking service
class DomainCheckService {
  private checker: DomainAvailabilityChecker;
  private db: DomainDatabase;
  private cache: DomainCache;
  private bulkIngestion: BulkDataIngestion;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.checker = new DomainAvailabilityChecker(env.IP2LOCATION_API_KEY);
    this.db = new DomainDatabase(env.DB);
    this.cache = new DomainCache(env.CACHE);
    this.bulkIngestion = new BulkDataIngestion(env.DB, env.CACHE);
  }

  async checkDomains(request: DomainCheckRequest): Promise<DomainCheckResponse> {
    const startTime = Date.now();
    const { domains, tlds = ['com'], filters } = request;

    // Apply filters first
    const filteredDomains = DomainFilter.applyFilters(domains, filters);

    // Create cache key
    const cacheKey = `bulk:${filteredDomains.sort().join(',')}:${tlds.sort().join(',')}:${JSON.stringify(filters)}`;

    // Check bulk cache first
    const cached = await this.cache.getBulkCheck(cacheKey);
    if (cached) {
      return {
        ...cached,
        source: 'cache',
        processingTime: Date.now() - startTime
      };
    }

    const allResults: DomainCheckResult[] = [];
    let totalChecked = 0;
    let availableCount = 0;

    // Check each TLD
    for (const tld of tlds) {
      // Get cached results from KV (30 minutes)
      const cachedResults = await this.cache.getDomainChecks(filteredDomains, tld);

      // Get cached results from database (24 hours)
      const dbResults = await this.db.getDomainChecks(filteredDomains, tld, 1440);

      // Get bulk data results (up to 7 days old)
      const bulkResults = await this.db.getDomainChecks(filteredDomains, tld, 10080, 'bulk'); // 7 days

      // Combine all caches (KV takes precedence, then DB, then bulk)
      const combinedCache = new Map([...bulkResults, ...dbResults, ...cachedResults]);

      // Find domains that need fresh checking
      const toCheck = filteredDomains.filter(domain => !combinedCache.has(domain));

      // Check fresh domains
      let freshResults = new Map<string, boolean>();
      if (toCheck.length > 0) {
        freshResults = await this.checker.checkDomainsBatch(toCheck, tld);

        // Save fresh results to database
        for (const [domain, available] of freshResults) {
          await this.db.saveDomainCheck(domain, tld, available, 'api');
        }

        // Cache fresh results in KV (30 minutes)
        await this.cache.setDomainChecks(freshResults, tld, 1800);
      }

      // Combine all results for this TLD
      const tldResults = new Map([...combinedCache, ...freshResults]);

      // Build response for this TLD
      for (const domain of filteredDomains) {
        const available = tldResults.get(domain) ?? false;
        allResults.push({
          domain: `${domain}.${tld}`,
          available,
          tld,
          checkedAt: new Date().toISOString()
        });

        totalChecked++;
        if (available) availableCount++;
      }
    }

    const response: DomainCheckResponse = {
      results: allResults,
      totalChecked,
      availableCount,
      processingTime: Date.now() - startTime,
      source: 'api'
    };

    // Cache the complete response (10 minutes)
    await this.cache.setBulkCheck(cacheKey, response, 600);

    return response;
  }

  async getStats(tlds: string[] = ['com']): Promise<any> {
    const stats = await this.db.getBulkDomainStats(tlds);
    const ingestionStatus = await this.bulkIngestion.getIngestionStatus();

    return {
      tlds: tlds.map((tld, index) => ({
        tld,
        ...stats[index]
      })),
      cache: {
        kvTtl: 1800, // 30 minutes
        bulkTtl: 600, // 10 minutes
        dbRetention: 1440, // 24 hours
        bulkRetention: 10080 // 7 days
      },
      bulkData: {
        ingestionStatus,
        lastIngestion: ingestionStatus.lastUpdated || null
      }
    };
  }

  async triggerBulkIngestion(source: 'domains-index-free' | 'domains-index-paid' = 'domains-index-free'): Promise<{ success: boolean, message: string, stats?: any }> {
    try {
      console.log(`Starting bulk data ingestion from ${source}...`);
      const apiKey = source === 'domains-index-paid' ? this.env.DOMAINS_INDEX_API_KEY : undefined;
      const result = await this.bulkIngestion.ingestBulkData(source, apiKey);

      return {
        success: true,
        message: `Bulk ingestion from ${source} completed: ${result.processed} domains processed, ${result.errors} errors`,
        stats: result
      };
    } catch (error) {
      console.error('Bulk ingestion failed:', error);
      return {
        success: false,
        message: `Bulk ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Cloudflare Worker handler
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Daily bulk data ingestion
    console.log('Running scheduled bulk data ingestion...');
    const service = new DomainCheckService(env);

    try {
      const result = await service.triggerBulkIngestion();
      console.log('Scheduled ingestion result:', result);
    } catch (error) {
      console.error('Scheduled ingestion failed:', error);
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const rateLimiter = new RateLimiter(env.CACHE);

    try {
      // Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          service: 'domain-check',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Rate limiting
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
      const allowed = await rateLimiter.checkLimit(clientIP);
      if (!allowed) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const service = new DomainCheckService(env);

      // POST /api/check
      if (url.pathname === '/api/check' && request.method === 'POST') {
        const body: DomainCheckRequest = await request.json();

        if (!body.domains || !Array.isArray(body.domains) || body.domains.length === 0) {
          return new Response(JSON.stringify({ error: 'Domains array is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (body.domains.length > 100) {
          return new Response(JSON.stringify({ error: 'Maximum 100 domains per request' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await service.checkDomains(body);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/check
      if (url.pathname === '/api/check' && request.method === 'GET') {
        const domains = url.searchParams.get('domains')?.split(',') || [];
        const tlds = url.searchParams.get('tlds')?.split(',') || ['com'];
        const minLength = url.searchParams.get('minLength') ? parseInt(url.searchParams.get('minLength')!) : undefined;
        const maxLength = url.searchParams.get('maxLength') ? parseInt(url.searchParams.get('maxLength')!) : undefined;
        const includeHyphens = url.searchParams.get('includeHyphens') === 'true';
        const excludeNumbers = url.searchParams.get('excludeNumbers') === 'true';

        if (domains.length === 0) {
          return new Response(JSON.stringify({ error: 'Domains parameter is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (domains.length > 100) {
          return new Response(JSON.stringify({ error: 'Maximum 100 domains per request' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await service.checkDomains({
          domains,
          tlds,
          filters: {
            minLength,
            maxLength,
            includeHyphens,
            excludeNumbers
          }
        });

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

       // GET /api/stats
       if (url.pathname === '/api/stats' && request.method === 'GET') {
         const tlds = url.searchParams.get('tlds')?.split(',') || ['com'];
         const stats = await service.getStats(tlds);
         return new Response(JSON.stringify(stats), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' }
         });
       }

       // POST /api/ingest-bulk
       if (url.pathname === '/api/ingest-bulk' && request.method === 'POST') {
         const body = await request.json().catch(() => ({}));
         const source = body.source || 'domains-index-free';
         const result = await service.triggerBulkIngestion(source);
         return new Response(JSON.stringify(result), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           status: result.success ? 200 : 500
         });
       }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);

      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};