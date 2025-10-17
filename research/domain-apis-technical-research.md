# Domain APIs & Data Sources: Technical Implementation Guide

## Overview

This document provides technical specifications for accessing **affordable domain-related data sources under $100/month**. Focus is on free and low-cost bulk data feeds, APIs, and implementation details. **Excluded: Premium services over $100/month** (Whoxy $10K, WhoisDS $4K, etc.).

### Cost Breakdown (Affordable Options Only)

| Source | Cost | Data Volume | Update Frequency |
|--------|------|-------------|------------------|
| **ICANN CZDS** | Free* | All gTLD zones | Daily |
| **Domains Index** | Free/$25/mo | 255M domains | Monthly/Daily |
| **Domains Monitor** | Free | TLD lists | Weekly |
| **Top 1M GitHub** | Free | 1M domains | Daily |
| **IP2Location** | $49/mo | 5K WHOIS queries | Real-time |
| **NameSilo API** | Free | Domain checks | Real-time |
| **DomainNameAPI** | Free | Bulk checks | Real-time |

*Requires organizational approval

## 1. ICANN Centralized Zone Data Service (CZDS)

### Access Requirements
```bash
# CZDS requires approved organization status
# Application process: https://czds.icann.org/
# Legal agreements required per TLD registry
# Approval timeline: 1-3 months per TLD
```

### Technical Specifications

#### Authentication
```typescript
// OAuth 2.0 flow
const CZDS_AUTH = {
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  tokenUrl: 'https://account-api.icann.org/api/auth/token'
};

// Get access token
const token = await fetch(CZDS_AUTH.tokenUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CZDS_AUTH.clientId,
    client_secret: CZDS_AUTH.clientSecret
  })
});
```

#### Zone File Downloads
```typescript
interface ZoneFile {
  tld: string;
  url: string;
  size: number;
  lastModified: string;
  checksum: string;
}

// List available zone files
const zoneFiles = await fetch('https://czds-api.icann.org/czds/zonefiles', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Download specific zone file
const response = await fetch(zoneFileUrl, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### Data Format
```
; Zone file for .com
; Generated: 2024-10-16 00:00:00 UTC
$ORIGIN com.
$TTL 86400

example.com. 86400 IN NS ns1.example.com.
example.com. 86400 IN NS ns2.example.com.
www.example.com. 86400 IN A 192.0.2.1
```

#### Processing Pipeline
```typescript
class CZDSProcessor {
  async downloadZoneFile(tld: string): Promise<ZoneRecord[]> {
    const response = await this.authenticateAndDownload(tld);
    const decompressed = await this.decompressGzip(response);
    return this.parseZoneFile(decompressed);
  }

  parseZoneFile(content: string): ZoneRecord[] {
    const records: ZoneRecord[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.startsWith(';') || line.trim() === '') continue;

      const record = this.parseZoneRecord(line);
      if (record) records.push(record);
    }

    return records;
  }
}
```

#### Update Frequency
- **Daily updates**: 00:00-06:00 UTC
- **File sizes**: .com (~50GB), .net (~4GB), .org (~3GB)
- **Compression**: Gzip (.gz files)
- **Retention**: Current day only (historical data not provided)

## 2. WHOIS APIs

### WhoisXMLAPI

#### Authentication
```typescript
const WHOIS_API = {
  baseUrl: 'https://whoisxmlapi.com/api/v1',
  apiKey: 'your-api-key' // From account dashboard
};
```

#### Domain Availability Check
```typescript
interface WhoisAvailabilityResponse {
  domainName: string;
  domainAvailability: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';
  registryDomainId?: string;
  registrarName?: string;
  createdDate?: string;
  updatedDate?: string;
  expiresDate?: string;
}

// Check single domain
const response = await fetch(
  `${WHOIS_API.baseUrl}?apiKey=${WHOIS_API.apiKey}&domainName=example.com`
);

// Response format
{
  "domainName": "example.com",
  "domainAvailability": "UNAVAILABLE",
  "registryDomainId": "123456789",
  "registrarName": "GoDaddy.com, LLC",
  "createdDate": "1995-08-14T04:00:00Z",
  "updatedDate": "2024-08-14T04:00:00Z",
  "expiresDate": "2025-08-14T04:00:00Z"
}
```

#### Rate Limits
- **Free tier**: 100 queries/month
- **Basic**: 1,000 queries/month ($2)
- **Professional**: 10,000 queries/month ($20)
- **Enterprise**: Custom limits
- **Rate limit**: 10 requests/second

#### Bulk WHOIS API
```typescript
// Submit bulk request
const bulkRequest = {
  domains: ['example.com', 'test.com', 'sample.org'],
  format: 'json'
};

