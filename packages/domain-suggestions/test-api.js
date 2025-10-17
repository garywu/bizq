#!/usr/bin/env node

/**
 * Test script for Domain Suggestions API
 * Run this after setting the OpenAI API key secret
 */

const API_BASE = 'https://domain-suggestions.edgekaos.workers.dev';

async function testAPI() {
  console.log('🧪 Testing Domain Suggestions API\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test POST /api/suggest
    console.log('\n2. Testing POST /api/suggest...');
    const postResponse = await fetch(`${API_BASE}/api/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        industry: 'technology',
        keywords: ['innovative', 'fast', 'cloud'],
        limit: 5,
        checkAvailability: true
      })
    });

    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('✅ POST response:', {
        suggestionsCount: postData.suggestions?.length || 0,
        industry: postData.industry,
        processingTime: postData.processingTime,
        source: postData.source
      });
    } else {
      console.log('❌ POST failed:', await postResponse.text());
    }

    // Test GET /api/suggest
    console.log('\n3. Testing GET /api/suggest...');
    const getResponse = await fetch(`${API_BASE}/api/suggest?industry=restaurant&keywords=pizza,italian&limit=3`);

    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ GET response:', {
        suggestionsCount: getData.suggestions?.length || 0,
        industry: getData.industry,
        processingTime: getData.processingTime,
        source: getData.source
      });
    } else {
      console.log('❌ GET failed:', await getResponse.text());
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAPI();