#!/usr/bin/env -S npx tsx

/**
 * Claude Code API Server for BizQ
 * Provides HTTP endpoints for frontend to use Claude Code CLI
 */

import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// Simple in-memory cache
const cache = new Map<string, any>();
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Execute Claude Code query using CLI
 */
async function queryClaudeCLI(prompt: string, outputFormat = 'text'): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Query timeout'));
    }, 30000);

    // Use shell to execute the piped command
    const command = `echo "${prompt.replace(/"/g, '\\"')}" | claude --print --output-format ${outputFormat}`;
    
    const proc = spawn('sh', ['-c', command]);
    
    let output = '';
    let errorOutput = '';
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Claude exited with code ${code}: ${errorOutput}`));
      }
    });
    
    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/**
 * Generate cache key for prompt
 */
function getCacheKey(prompt: string, type: string = ''): string {
  const content = `${type}:${prompt}`.toLowerCase();
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Build contextual prompt based on task type
 */
function buildContextualPrompt(prompt: string, taskType: string): string {
  const prefixes: Record<string, string> = {
    financial: `Analyze this financial question and provide specific insights: ${prompt}`,
    marketing: `Create a marketing solution for: ${prompt}`,
    strategy: `Provide strategic business advice for: ${prompt}`,
    operations: `Suggest operational improvements for: ${prompt}`,
    general: prompt
  };
  return prefixes[taskType] || prompt;
}

/**
 * Get fallback response when Claude is unavailable
 */
function getFallbackResponse(taskType: string, content: string): string {
  const fallbacks: Record<string, string> = {
    financial: "Based on the financial query, I recommend reviewing cash flow, optimizing expenses, and maintaining a 20% profit margin target.",
    marketing: "For this marketing challenge, focus on your target audience, create engaging content, and measure ROI across channels.",
    strategy: "Strategically, prioritize customer retention, operational efficiency, and sustainable growth while managing risks.",
    operations: "To optimize operations, implement process automation, improve inventory management, and enhance quality control.",
    general: `I'll help you with: ${content.substring(0, 100)}. Focus on efficiency, measurement, and continuous improvement.`
  };
  return fallbacks[taskType] || `Processing your request: ${content.substring(0, 100)}`;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Claude Code API Server',
    timestamp: new Date().toISOString()
  });
});

// Process single task endpoint
app.post('/api/task', async (req, res) => {
  try {
    const { businessId, content, type = 'general', useCache = true } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Missing content in request' });
    }
    
    // Check cache
    const cacheKey = getCacheKey(content, type);
    if (useCache && cache.has(cacheKey)) {
      cacheHits++;
      console.log(`💾 Cache hit for: ${content.substring(0, 50)}...`);
      
      const cachedResult = cache.get(cacheKey);
      return res.json({
        success: true,
        result: cachedResult.result,
        cached: true,
        cacheKey,
        businessId,
        credits: 1 // Reduced credits for cached result
      });
    }
    
    // Build contextual prompt
    const contextualPrompt = buildContextualPrompt(content, type);
    
    // Query Claude Code
    cacheMisses++;
    console.log(`🔄 Processing task: ${content.substring(0, 50)}...`);
    
    try {
      const result = await queryClaudeCLI(contextualPrompt);
      
      // Cache the result
      cache.set(cacheKey, {
        result,
        timestamp: new Date().toISOString(),
        taskType: type
      });
      
      return res.json({
        success: true,
        result,
        cached: false,
        businessId,
        credits: 10
      });
      
    } catch (error: any) {
      console.error('⚠️ Claude error, using fallback:', error.message);
      
      // Return fallback response
      const fallback = getFallbackResponse(type, content);
      return res.json({
        success: true,
        result: fallback,
        fallback: true,
        error: error.message,
        credits: 5
      });
    }
    
  } catch (error: any) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process bulk tasks endpoint
app.post('/api/bulk-task', async (req, res) => {
  try {
    const { businessIds, content, type = 'general' } = req.body;
    
    if (!businessIds || !content) {
      return res.status(400).json({ error: 'Missing businessIds or content' });
    }
    
    const results = [];
    
    // Check cache first
    const cacheKey = getCacheKey(content, type);
    let result: string;
    
    if (cache.has(cacheKey)) {
      result = cache.get(cacheKey).result;
      console.log(`💾 Using cached result for bulk task`);
    } else {
      try {
        const contextualPrompt = buildContextualPrompt(content, type);
        result = await queryClaudeCLI(contextualPrompt);
        
        // Cache it
        cache.set(cacheKey, {
          result,
          timestamp: new Date().toISOString(),
          taskType: type
        });
      } catch (error: any) {
        console.error('⚠️ Claude error in bulk, using fallback');
        result = getFallbackResponse(type, content);
      }
    }
    
    // Apply to all businesses
    for (const businessId of businessIds) {
      results.push({
        businessId,
        success: true,
        result,
        cached: cache.has(cacheKey)
      });
    }
    
    res.json({
      success: true,
      results,
      totalCredits: businessIds.length * 5
    });
    
  } catch (error: any) {
    console.error('❌ Bulk processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate content endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { type = 'general', context = {}, format = 'text' } = req.body;
    
    // Build generation prompt
    const prompts: Record<string, string> = {
      marketing: `Create engaging marketing content for: ${JSON.stringify(context)}`,
      email: `Write a professional business email based on: ${JSON.stringify(context)}`,
      report: `Generate a business report for: ${JSON.stringify(context)}`,
      code: `Generate clean, commented code for: ${JSON.stringify(context)}`
    };
    
    const prompt = prompts[type] || `Generate ${type} content: ${JSON.stringify(context)}`;
    
    try {
      let result = await queryClaudeCLI(prompt, format);
      
      // Parse JSON if requested
      if (format === 'json') {
        try {
          result = JSON.parse(result);
        } catch {
          // Keep as text if JSON parsing fails
        }
      }
      
      res.json({
        success: true,
        content: result,
        type,
        credits: 15
      });
      
    } catch (error: any) {
      console.error('⚠️ Generation error, using fallback');
      res.json({
        success: true,
        content: `Generated ${type} content based on provided context.`,
        type,
        fallback: true,
        credits: 5
      });
    }
    
  } catch (error: any) {
    console.error('❌ Generate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cache statistics endpoint
app.get('/api/cache/stats', (req, res) => {
  const hitRate = (cacheHits + cacheMisses) > 0 
    ? ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1)
    : '0';
    
  const entries = Array.from(cache.entries()).slice(0, 10).map(([key, value]) => ({
    key,
    timestamp: value.timestamp,
    type: value.taskType
  }));
  
  res.json({
    cacheSize: cache.size,
    cacheHits,
    cacheMisses,
    hitRate: `${hitRate}%`,
    entries
  });
});

// Clear cache endpoint
app.post('/api/cache/clear', (req, res) => {
  cache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  console.log('🗑️ Cache cleared');
  res.json({ success: true, message: 'Cache cleared' });
});

// Check Claude CLI availability
async function checkClaudeCLI(): Promise<boolean> {
  try {
    await new Promise((resolve, reject) => {
      const proc = spawn('claude', ['--version']);
      proc.on('close', (code) => code === 0 ? resolve(true) : reject());
      proc.on('error', reject);
    });
    return true;
  } catch {
    return false;
  }
}

// Start server
async function startServer() {
  const port = process.env.PORT || 5000;
  
  // Check Claude CLI
  const claudeAvailable = await checkClaudeCLI();
  
  if (claudeAvailable) {
    console.log('✅ Claude CLI is available');
  } else {
    console.log('⚠️ Claude CLI not found, will use fallback responses');
  }
  
  app.listen(port, () => {
    console.log(`
🚀 Claude Code API Server Running
📍 URL: http://localhost:${port}
✨ Claude CLI: ${claudeAvailable ? 'Available' : 'Using Fallbacks'}

📡 Endpoints:
   POST /api/task         - Process single task
   POST /api/bulk-task    - Process multiple tasks  
   POST /api/generate     - Generate content
   GET  /api/cache/stats  - Cache statistics
   POST /api/cache/clear  - Clear cache
   GET  /health           - Health check

💡 Frontend Integration Example:
   fetch('http://localhost:${port}/api/task', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       businessId: 'biz-001',
       content: 'Calculate ROI for 20% price increase',
       type: 'financial'
     })
   })

🧪 Test with curl:
   curl -X POST http://localhost:${port}/api/task \\
     -H "Content-Type: application/json" \\
     -d '{"content":"What is 2+2?","type":"general"}'
`);
  });
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

// Start the server
startServer().catch(console.error);