const submitResponse = await fetch(`${WHOIS_API.baseUrl}/bulk`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Authentication-Token': WHOIS_API.apiKey
  },
  body: JSON.stringify(bulkRequest)
});

// Check status
const statusResponse = await fetch(
  `${WHOIS_API.baseUrl}/bulk/${jobId}/status`,
  { headers: { 'X-Authentication-Token': WHOIS_API.apiKey } }
);

// Download results
const results = await fetch(
  `${WHOIS_API.baseUrl}/bulk/${jobId}/download`,
  { headers: { 'X-Authentication-Token': WHOIS_API.apiKey } }
);
```

### GoDaddy WHOIS API

#### Authentication
```typescript
const GODADDY_API = {
  baseUrl: 'https://api.godaddy.com/v1',
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret'
};

// Use API key in headers
const headers = {
  'Authorization': `sso-key ${GODADDY_API.apiKey}:${GODADDY_API.apiSecret}`,
  'Content-Type': 'application/json'
};
```

#### Domain Availability
```typescript
// Check availability
const response = await fetch(
  `${GODADDY_API.baseUrl}/domains/available?domain=example.com`,
  { headers }
);

// Response
{
  "available": false,
  "domain": "example.com",
  "definitive": true,
  "price": 17990000, // Price in cents
  "currency": "USD",
  "period": 1
}
```

#### Bulk Availability Check
```typescript
const bulkCheck = {
  domains: ['example.com', 'test.com', 'sample.org'],
  checkType: 'FAST' // FAST or FULL
};

const response = await fetch(`${GODADDY_API.baseUrl}/domains/available`, {
  method: 'POST',
  headers,
  body: JSON.stringify(bulkCheck)
});

// Response
{
  "results": [
    {
      "domain": "example.com",
      "available": false,
      "definitive": true
    },
    {
      "domain": "test.com",
      "available": false,
      "definitive": true
    }
  ]
}
```

#### Rate Limits
- **Production**: 60,000 requests/hour
- **Sandbox**: 100 requests/hour
- **Burst limit**: 10 requests/second

## 3. Auction Data Feeds

### GoDaddy Auctions API

#### Authentication
```typescript
const GODADDY_AUCTIONS = {
  baseUrl: 'https://api.godaddy.com/v1/auctions',
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret'
};
```

#### Auction Listings
```typescript
// Get active auctions
const response = await fetch(
  `${GODADDY_AUCTIONS.baseUrl}/listings?status=active&limit=100`,
  { headers: { 'Authorization': `sso-key ${apiKey}:${apiSecret}` } }
);

// Response format
{
  "listings": [
    {
      "auctionId": "12345",
      "domainName": "example.com",
      "currentBid": 50000, // in cents
      "buyItNowPrice": 100000,
      "bids": 12,
      "endTime": "2024-10-20T15:00:00Z",
      "traffic": 15000,
      "domainAge": 8760, // hours
      "status": "active"
    }
  ],
  "pagination": {
    "total": 25000,
    "page": 1,
    "limit": 100
  }
}
```

#### Auction Details
```typescript
// Get specific auction
const auction = await fetch(
  `${GODADDY_AUCTIONS.baseUrl}/listings/${auctionId}`,
  { headers }
);

// Detailed response
{
  "auctionId": "12345",
  "domainName": "example.com",
  "description": "Premium domain with high traffic",
  "currentBid": 50000,
  "buyItNowPrice": 100000,
  "minimumBid": 25000,
  "bidIncrement": 1000,
  "bids": [
    {
      "bidId": "67890",
      "amount": 50000,
      "bidderId": "bidder123",
      "timestamp": "2024-10-15T10:30:00Z"
    }
  ],
  "endTime": "2024-10-20T15:00:00Z",
  "trafficEstimate": 15000,
  "domainAge": 8760,
  "backlinks": 2500,
  "registrar": "GoDaddy",
  "status": "active"
}
```

#### Bulk Auction Data
```typescript
// Download complete auction feed (CSV format)
const feedResponse = await fetch(
  `${GODADDY_AUCTIONS.baseUrl}/feed/auctions.csv`,
  { headers }
);

// CSV format:
// auction_id,domain_name,current_bid,buy_it_now,end_time,bids,traffic
// 12345,example.com,500.00,1000.00,2024-10-20T15:00:00Z,12,15000
```

### NameJet API

#### Authentication
```typescript
const NAMEJET_API = {
  baseUrl: 'https://www.namejet.com/api',
  apiKey: 'your-api-key'
};
```

#### Auction Listings
```typescript
// Get current auctions
const response = await fetch(
  `${NAMEJET_API.baseUrl}/auctions?status=current&format=json`,
  {
    headers: { 'X-API-Key': NAMEJET_API.apiKey }
  }
);

// Response format
{
  "auctions": [
    {
      "id": "12345",
      "domain": "example.com",
      "current_bid": 500.00,
      "bids": 8,
      "end_time": "2024-10-18T20:00:00Z",
      "min_bid": 100.00,
      "increment": 10.00,
      "status": "active"
    }
  ],
  "total": 1500,
  "page": 1,
  "per_page": 100
}
```

#### Historical Auction Data
```typescript
// Get completed auctions
const history = await fetch(
  `${NAMEJET_API.baseUrl}/auctions/history?date=2024-10-15&format=json`,
  { headers: { 'X-API-Key': NAMEJET_API.apiKey } }
);

// Response includes final sale prices
{
  "auctions": [
    {
      "id": "12345",
      "domain": "example.com",
      "final_price": 750.00,
      "bids": 12,
      "end_time": "2024-10-15T20:00:00Z",
      "winner": "bidder456",
      "status": "sold"
    }
  ]
}
```

## 4. Affordable Bulk Data Sources (Under $100/month)

### Free Bulk Domain Data Sources

#### 1. ICANN CZDS (Free with Approval)
```typescript
// OAuth 2.0 authentication for approved organizations
const CZDS_BASE = 'https://czds-api.icann.org';

// Get zone file URLs
const response = await fetch(`${CZDS_BASE}/czds/zonefiles`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Download zone files (50GB+ .com zone)
const zoneFile = await fetch(zoneFileUrl, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```
- **Cost**: Free
- **Requirements**: Legal approval, legitimate use case
- **Data**: Complete zone files for all gTLDs
- **Updates**: Daily (00:00-06:00 UTC)

#### 2. Domains Index Free Datasets
```bash
# Free downloads available
curl -O https://domains-index.com/wp-content/uploads/bundle_free.zip
```
- **Cost**: Free
- **Data**: 255M+ domains across gTLD/ccTLD
- **Format**: CSV files
- **Updates**: Monthly
- **Paid option**: $25/month for daily updates

#### 3. Domains Monitor Free Lists
```bash
# Free domain zone lists
curl -O https://domains-monitor.com/freelists/download/all-domains.zip
```
- **Cost**: Free
- **Data**: Domain lists by TLD
- **Format**: Text/CSV
- **Updates**: Weekly

#### 4. GitHub: Top 1M Domains (Alexa/Cisco)
```bash
# Free Alexa top 1M domains
git clone https://github.com/PeterDaveHello/top-1m-domains.git
```
- **Cost**: Free
- **Data**: Top 1M most visited domains
- **Source**: Cisco Umbrella/Alexa
- **Updates**: Daily via GitHub Actions

#### 5. Public Suffix List
```bash
# Free list of all TLDs
curl -O https://publicsuffix.org/list/public_suffix_list.dat
```
- **Cost**: Free
- **Data**: All valid TLDs and second-level domains
- **Updates**: As needed (IANA managed)

#### 6. IANA Root Zone Database
```bash
# Free root zone data
curl -O https://www.internic.net/domain/root.zone
```
- **Cost**: Free
- **Data**: Root zone delegations
- **Updates**: As root zone changes

### Affordable APIs (Under $100/month)

#### 1. IP2Location Domain WHOIS API
```typescript
const IP2LOCATION_API = {
  baseUrl: 'https://api.ip2location.io',
  apiKey: 'your-api-key'
};

// Check domain WHOIS
const response = await fetch(
  `${IP2LOCATION_API.baseUrl}/?key=${apiKey}&domain=example.com`
);
```
- **Cost**: $49/month (5K queries)
- **Data**: WHOIS information, domain status
- **Rate limit**: Based on plan
- **Bulk support**: Yes

#### 2. NameSilo API (Free for Registrars)
```typescript
const NAMESILO_API = {
  baseUrl: 'https://www.namesilo.com/api',
  apiKey: 'your-api-key',
  version: '1'
};

// Domain availability check
const response = await fetch(
  `${NAMESILO_API.baseUrl}/checkRegisterAvailability?version=${version}&key=${apiKey}&domains=example.com`
);
```
- **Cost**: Free (for domain registration API)
- **Data**: Domain availability, registration
- **Rate limit**: Fair use policy
- **Bulk support**: Limited

#### 3. DomainNameAPI Reseller Program
```typescript
const DOMAIN_API = {
  baseUrl: 'https://api.domainnameapi.com',
  apiKey: 'your-api-key'
};

// Bulk domain check
const response = await fetch(`${DOMAIN_API.baseUrl}/check`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    domains: ['example.com', 'test.com'],
    tlds: ['com', 'net']
  })
});
```
- **Cost**: Free basic API, bulk discounts for resellers
- **Data**: Domain availability, WHOIS
- **Bulk support**: Yes
- **Reseller tiers**: Based on volume

## 5. Implementation Architecture

### Data Pipeline Architecture
```typescript
class DomainDataPipeline {
  private sources: DataSource[];

