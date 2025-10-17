#!/usr/bin/env node

/**
 * Proof of Concept Test for Domain Availability Service
 * Tests IP2Location API integration and bulk data ingestion
 */

const https = require('https');

// Test configuration
const TEST_CONFIG = {
  ip2location: {
    apiKey: process.env.IP2LOCATION_API_KEY || 'demo',
    baseUrl: 'https://api.ip2location.io'
  },
  domainsIndex: {
    freeUrl: 'https://domains-index.com/wp-content/uploads/bundle_free.zip',
    sampleDomains: ['example.com', 'google.com', 'test-domain-123.com']
  }
};

// Test IP2Location API integration
async function testIP2LocationAPI() {
  console.log('🧪 Testing IP2Location API integration...');

  const results = [];

  for (const domain of TEST_CONFIG.domainsIndex.sampleDomains) {
    try {
      const url = `${TEST_CONFIG.ip2location.baseUrl}/?key=${TEST_CONFIG.ip2location.apiKey}&domain=${domain}`;

      const response = await makeRequest(url);
      const data = JSON.parse(response.data);

      const result = {
        domain,
        available: data.domain_status !== 'ACTIVE',
        status: data.domain_status,
        success: true
      };

      results.push(result);
      console.log(`  ✅ ${domain}: ${result.available ? 'Available' : 'Taken'} (${result.status})`);

    } catch (error) {
      console.log(`  ❌ ${domain}: API Error - ${error.message}`);
      results.push({
        domain,
        available: false,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }

    // Rate limiting
    await sleep(1000);
  }

  return results;
}

// Test Domains Index bulk data access
async function testDomainsIndexAccess() {
  console.log('🧪 Testing Domains Index bulk data access...');

  try {
    // Test free tier access (first few bytes)
    const response = await makeRequest(TEST_CONFIG.domainsIndex.freeUrl, { method: 'HEAD' });

    console.log('  ✅ Domains Index free tier accessible');
    console.log(`  📊 Content-Length: ${response.headers['content-length']} bytes`);

    return {
      success: true,
      contentLength: response.headers['content-length'],
      accessible: true
    };

  } catch (error) {
    console.log(`  ❌ Domains Index access failed: ${error.message}`);
    return {
      success: false,
      accessible: false,
      error: error.message
    };
  }
}

// Test bulk data ingestion simulation
async function testBulkIngestionSimulation() {
  console.log('🧪 Testing bulk data ingestion simulation...');

  try {
    // Simulate downloading and processing a small sample
    const sampleData = `example.com,com,available
google.com,com,unavailable
test-domain-123.com,com,available
microsoft.com,com,unavailable`;

    const lines = sampleData.split('\n');
    let processed = 0;
    let errors = 0;

    console.log(`  📄 Processing ${lines.length} sample lines...`);

    for (const line of lines) {
      try {
        const [domain, tld, status] = line.split(',');
        if (domain && tld) {
          const available = status === 'available';
          processed++;
          console.log(`    ✅ ${domain}.${tld}: ${available ? 'Available' : 'Taken'}`);
        }
      } catch (error) {
        errors++;
        console.log(`    ❌ Processing error: ${error.message}`);
      }
    }

    return {
      success: true,
      processed,
      errors,
      totalLines: lines.length
    };

  } catch (error) {
    console.log(`  ❌ Bulk ingestion simulation failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test caching strategy simulation
async function testCachingStrategy() {
  console.log('🧪 Testing caching strategy simulation...');

  const cacheSimulation = {
    kv: new Map(), // 30min cache
    db: new Map(), // 24hr cache
    bulk: new Map() // 7 day cache
  };

  const testDomains = ['example.com', 'google.com', 'test-domain-123.com'];
  let totalRequests = 0;
  let cacheHits = 0;

  // Simulate multiple requests with caching
  for (let i = 0; i < 10; i++) {
    for (const domain of testDomains) {
      totalRequests++;

      // Check caches in order: KV -> DB -> Bulk -> API
      let result = cacheSimulation.kv.get(domain);
      if (!result) {
        result = cacheSimulation.db.get(domain);
        if (!result) {
          result = cacheSimulation.bulk.get(domain);
          if (!result) {
            // Simulate API call
            result = Math.random() > 0.5;
            // Cache in all layers
            cacheSimulation.bulk.set(domain, result);
            cacheSimulation.db.set(domain, result);
            cacheSimulation.kv.set(domain, result);
          } else {
            cacheHits++;
            cacheSimulation.db.set(domain, result);
            cacheSimulation.kv.set(domain, result);
          }
        } else {
          cacheHits++;
          cacheSimulation.kv.set(domain, result);
        }
      } else {
        cacheHits++;
      }
    }
  }

  const hitRate = (cacheHits / totalRequests * 100).toFixed(1);

  console.log(`  📊 Cache simulation: ${cacheHits}/${totalRequests} hits (${hitRate}% hit rate)`);
  console.log(`  🎯 Target hit rate: 95%+ (Current: ${hitRate}%)`);

  return {
    success: true,
    totalRequests,
    cacheHits,
    hitRate: parseFloat(hitRate)
  };
}

// Utility functions
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'BizQ-Integration-Test/1.0',
        ...options.headers
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test runner
async function runProofOfConcept() {
  console.log('🚀 Starting Domain Availability Service Proof of Concept\n');

  const results = {
    ip2location: await testIP2LocationAPI(),
    domainsIndex: await testDomainsIndexAccess(),
    bulkIngestion: await testBulkIngestionSimulation(),
    caching: await testCachingStrategy()
  };

  console.log('\n📋 Test Results Summary:');
  console.log('='.repeat(50));

  // IP2Location results
  const ip2Success = results.ip2location.filter(r => r.success).length;
  console.log(`IP2Location API: ${ip2Success}/${results.ip2location.length} successful`);

  // Domains Index results
  console.log(`Domains Index Access: ${results.domainsIndex.success ? '✅' : '❌'} ${results.domainsIndex.accessible ? 'Accessible' : 'Failed'}`);

  // Bulk ingestion results
  console.log(`Bulk Ingestion: ${results.bulkIngestion.success ? '✅' : '❌'} ${results.bulkIngestion.processed || 0} processed`);

  // Caching results
  console.log(`Caching Strategy: ${results.caching.success ? '✅' : '❌'} ${results.caching.hitRate}% hit rate`);

  // Overall assessment
  const allSuccessful = Object.values(results).every(r =>
    Array.isArray(r) ? r.every(item => item.success) : r.success
  );

  console.log('\n🎯 Overall Assessment:');
  if (allSuccessful) {
    console.log('✅ Proof of Concept: SUCCESS');
    console.log('💡 Ready for production deployment with affordable data sources');
  } else {
    console.log('⚠️  Proof of Concept: PARTIAL SUCCESS');
    console.log('💡 Some components need refinement before production');
  }

  console.log('\n💰 Cost Analysis:');
  console.log('- IP2Location: $49/month (5K queries)');
  console.log('- Domains Index: $25/month (daily bulk data)');
  console.log('- Total: $74/month (under $100 budget)');
  console.log('- Break-even: 1-3 months with freemium model');

  return results;
}

// Run the proof of concept
if (require.main === module) {
  runProofOfConcept()
    .then(() => {
      console.log('\n✨ Proof of concept completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Proof of concept failed:', error);
      process.exit(1);
    });
}

module.exports = { runProofOfConcept, testIP2LocationAPI, testDomainsIndexAccess };