  async collectData(): Promise<DomainRecord[]> {
    const allData: DomainRecord[] = [];

    // Parallel collection from multiple sources
    const promises = this.sources.map(source => this.collectFromSource(source));
    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allData.push(...result.value);
      } else {
        console.error('Source failed:', result.reason);
      }
    }

    return this.deduplicateAndMerge(allData);
  }

  private async collectFromSource(source: DataSource): Promise<DomainRecord[]> {
    switch (source.type) {
      case 'czds':
        return this.collectCZDS(source);
      case 'whois_api':
        return this.collectWHOIS(source);
      case 'auction_feed':
        return this.collectAuctions(source);
      case 'bulk_download':
        return this.collectBulk(source);
      default:
        throw new Error(`Unknown source type: ${source.type}`);
    }
  }
}
```

### Caching Strategy
```typescript
class DomainCache {
  private kv: KVNamespace;
  private db: D1Database;

  // Multi-level caching
  async getDomainData(domain: string): Promise<DomainRecord | null> {
    // Level 1: KV Cache (30 minutes)
    const kvKey = `domain:${domain}`;
    let data = await this.kv.get(kvKey);
    if (data) return JSON.parse(data);

    // Level 2: Database Cache (24 hours)
    const dbResult = await this.db.prepare(
      'SELECT * FROM domain_cache WHERE domain = ? AND cached_at > ?'
    ).bind(domain, Date.now() - 24 * 60 * 60 * 1000).first();

    if (dbResult) {
      // Update KV cache
      await this.kv.put(kvKey, JSON.stringify(dbResult), { expirationTtl: 1800 });
      return dbResult;
    }

    return null;
  }

  async setDomainData(domain: string, data: DomainRecord): Promise<void> {
    // Store in both caches
    const kvKey = `domain:${domain}`;

    await Promise.all([
      this.kv.put(kvKey, JSON.stringify(data), { expirationTtl: 1800 }),
      this.db.prepare(
        'INSERT OR REPLACE INTO domain_cache (domain, data, cached_at) VALUES (?, ?, ?)'
      ).bind(domain, JSON.stringify(data), Date.now()).run()
    ]);
  }
}
```

### Rate Limiting Implementation
```typescript
class RateLimiter {
  private kv: KVNamespace;

  async checkLimit(identifier: string, maxRequests: number = 1000, windowMs: number = 3600000): Promise<boolean> {
    const key = `ratelimit:${identifier}`;
    const windowKey = `${key}:${Math.floor(Date.now() / windowMs)}`;

    const current = await this.kv.get(windowKey);
    const count = current ? parseInt(current) : 0;

    if (count >= maxRequests) {
      return false; // Rate limit exceeded
    }

    await this.kv.put(windowKey, (count + 1).toString(), {
      expirationTtl: Math.ceil(windowMs / 1000)
    });

    return true;
  }
}
```

### Error Handling & Resilience
```typescript
class DomainDataCollector {
  private retryConfig = {
    maxRetries: 3,
    backoffMs: 1000,
    timeoutMs: 30000
  };

  async collectWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.withTimeout(operation(), this.retryConfig.timeoutMs);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed:`, error);

        if (attempt < this.retryConfig.maxRetries) {
          await this.delay(this.retryConfig.backoffMs * Math.pow(2, attempt - 1));
        }
      }
    }

    throw lastError!;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      )
    ]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 6. Data Processing & Storage

### Database Schema
```sql
-- Domain availability and metadata
CREATE TABLE domains (
    domain TEXT PRIMARY KEY,
    tld TEXT NOT NULL,
    available BOOLEAN,
    registrar TEXT,
    created_date DATETIME,
    updated_date DATETIME,
    expires_date DATETIME,
    nameservers TEXT, -- JSON array
    status TEXT,
    last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT -- 'czds', 'whois_api', 'auction_feed'
);

-- Auction data
CREATE TABLE auctions (
    auction_id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'godaddy', 'namejet', 'sedo'
    current_bid INTEGER, -- in cents
    buy_it_now_price INTEGER,
    bids_count INTEGER DEFAULT 0,
    end_time DATETIME,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Auction bids history
CREATE TABLE auction_bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id TEXT NOT NULL,
    bid_amount INTEGER NOT NULL,
    bidder_id TEXT,
    bid_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(auction_id)
);

-- Cache table for fast lookups
CREATE TABLE domain_cache (
    domain TEXT PRIMARY KEY,
    data TEXT NOT NULL, -- JSON
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_domains_tld ON domains(tld);
CREATE INDEX idx_domains_available ON domains(available);
CREATE INDEX idx_domains_last_checked ON domains(last_checked);
CREATE INDEX idx_auctions_domain ON auctions(domain);
CREATE INDEX idx_auctions_platform ON auctions(platform);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_time ON auctions(end_time);
```

### Data Processing Pipeline
```typescript
class DomainDataProcessor {
  async processZoneFile(content: string): Promise<DomainRecord[]> {
    const lines = content.split('\n');
    const records: DomainRecord[] = [];

    for (const line of lines) {
      if (this.isValidZoneRecord(line)) {
        const record = this.parseZoneRecord(line);
        if (record) records.push(record);
      }
    }

    return records;
  }

  async processWHOISResponse(response: WhoisResponse): Promise<DomainRecord> {
    return {
      domain: response.domainName,
      tld: this.extractTLD(response.domainName),
      available: response.domainAvailability === 'AVAILABLE',
      registrar: response.registrarName,
      createdDate: response.createdDate,
      updatedDate: response.updatedDate,
      expiresDate: response.expiresDate,
      source: 'whois_api'
    };
  }

  async processAuctionData(auction: AuctionData): Promise<AuctionRecord> {
    return {
      auctionId: auction.id,
      domain: auction.domain,
      platform: auction.platform,
      currentBid: auction.currentBid,
      buyItNowPrice: auction.buyItNowPrice,
      bidsCount: auction.bids,
      endTime: new Date(auction.endTime),
      status: auction.status
    };
  }
}
```

## 7. Monitoring & Observability

### Metrics Collection
```typescript
class DomainMetrics {
  private metrics: Map<string, number> = new Map();

  recordApiCall(apiName: string, success: boolean, duration: number): void {
    const key = `api_call_${apiName}_${success ? 'success' : 'failure'}`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);

    const durationKey = `api_duration_${apiName}`;
    this.metrics.set(durationKey, duration);
  }

  recordDataProcessed(source: string, count: number): void {
    const key = `data_processed_${source}`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + count);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}
```

### Health Checks
```typescript
class DomainHealthChecker {
  async checkAPIServices(): Promise<HealthStatus[]> {
    const services = [
      { name: 'WhoisXMLAPI', url: 'https://whoisxmlapi.com/api/v1' },
      { name: 'GoDaddy API', url: 'https://api.godaddy.com/v1/domains/available' },
      { name: 'CZDS', url: 'https://czds-api.icann.org' }
    ];

    const results = await Promise.allSettled(
      services.map(service => this.checkService(service))
    );

    return results.map((result, index) => ({
      service: services[index].name,
      status: result.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      responseTime: result.status === 'fulfilled' ? result.value : 0,
      lastChecked: new Date().toISOString()
    }));
  }

  private async checkService(service: { name: string, url: string }): Promise<number> {
    const start = Date.now();
    const response = await fetch(service.url, { method: 'HEAD' });
    const duration = Date.now() - start;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return duration;
  }
}
```

This technical guide provides the foundation for building domain data collection and processing systems. Each API and data source has specific requirements, rate limits, and data formats that must be handled appropriately for reliable operation.